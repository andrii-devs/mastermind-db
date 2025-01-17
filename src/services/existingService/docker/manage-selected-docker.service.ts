import inquirer from 'inquirer';
import { getDynamicSeparator } from '../../../utils/strings.utils';
import { logger } from '../../../utils/logger.utils';
import {
  isContainerRunning,
  purgeDockerContainer,
  refreshDockerContainer,
  startDockerContainer,
  stopDockerContainer,
} from '../../../operations/manage-docker.operation';
import { manageSelectedService } from '../../../core/existing-service.core';
import {
  EXIT_CLI,
  GO_BACK_MAIN_MENU,
  GO_BACK_SERVICE_MENU,
} from '../../../utils/const.utils';
import { runCLI } from '../../../cmd/cli';
import kleur from 'kleur';

export async function manageSelectedDockerService(serviceName: string) {
  const containerName = `${serviceName}-db`;

  const dockerStatusIcon = (await isContainerRunning(containerName))
    ? kleur.green('✔ Running') // Green text for running
    : kleur.red('✘ Stopped');

  const { dockerAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'dockerAction',
      message: `What would you like to do with Docker container for "${serviceName}"?`,
      choices: [
        {
          name: `🚀 Start Docker Container ${dockerStatusIcon}`,
          value: 'start',
          description: 'Start the Docker container if it is not running.',
        },
        {
          name: '🛑 Stop Docker Container',
          value: 'stop',
          description: 'Stop the Docker container if it is running.',
        },
        {
          name: '🔄 Refresh Docker Container',
          value: 'refresh',
          description: 'Stop, remove, and start the Docker container anew.',
        },
        {
          name: '🔥 Purge Docker Container',
          value: 'purge',
          description:
            'Remove the Docker container and its associated volumes permanently.',
        },
        new inquirer.Separator(getDynamicSeparator()),
        {
          name: '🔙 Return to Service Menu',
          value: 'menu',
          description: 'Go back to the service menu.',
        },
        {
          name: '❌ Exit CLI',
          value: 'exit',
          description: 'Exit the CLI tool.',
        },
      ],
    },
  ]);

  switch (dockerAction) {
    case 'start':
      await startDockerContainer(containerName);
      await askForReturnOrExit(serviceName);
      break;
    case 'stop':
      await stopDockerContainer(containerName);
      await askForReturnOrExit(serviceName);
      break;
    case 'refresh':
      await refreshDockerContainer(containerName);
      await askForReturnOrExit(serviceName);
      break;
    case 'purge':
      await purgeDockerContainer(containerName);
      await askForReturnOrExit(serviceName);

      break;
    case 'menu':
      await manageSelectedService(serviceName);
      break;
    case 'exit':
      logger.success(kleur.bold('\nThank you for using Master Mind DB 🛠️'));
      process.exit(0);

    default:
      logger.error('Invalid operation selected');
      break;
  }

  await manageSelectedDockerService(serviceName);
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
    await manageSelectedService(serviceName);
  } else if (nextAction === GO_BACK_MAIN_MENU) {
    await runCLI();
    return;
  } else {
    logger.success(kleur.bold('\nThank you for using Master Mind DB 🛠️'));
    process.exit(0);
  }
}
