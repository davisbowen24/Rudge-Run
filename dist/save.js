import { freshStats, normalizeStats } from './stats.js';
import { MAPS, PREVIOUS_CHECKPOINT_SPACING } from './maps.js';
import { UPGRADES, VEHICLES, freshLevels } from './vehicles.js';
import { MAX_LEVEL, PERSISTENT_KEY, SAVE_KEY } from './config.js';

export function createSave({ economy, state, cloudSave }) {

  function migrateCheckpointDistance(id,distance){

    const oldSpacing=PREVIOUS_CHECKPOINT_SPACING[id];

    for(let n=1;n<1000;n++){
      const current=economy.checkpointDistance(n,id),old=Math.round(current/MAPS[id].checkpointSpacing*oldSpacing);
      if(Math.abs(old-distance)<=1)
      return String(current);
      if(old>distance+1)
      break;
    }

    return String(distance);

  }

  function freshProgress(){
    return {stats:freshStats(),version:4,checkpointSpacingRevision:1,best:Object.fromEntries(Object.keys(MAPS).map(id=>[id,0])),checkpoints:Object.fromEntries(Object.keys(MAPS).map(id=>[id,[]])),balance:0,levelsByVehicle:Object.fromEntries(Object.keys(VEHICLES).map(id=>[id,freshLevels()])),upgradeSpent:Object.fromEntries(Object.keys(VEHICLES).map(id=>[id,0])),owned:['base'],selected:'base',ownedMaps:['countryside'],selectedMap:'countryside'};
  }

  function validatedLevels(source){
    const out=freshLevels();
    for(const key of Object.keys(UPGRADES)){
      const n=source?.[key];
      if(Number.isInteger(n)&&n>=0&&n<=MAX_LEVEL)
      out[key]=n;
    }
    return out;
  }

  function readSavedProgress(){
    const cached=cloudSave.initialSave();if(cached)return cached;
    try{
      const saved=JSON.parse(localStorage.getItem(cloudSave.localKey(PERSISTENT_KEY)));
      if(saved&&Number.isSafeInteger(saved.balance))
      return saved;
    }catch(e){
    }
    try{
      return JSON.parse(sessionStorage.getItem(cloudSave.localKey(SAVE_KEY)));
    }catch(e){
      return null;
    }
  }

  function levelsFor(id=state.progression.selected){
    return state.progression.levelsByVehicle[id];
  }

  function saveProgress(){
    cloudSave.saved(state.progression);
    const data=JSON.stringify(state.progression);
    try{
      localStorage.setItem(cloudSave.localKey(PERSISTENT_KEY),data);
    }catch(e){
    }
    try{
      sessionStorage.setItem(cloudSave.localKey(SAVE_KEY),data);
    }catch(e){
    }
  }

  function loadProgress(source) {

    try{
      const saved=source??readSavedProgress();
      if(saved&&Number.isSafeInteger(saved.balance)&&saved.balance>=0){
        // Preserve optional settings and future permanent fields as part of the full save.
        for(const [key,value] of Object.entries(saved))if(!Object.hasOwn(state.progression,key)&&!['__proto__','constructor','prototype'].includes(key))state.progression[key]=value;
        state.progression.balance=saved.balance;
        for(const id of Object.keys(MAPS)){
          if(Number.isFinite(saved.best?.[id])&&saved.best[id]>=0)
          state.progression.best[id]=Math.floor(saved.best[id]);
          if(Array.isArray(saved.checkpoints?.[id]))
          state.progression.checkpoints[id]=[...new Set(saved.checkpoints[id].map(String).filter(n=>/^\d+$/.test(n)&&Number(n)>0))];
        }
        if(Array.isArray(saved.ownedMaps))
        state.progression.ownedMaps=[...new Set(['countryside',...saved.ownedMaps.filter(id=>Object.hasOwn(MAPS,id))])];
        for(const id of Object.keys(MAPS))
        state.progression.best[id]=Math.max(state.progression.best[id],...state.progression.checkpoints[id].map(Number));
        if(saved.checkpointSpacingRevision!==1)
        for(const id of Object.keys(MAPS))
        state.progression.checkpoints[id]=state.progression.checkpoints[id].map(d=>migrateCheckpointDistance(id,Number(d)));
        if(state.progression.ownedMaps.includes(saved.selectedMap))
        state.progression.selectedMap=saved.selectedMap;
        if(Array.isArray(saved.owned))
        state.progression.owned=[...new Set(['base',...saved.owned.filter(id=>Object.hasOwn(VEHICLES,id))])];
        if(state.progression.owned.includes(saved.selected))
        state.progression.selected=saved.selected;
state.progression.stats=normalizeStats(saved.stats,state.progression.best);
// One-time legacy migration: preserve earned shared benefits on already-owned vehicles.

        for(const id of Object.keys(VEHICLES)){
          state.progression.levelsByVehicle[id]=validatedLevels(saved.levelsByVehicle?.[id]??(state.progression.owned.includes(id)?saved.levels:null));
          const spent=saved.upgradeSpent?.[id];
          if(Number.isSafeInteger(spent)&&spent>=0)
          state.progression.upgradeSpent[id]=spent;
        }

      }
    }catch(e){/* In-memory progress remains available when storage is blocked. */
    }

  }

  return { migrateCheckpointDistance, freshProgress, validatedLevels, readSavedProgress, levelsFor, saveProgress, loadProgress };

}
