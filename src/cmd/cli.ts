import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { getServiceFolders } from '../utils/file-path.utils';
import { generateSequelizeFiles } from '../helper/sequelize-files.helper';
import {
  checkIfConfigFileExists,
  getConfigPath,
  getRootDir,
} from '../helper/sequelize-blueprint-config.helper';
import { createDatabaseAction } from '../service/create-database.service';

dotenv.config();

const CREATE_DATABASE = 'Create a New Database';
const GENERATE_FILES = 'Generate Files (Migrations/Models/Seeders)';

export async function runCLI() {
  if (!checkIfConfigFileExists(getConfigPath())) {
    process.exit(1);
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [CREATE_DATABASE, GENERATE_FILES],
    },
  ]);

  if (action === CREATE_DATABASE) {
    await createDatabaseAction();
  } else {
    const folders = getServiceFolders();
    const baseDir = getRootDir();
    if (folders.length === 0) {
      console.log(
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

    await generateSequelizeFiles(serviceName, fileTypes);
  }
}
