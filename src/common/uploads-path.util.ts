// src/common/uploads-path.util.ts
import { join, dirname } from 'path';

/**
 * Diretório raiz onde salvaremos arquivos enviados (fotos etc).
 *
 * Ordem de prioridade:
 *  1. process.env.UPLOAD_ROOT -> caminho absoluto fornecido pelo operador.
 *  2. process.cwd()           -> raiz do projeto (onde você rodou `npm run start:dev`).
 *  3. (fallback raro) dirname(process.execPath) quando empacotado via pkg.
 */
export function getUploadsRoot(): string {
  if (process.env.UPLOAD_ROOT && process.env.UPLOAD_ROOT.trim()) {
    return process.env.UPLOAD_ROOT.trim();
  }

  // Detecta execução empacotada (pkg) — normalmente você usaria o diretório do executável.
  const runningInPkg = typeof (process as any).pkg !== 'undefined';
  if (runningInPkg) {
    return dirname(process.execPath);
  }

  // Default: raiz do projeto (onde o comando foi executado)
  return process.cwd();
}

/**
 * Helper para construir subpastas dentro do root de uploads.
 * Ex.: getUploadsPath('visitors', visitorId.toString(), filename)
 */
export function getUploadsPath(...segments: string[]): string {
  return join(getUploadsRoot(), 'uploads', ...segments);
}

/**
 * Caminho público (URL) a ser retornado ao front.
 * Mantemos prefixo `/uploads` — que será servido no main.ts.
 */
export function getUploadsPublicUrl(...segments: string[]): string {
  return `/uploads/${segments.join('/')}`;
}
