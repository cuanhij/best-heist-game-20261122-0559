# Midnight Vault

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/cuanhij/best-heist-game-20261122-0559/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/cuanhij/best-heist-game-20261122-0559/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

A top-down 2D heist game in vanilla JavaScript — no libraries, no network, fully
offline. Sneak through three museum rooms (entry hall, gallery, vault room),
read the guards' vision cones and the sweeping security cameras, steal four
pieces of loot, crack the $500 vault, and slip out the getaway door before the
alarm hits 100.

## How to play

- **Move:** WASD / arrow keys, or click anywhere to walk there.
- **Steal:** walk over gems and up to paintings; stand beside the vault safe to
  crack it (3 seconds).
- **Hide:** stand in the dark shadow patches — guards and cameras can't see you
  there, and the alarm falls fast.
- **Tools (cost cash):** `1` noise-maker $50 (lures the nearest guard away),
  `2` EMP $100 (blinds all cameras for 10s), `3` disguise $150 (guards barely
  notice you for 8s).
- **Alarm:** rises when a guard or camera spots you, falls when you're hidden.
  At 70 the guards chase; at 100 you're busted.
- **Win:** reach the getaway door on the left wall with 4+ pieces of loot.
- **Restart:** `Enter` or `R`. `M` mutes the synth music and sound effects.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

`game/` is plain static files — serve it with any static HTTP server. All art is
drawn on canvas and all sound is synthesized with WebAudio; the game makes no
network requests.

## Layout

- `game/main.js` — state and game loop
- `game/level.js` — floor plan, loot, shadows, patrols, cameras, geometry
- `game/guards.js` — guard patrol, vision cones, chase, noise investigation
- `game/cameras.js` — sweeping camera cones and EMP blindness
- `game/render.js` — all drawing: rooms, cones, loot, thief, screens
- `game/hud.js` — alarm meter, cash, loot, timer, tools, toasts
- `game/audio.js` — synthesized music and sound effects (WebAudio)
- `game/input.js` — keyboard and click-to-move input
- `game/shots.js` — deterministic scene staging for screenshots (`?shot=`)
- `main.ts` — the make.fun hand-in program (copies `game/` + `screenshots/`,
  writes `dossier.json`)

Original work: Midnight Vault, its rooms, guards (Rook, Bishop, Knight), art and
sounds are all my own. License: MIT.
