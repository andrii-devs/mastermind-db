import inquirer from 'inquirer';
import {
  loadProjectConfig,
  saveProjectConfig,
} from '../helper/mastermind-config.helper';
import { logger } from '../utils/logger.utils';
import { printLogo } from '../utils/print-logo.utils';

export async function initConfigIfNotExists(version: string) {
  const config = loadProjectConfig();

  if (!config.rootDir) {
    printLogo(version);
    logger.warn('Configuration file not found!');
    const { rootDir } = await inquirer.prompt([
      {
        type: 'input',
        name: 'rootDir',
        message: 'Enter the root directory for your projects (default:./src):',
        default: './src',
      },
    ]);

    config.rootDir = rootDir;
    saveProjectConfig(config);
  } else {
    logger.info(
      `Loaded configuration file. Using root directory "${config.rootDir}"`,
    );
  }
}
