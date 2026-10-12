import { PHYS } from './config.js';
import { state } from './storage.js';
import { computeConnectivity, totalTorque } from './shop.js';

export function step(dt){
  const conn=computeConnectivity();
  const T=totalTorque(conn);
  const friction=(PHYS.frictionBase)*(1+PHYS.frictionTempK*(state.temperature-20));
  const a=(T/PHYS.baseInertia) - friction*(state.omega/1200);
  state.omega += a*dt;
  state.pressure += (Math.abs(state.omega)*PHYS.pressureK - PHYS.coolingK)*dt; if(state.pressure<0) state.pressure=0;
  state.temperature += (Math.abs(state.omega)*PHYS.tempK + state.pressure*PHYS.pressureToTempK - PHYS.coolingK)*dt; if(state.temperature<0) state.temperature=0;
  const sps=Math.abs(state.omega)*PHYS.spsPerOmega*(state.omega>=0?1:PHYS.negPenalty);
  state.steam += sps*dt;
  return {sps};
}
export function applyClickImpulse(){ state.omega += PHYS.clickImpulse; }
export function applyWheelImpulse(delta,mag,mult){ state.omega += delta * PHYS.wheelImpulse * (0.5+mag) * (mult||1); }
