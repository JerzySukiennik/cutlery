# Cutlery

A wordless 2.5D co-op platformer in the spirit of Unravel Two, about Fork, Knife and Butter getting back to the breakfast table. They are not tied together: they cooperate through what each of them is as a tool.

## Chapters

| | Chapter | Players | Story |
|---|---|---|---|
| I | Cold Start | 1, Butter | Butter wakes up in the fridge and crosses the kitchen to the cutlery drawer. It is empty. |
| II | The Drawer | 2, Fork and Knife | Fork and Knife climb out of the drawer and cross the kitchen to the fridge. The butter dish is empty. |
| III | Breakfast | 3, all three | They meet by the window and make it to the breakfast table together. |

Chapters II and III are played online, each player on their own device (room codes, Firebase Realtime Database). Anyone can also play them alone, switching characters with Tab. Characters nobody picks stay with the host.

## Tools

- **Fork** sticks into soft things (bread, cheese, sponge, Butter), climbs them by stabbing and jumping, and carries small things on its tines, including Butter.
- **Knife** cuts string and food, sticks into wood and turns into a springy ledge, and climbs wood the same way Fork climbs bread.
- **Butter** has a temperature. Frozen it is heavy and can shove things. Soft it squishes through gaps and clings to walls. Melted it seeps through grates. It can smear itself onto a wall or the floor.

Combos: Fork stabs into buttered tiles to make a bridge. Knife spreads Butter into a long slide that lets one character push what three cannot. Fork holds food still while Knife cuts it.

## Controls

A/D walk, W or Space jump (hold for higher), E or Shift use your tool, S squish or let go, Tab switch character, Esc pause. Gamepad and on-screen touch controls are supported.

## Tech

three.js 0.169 and Rapier 2D 0.14 from a CDN, ES modules, no build step. Kinematic character controllers for everything that moves, a depth-of-field grade pass, procedural kitchen props and textures, a felt piano rendered in the browser with OfflineAudioContext, sound effects from Kenney (CC0).

Run locally with any static server, for example `python3 Niepotrzebne/serve.py 8473`. Add `?net=local` to test online rooms between tabs of one browser without Firebase.
