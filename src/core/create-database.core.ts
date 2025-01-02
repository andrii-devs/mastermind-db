import inquirer from 'inquirer';
import { DBType } from '../types';
import { allocatePort } from '../helper/allocate-port.helper';
import { scaffoldDatabase } from '../service/scaffold-database.service';
import { scaffoldDockerCompose } from '../service/scaffold-docker-compose.service';
import { scaffoldSequelizeTemplate } from '../service/scaffold-sequelize-files.service';
import { logger } from '../utils/logger.utils';
import {
  addOrUpdateProjectConfig,
  loadProjectConfig,
} from '../helper/mastermind-config.helper';

export async function createDatabaseAction() {
  const projectConfig = loadProjectConfig();
  let { rootDir } = projectConfig;
  if (!rootDir) {
    logger.error(`No root directory specified. Please run init command first`);
    process.exit(1);
  }

  const { dbType, serviceName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'serviceName',
      message: 'Enter a unique name for the service (e.g., auth, store):',
      validate: (input) =>
        input.trim() !== '' ? true : 'Service name cannot be empty',
    },
    {
      type: 'list',
      name: 'dbType',
      message: 'Select the type of database you want to create:',
      choices: Object.values(DBType),
    },
  ]);

  const { ormType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'ormType',
      message: `Select ORM for ${dbType}:`,
      choices: ['Sequelize'],
    },
  ]);

  const dbName = `${serviceName}_db`;
  const port = await allocatePort(dbType);
  const databaseMap: Record<string, string> = {
    MySQL: 'mysql',
    PostgreSQL: 'postgresql',
  };

  addOrUpdateProjectConfig(serviceName, ormType, rootDir);

  await scaffoldDatabase(serviceName, databaseMap[dbType], dbName, port);

  switch (ormType) {
    case 'Sequelize':
      await scaffoldSequelizeTemplate(serviceName);
      break;
    default:
      throw new Error(`Unsupported ORM: ${ormType}`);
  }
  await scaffoldDockerCompose(serviceName, databaseMap[dbType], port);

  logger.success(`Setup for "${serviceName}" complete!`);
}
