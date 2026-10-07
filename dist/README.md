# Ridge Run / Hill Climb

Vanilla HTML, CSS and JavaScript. No build step or runtime dependencies.

## Run locally

From this folder, run `python3 -m http.server 8080 --directory dist` and open
`http://localhost:8080`. Serve over HTTP: browsers cannot load ES modules reliably
from `file://` URLs.

## Source layout

All browser files are in `dist/` (the hosting root).

- `index.html`: existing page structure and Canvas containers.
- `styles.css`: page stylesheet.
- `bootstrap.js`: browser entry point.
- `game.js`: composition root; creates a private state object and wires services.
- `main.js`: ordered initialization, run reset and fixed-step game loop.
- `config.js`: shared Jeep baseline, world/economy constants and storage keys.
- `vehicles.js`: authoritative vehicle definitions, geometry, multipliers and upgrade curves/prices.
- `maps.js`: authoritative map definitions, multipliers, flags and seasonal palettes.
- `upgrades.js`: per-vehicle upgraded stat calculation and upgrade descriptions.
- `physics.js`: contacts, suspension, forces, rotation, collision and hazard effects.
- `terrain.js`: terrain queries, specialized generators, surface properties and feature caches.
- `economy.js`: pickups, fuel spacing, rewards, checkpoints and purchases.
- `save.js`: save loading, legacy migration, validation and persistence.
- `ui.js`: screens, menus, HUD and menu event bindings.
- `input.js`: keyboard, pointer and focus/visibility controls.
- `render.js`: Canvas drawing, scenery and vehicle rendering.
- `feedback.js`: sound and particle feedback.
- `utils.js`: DOM lookup and numeric clamp helpers.

Modules import static data explicitly. Runtime services receive explicit dependencies
from `game.js`; they do not import each other. This avoids circular imports while
retaining existing function behavior. Shared mutable values belong to one game
instance's `state` object, not browser globals. Factories have no startup side
effects; `main.start()` initializes state and bindings after all services are wired.

## Save compatibility

The existing keys are unchanged: localStorage `ridge-run-progress-v3`, with
sessionStorage `ridge-run-garage-v1` as the legacy fallback. Save version 4 and
checkpoint-spacing revision 1 remain unchanged. Existing owned vehicles/maps,
per-vehicle upgrades, spending, balances, selected items, best distances and claimed
checkpoints load through the original validation/migration logic.

Browser storage is origin-specific. The published game retains its existing origin;
a local development server has its own separate save storage.

## Refactor validation

Compared against the pre-refactor source using an isolated JavaScript module harness:
all 20 vehicle simulations, all 18 terrain generators, pixel-identical Canvas frames,
existing save migration, menus, vehicle/map purchases and selection, upgrades,
pause/resume/quit, and keyboard/pointer bindings. Physics and balance formulas were
moved without changes.

## Map visual identity and speed effects

`visuals.js` centralizes the 18 map presentation profiles and reusable surface
materials. `effects.js` owns terrain markings, world-anchored map props, contact
particles and speed streaks. It reads simulation state without changing forces,
collisions, generated terrain, economy or saves. Highway uses denser road markers
and stronger streaks. Construction particles use actual steel/concrete/dirt
sections; seasonal and hazard surfaces override the default particle material.

Particles reuse a private object pool (maximum 180 live objects). Emission scales
with speed, slip and wheel contact. A rolling frame-time budget reduces particles,
surface sampling and secondary props during slow frames. Reset clears effects;
pause freezes particles. The effects RNG is independent of gameplay.

## Big-moment feedback and HUD

`moments.js` owns bounded event popups, unlock/upgrade reveals, live record detection,
coin display smoothing, HUD pulses, jump tracking and camera effects. Gameplay
sends notifications only after its existing pickup, flip, milestone or purchase
logic succeeds; feedback never changes rewards or saved records.

Jump distance and airtime are observed at the physics timestep. Landing strength
uses incoming wheel-point velocity projected onto the terrain normal. The renderer
limits shake to five pixels and framing to a gentle zoom, while the main camera
adds a capped speed-based look-ahead. Only three popups and one reveal may overlap.
Reduced-motion preferences disable shake, camera zoom and scale pulses.

## Motor Works garage and showroom

`workshop.js` supplies a shared Canvas vehicle stage, collection browser, base-trait
bars and per-vehicle upgrade controls. The stage reuses `paintVehicle` and its exact
geometry; scaling, lighting and transitions are menu-only. Only the visible stage
animates. Browsing locked or owned vehicles does not equip them. Equip and unlock
actions continue through the original economy functions and save schema.

Showroom arrows and the collection strip browse all 20 vehicles; keyboard arrows
work inside the showroom. “Tune in Garage” equips an owned vehicle and opens its
independent upgrades. Garage arrows cycle owned vehicles. Exact specifications and
upgrade comparisons remain in expandable panels. Reset progress remains exclusive
to the showroom with its existing confirmation.

## Typography and text theme

`theme.js` is the authoritative source for font stacks, semantic text colors, text
shadows and popup type sizes. `installTheme()` exports these as CSS custom
properties at startup; `canvasFont()` gives Canvas labels the same readable stack.
`theme.css` applies the roles to HUD, menus, ownership, prices and upgrade states.
The display stack uses locally available condensed fonts (Impact / Arial Narrow);
body text and numerical values use Arial / Helvetica with tabular numerals.
No font downloads or external font dependencies are required.

Event styling uses existing event types and presentation metadata only. Fuel is
green, checkpoints cyan, single flips white, combos violet, records orange-gold,
unlocks premium violet, and upgrades green-cyan. Popup lifetime and rewards are
unchanged. Dark popup backing, restrained text outlines and distinct labels retain
readability even when hue differences are difficult to distinguish.

### Player Stats & Records
`dist/stats.js` owns the save schema, legacy migration, run observers and Records page.
Stats are stored under `stats.global`, `stats.maps` and `stats.vehicles` in the existing
save key. Older map bests survive, with unknown vehicle attribution. Historical totals
cannot be reconstructed and begin with this update. A run starts on driving input and
is finalized once on loss, garage exit, or page exit. Safe wheel-contact landings alone
qualify for jump distance/airtime; existing completed-flip events retain their reward
semantics. Distance driven is cumulative absolute horizontal movement; best distance
is maximum forward progress. Purchases never subtract from coins-earned statistics.

### Optional accounts and cloud saves
The Account page supports username/password accounts without email aliases. Guest play
and existing local saves remain available. See [`SUPABASE_SETUP.md`](../SUPABASE_SETUP.md)
for database/Edge deployment, the public endpoint setting, security details and tests.
Run `npm ci && npm test` from the repository root. No runtime dependency or build step
has been added to the game; PGlite is used only by the backend tests.
