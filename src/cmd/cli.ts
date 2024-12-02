import dotenv from 'dotenv';
import inquirer from 'inquirer';
import fs from 'fs';
import { DBType } from '../types';
import { allocatePort } from '../service/allocate-port.service';
import { scaffoldDatabase } from '../service/scaffold-database.service';
import { updateDockerCompose } from '../service/update-docker-compose.service';
import { getServiceFolders } from '../utils/file-path.utils';
import { generateFiles } from '../helper/generate-files.helper';
import {
  checkIfConfigFileExists,
  getConfigPath,
} from '../helper/generate-sequelize-config.helper';
import { createDatabaseAction } from '../service/create-database.service';

dotenv.config();

export async function runCLI() {
  if (!checkIfConfigFileExists(getConfigPath())) {
    process.exit(1);
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: ['Create Database', 'Create Migrations/Models/Seeders'],
    },
  ]);

  if (action === 'Create Database') {
    await createDatabaseAction();
  } else {
    const folders = getServiceFolders();
    if (folders.length === 0) {
      console.log(
        'No services found in "src". Please create a database first.',
      );
      return;
    }

    const { serviceName, fileTypes } = await inquirer.prompt([
      {
        type: 'list',
        name: 'serviceName',
        message: 'Select a service:',
        choices: folders,
      },
      {
        type: 'checkbox',
        name: 'fileTypes',
        message: 'Select file types to generate:',
        choices: ['Migrations', 'Models', 'Seeders'],
      },
    ]);

    await generateFiles(serviceName, fileTypes);
  }
}
