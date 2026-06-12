# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a personal engineering toolkit repository. Currently contains a Pomodoro timer; more tools are expected to be added over time.

## Commands

```bash
python pomodoro.py          # run the Pomodoro timer
```

No build step, no linting, no tests yet. Python 3.13 on Windows 11, tkinter is bundled with Python — zero dependencies.

## Architecture: pomodoro.py

Single-file tkinter desktop app (~350 lines). One class `PomodoroTimer`.

**State machine:** `focus → short_break → focus` (×4), then `focus → long_break → focus` (counter resets).

**Key constants:** `FOCUS_SECONDS=25*60`, `SHORT_BREAK_SECONDS=5*60`, `LONG_BREAK_SECONDS=15*60`, `SESSIONS_BEFORE_LONG_BREAK=4`.

**Timer:** driven by `_tick()` via `root.after(1000, ...)`, not a background thread. `self.running` boolean guards whether ticks continue. `self.after_id` stores the scheduled callback for cancellation on pause/reset.

**UI:** Dark theme (`#1e1e2e` background). Two-column button grid. `ttk.Progressbar` for visual countdown. Session indicator uses 4 Unicode dots (○/●). Always-on-top toggle via `root.attributes('-topmost', bool)`.

**Sound:** `winsound.MessageBeep()` on Windows, terminal bell `\a` on other platforms. Also briefly flashes window to top on phase transition.

## Git

Remote: `git@github.com:easonzhang875/pomodoro.git` (public repo). Main branch: `master`.
