import { logger } from '../../../utils/logger.utils';
import { getDynamicSeparator } from '../../../utils/strings.utils';
import inquirer from 'inquirer';
import {
  exportDatabaseDump,
  importDatabaseDump,
  resetDatabase,
} from '../../../operations/database.operation';
import { getConfigPaths } from '../../../helper/mastermind-config.helper';
import {
  EXIT_CLI,
  GO_BACK_SELECTED_DATABASE_MENU,
  GO_BACK_SERVICE_MENU,
} from '../../../utils/const.utils';
import { manageSelectedService } from '../../../core/existing-service.core';
import kleur from 'kleur';

export async function manageSelectedServiceDatabase(serviceName: string) {
  const { database } = getConfigPaths(serviceName);

  const { dbAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'dbAction',
      message: 'What would you like to do with the database?',
      choices: [
        {
          name: '📤 Export Database Dump',
          value: 'export',
          description: 'Create a backup of your database in a dump file.',
        },
        {
          name: '📥 Import Database Dump',
          value: 'import',
          description: 'Restore your database from an existing dump file.',
        },
        {
          name: '🔄 Reset Database',
          value: 'reset',
          description:
            'Delete all data and restore the database to its initial state.',
        },
        new inquirer.Separator(getDynamicSeparator()),
        {
          name: GO_BACK_SERVICE_MENU,
          value: 'menu',
          description: 'Go back to the service menu.',
        },
        {
          name: '❌ Exit',
          value: 'exit',
          description: 'Exit the CLI tool.',
        },
      ],
    },
  ]);

  switch (dbAction) {
    case 'export':
      await exportDatabaseDump(serviceName);
      await askForReturnOrExit(serviceName);
      break;
    case 'import':
      await importDatabaseDump(serviceName, database, `${serviceName}_db`);
      await askForReturnOrExit(serviceName);

      break;
    case 'reset':
      await resetDatabase(serviceName, database);
      await askForReturnOrExit(serviceName);

      break;

    case 'menu':
      await manageSelectedService(serviceName);
      break;
    case 'exit':
      logger.success(kleur.bold('\nThank you for using Master Mind DB 🛠️'));
      process.exit(0);

    default:
      logger.error('Invalid option selected.');
      break;
  }
}

async function askForReturnOrExit(serviceName: string) {
  const { nextAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextAction',
      message: 'What would you like to do next?',
      choices: [
        { name: GO_BACK_SELECTED_DATABASE_MENU, value: 'menu' },
        { name: EXIT_CLI, value: 'exit' },
      ],
    },
  ]);

  switch (nextAction) {
    case 'menu':
      await manageSelectedServiceDatabase(serviceName);
      break;
    case 'exit':
      logger.success(kleur.bold('\nThank you for using Master Mind DB 🛠️'));
      process.exit(0);
    default:
      logger.error('Invalid option selected.');
      break;
  }
}
