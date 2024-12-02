import inquirer from 'inquirer';
import { DBType } from '../types';
import { generateFiles } from '../helper/generate-files.helper';
import { allocatePort } from './allocate-port.service';
import { scaffoldDatabase } from './scaffold-database.service';
import { updateDockerCompose } from './update-docker-compose.service';

export async function createDatabaseAction() {
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

  console.log(`Setting up ${dbType} database for service "${serviceName}"...`);

  const dbName = `${serviceName}_db`;
  const port = await allocatePort(dbType);

  await generateFiles(serviceName, fileTypes);
  await scaffoldDatabase(serviceName, dbType, dbName, port);

  const { useCompose } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useCompose',
      message: 'Do you want to update your docker-compose.yml?',
    },
  ]);

  if (useCompose) {
    await updateDockerCompose(serviceName, dbType, port, dbName);
  }

  console.log(`Setup for "${serviceName}" complete!`);
}
