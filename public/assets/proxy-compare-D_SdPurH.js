const c=Symbol(),r=Object.getPrototypeOf,e=new WeakMap,n=t=>t&&(e.has(t)?e.get(t):r(t)===Object.prototype||r(t)===Array.prototype),s=t=>n(t)&&t[c]||null,a=(t,o=!0)=>{e.set(t,o)};export{s as g,a as m};
//# sourceMappingURL=proxy-compare-D_SdPurH.js.map
