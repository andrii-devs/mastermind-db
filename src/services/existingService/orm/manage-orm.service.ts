import inquirer from 'inquirer';
import { getConfigPaths } from '../../../helper/mastermind-config.helper';
import { logger } from '../../../utils/logger.utils';
import {
  EXIT_CLI,
  GENERATE_FILES,
  GO_BACK_MAIN_MENU,
  GO_BACK_SERVICE_MENU,
  MANAGE_MIGRATIONS,
  MANAGE_SEEDERS,
} from '../../../utils/const.utils';
import { generateSequelizeAction } from './sequelize/generate-sequelize.service';
import { manageSeedersAction } from './sequelize/manage-seeders.service';
import { manageMigrationsAction } from './sequelize/manage-migration.service';
import { runCLI } from '../../../cmd/cli';
import { getDynamicSeparator } from '../../../utils/strings.utils';
import { manageSelectedService } from '../../../core/existing-service.core';

export async function manageORMService(
  serviceName: string,
  showInfo: boolean = true,
) {
  const { rootDir, orm, migrationsDir, modelsDir, seedersDir } =
    getConfigPaths(serviceName);

  // if (showInfo) {
  //   logger.info(`Managing service: ${serviceName}`);
  //   logger.info(`Root Directory: ${rootDir}`);
  //   logger.info(`Service ORM: ${orm}`);
  //   logger.info(`Migrations Directory: ${migrationsDir}`);
  //   logger.info(`Models Directory: ${modelsDir}`);
  //   logger.info(`Seeders Directory: ${seedersDir}`);
  // }

  switch (orm) {
    case 'Sequelize':
      await manageSequelizeAction(serviceName, orm);
      break;

    default:
      logger.debug(`Wrong ORM type ${orm}`);
      break;
  }
}

async function manageSequelizeAction(serviceName: string, orm: string) {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `Select an action for service "${serviceName}?" (${orm}):`,
      choices: [
        {
          name: GENERATE_FILES,
          value: 'generate',
          description:
            'Generate new Sequelize files, such as migrations, models, and seeders for your project.',
        },
        {
          name: MANAGE_MIGRATIONS,
          value: 'migrations',
          description:
            'View and manage existing database migrations to keep your schema up to date.',
        },
        {
          name: MANAGE_SEEDERS,
          value: 'seeders',
          description:
            'Add or modify seeders for populating your database with default or test data.',
        },
        new inquirer.Separator(getDynamicSeparator()),

        { name: GO_BACK_SERVICE_MENU, value: 'menu' },
        {
          name: EXIT_CLI,
          value: 'exit',
          description: 'Quit the CLI application.',
        },
      ],
      loop: false,
    },
  ]);

  switch (action) {
    case 'generate':
      await generateSequelizeAction(serviceName);
      await askForReturnOrExit(serviceName);
      break;

    case 'migrations':
      await manageMigrationsAction(serviceName);
      break;

    case 'seeders':
      await manageSeedersAction(serviceName);
      break;
    case 'menu':
      await manageSelectedService(serviceName);
      break;
    case 'exit':
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
    await runCLI();
    return;
  } else {
    logger.success('Exiting Master Mind DB. Goodbye!');
    process.exit(0);
  }
}
