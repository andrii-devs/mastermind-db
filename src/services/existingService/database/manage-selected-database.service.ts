import { logger } from '../../../utils/logger.utils';
import { getDynamicSeparator } from '../../../utils/strings.utils';
import inquirer from 'inquirer';
import {
  exportDatabaseDump,
  resetDatabase,
} from '../../../operations/database.operation';
import { getConfigPaths } from '../../../helper/mastermind-config.helper';

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
          name: `🔙 Return to the service ${serviceName} Menu`,
          value: 'main',
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
      break;
    case 'import':
      break;
    case 'reset':
      await resetDatabase(serviceName, database);
      break;

    case 'main':
      break;
    case 'exit':
      break;

    default:
      logger.error('Invalid option selected.');
      break;
  }
}
