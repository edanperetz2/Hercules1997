# Hercules · A Hero's Journey

A playable browser fan game inspired by the side-scrolling action of **Hercules (1997)**. Original implementation, generated character/background artwork, and original synthesized audio. No original game's binaries, extracted sprites, recordings, or ROMs are included.

## Play

Open the deployed game URL in a modern desktop or mobile browser. No installation or paid services are required. All ten chapters are available through **Choose a chapter**. Your progress is saved in the current browser.

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Move | Arrow keys / A, D | Left stick / D-pad |
| Jump / double jump | Space / W / Up | A |
| Sword / charged strike | J / X (hold, then release to charge) | X |
| Magic | K / C | Y |
| Ground slam | Down / S in the air | D-pad down |
| Pause | Escape / P | Start |

Touch buttons appear on mobile. Sound is optional; toggle the musical note at the top. Use fullscreen or landscape orientation for a larger view.

## Campaign

1. The Training Grounds
2. The Hero's Gauntlet — rush
3. The Centaur's Forest — Nessus
4. The Big Olive — Minotaur
5. The Hydra's Lair — Hydra
6. Medusa's Temple — Medusa
7. The Cyclops Chase — rush
8. The Titan's Ascent — Earth Titan
9. The River of Souls — rush
10. The Final Labor — Hades

Collect gold, the eight HERCULES letters, and four amphorae in each chapter. Green crystals restore health; blue crystals restore magic. Bosses telegraph their attacks and become vulnerable while recovering. Three difficulty settings change health, lives, enemy speed, and damage.

## Run and verify

```sh
npm test
npm run check
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`. The game has no runtime JavaScript dependencies, build step, backend, or API keys. The optional Google Fonts stylesheet has local serif/sans-serif fallbacks.

`dist/engine.js` contains deterministic gameplay, `dist/renderer.js` draws the canvas, `dist/audio.js` synthesizes sound, and `dist/game.js` handles browser controls, menus, and local progress. Artwork lives in `dist/assets/`.

The `dist/` directory can also be hosted by GitHub Pages or another static host. `.openai/hosting.json` is the existing Sites deployment identity; retain it when editing this hosted Site.

## Reference and attribution

Gameplay references: [Wikipedia: Hercules (1997 video game)](https://en.wikipedia.org/wiki/Hercules_(1997_video_game)) and the [original PC manual](https://cdn.cloudflare.steamstatic.com/steam/apps/987400/manuals/disneys_hercules_manual.pdf). Artwork generated with OpenAI image generation for this project and adapted into transparent game sprites. This is an unofficial fan game; Disney and the original game's creators are not affiliated with it. Character silhouettes for the Minotaur, Medusa, and Earth Titan use tinted variants of the original creature sprites. This is a new interpretation, with double jump and other accessibility conveniences, rather than a pixel-exact reproduction.
