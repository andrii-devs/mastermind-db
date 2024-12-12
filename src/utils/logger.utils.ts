import kleur from 'kleur';

export const logger = {
  success: (message: string): void => console.log(kleur.green(message)),
  error: (message: string): void => console.log(kleur.red(message)),
  warn: (message: string): void => console.log(kleur.yellow(message)),
  info: (message: string): void => console.log(kleur.cyan(message)),
  debug: (message: string): void => console.log(kleur.gray(message)),
  custom: (message: string, color: (text: string) => string): void =>
    console.log(color(message)),
};

interface SequelizeCliMessageHandlers {
  [key: string]: (message: string) => void;
}

export const sequelizeCLIMessageHandler: SequelizeCliMessageHandlers = {
  'No migration to execute': (message: string): void => logger.info(message),
  'All migrations executed successfully': (message: string): void =>
    logger.success(message),
  'Migration execution complete': (message: string) => logger.success(message),
};

export function handlerSequelizeMessage(message: string) {
  const handler = sequelizeCLIMessageHandler[message];
  if (handler) {
    handler(message);
  } else {
    logger.info(message);
  }
}
