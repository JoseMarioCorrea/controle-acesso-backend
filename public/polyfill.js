"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
if (typeof globalThis.crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', {
        value: crypto_1.webcrypto,
        configurable: true,
        enumerable: false,
        writable: false,
    });
}
else if (typeof globalThis.crypto.randomUUID !== 'function') {
    globalThis.crypto.randomUUID = crypto_1.webcrypto.randomUUID;
}
//# sourceMappingURL=polyfill.js.map