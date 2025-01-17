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
import { getDynamicSeparator } from '../utils/strings.utils';

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
          {
            name: CREATE_SERVICE,
            value: 'create',
            description:
              'Create a new service to start managing your configurations and operations.',
          },

          {
            name: MANAGE_EXISTING_SERVICE,
            value: 'manage',
            description:
              'Access and manage configurations, database, or Docker containers for an existing service.',
          },
          {
            name: DELETE_SERVICE,
            value: 'delete',
            description:
              'Remove an existing service and its related configurations permanently.',
          },
          {
            name: CONFIGURE_SETTINGS,
            value: 'configureSettings',
            description:
              'Modify the global settings of the CLI to suit your project needs.',
          },
          new inquirer.Separator(getDynamicSeparator()),
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
      case 'create':
        await createDatabaseAction();
        await askForReturnOrExit();
        break;

      case 'manage':
        await manageExistingService();
        break;

      case 'configureSettings':
        await configureCLI();
        break;

      case 'delete':
        await deleteServiceAction();
        break;

      case 'exit':
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
