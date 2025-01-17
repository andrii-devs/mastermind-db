import inquirer from 'inquirer';
import { loadProjectConfig } from '../helper/mastermind-config.helper';
import { logger } from '../utils/logger.utils';
import { manageORMService } from '../services/existingService/orm/manage-orm.service';
import {
  EXIT_CLI,
  GO_BACK_MAIN_MENU,
  MANAGE_BACKUPS_AND_PURGE,
  MANAGE_DATABASE_OPERATIONS,
  MANAGE_DOCKER_CONTAINERS,
  MANAGE_ORM_FILES,
} from '../utils/const.utils';
import { getDynamicSeparator } from '../utils/strings.utils';
import { manageSelectedServiceDatabase } from '../services/existingService/database/manage-selected-database.service';
import kleur from 'kleur';
import { manageSelectedDockerService } from '../services/existingService/docker/manage-selected-docker.service';
import { manageBackupAndDataPurge } from '../services/existingService/backups/manage-backups-and-data-purge.service';

export async function manageExistingService() {
  const projectConfig = loadProjectConfig();

  if (
    !projectConfig.services ||
    Object.keys(projectConfig.services).length === 0
  ) {
    logger.warn('No existing services found. Please create a service first.');
    return;
  }

  const updatedChoice = Object.keys(projectConfig.services).map(
    (service: string) => ({ name: `📁 ${service}`, value: service }),
  );

  const { serviceName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'serviceName',
      message: 'Select an existing service to manage:',
      choices: updatedChoice,
    },
  ]);

  await manageSelectedService(serviceName);
}

export async function manageSelectedService(serviceName: string) {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `What would you like to do with ${serviceName} service?`,
      choices: [
        {
          name: MANAGE_ORM_FILES,
          value: 'orm',
          description: 'View, generate, or modify ORM files and configurations',
        },
        {
          name: MANAGE_DOCKER_CONTAINERS,
          value: 'docker',
          description:
            'Start, stop, or manage Docker containers for your services.',
        },
        {
          name: MANAGE_DATABASE_OPERATIONS,
          value: 'database',
          description:
            'Perform database operations like export, import, or reset data.',
        },
        {
          name: MANAGE_BACKUPS_AND_PURGE,
          value: 'manageBackups',
        },
        new inquirer.Separator(getDynamicSeparator()),
        {
          name: GO_BACK_MAIN_MENU,
          value: 'main',
        },
        {
          name: EXIT_CLI,
          value: 'exit',
          description: 'Quit the CLI application.',
        },
      ],
    },
  ]);

  switch (action) {
    case 'orm':
      await manageORMService(serviceName);
      break;
    case 'docker':
      await manageSelectedDockerService(serviceName);
      break;

    case 'database':
      await manageSelectedServiceDatabase(serviceName);
      break;

    case 'manageBackups':
      await manageBackupAndDataPurge(serviceName);
      break;

    case 'main':
      break;
    case 'exit':
      logger.success(kleur.bold('\nThank you for using Master Mind DB 🛠️'));
      process.exit(0);

    default:
      logger.error('Invalid option selected.');
      break;
  }
}
