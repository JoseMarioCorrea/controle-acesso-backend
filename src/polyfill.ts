// src/polyfill.ts
import { webcrypto } from 'crypto';

if (typeof globalThis.crypto === 'undefined') {
  // define a propriedade crypto como o webcrypto
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    enumerable:   false,
    writable:     false,
  });
} else if (typeof (globalThis.crypto as any).randomUUID !== 'function') {
  // adiciona randomUUID se faltar
  (globalThis.crypto as any).randomUUID = webcrypto.randomUUID;
}
