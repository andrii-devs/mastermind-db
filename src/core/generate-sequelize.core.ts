import inquirer from 'inquirer';
import { getRootDir } from '../helper/sequelize-blueprint-config.helper';
import { getServiceFolders } from '../utils/file-path.utils';
import { logger } from '../utils/logger.utils';
import { generateSequelizeFiles } from '../helper/generate-sequelize-files.helper';

export async function generateSequelizeAction(serviceName: string) {
  const folders = getServiceFolders();
  const baseDir = getRootDir();
  if (folders.length === 0) {
    logger.error(
      `No existing services found in ${baseDir}. Please create a database first.`,
    );
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
