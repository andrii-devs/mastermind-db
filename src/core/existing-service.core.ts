import inquirer from 'inquirer';
import {
  getConfigPaths,
  loadProjectConfig,
} from '../helper/mastermind-config.helper';
import { logger } from '../utils/logger.utils';
import {
  GO_BACK_SERVICE_MENU,
  EXIT_CLI,
  GENERATE_FILES,
  GO_BACK_MAIN_MENU,
  MANAGE_MIGRATIONS,
  MANAGE_SEEDERS,
} from '../utils/const.utils';
import { generateSequelizeAction } from './generate-sequelize.core';
import { manageMigrationsAction } from './manage-migration.core';
import { manageSeedersAction } from './manage-seeders.core';

export async function manageExistingService() {
  const projectConfig = loadProjectConfig();

  if (
    !projectConfig.databases ||
    Object.keys(projectConfig.databases).length === 0
  ) {
    logger.warn('No existing services found. Please create a service first.');
    return;
  }

  const { serviceName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'serviceName',
      message: 'Select an existing service to manage:',
      choices: Object.keys(projectConfig.databases),
    },
  ]);

  const { rootDir, orm, migrationsDir, modelsDir, seedersDir } =
    getConfigPaths(serviceName);
  //TODO: make optional this output
  logger.info(`Managing service: ${serviceName}`);
  logger.info(`Root Directory: ${rootDir}`);
  logger.info(`Service ORM: ${orm}`);
  logger.info(`Migrations Directory: ${migrationsDir}`);
  logger.info(`Models Directory: ${modelsDir}`);
  logger.info(`Seeders Directory: ${seedersDir}`);

  switch (orm) {
    case 'Sequelize':
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: `Select an action for service "${serviceName}?" (${orm}):`,
          choices: [
            GENERATE_FILES,
            MANAGE_MIGRATIONS,
            MANAGE_SEEDERS,
            GO_BACK_MAIN_MENU,
            EXIT_CLI,
          ],
          loop: false,
        },
      ]);

      await manageSequelizeAction(action);
      break;

    default:
      logger.debug(`Wrong ORM type ${orm}`);
      break;
  }
}

async function manageSequelizeAction(choice: string) {
  switch (choice) {
    case GENERATE_FILES:
      await generateSequelizeAction();
      await askForReturnOrExit();
      break;

    case MANAGE_MIGRATIONS:
      await manageMigrationsAction();
      await askForReturnOrExit();
      break;

    case MANAGE_SEEDERS:
      await manageSeedersAction();
      await askForReturnOrExit();
      break;
    case GO_BACK_MAIN_MENU:
      return;

    case EXIT_CLI:
      logger.success('Exiting Master Mind DB. Goodbye!');
      process.exit(0);

    default:
      break;
  }
}

async function askForReturnOrExit() {
  const { nextAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextAction',
      message: 'What would you like to do next?',
      choices: [GO_BACK_SERVICE_MENU, GO_BACK_MAIN_MENU, EXIT_CLI],
    },
  ]);

  if (nextAction === GO_BACK_SERVICE_MENU) {
    await manageExistingService();
  } else if (nextAction === GO_BACK_MAIN_MENU) {
    return;
  } else {
    logger.success('Exiting Master Mind DB. Goodbye!');
    process.exit(0);
  }
}
