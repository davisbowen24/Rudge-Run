/**
 * Chase warning badges are deliberately presentation-only. Their inline SVGs
 * are fixed, trusted vector silhouettes (not user strings or external assets).
 * Each map uses the existing chase hazard type from chaseVisuals.js.
 */
import { chaseHazardForMap } from './chaseVisuals.js';

const palettes=Object.freeze({
  tornadoes:['#d4e5ef','#1b303b','#9ab8ca'],
  sludge:['#c6ff69','#183823','#7fdb57'],
  disco:['#ff83e4','#311944','#aa86ff'],
  aliens:['#b4ff90','#173d2b','#65d96b'],
  pipes:['#e4e6dc','#273740','#aebebc'],
  mud:['#e8c58d','#3f2c1d','#b48b57'],
  semi:['#ffc28b','#472126','#e76d55'],
  spiders:['#c7ff9f','#202d27','#6abb7d'],
  ufos:['#b5f5ff','#172c47','#79b8ed'],
  cows:['#ffead2','#433328','#c8a87a'],
  lava:['#ffce75','#492218','#f98039'],
  grandmas:['#ffcbe6','#442137','#e989b4'],
  avalanche:['#edfaff','#283e55','#9ed5ee'],
  sandstorm:['#ffdc9b','#513827','#d5a363'],
  flood:['#bdfff3','#154457','#66cbda'],
  ghosts:['#d8c7ff','#33294f','#937bd5'],
  piranhas:['#bde8f1','#1c3746','#71bfcc'],
  generic:['#ffffff','#26313e','#9ba8b6']
});

// Every icon uses a filled shape designed to read as a shadow even at 40 px.
// Dark negative-space cutouts are kept minimal so the silhouettes remain bold.
const icons=Object.freeze({
  grandmas:`<circle cx="23" cy="12" r="8"/><circle cx="13" cy="9" r="5"/>
    <path d="M17 23h12l10 22H8z"/><path d="M16 43h7l-4 15h-8zM27 43h7l6 15h-8z"/>
    <path d="M16 25L7 37l5 4 12-11zM28 25l10-11 6 4-11 16z"/>
    <path d="M40 8l5-5 5 4-5 6zM45 7l9-9 7 7-11 10z"/>
    <path d="M16 9q8-8 15 2l-2 3-13-1z"/>
    <path d="M18 13h5m3 0h5" stroke="var(--chase-bg)" stroke-width="2" fill="none"/>`,
  cows:`<path d="M6 23Q8 16 18 17h22q7 1 8 8v18H7z"/>
    <path d="M12 39h8v20h-8zM33 39h7v20h-7z"/>
    <path d="M39 19l9-5 11 6-2 22-16 1-7-12z"/>
    <path d="M43 15l-2-12 9 11zM52 16l9-13-3 17z"/>
    <path d="M8 20L2 13l-2 2 3 16 5-3z"/>
    <ellipse cx="51" cy="34" rx="7" ry="5"/>
    <circle cx="45" cy="25" r="2.1" fill="var(--chase-bg)"/>
    <path d="M10 22l10-3 8 9-12 7z" fill="var(--chase-bg)"/>`,
  tornadoes:`<path d="M4 11Q18 3 34 10T61 9L54 17Q32 15 12 19z"/>
    <path d="M8 22q18-9 41-1l-6 8q-12-1-24 6z"/>
    <path d="M18 37q14-8 24-5l-8 11-9 2z"/>
    <path d="M26 47l10-3-8 16-6-8z"/>
    <path d="M1 38q8-7 13-2l-5 7-7 3zM46 41q10-7 17-1l-4 9-10-1z" opacity=".72"/>`,
  sludge:`<path d="M2 39q4-11 15-9 9-16 21-7 10-9 16 2 11 6 7 18-3 12-19 13H18Q3 54 2 39z"/>
    <circle cx="13" cy="15" r="5"/><circle cx="34" cy="8" r="7"/><circle cx="51" cy="13" r="3"/>
    <circle cx="21" cy="40" r="7" fill="var(--chase-bg)" opacity=".55"/>
    <circle cx="41" cy="33" r="4" fill="var(--chase-bg)" opacity=".45"/>`,
  disco:`<circle cx="16" cy="16" r="7"/><path d="M13 24l13-1 9 15-10 8-6-12-6 13-9-4z"/>
    <path d="M23 25l12-12 8 4-14 20zM11 27L2 10l6-3 13 19z"/>
    <path d="M21 43l9 14-6 5-11-14zM26 39l18 9-3 8-20-9z"/>
    <circle cx="48" cy="13" r="12"/><path d="M36 13h24M48 1v24M40 4l16 18M56 4L40 22" stroke="var(--chase-bg)" stroke-width="2"/>`,
  aliens:`<path d="M15 25q-2-19 16-19t18 19q0 19-18 22T15 25z"/>
    <path d="M23 10L16 1l-5 7m29 2 9-9 5 8" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M22 44L11 58l10 4 12-15 11 15 11-4-14-15z"/>
    <path d="M16 28L3 40l5 5 14-7zM48 27l13 13-5 5-14-8z"/>
    <circle cx="22" cy="24" r="5" fill="var(--chase-bg)"/>
    <circle cx="33" cy="21" r="6" fill="var(--chase-bg)"/>
    <circle cx="43" cy="24" r="5" fill="var(--chase-bg)"/>`,
  pipes:`<path d="M8 14L45 3l12 34-36 12z"/>
    <ellipse cx="22" cy="32" rx="12" ry="18" transform="rotate(-19 22 32)"/>
    <ellipse cx="22" cy="32" rx="6" ry="10" transform="rotate(-19 22 32)" fill="var(--chase-bg)"/>
    <path d="M45 3q12 0 16 11t-4 23" fill="none" stroke="currentColor" stroke-width="5"/>
    <path d="M5 56l23-5M10 62l28-5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
  mud:`<path d="M1 41q2-10 12-11l10-9 11 3q8-13 16-2 12 1 14 17l-8 17H10z"/>
    <circle cx="12" cy="14" r="6"/><circle cx="34" cy="9" r="4"/>
    <path d="M16 37q14-8 27 4l-6 11-16-1z" fill="var(--chase-bg)" opacity=".3"/>`,
  semi:`<path d="M1 22h35v24H1zM36 29h13l11 10v7H36z"/>
    <path d="M43 32h7l6 8H43z" fill="var(--chase-bg)"/>
    <circle cx="13" cy="48" r="9"/><circle cx="45" cy="48" r="9"/>
    <circle cx="13" cy="48" r="4" fill="var(--chase-bg)"/>
    <circle cx="45" cy="48" r="4" fill="var(--chase-bg)"/>
    <path d="M3 17h32" stroke="currentColor" stroke-width="5"/>`,
  spiders:`<ellipse cx="26" cy="34" rx="16" ry="13"/><circle cx="44" cy="32" r="10"/>
    <path d="M16 30L5 18 1 7M17 37L4 37 0 47M31 25L29 10 22 1M33 43l4 13 9 7
      M44 26l9-15 9-3M47 37l13 5 4 13M19 28L6 11M21 44l-9 12"
      stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="46" cy="29" r="2" fill="var(--chase-bg)"/>
    <circle cx="53" cy="29" r="2" fill="var(--chase-bg)"/>`,
  ufos:`<ellipse cx="32" cy="34" rx="29" ry="11"/>
    <path d="M17 29Q20 9 32 9T47 29z"/>
    <path d="M23 45l-9 17h36L41 45z" opacity=".6"/>
    <circle cx="16" cy="35" r="3" fill="var(--chase-bg)"/>
    <circle cx="32" cy="39" r="3" fill="var(--chase-bg)"/>
    <circle cx="49" cy="35" r="3" fill="var(--chase-bg)"/>`,
  lava:`<path d="M2 44q8-12 18-8Q14 20 32 10q-4 15 6 20Q45 9 48 1q15 25 11 40-2 18-28 20Q4 60 2 44z"/>
    <path d="M18 49q2-9 13-14-3 10 4 15 7-8 6-15 12 11 6 19-18 11-29-5z"
    fill="var(--chase-bg)" opacity=".57"/>`,
  avalanche:`<path d="M0 47L18 16l9 11L37 4l27 43-7 15H9z"/>
    <path d="M11 32l7-16 9 11-5-1zM31 21L37 4l15 24-12-5-6 5z"
      fill="var(--chase-bg)" opacity=".45"/>
    <path d="M0 53q14-12 29 0t35 0v10H0z"/>`,
  sandstorm:`<path d="M3 14q31-20 55 0 11 15-5 23-10 4-19-3-6-8 4-14
    M2 38q22-13 36-2t25 3M8 56q24-12 45 3"
    stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/>
    <circle cx="16" cy="28" r="4"/>`,
  flood:`<path d="M2 24q12-12 26 0t34 0v9q-16 13-32 2T2 35z"/>
    <path d="M2 39q12-12 26 0t34 0v10q-16 13-32 2T2 51z"/>
    <path d="M2 55q16-9 28 0t32 0v9H2z"/>`,
  ghosts:`<path d="M8 30Q8 4 31 4t23 26v29l-9-7-9 9-8-10-10 9-10-7z"/>
    <ellipse cx="23" cy="30" rx="5" ry="8" fill="var(--chase-bg)"/>
    <ellipse cx="40" cy="30" rx="5" ry="8" fill="var(--chase-bg)"/>
    <ellipse cx="32" cy="43" rx="4" ry="6" fill="var(--chase-bg)"/>`,
  piranhas:`<path d="M14 32L1 14v37zM10 32Q28 5 52 21L63 32 52 43Q28 58 10 32z"/>
    <path d="M44 34l10 2-11 11z" fill="var(--chase-bg)"/>
    <path d="M46 36l3 6 3-5 3 4 3-6" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="44" cy="25" r="4" fill="var(--chase-bg)"/>`,
  generic:`<path d="M32 5L60 56H4z"/><path d="M32 22v18" stroke="var(--chase-bg)" stroke-width="6"/>
    <circle cx="32" cy="47" r="3" fill="var(--chase-bg)"/>`
});

export function chaseWarningVisualForMap(mapId){
  const type=chaseHazardForMap(mapId).type;
  const [color,background,border]=palettes[type]||palettes.generic;
  const silhouette=icons[type]||icons.generic;
  return {
    type,color,background,border,
    // Static, trusted paths; no user-derived HTML is ever interpolated.
    svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="currentColor">${silhouette}</svg>`
  };
}
