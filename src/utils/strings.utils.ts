import { exec } from 'child_process';
import kleur from 'kleur';
import { promisify } from 'util';

export function getDynamicSeparator(): string {
  const width = process.stdout.columns / 2 || 80;
  return kleur.bold('━'.repeat(width));
}

export function capitalizeString(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, '-');
}

export const execAsync = promisify(exec);
