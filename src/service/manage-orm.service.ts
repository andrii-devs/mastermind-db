import inquirer from 'inquirer';
import { getConfigPaths } from '../helper/mastermind-config.helper';
import { logger } from '../utils/logger.utils';
import {
  EXIT_CLI,
  GENERATE_FILES,
  GO_BACK_MAIN_MENU,
  GO_BACK_SERVICE_MENU,
  MANAGE_MIGRATIONS,
  MANAGE_SEEDERS,
} from '../utils/const.utils';
import { generateSequelizeAction } from '../core/generate-sequelize.core';
import { manageSeedersAction } from '../core/manage-seeders.core';
import { manageMigrationsAction } from '../core/manage-migration.core';

export async function manageORMService(
  serviceName: string,
  showInfo: boolean = true,
) {
  const { rootDir, orm, migrationsDir, modelsDir, seedersDir } =
    getConfigPaths(serviceName);

  if (showInfo) {
    logger.info(`Managing service: ${serviceName}`);
    logger.info(`Root Directory: ${rootDir}`);
    logger.info(`Service ORM: ${orm}`);
    logger.info(`Migrations Directory: ${migrationsDir}`);
    logger.info(`Models Directory: ${modelsDir}`);
    logger.info(`Seeders Directory: ${seedersDir}`);
  }

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

      await manageSequelizeAction(serviceName, action);
      break;

    default:
      logger.debug(`Wrong ORM type ${orm}`);
      break;
  }
}

async function manageSequelizeAction(serviceName: string, choice: string) {
  switch (choice) {
    case GENERATE_FILES:
      await generateSequelizeAction(serviceName);
      await askForReturnOrExit(serviceName);
      break;

    case MANAGE_MIGRATIONS:
      await manageMigrationsAction(serviceName);
      await askForReturnOrExit(serviceName);
      break;

    case MANAGE_SEEDERS:
      await manageSeedersAction(serviceName);
      await askForReturnOrExit(serviceName);
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

async function askForReturnOrExit(serviceName: string) {
  const { nextAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextAction',
      message: 'What would you like to do next?',
      choices: [GO_BACK_SERVICE_MENU, GO_BACK_MAIN_MENU, EXIT_CLI],
    },
  ]);

  if (nextAction === GO_BACK_SERVICE_MENU) {
    await manageORMService(serviceName, false);
  } else if (nextAction === GO_BACK_MAIN_MENU) {
    return;
  } else {
    logger.success('Exiting Master Mind DB. Goodbye!');
    process.exit(0);
  }
}
