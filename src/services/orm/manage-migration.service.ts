import inquirer from 'inquirer';
import { runSequelizeCommand } from '../../helper/run-sequelize-command.helper';
import { logger } from '../../utils/logger.utils';
import path from 'path';
import { loadProjectConfig } from '../../helper/mastermind-config.helper';
import {
  EXIT_CLI,
  GO_BACK_MIGRATION_MENU,
  GO_BACK_SERVICE_MENU,
} from '../../utils/const.utils';
import { manageORMService } from './manage-orm.service';

const APPLY_ALL_MIGRATION = 'Apply all migrations';
const UNDO_ALL_MIGRATION = 'Undo all migrations';
const UNDO_LATEST_MIGRATION = 'Undo the latest migration';
export async function manageMigrationsAction(serviceName: string) {
  const projectConfig = loadProjectConfig();
  if (
    !projectConfig.services ||
    Object.keys(projectConfig.services).length === 0
  ) {
    logger.warn('No existing services found. Please create a service first.');
    return;
  }

  const servicePath = path.join(projectConfig.rootDir, serviceName);

  const { environment } = await inquirer.prompt([
    {
      type: 'list',
      name: 'environment',
      message: 'Select the environment:',
      choices: ['development', 'production', 'test'],
      default: 'development',
    },
  ]);

  await migrationsAction(serviceName, servicePath, environment);
}

async function migrationsAction(
  serviceName: string,
  servicePath: string,
  environment: string,
) {
  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: `What would you like to do with migrations for "${serviceName}"?`,
      choices: [
        APPLY_ALL_MIGRATION,
        UNDO_ALL_MIGRATION,
        UNDO_LATEST_MIGRATION,
        'Go back ORM menu',
      ],
    },
  ]);

  switch (operation) {
    case APPLY_ALL_MIGRATION:
      await runSequelizeCommand('db:migrate', servicePath, environment);
      await askForReturnOrExit(serviceName, servicePath, environment);
      break;

    case UNDO_ALL_MIGRATION:
      const { confirmUndo } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmUndo',
          message: 'Are you sure you want to undo all migrations?',
        },
      ]);

      if (confirmUndo) {
        await runSequelizeCommand(
          'db:migrate:undo:all',
          servicePath,
          environment,
        );
      }

      await askForReturnOrExit(serviceName, servicePath, environment);
      break;

    case UNDO_LATEST_MIGRATION:
      await runSequelizeCommand('db:migrate:undo', servicePath, environment);
      await askForReturnOrExit(serviceName, servicePath, environment);
      break;

    default:
      await manageORMService(serviceName);
      break;
  }
}

function sanitazeMigration(migration: string): string {
  return migration.replace('.ts', '');
}

async function askForReturnOrExit(
  serviceName: string,
  servicePath: string,
  environment: string,
) {
  const { nextAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextAction',
      message: 'What would you like to do next?',
      choices: [GO_BACK_MIGRATION_MENU, GO_BACK_SERVICE_MENU, EXIT_CLI],
    },
  ]);

  if (nextAction === GO_BACK_MIGRATION_MENU) {
    await migrationsAction(serviceName, servicePath, environment);
  } else if (nextAction === GO_BACK_SERVICE_MENU) {
    await manageORMService(serviceName);
  } else {
    logger.success('Exiting Master Mind DB. Goodbye!');
    process.exit(0);
  }
}
