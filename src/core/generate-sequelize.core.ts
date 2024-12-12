import inquirer from 'inquirer';
import { getRootDir } from '../helper/sequelize-blueprint-config.helper';
import { getServiceFolders } from '../utils/file-path.utils';
import { scaffoldSequelizeFiles } from '../service/scaffold-sequelize-files.service';
import { logger } from '../utils/logger.utils';

export async function generateSequelizeAction() {
  const folders = getServiceFolders();
  const baseDir = getRootDir();
  if (folders.length === 0) {
    logger.error(
      `No existing services found in ${baseDir}. Please create a database first.`,
    );
    return;
  }

  const { serviceName, fileTypes } = await inquirer.prompt([
    {
      type: 'list',
      name: 'serviceName',
      message: 'Select the service for which you want to generate files:',
      choices: folders,
    },
    {
      type: 'checkbox',
      name: 'fileTypes',
      message: 'Select the type(s) of files to generate:',
      choices: ['Migrations', 'Models', 'Seeders'],
    },
  ]);

  await scaffoldSequelizeFiles(serviceName, fileTypes);
}
