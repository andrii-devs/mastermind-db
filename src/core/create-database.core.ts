import inquirer from 'inquirer';
import { DBType } from '../types';
import { allocatePort } from '../helper/allocate-port.helper';
import { scaffoldDatabase } from '../service/scaffold-database.service';
import { scaffoldDockerCompose } from '../service/scaffold-docker-compose.service';
import { scaffoldSequelizeFiles } from '../service/scaffold-sequelize-files.service';

export async function createDatabaseAction() {
  const { dbType, serviceName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'dbType',
      message: 'Select the type of database you want to create:',
      choices: Object.values(DBType),
    },
    {
      type: 'input',
      name: 'serviceName',
      message: 'Enter a unique name for the service (e.g., auth, whatsapp):',
      validate: (input) =>
        input.trim() !== '' ? true : 'Service name cannot be empty',
    },
  ]);

  console.log(
    `Initializing a ${dbType} database for the "${serviceName}" service...`,
  );

  const dbName = `${serviceName}_db`;
  const port = await allocatePort(dbType);

  await scaffoldDatabase(serviceName, dbType, dbName, port);
  await scaffoldDockerCompose(serviceName, dbType, port);
  await scaffoldSequelizeFiles(serviceName);

  console.log(`Setup for "${serviceName}" complete!`);
}
