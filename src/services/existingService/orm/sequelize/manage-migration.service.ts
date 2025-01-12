import inquirer from 'inquirer';
import { logger } from '../../../../utils/logger.utils';
import path from 'path';
import { loadProjectConfig } from '../../../../helper/mastermind-config.helper';
import {
  APPLY_ALL_MIGRATION,
  EXIT_CLI,
  GO_BACK_MIGRATION_MENU,
  GO_BACK_SERVICE_MENU,
  RETURN_ORM_MENU,
  UNDO_ALL_MIGRATION,
  UNDO_LATEST_MIGRATION,
} from '../../../../utils/const.utils';
import { manageORMService } from '../manage-orm.service';
import { getDynamicSeparator } from '../../../../utils/strings.utils';
import { runSequelizeCommand } from '../../../../operations/sequelize-files.operation';

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
      choices: [
        {
          name: '🛠️  Development',
          value: 'development',
          description: 'Environment for development and testing new features.',
        },
        {
          name: '🚀 Production',
          value: 'production',
          description:
            'Live environment for deploying the application to end users.',
        },
        {
          name: '🧪 Test',
          value: 'test',
          description:
            'Environment for running automated tests and QA validations.',
        },
      ],
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
        {
          name: APPLY_ALL_MIGRATION,
          value: 'applyAllMigrations',
          description:
            'Run all pending migrations to update the database schema to the latest state.',
        },
        {
          name: UNDO_ALL_MIGRATION,
          value: 'undoAllMigrations',
          description:
            'Revert all applied migrations and reset the database schema to its initial state.',
        },
        {
          name: UNDO_LATEST_MIGRATION,
          value: 'undoLatestMigrations',
          description:
            'Revert only the last applied migration to undo the most recent schema change.',
        },
        new inquirer.Separator(getDynamicSeparator()),
        {
          name: RETURN_ORM_MENU,
          value: 'ormMenu',
          description:
            'Go back to the ORM management menu to perform other operations.',
        },
      ],
    },
  ]);

  switch (operation) {
    case 'applyAllMigrations':
      await runSequelizeCommand('db:migrate', servicePath, environment);
      await askForReturnOrExit(serviceName, servicePath, environment);
      break;

    case 'undoAllMigrations':
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

    case 'undoLatestMigrations':
      await runSequelizeCommand('db:migrate:undo', servicePath, environment);
      await askForReturnOrExit(serviceName, servicePath, environment);
      break;

    default:
      await manageORMService(serviceName);
      break;
  }
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

function sanitazeMigration(migration: string): string {
  return migration.replace('.ts', '');
}
