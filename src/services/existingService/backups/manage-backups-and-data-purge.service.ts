import inquirer from 'inquirer';
import { getDynamicSeparator } from '../../../utils/strings.utils';
import { logger } from '../../../utils/logger.utils';
import { manageSelectedService } from '../../../core/existing-service.core';
import {
  getConfigPaths,
  IConfigPath,
} from '../../../helper/mastermind-config.helper';
import {
  configureDataPurge,
  configureSystemCronBackup,
  manualPurge,
  removeBackupCronJob,
  viewBackupCronStatus,
} from '../../../operations/backup.operation';
import {
  EXIT_CLI,
  GO_BACK_BACKUPS_PURGE_MENU,
} from '../../../utils/const.utils';
import kleur from 'kleur';

export async function manageBackupAndDataPurge(serviceName: string) {
  const { backupAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'backupAction',
      message: `What would you like to do with Backups & Data Purge for ${serviceName} service?`,
      choices: [
        {
          name: '🛠️  Manage Backup and Cron Jobs',
          value: 'manageBackup',
          description:
            'Set up, view, or remove automatic backup schedules (cron jobs).',
        },
        {
          name: '🗑️  Configure Data Purge',
          value: 'configurePurge',
          description: 'Define rules for cleaning up or archiving old data.',
        },
        {
          name: '🧹 Run Data Purge Now',
          value: 'runPurge',
          description:
            'Perform a one-time data purge based on configured rules.',
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

  const configPaths = getConfigPaths(serviceName);

  switch (backupAction) {
    case 'manageBackup':
      await manageBackupRoutine(serviceName, configPaths);
      await askForReturnOrExit(serviceName);
      break;
    case 'configurePurge':
      await configureDataPurge(serviceName);
      await askForReturnOrExit(serviceName);

      break;
    case 'runPurge':
      await manualPurge(serviceName);
      await askForReturnOrExit(serviceName);
      break;
    case 'menu':
      await manageSelectedService(serviceName);
      break;
    case 'exit':
      logger.success(kleur.bold('\nThank you for using Master Mind DB 🛠️'));
      process.exit(0);
      break;
    default:
      logger.error('Invalid action selected');
      break;
  }
}

async function manageBackupRoutine(
  serviceName: string,
  configPaths: IConfigPath,
) {
  const { cronAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'cronAction',
      message: `What would you like to do with cron jobs for the "${serviceName}" service?`,
      choices: [
        {
          name: '➕ Create Cron Job',
          value: 'create',
          description: 'Create a new system-level cron job for backups.',
        },
        {
          name: '🔍 View Cron Jobs',
          value: 'view',
          description: 'View existing cron jobs for backups.',
        },
        {
          name: '❌ Remove Cron Job',
          value: 'remove',
          description: 'Remove an existing cron job for backups.',
        },
        new inquirer.Separator(getDynamicSeparator()),
        {
          name: '🔙 Return to Backup Menu',
          value: 'return',
          description: 'Go back to the main backups menu.',
        },
      ],
    },
  ]);

  switch (cronAction) {
    case 'create':
      await configureSystemCronBackup(
        serviceName,
        configPaths.database,
        `${serviceName}_db`,
      );
      break;
    case 'view':
      await viewBackupCronStatus(serviceName);
      break;
    case 'remove':
      await removeBackupCronJob(serviceName);
      break;
    case 'return':
      await manageBackupAndDataPurge(serviceName);
      break;
    default:
      logger.error('Invalid option selected.');
      break;
  }
}

async function askForReturnOrExit(serviceName: string) {
  const { nextAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextAction',
      message: 'What would you like to do next?',
      choices: [
        { name: GO_BACK_BACKUPS_PURGE_MENU, value: 'menu' },
        { name: EXIT_CLI, value: 'exit' },
      ],
    },
  ]);

  switch (nextAction) {
    case 'menu':
      await manageBackupAndDataPurge(serviceName);
      break;
    case 'exit':
      logger.success(kleur.bold('\nThank you for using Master Mind DB 🛠️'));
      process.exit(0);
    default:
      logger.error('Invalid option selected.');
      break;
  }
}
