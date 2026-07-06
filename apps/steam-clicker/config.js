export const SAVE_KEY='steam_clicker_v6';export const CONV_RATE_SP=100000;
export const PHYS={baseInertia:1400,frictionBase:0.45,frictionTempK:0.002,wheelImpulse:22,clickImpulse:90,spsPerOmega:0.08,negPenalty:0.8,pressureK:0.006,tempK:0.02,pressureToTempK:0.0009,coolingK:0.015,maxOmegaGauge:1600};
export const ITEMS=[
{id:'gear',name:'Gears',ring:0,baseCost:15,costMult:1.15,torque:12,color:'steel'},
{id:'drone',name:'Copper Drones',ring:1,baseCost:120,costMult:1.16,torque:30,color:'copper'},
{id:'auto',name:'Temporal Automatons',ring:2,baseCost:950,costMult:1.17,torque:85,color:'bronze'},
{id:'boiler',name:'Pressure Boilers',ring:3,baseCost:5200,costMult:1.18,torque:220,color:'brass'},
{id:'aether',name:'Aether Condensers',ring:4,baseCost:33000,costMult:1.19,torque:620,color:'aether'},
];
export const MATERIALS={steel:['#6d6d73','#44464c','#222429'],copper:['#c96f3b','#9a4e2c','#4b2a1c'],bronze:['#b58a3a','#8a6a21','#3e2c12'],brass:['#e0c074','#b98a2e','#5e4617'],gold:['#f8e391','#d4ad3d','#6a5216'],titanium:['#8ea6c1','#596a85','#2b3747'],aether:['#7fe3ff','#3aa6c9','#1a3a48']};
export const SIZES_BASE=[54,42,38,36,34];