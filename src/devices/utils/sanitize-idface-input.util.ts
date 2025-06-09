// src/idface/utils/sanitize-idface-input.util.ts
export interface IdfaceUserInput {
  nome: string;
  registration?: string | null;
  prefix?: string;
}

export function sanitizeIdfaceUserInput(input: IdfaceUserInput): {
  name: string;
  registration: string;
} {
  const nome = (input.nome || '').trim();
  if (!nome) throw new Error('Nome é obrigatório para o iDFace');

  const rawRegistration = (input.registration || '').trim();
  const registration = rawRegistration
    ? rawRegistration.replace(/\s/g, '')
    : `${input.prefix || 'USR'}-${Date.now()}`;

  return { name: nome, registration };
}
