import inquirer from 'inquirer';
import { runSequelizeCommand } from '../../helper/run-sequelize-command.helper';
import { logger } from '../../utils/logger.utils';
import path from 'path';
import { loadProjectConfig } from '../../helper/mastermind-config.helper';
import {
  EXIT_CLI,
  GO_BACK_SEED_MENU,
  GO_BACK_SERVICE_MENU,
} from '../../utils/const.utils';
import { manageORMService } from './manage-orm.service';

const APPLY_ALL_SEED = 'Apply all seeders';
const UNDO_ALL_SEED = 'Undo all seeders';
const UNDO_LATEST_SEED = 'Undo the latest seed';

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
      choices: ['development', 'production', 'test'],
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
        APPLY_ALL_SEED,
        UNDO_ALL_SEED,
        UNDO_LATEST_SEED,
        GO_BACK_SERVICE_MENU,
      ],
    },
  ]);

  switch (operation) {
    case APPLY_ALL_SEED:
      await runSequelizeCommand('db:seed:all', servicePath, environment);
      await askForReturnOrExit(serviceName, servicePath, environment);
      break;

    case UNDO_ALL_SEED:
      await runSequelizeCommand('db:seed:undo:all', servicePath, environment);
      await askForReturnOrExit(serviceName, servicePath, environment);
      break;

    case UNDO_LATEST_SEED:
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
