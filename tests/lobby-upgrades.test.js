import test from 'node:test';
import assert from 'node:assert/strict';
import {createSave} from '../dist/save.js';
import {createUpgrades} from '../dist/upgrades.js';
import {createEconomy} from '../dist/economy.js';
import {createWorkshop} from '../dist/workshop.js';

test('lobby purchases and fractional tuning target the room car without changing single-player selection',()=>{
  const state={screen:'lobby'},save=createSave({state,cloudSave:{initialSave:()=>null,localKey:k=>k,saved(){}},economy:{}});
  state.progression=save.freshProgress();state.progression.owned.push('bike');state.progression.balance=100000;
  const upgrades=createUpgrades({state,save}),economy=createEconomy({state,save,upgrades,ui:{renderGarage(){throw Error('must not navigate away');}},moments:{emit(){}}});
  const before=state.progression.balance,cost=economy.upgradeCost('suspension','bike');
  assert.equal(economy.buyUpgrade('suspension','bike'),true);
  assert.equal(state.progression.balance,before-cost);
  assert.equal(save.levelsFor('bike').suspension,1);assert.equal(save.levelsFor('base').suspension,0);
  assert.equal(state.progression.selected,'base');
  assert.equal(save.setActiveLevel('suspension',.5,'bike'),.5);
  const workshop=createWorkshop({state,save,upgrades,economy,ui:{upgradeBenefit:()=>'',statSummary:()=>''}});
  const html=workshop.upgradeCards('bike','lobby');
  assert.match(html,/Air Control/);assert.match(html,/lobby-tune-suspension/);assert.match(html,/value="0.5"/);
  assert.equal(economy.buyUpgrade('engine','tank'),false);
  state.screen='playing';assert.equal(economy.buyUpgrade('engine','bike'),false);
});
