"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeIdfaceUserInput = sanitizeIdfaceUserInput;
function sanitizeIdfaceUserInput(input) {
    const nome = (input.nome || '').trim();
    if (!nome)
        throw new Error('Nome é obrigatório para o iDFace');
    const rawRegistration = (input.registration || '').trim();
    const registration = rawRegistration
        ? rawRegistration.replace(/\s/g, '')
        : `${input.prefix || 'USR'}-${Date.now()}`;
    return { name: nome, registration };
}
//# sourceMappingURL=sanitize-idface-input.util.js.map