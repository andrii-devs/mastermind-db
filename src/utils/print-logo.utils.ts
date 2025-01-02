import kleur from 'kleur';
import figlet from 'figlet';
import { logger } from './logger.utils';
export async function printLogo(version: string) {
  console.log(
    kleur.cyan(
      figlet.textSync('Master Mind DB', {
        horizontalLayout: 'default',
        verticalLayout: 'default',
      }),
    ),
  );
  logger.success(kleur.bold(`Version: ${version || '1.0.0'}`));
}
