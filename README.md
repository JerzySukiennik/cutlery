# Cutlery

A wordless 2.5D co-op platformer in the spirit of Unravel Two, about Fork, Knife and Butter finding their way back to each other through one house, one day. They are not tied together: they cooperate through what each of them is as a tool.

## The house

The game opens in a dollhouse cut open from the front. Everyone who is playing at that moment is in the same house and can see each other walk around. At the door you say how many of you are playing, then pick a character from that story: Butter alone, Fork or Knife for two, any of the three for three. You start on that story's floor.

Each floor is one story path and each room holds one chapter's portal. A portal starts when the right characters stand on its plates: Butter alone on the ground floor, Fork and Knife together on the first floor, all three on the top floor. Groups are matched into a private online room automatically. Chapters open in order within each path, and everyone standing on a portal needs that chapter open.

A brass cage lift connects the floors. Walk up to a floor's gate and the lift comes; inside, E rides up a floor and S rides down.

## Chapters

| Path | I | II | III |
|---|---|---|---|
| Butter, 1 player | Cold Start: the fridge | The Pantry: jars, sacks and a mousetrap | The Living Room: over the piano |
| Fork & Knife, 2 players | The Drawer: out of the drawer | The Dining Room: a tablecloth and a serving spoon | The Study: books, a stapler and a ruler |
| All three, 3 players | Breakfast: together again | Washing Up: Butter floats | Goodnight: home through the dark kitchen |

Butter's morning and Fork and Knife's morning happen at the same time from two sides of the house; the last three chapters follow after they meet.

## Tools

- **Fork** sticks into soft things (bread, cheese, sponge, cloth, Butter), climbs them by stabbing and jumping, and carries small things on its tines, including Butter.
- **Knife** cuts string and food, sticks into wood and turns into a springy ledge, and climbs wood the same way Fork climbs bread.
- **Butter** has a temperature. Frozen it is heavy and can shove things. Soft it squishes through gaps and clings to walls. Melted it is an oily puddle that pours through the holes of a grate. It floats in water.

Combos: Fork stabs into buttered tiles to make a bridge. Knife spreads Butter into a long slide that lets them push what they cannot alone. Fork holds food still while Knife cuts it. Butter carries the others across a sink.

## Controls

A/D walk, W or Space jump (hold for higher), E or Shift use your tool, S squish or let go, Esc pause. Gamepad and on-screen touch controls are supported.

## Tech

three.js 0.169 and Rapier 2D 0.14 from a CDN, ES modules, no build step. Kinematic character controllers for everything that moves, a depth-of-field grade pass, procedural props and textures, recorded music (Satie and Schumann piano recordings in the public domain, acoustic tracks by Kevin MacLeod under CC BY 4.0, listed in `assets/music/CREDITS.md`) that crossfades between rooms, a felt piano rendered in the browser with OfflineAudioContext for stings and the toy piano, recorded foley and room loops from freesound.org (all CC0, listed in `assets/audio/CREDITS.md`). A storyteller narrates chapter openings, endings, hints and the odd mishap, with subtitles; the voice was designed and cloned with the open Qwen3-TTS model (Apache 2.0) and rendered once, so the game ships plain mp3s in `assets/voice`. Online play runs on Firebase Realtime Database: house presence, the shared lift, invitations and per-chapter rooms.

Run locally with any static server, for example `python3 Niepotrzebne/serve.py 8473`. Add `?net=local` to test the house and rooms between tabs of one browser without Firebase, `?ch=d2` to jump straight into a chapter.
