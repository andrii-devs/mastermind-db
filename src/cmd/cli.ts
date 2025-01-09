import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { createDatabaseAction } from '../core/create-database.core';
import kleur from 'kleur';
import { printLogo } from '../utils/print-logo.utils';
import { logger } from '../utils/logger.utils';
import { configureCLI } from '../core/configure.core';
import {
  CONFIGURE_SETTINGS,
  CREATE_SERVICE,
  DELETE_SERVICE,
  EXIT_CLI,
  MANAGE_EXISTING_SERVICE,
} from '../utils/const.utils';
import { manageExistingService } from '../core/existing-service.core';
import { deleteServiceAction } from '../core/delete-service.core';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

export async function runCLI() {
  let exitCLI = false;
  while (!exitCLI) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'),
    );
    const version = packageJson.version;

    printLogo(version);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          CREATE_SERVICE,
          MANAGE_EXISTING_SERVICE,
          DELETE_SERVICE,
          CONFIGURE_SETTINGS,
          EXIT_CLI,
        ],
        loop: false,
      },
    ]);

    switch (action) {
      case CREATE_SERVICE:
        await createDatabaseAction();
        await askForReturnOrExit();
        break;

      case MANAGE_EXISTING_SERVICE:
        await manageExistingService();
        break;

      case CONFIGURE_SETTINGS:
        await configureCLI();
        break;

      case DELETE_SERVICE:
        await deleteServiceAction();
        break;

      case EXIT_CLI:
        logger.success(kleur.bold('\nThank you for using Master Mind DB 🛠️'));
        exitCLI = true;
        break;

      default:
        logger.error('Invalid action selected. Exiting...');
        exitCLI = true;
    }
  }
}

async function askForReturnOrExit() {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'What would you like to do next?',
      choices: [
        { name: 'Go back to the main menu', value: 'menu' },
        { name: 'Exit', value: EXIT_CLI },
      ],
    },
  ]);

  if (choice === EXIT_CLI) {
    logger.success(kleur.bold('\nExiting Master Mind DB. Goodbye 🛠️'));
    process.exit(0);
  }
}
