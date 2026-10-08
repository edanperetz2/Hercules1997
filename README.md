# Hercules · A Hero's Journey

A playable browser fan game inspired by the side-scrolling action of **Hercules (1997)**. Original implementation, generated character/background artwork, and original synthesized audio. No original game's binaries, extracted sprites, recordings, or ROMs are included.

## Play

[**Play online**](https://hercules-labors-1997.cometglade1.chatgpt.site) in a modern desktop or mobile browser. No installation or paid services are required. Choose your controls on the opening screen, then begin or continue your adventure. All ten chapters are available through **Choose a chapter**. Your progress and control preferences are saved in the current browser.

| Action | WASD preset | Arrow preset | Gamepad |
| --- | --- | --- | --- |
| Move | A, D | Left, Right | Left stick / D-pad |
| Jump / double jump | Space | Z | A / Cross |
| Sword / charged strike | J (hold, then release to charge) | X | X / Square |
| Magic | K | C | Y / Triangle |
| Ground slam | S in the air | Down | Stick / D-pad down |
| Pause | Escape / P | Escape / P | Start / Options |

The opening screen also offers **Custom keys**, **Touch**, and **Gamepad**. Custom bindings swap duplicate keys automatically. Touch mode keeps the on-screen buttons visible on any device; gamepad mode keeps WASD as a keyboard backup. Change layouts through **Controls → Change controls**. Sound is optional; toggle the musical note at the top.

### iOS and Android

Open the public game link in Safari on iPhone/iPad or Chrome on Android. No app installation or account is required. Touch is preselected for new visitors on phones. Hold a direction with one thumb and tap Jump, Sword, or Magic with the other; jump twice for a double jump and hold Sword to charge. Both portrait and landscape work, with the original 16:9 scene preserved. Portrait controls sit below the scene; landscape gives a larger playfield. The larger-view button uses browser fullscreen when available and a page-filling view otherwise. Tap Exit to return.

Controls support simultaneous fingers, cancellation, and a Touch Events fallback. Changing apps pauses the game and clears held buttons. Safe-area spacing keeps the controls away from notches and the home indicator. Sound is enabled by an explicit tap and resumes on a later gesture after interruption. Mobile viewport and input tests use simulated devices; physical iOS/Android devices were not available for testing.

The forest edition uses a dense green grove, grassy ledges, wooden training targets, and silver cloud HUD frames based on the supplied visual reference. Hercules wears a short orange-brown tunic and blue cape. An articulated rig animates alternating legs, rising/apex/falling jumps, landing, sword wind-up/contact/recovery, charged strikes, magic, recoil, and victory; the head reuses the generated portrait artwork.

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

`dist/engine.js` contains deterministic gameplay, `dist/renderer.js` draws the canvas, `dist/hero-rig.js` animates the hero, `dist/animation.js` chooses action poses, `dist/controls.js` validates bindings, `dist/mobile.js` handles touch pointers and scene sizing, `dist/audio.js` synthesizes sound, and `dist/game.js` handles browser controls, menus, and local progress. Artwork lives in `dist/assets/`.

The `dist/` directory can also be hosted by GitHub Pages or another static host. `.openai/hosting.json` is the existing Sites deployment identity; retain it when editing this hosted Site.

## Reference and attribution

Gameplay references: [Wikipedia: Hercules (1997 video game)](https://en.wikipedia.org/wiki/Hercules_(1997_video_game)) and the [original PC manual](https://cdn.cloudflare.steamstatic.com/steam/apps/987400/manuals/disneys_hercules_manual.pdf). Artwork generated with OpenAI image generation for this project and adapted into transparent game sprites. This is an unofficial fan game; Disney and the original game's creators are not affiliated with it. Character silhouettes for the Minotaur, Medusa, and Earth Titan use tinted variants of the original creature sprites. This is a new interpretation, with double jump and other accessibility conveniences, rather than a pixel-exact reproduction.
