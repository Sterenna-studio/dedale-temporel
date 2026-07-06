import { CONV_RATE_SP } from './config.js';
import { state } from './storage.js';
import { addGold, refreshGold } from '/lab/shared/economy.js';
const btn=()=>document.getElementById('convertBtn'); const info=()=>document.getElementById('convertInfo'); const gold=()=>document.getElementById('goldCount');
export function attach(){ btn()?.addEventListener('click',convertToGold); }
export function refreshButton(){ const can=state.steam>=CONV_RATE_SP; if(btn()) btn().disabled=!can; if(info()) info().textContent=can?'Prêt à convertir.':`Encore ${(CONV_RATE_SP-state.steam).toFixed(0)} SP`; }
async function convertToGold(){ if(state.steam<CONV_RATE_SP) return; state.steam-=CONV_RATE_SP; await addGold(1); const g=await refreshGold(); if(gold()) gold().textContent=g; }