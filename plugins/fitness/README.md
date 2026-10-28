# Fitness

A Claude Code mod that proposes a short exercise while Claude works on a long turn, lets you mark it done or skip it, and keeps stats on what you did.

## How it works

- When a turn has been running for 10 seconds, a band above the prompt proposes one exercise: reps (`Bodyweight squats × 15`) or a timed hold (`Plank · 30 s`).
- Press `1` to mark it done, `2` to skip it, or `3` to start a countdown on a timed hold. A bare digit at an empty prompt reaches the band.
- After each exercise you get a 30 second rest, then the next proposal if Claude is still working. Nothing is proposed while Claude is idle.
- Each exercise logs reps, estimated calories and active time. The status line shows this session's totals.

Exercises need no equipment and come in three postures: seated at the desk, standing beside it, and on the floor. Turn any posture off in the pane.

## Commands

- `/fitness` opens the stats pane: this session, all time, your top exercises, a daily streak, and the settings toggles.
- `/fitness weight 75` sets your weight in kilograms, used for the calorie estimate (default 70).

In the pane, `s`, `t` and `f` toggle the seated, standing and floor postures and `m` mutes proposals. All-time stats and settings persist across sessions.

## Calories

Estimated from MET values (metabolic equivalents) per exercise, your weight and the exercise's expected duration. Treat the numbers as rough.

## Development

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```
