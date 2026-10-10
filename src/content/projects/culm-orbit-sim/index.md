---
title: "Lidar-Guided Orbit Around a Bamboo Culm"

summary: "A simulated Clearpath Husky finds a bamboo culm bundle with 2D lidar
  and drives a closed-loop 2 m orbit around it, holding 6.5 mm RMS radial
  error against ground truth over a full lap."

cover: "./cover.jpg"
coverAlt: "RViz view of a Husky robot on a green 2 m circle around a bundle of
  bamboo sticks, with lidar detections marked on the sticks and the robot's
  approach path trailing behind it"

# TODO: confirm category, dates, org and role before publishing.
category: "research"
dateStart: 2026-09-01
dateEnd: 2026-10-02

tags: ["ROS 2", "Gazebo", "Python", "Lidar", "Control", "Clearpath Husky"]

featured: false

# Hidden from the live site until the TODOs above are confirmed.
draft: false

gallery:
  - src: "./rviz-overview.jpg"
    alt: "Full RViz window: front and left camera feeds on the left, showing
      the bamboo sticks from the robot's side, and the 3D view on the right
      with the robot partway around the orbit circle"
    caption: "Mid-orbit. The left camera keeps the culm in frame for the whole
      lap, which is what the recorded bags are for."

videos:
  - youtubeId: "ENqByl2Sk28"
    title: "Latest bamboo sim with point cloud integration and bag recording"
    caption: "Latest version: point cloud integration and bag recording"
  - youtubeId: "Z-1GwuYIYdw"
    title: "Husky orbiting a bamboo culm bundle in Gazebo, first version"
    caption: "Initial proof of concept (v1)"
---

## Overview

A Clearpath Husky (A200) in Gazebo, with a 2D lidar and two RealSense cameras, drives one lap around a bamboo culm bundle at a fixed radius while recording the cameras. You click near the culm in RViz and the robot does the rest. The bundle is seven tilted sticks built from a real point cloud, so the lidar sees seven small, uneven circles, not one cylinder.

## Approach

**State machine:** `IDLE` (check the click against the lidar) → `APPROACH` → `ALIGN` (turn side-on, start recording) → `ORBIT` → `DONE`, with a `LOST` state and a safety stop.

**Detection.** The detector registers the bundle's known seven-circle footprint to the scan: a coarse grid search for the first fix, then Gauss-Newton with a Huber loss and weak priors, so one or two visible sticks are enough. Fixes with too few inliers, a high residual, or a jump over 25 cm are rejected; accepted ones are low-pass filtered.

**Control.** A guiding-vector-field orbit law, where heading error decays as `δ' = -k_β·δ`:

```python
e = r - R
beta_d = s * (pi/2 - atan(k_r * e))     # desired bearing to the center
delta = wrap(beta - beta_d)
v_cmd = v * max(0.3, cos(delta))
w = (v_cmd / r) * sin(beta) - beta_d_dot + k_beta * delta
```

**Lap counting.** The swept angle is measured in the culm's frame, using its tracked orientation, which cancels skid-steer yaw drift in odometry.

**Sim and logging.** Gazebo runs headless, and the robot spawn waits for `/clock` (otherwise the EKF failed about 1 launch in 14). The launch publishes the camera optical-frame TFs that Clearpath's model leaves out. Runs record to MCAP + zstd bags, with the recorder started before the lap and stopped off the control thread.

## Results

One lap at R = 2.0 m and 0.25 m/s, scored against Gazebo ground truth (used for evaluation only, never by the controller):

| RMS radial error | Whole lap | After 5 s settling |
|---|---|---|
| Ground truth | 11.7 mm | **6.5 mm** |
| Lidar estimate | 10.9 mm | 5.0 mm |

Lap time was 52.6 s, with 0 s lost.

## Next steps

Move it to the real Husky, measure the footprint of a real bundle (or estimate it during the approach), and replace the click with automatic detection.
