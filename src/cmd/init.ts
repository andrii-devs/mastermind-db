import { logger } from '../utils/logger.utils';
import {
  loadProjectConfig,
  saveProjectConfig,
} from '../helper/mastermind-config.helper';
import inquirer from 'inquirer';
export async function initCLI() {
  let { rooDir } = loadProjectConfig();
  if (rooDir) {
    logger.warn(
      `Configuration file already exists ${rooDir}. To change it choose configuration into CLI menu!`,
    );
  } else {
    const { rootDir } = await inquirer.prompt([
      {
        type: 'input',
        name: 'rootDir',
        message: `Enter a root directory for your projects:`,
        default: './src',
      },
    ]);

    saveProjectConfig(rootDir);
    logger.success(`Initialized .mastermindrc with root directory ${rooDir}.`);
  }
}
