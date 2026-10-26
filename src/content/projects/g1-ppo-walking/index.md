---
title: "Teaching a Unitree G1 Humanoid to Walk with PPO"

summary: "A Unitree G1 humanoid trained to walk with PPO in MuJoCo MJX. Over seven
  iterations, a custom evaluator that scores each policy against human gait
  targets cut gait error from 11.3 to 0.99, with no falls."

cover: "./cover.png"
coverAlt: "Render of the Unitree G1 humanoid standing on a blue checkered floor in MuJoCo"

# TODO: confirm dates before publishing. dateStart is the v2 run timestamp.
category: "personal"
dateStart: 2026-10-12

tags: ["Reinforcement Learning", "PPO", "MuJoCo", "JAX", "Humanoid", "Unitree G1"]

featured: false

draft: false

videos:
  - youtubeId: "ls6OH8ghevg"
    title: "G1 walking policy, v1 through v5b in order"
    caption: "Each iteration in chronological order"
---

## Overview

A PPO policy that drives the 12 leg joints of a Unitree G1 to walk at any commanded speed from 0 to 0.8 m/s. Reward going up doesn't mean the walk looks right: a policy can score well while it shuffles, crouches or drifts sideways. So I wrote a gait observer that measures each policy the way a gait lab would and scores it against human targets. Every iteration then had one number to beat, and a list of exactly what was still wrong.

## How it works

**Training.** Brax PPO on MuJoCo MJX, with 4,096 parallel environments and 100M steps, which takes about 1 h 16 min on one GPU of UF's HiPerGator cluster. The policy and value networks are both 512-256-128 MLPs.

**Policy.** The 52 inputs are the gyro, gravity direction, pelvis velocity, the speed command, joint angles and velocities, the last action, and a per-foot gait clock. The outputs are joint position targets around a standing "home" pose, each scaled by its own per-joint action scale.

**Gait clock.** Stride frequency follows Alexander's dynamic-similarity law (relative stride 2.3·Fr^0.3), so the robot takes longer strides when it walks faster, like a person. Each foot spends 60% of its cycle in stance and 40% in swing. The reward terms for foot clearance, contact timing, knee angle and push-off are tied to those windows.

**Gait observer.** It replays a trained policy in plain MuJoCo and measures about 40 gait metrics: duty factor, knee and hip angles, ankle push-off, stride length compared with Alexander's prediction, foot slip, left/right symmetry and heading drift. Each metric is z-scored against a human target and combined into one gait error. The observer also recomputes every training reward term, so I can check what the policy was actually paid for.

## Iterations

| Version | What changed | Gait error |
|---|---|---|
| v1 | Knees-bent pose, fixed 1.25 Hz clock | Stood, didn't step |
| v2 | Home pose, per-joint action scales, stiffer ankles, speed-scaled clock | 11.3 |
| v3 | Contact from the foot collision shapes, per-foot gait rewards, smoothed velocity tracking | 4.69 |
| v4a | Hip damping raised (damping ratio 0.12 → 0.4) | 1.55 |
| v4b | Rewards for heading, foot slip, ankle push-off and knee angle | 1.02 |
| **v5** | Lower minimum cadence, knee hyperextension penalty, ankle push-off ramp | **0.99** |
| v5b | Heading error added to the observation | 3.45 |

Gait error is averaged over 0.3, 0.5 and 0.8 m/s (v2: one episode at 0.5 m/s). Lower is better. No version fell.

- **The hip was an actuator problem, not a reward problem.** In v3 the hips swung through in the wrong order and overshot. The hip damping ratio was only 0.12. Raising it to 0.4 changed no reward at all and cut gait error 3×.
- **A penalty the policy can't see.** In v5 the heading reward had almost no effect: at 0.8 m/s the robot turned 64° every 10 s. The observation had no yaw in it, so the policy could feel itself turning but not how far off course it was. Adding the heading error to the observation (v5b) brought drift under 1° per 10 s. The same run walked with uneven step lengths at low speed, so v5 is still the best overall.
- **A reward with no gradient.** The ankle push-off term paid exactly 0, because the ankle never pointed the toe down past neutral. I recorded the ankle angle in the reward's own window and shifted the ramp's starting point to −25°. The planned −15° would have left 41% of steps, and 98% at 0.8 m/s, with no learning signal.
- **Measuring what training sees.** The observer's contact rule differed from the environment's, so measured slip (0.04–0.06 m/s) didn't match the near-zero slip penalty. I added a mode that reuses the environment's contact definition, and a stance plot that tracks the heel and toe separately. It showed the toe stays planted while the heel lifts, so most of the "slip" is the foot rolling over the toe, not sliding.
- **Every change is reproducible.** Each version is a config flag on the same code, checked against the previous version with a 200-step bit-exact regression test. Those tests only matched once I forced XLA onto a single CPU thread; multithreaded CPU reductions aren't bit-reproducible.

![v5 gait at 0.5 m/s, six panels: footfall timing for both feet against the scheduled stance, knee flexion peaking near 58 degrees in swing, hip flexion from about 20 degrees to minus 15, foot clearance up to about 8 cm, pelvis height and pitch over time, and ankle pitch across the gait cycle](./gait-plot.png)

v5 at 0.5 m/s, as the gait observer reports it. The grey bands are the range each joint can reach, and the dashed lines are human reference values.

## Results

v5, three episodes per speed, no falls:

| Metric | 0.3 m/s | 0.5 m/s | 0.8 m/s | Human target |
|---|---|---|---|---|
| Gait error | 0.91 | 0.96 | 1.09 | 0 |
| Knee at touchdown | 9.8° | 12.0° | 13.3° | ~5° |
| Lowest knee angle in stance | 4.9° | 5.2° | 4.3° | 5 ± 5° |
| Stride vs Alexander's prediction | 1.04 | 1.02 | 1.01 | 1.0 ± 0.15 |
| Hip range of motion | 32° | 37° | 44° | 40 ± 10° |

Since v3, the knee at touchdown has dropped from 45–55° to 10–13°, and stride length now matches the human scaling law at every speed. Two problems remain: v5 drifts in heading, and the ankle still never pushes off as hard as a human's. All results are from simulation.

## Next steps

Combine v5b's heading observation with a fix for its low-speed step asymmetry. After that, turn on random pushes and add uneven terrain, both needed before this policy could run on a real G1.
