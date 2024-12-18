import inquirer from 'inquirer';
import {
  loadProjectConfig,
  saveProjectConfig,
} from '../helper/mastermind-config.helper';
import { logger } from '../utils/logger.utils';

export async function configureCLI() {
  const currentConfig = loadProjectConfig();
  const { configAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'configAction',
      message: 'Choose an action to manage your configuration:',
      choices: [
        { name: 'View current configuration', value: 'view' },
        { name: 'Change root directory', value: 'changeRootDir' },
        { name: 'Reset to default configuration', value: 'reset' },
        { name: 'Go back to the main menu', value: 'back' },
      ],
    },
  ]);

  switch (configAction) {
    case 'view':
      logger.info(`Your current configuration:`);
      console.log(JSON.stringify(currentConfig, null, 2));
      break;

    case 'changeRootDir':
      const { newRootDir } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newRootDir',
          message: `Enter a new root directory for your projects (current: ${currentConfig.rootDir}):`,
          default: currentConfig.rootDir || './src',
        },
      ]);

      currentConfig.rootDir = newRootDir;
      saveProjectConfig(currentConfig);

      logger.success(`Root directory updated to: ${newRootDir}`);
      break;

    case 'reset':
      const defaultConfig = {
        rootDir: './src',
        databases: {},
      };
      saveProjectConfig(defaultConfig);

      logger.success('Configuration reset to defaults.');
      break;

    case 'back':
      logger.info('Returning to the main menu.');
      return;

    default:
      logger.error('Invalid option selected.');
  }

  const { nextAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextAction',
      message: 'What would you like to do next?',
      choices: [
        { name: 'Go back to the settings menu', value: 'settings' },
        { name: 'Go back to the main menu', value: 'main' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);

  if (nextAction === 'settings') {
    await configureCLI();
  } else if (nextAction === 'main') {
    return;
  } else {
    logger.success('Exiting Master Mind DB. Goodbye!');
    process.exit(0);
  }
}
