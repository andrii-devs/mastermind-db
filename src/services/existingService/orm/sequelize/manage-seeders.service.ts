import inquirer from 'inquirer';
import { logger } from '../../../../utils/logger.utils';
import path from 'path';
import { loadProjectConfig } from '../../../../helper/mastermind-config.helper';
import {
  APPLY_ALL_SEED,
  EXIT_CLI,
  GO_BACK_SEED_MENU,
  GO_BACK_SERVICE_MENU,
  UNDO_ALL_SEED,
  UNDO_LATEST_SEED,
} from '../../../../utils/const.utils';
import { manageORMService } from '../manage-orm.service';
import { getDynamicSeparator } from '../../../../utils/strings.utils';
import { runSequelizeCommand } from '../../../../operations/sequelize-files.operation';

export async function manageSeedersAction(serviceName: string): Promise<void> {
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

  await seedersAction(serviceName, servicePath, environment);
}

async function seedersAction(
  serviceName: string,
  servicePath: string,
  environment: string,
) {
  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: `What would you like to do with seeders for "${serviceName}"?`,
      choices: [
        {
          name: APPLY_ALL_SEED,
          value: 'applyAllSeeds',
          description:
            'Execute all seeders to populate the database with initial data.',
        },
        {
          name: UNDO_ALL_SEED,
          value: 'undoAllSeeds',
          description:
            'Revert all seeders to clear the seeded data from the database.',
        },
        {
          name: UNDO_LATEST_SEED,
          value: 'undoLatestSeed',
          description:
            'Revert the changes made by the most recently executed seeder.',
        },
        new inquirer.Separator(getDynamicSeparator()),
        { name: GO_BACK_SERVICE_MENU, value: 'menu' },
      ],
    },
  ]);

  switch (operation) {
    case 'applyAllSeeds':
      await runSequelizeCommand('db:seed:all', servicePath, environment);
      await askForReturnOrExit(serviceName, servicePath, environment);
      break;

    case 'undoAllSeeds':
      await runSequelizeCommand('db:seed:undo:all', servicePath, environment);
      await askForReturnOrExit(serviceName, servicePath, environment);
      break;

    case 'undoLatestSeed':
      await runSequelizeCommand('db:seed:undo', servicePath, environment);
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
      choices: [GO_BACK_SEED_MENU, GO_BACK_SERVICE_MENU, EXIT_CLI],
    },
  ]);

  if (nextAction === GO_BACK_SEED_MENU) {
    await seedersAction(serviceName, servicePath, environment);
  } else if (nextAction === GO_BACK_SERVICE_MENU) {
    return;
  } else {
    logger.success('Exiting Master Mind DB. Goodbye!');
    process.exit(0);
  }
}
