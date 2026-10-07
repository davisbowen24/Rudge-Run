// Conservative, idempotent migration. Unknown fields/settings prefer the local save.
const forbidden=new Set(['__proto__','prototype','constructor']);
export function clean(value){
  if(Array.isArray(value))return value.map(clean);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!forbidden.has(k)).map(([k,v])=>[k,clean(v)]));
  return value;
}
function maximum(a,b){
  const result={...clean(b||{}),...clean(a||{})};
  for(const k of Object.keys(result)){
    if(typeof a?.[k]==='number'||typeof b?.[k]==='number')result[k]=Math.max(Number.isFinite(a?.[k])?a[k]:0,Number.isFinite(b?.[k])?b[k]:0);
    else if(a?.[k]&&b?.[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))result[k]=maximum(a[k],b[k]);
  }
  return result;
}
export function mergeSaves(local,cloud){
  const a=clean(local||{}),b=clean(cloud||{}),out={...b,...a};
  out.balance=Math.max(a.balance||0,b.balance||0); // Never add balances from related saves.
  for(const key of ['owned','ownedMaps'])out[key]=[...new Set([...(a[key]||[]),...(b[key]||[])])];
  for(const key of ['levelsByVehicle','upgradeSpent','best'])out[key]=maximum(a[key],b[key]);
  out.checkpoints={};for(const id of new Set([...Object.keys(a.checkpoints||{}),...Object.keys(b.checkpoints||{})]))out.checkpoints[id]=[...new Set([...(a.checkpoints?.[id]||[]),...(b.checkpoints?.[id]||[])].map(String))];
  out.settings={...b.settings,...a.settings};
  out.stats=maximum(a.stats,b.stats);
  // Keep the vehicle paired with the winning distance, including legacy records.
  out.stats.maps={...out.stats.maps};
  for(const id of Object.keys(out.stats.maps)){
    const ar=a.stats?.maps?.[id],br=b.stats?.maps?.[id];
    out.stats.maps[id]=clean((ar?.bestDistance||0)>=(br?.bestDistance||0)?ar:br);
  }
  out.stats.lastRun=clean(a.stats?.lastRun||b.stats?.lastRun||null);
  return out;
}
