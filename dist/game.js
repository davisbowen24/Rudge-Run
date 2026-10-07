import { createAuth } from './auth.js';
import { createCloudSave } from './cloudSave.js';
import { createAccountUi } from './accountUi.js';
import { createMultiplayer } from './multiplayer.js';
import { createLobbyUi } from './lobby.js';
import { createStats } from './stats.js';
import { installTheme } from './theme.js';
import { createWorkshop } from './workshop.js';
import { createMoments } from './moments.js';
import { createEffects } from './effects.js';
import { createRender } from './render.js';
import { createTerrain } from './terrain.js';
import { createEconomy } from './economy.js';
import { createPhysics } from './physics.js';
import { createUpgrades } from './upgrades.js';
import { createSave } from './save.js';
import { createInput } from './input.js';
import { createUi } from './ui.js';
import { createMain } from './main.js';
import { createFeedback } from './feedback.js';

/** One state object and explicitly wired services per game; no global game variables. */
export function createGame() {
  installTheme();

  const state = {};

  const services = { state, auth: createAuth(), cloudSave: {}, accountUi: {}, multiplayer: {}, lobby: {}, stats: {}, workshop: {}, moments: {}, effects: {}, render: {}, terrain: {}, economy: {}, physics: {}, upgrades: {}, save: {}, input: {}, ui: {}, main: {}, feedback: {} };

  Object.assign(services.render, createRender(services));

  Object.assign(services.terrain, createTerrain(services));

  Object.assign(services.economy, createEconomy(services));

  Object.assign(services.physics, createPhysics(services));

  Object.assign(services.upgrades, createUpgrades(services));

  Object.assign(services.save, createSave(services));

  Object.assign(services.input, createInput(services));

  Object.assign(services.ui, createUi(services));

  Object.assign(services.main, createMain(services));

  Object.assign(services.feedback, createFeedback(services));

  Object.assign(services.effects, createEffects(services));

  Object.assign(services.moments, createMoments(services));
  Object.assign(services.workshop, createWorkshop(services));
  Object.assign(services.stats, createStats(services));
  Object.assign(services.cloudSave, createCloudSave(services));
  Object.assign(services.accountUi, createAccountUi(services));
  Object.assign(services.multiplayer, createMultiplayer(services));
  Object.assign(services.lobby, createLobbyUi(services));
  services.main.start();
  services.accountUi.bindEvents();
  services.lobby.bindEvents();
  services.multiplayer.start();
  services.cloudSave.start();
  services.stats.bindEvents();
  services.workshop.bindEvents();

  return services;

}
