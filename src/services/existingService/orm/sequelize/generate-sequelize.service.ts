import inquirer from 'inquirer';
import { logger } from '../../../../utils/logger.utils';
import { loadProjectConfig } from '../../../../helper/mastermind-config.helper';
import { generateSequelizeFiles } from '../../../../operations/sequelize-files.operation';

export async function generateSequelizeAction(serviceName: string) {
  const projectConfig = loadProjectConfig();
  if (
    !projectConfig.services ||
    Object.keys(projectConfig.services).length === 0
  ) {
    logger.warn('No existing services found. Please create a service first.');
    return;
  }

  const { fileTypes } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'fileTypes',
      message: 'Select the type(s) of files to generate:',
      choices: ['Migrations', 'Models', 'Seeders'],
    },
  ]);

  await generateSequelizeFiles(serviceName, fileTypes);
}
