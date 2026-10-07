import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('menu navigation keeps Home or Leave Room available outside runs',async()=>{
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');

  for(const [screen,control] of [
    ['garageScreen','garageBack'],
    ['storeScreen','storeBack'],
    ['mapScreen','mapBack'],
    ['statsScreen','recordsBack'],
    ['accountScreen','accountBack'],
    ['multiplayerScreen','multiplayerBack'],
    ['lobbyScreen','lobbyLeave'],
    ['multiplayerResultsScreen','multiplayerResultsLeave']
  ]){
    const start=html.indexOf(`id="${screen}"`);
    assert.ok(start>=0,`missing ${screen}`);
    const next=html.indexOf('<section',start+10);
    const fragment=html.slice(start,next>=0?next:html.length);
    assert.match(fragment,new RegExp(`id="${control}"`),`${screen} needs ${control}`);
  }

  assert.match(html,/id="endHome">Home</);
  assert.match(html,/id="garageBack">Home</);
  assert.match(html,/id="storeBack">Home</);
  assert.match(html,/id="mapBack">Home</);
  assert.match(html,/id="recordsBack">Home</);
  assert.match(html,/id="multiplayerBack">Home</);
  assert.match(html,/id="accountBack">Home</);
  assert.match(html,/id="lobbyLeave">Leave Room</);
  assert.match(html,/id="multiplayerResultsLeave">Leave Room</);
});

test('Start Run is direct and Change Map remains optional',async()=>{
  const ui=await readFile(new URL('../dist/ui.js',import.meta.url),'utf8');

  for(const id of ['startRun','garageDrive','storeDrive','again']){
    assert.ok(ui.includes("$('"+id+"').addEventListener('click',()=>main.reset())"),id+' should start the selected run directly');
  }

  for(const id of ['startMap','garageMap','storeMap','endMap']){
    assert.ok(ui.includes("$('"+id+"').addEventListener('click',openMaps)"),id+' should open optional map selection');
  }

  assert.match(ui,/function closeGarage\(\)\{[\s\S]*showScreen\('start'\)/);
  assert.match(ui,/function closeStore\(\)\{[\s\S]*showScreen\('start'\)/);
  assert.match(ui,/function closeMaps\(\)\{[\s\S]*showScreen\('start'\)/);
});

test('home is a visual hub instead of the old centered card',async()=>{
  const [html,workshop,css]=await Promise.all([
    readFile(new URL('../dist/index.html',import.meta.url),'utf8'),
    readFile(new URL('../dist/workshop.js',import.meta.url),'utf8'),
    readFile(new URL('../dist/navigation.css',import.meta.url),'utf8')
  ]);

  const start=html.indexOf('id="startScreen"');
  const end=html.indexOf('id="garageScreen"',start);
  const home=html.slice(start,end);
  assert.doesNotMatch(home,/<div class="card">/);
  assert.match(home,/id="homePresentation"/);
  assert.match(home,/id="homeSelectedMap"/);
  assert.match(home,/id="startStats">Records</);
  assert.match(home,/class="home-utility-row"/);

  assert.match(workshop,/function home\(\)/);
  assert.match(workshop,/drawStage\('home',id\)/);
  assert.match(css,/\.home-main\{/);
  assert.match(css,/#garageScreen/);
  assert.match(css,/#storeScreen/);
  assert.match(css,/#mapScreen/);
  assert.match(css,/#lobbyScreen/);
});

test('navigation markup has no duplicate element IDs',async()=>{
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const ids=[...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
});
