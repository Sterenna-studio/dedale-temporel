// lab/shared/economy.js
import { getClient } from './supaRaw.js';
import { getCachedPlayer, updateCachedPlayer } from './supabaseData.js';
import { addGold as repoAddGold, setGold as repoSetGold } from './playersRepo.js';

let _cacheTs = 0;
export async function getGold(){
  const p = getCachedPlayer();
  if (!p?.id) return 0;
  if (p && Date.now() - _cacheTs < 15000) return p.gold ?? 0;
  const sb = await getClient();
  const { data } = await sb.from('players').select('gold').eq('id', p.id).maybeSingle();
  _cacheTs = Date.now();
  const val = data?.gold ?? 0;
  updateCachedPlayer({ gold: val });
  return val;
}
export async function setGold(value){
  const sb = await getClient();
  const p = getCachedPlayer();
  if (!p?.id) return 0;
  const gold = Math.max(0, Math.floor(value||0));
  await repoSetGold(sb, p.id, gold);
  updateCachedPlayer({ gold });
  _cacheTs = Date.now();
  return gold;
}
export async function addGold(delta){
  const sb = await getClient();
  const p = getCachedPlayer();
  if (!p?.id) return 0;
  const gold = await repoAddGold(sb, p.id, delta||0);
  updateCachedPlayer({ gold });
  _cacheTs = Date.now();
  return gold;
}
export async function spendGold(amount){
  const cur = await getGold();
  return await setGold(Math.max(0, cur - (amount||0)));
}
export async function refreshGold(){
  _cacheTs = 0;
  return await getGold();
}
