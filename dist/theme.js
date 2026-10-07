/** Authoritative presentation tokens, shared by DOM/CSS and Canvas lettering. */
export const UI_THEME = Object.freeze({
  fonts: Object.freeze({display:'Impact, "Arial Narrow", "Franklin Gothic Medium", sans-serif',body:'Arial, "Helvetica Neue", Helvetica, sans-serif'}),
  colors: Object.freeze({primary:'#f5f8fa',secondary:'#c2d3da',muted:'#96afb9',reward:'#ffdc68',warning:'#ffb16b',danger:'#ff747f',locked:'#b4beca',unlocked:'#9bf4b3',ready:'#7de4f5',max:'#ffdc68',fuel:'#9bf4b3',checkpoint:'#7de4f5',flip:'#ffffff',combo:'#e2b1ff',record:'#ffc17c',premium:'#d6b4ff',success:'#9bf4cb',ink:'#14242f',outline:'#081923'}),
  shadows: Object.freeze({text:'0 2px 2px #081923',popup:'0 2px 0 #081923, 0 4px 10px #081923b3',glow:'0 0 12px currentColor'}),
  sizes: Object.freeze({body:'1rem',secondary:'.875rem',label:'.75rem',minorPopup:'clamp(22px, 2.7vw, 32px)',majorPopup:'clamp(28px, 3.7vw, 44px)'})
});
export function installTheme(){
  const style=document.documentElement?.style;
  if(!style)return;
  for(const [key,value] of Object.entries(UI_THEME.fonts))style.setProperty('--font-'+key,value);
  for(const [key,value] of Object.entries(UI_THEME.colors))style.setProperty('--text-'+key,value);
  for(const [key,value] of Object.entries(UI_THEME.shadows))style.setProperty('--shadow-'+key,value);
  for(const [key,value] of Object.entries(UI_THEME.sizes))style.setProperty('--size-'+key,value);
}
export function canvasFont(size,weight=700,display=false){return `${display?400:weight} ${size}px ${UI_THEME.fonts[display?'display':'body']}`;}
