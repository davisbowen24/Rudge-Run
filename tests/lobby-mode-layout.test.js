import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const htmlPath=new URL('../dist/index.html',import.meta.url);
const cssPath=new URL('../dist/multiplayer.css',import.meta.url);
const jsPath=new URL('../dist/lobby.js',import.meta.url);

test('all four mode options occupy one two-column lobby grid in the requested order',async()=>{
  const html=await readFile(htmlPath,'utf8');
  const start=html.indexOf('<div class="lobby-mode-grid"');
  const end=html.indexOf('</div><label>Your vehicle',start);
  assert.ok(start>0&&end>start,'mode grid stays before the vehicle selector');
  const grid=html.slice(start,end);
  const ids=['lobbyChaseMode','lobbyChaosMode','lobbyLosersAssist','lobbyStuntAssist'];
  const labels=['Chase Mode','Chaos Mode',"Loser's Assist","Stuntman's Assist"];
  for(let i=0;i<ids.length;i++){
    assert.equal((grid.match(new RegExp('id="'+ids[i]+'"','g'))||[]).length,1);
    assert.ok(grid.includes(labels[i]));
    assert.ok(grid.includes('id="'+ids[i]+'Status"'));
    if(i)assert.ok(grid.indexOf('id="'+ids[i-1]+'"')<grid.indexOf('id="'+ids[i]+'"'),
      'DOM order determines row-major 2×2 layout');
  }
  assert.equal((grid.match(/class="lobby-chase-option"/g)||[]).length,4);
  assert.equal((grid.match(/class="lobby-mode-description"/g)||[]).length,4);
  assert.doesNotMatch(grid,/host.controlled|everyone uses the same setting/i);
  const descriptions=[...grid.matchAll(/class="lobby-mode-description">([^<]*)</g)].map(m=>m[1]);
  assert.equal(descriptions.length,4);
  for(const desc of descriptions)assert.ok(desc.length<45,'brief descriptions fit side by side');
});

test('mode cards remain a two-column layout even under narrow mobile CSS',async()=>{
  const css=await readFile(cssPath,'utf8');
  assert.match(css,/\.lobby-controls \.lobby-mode-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.lobby-controls \.lobby-mode-grid \.lobby-chase-option\{[^}]*grid-column:auto/);
  assert.match(css,/@media\(max-width:390px\)/);
  assert.doesNotMatch(css,/\.lobby-mode-grid\{[^}]*grid-template-columns:1fr/);
});

test('compact status labels still use four independent checked states',async()=>{
  const js=await readFile(jsPath,'utf8');
  for(const [id,name] of [
    ['lobbyChaseModeStatus','chaseToggle'],['lobbyChaosModeStatus','chaosToggle'],
    ['lobbyLosersAssistStatus','assistToggle'],['lobbyStuntAssistStatus','stuntToggle']
  ]){
    assert.ok(js.includes("$('"+id+"').textContent="+name+".checked?'ON':'OFF'"));
  }
});
