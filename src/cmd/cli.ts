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
    const { dbType, serviceName, fileTypes } = await inquirer.prompt([
      {
        type: 'list',
        name: 'dbType',
        message: 'Select your database:',
        choices: Object.values(DBType),
        default: 'MySQL',
      },
      {
        type: 'input',
        name: 'serviceName',
        message: 'Enter a service name (e.g., auth, whatsapp):',
        validate: (input) =>
          input.trim() !== '' ? true : 'Service name cannot be empty',
      },
      {
        type: 'checkbox',
        name: 'fileTypes',
        message: 'Select additional files to generate',
        choices: ['Migrations', 'Models', 'Seeders'],
      },
    ]);

    console.log(
      `Setting up ${dbType} database for service "${serviceName}"...`,
    );

    await generateFiles(serviceName, fileTypes);
    const dbName = `${serviceName}_db`;
    const port = await allocatePort(dbType);

    if (!fs.existsSync('./docker-compose.yml')) {
      console.log('No docker-compose.yml found. Creating a new one...');
      fs.writeFileSync(
        './docker-compose.yml',
        'version: "3.8"\nservices:\nnetworks:\n  db-network:\nvolumes:\n',
        'utf8',
      );
    }

    await scaffoldDatabase(serviceName, dbType, dbName, port);
    await updateDockerCompose(serviceName, dbType, port, dbName);

    console.log(`Setup for "${serviceName}" complete!`);
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
