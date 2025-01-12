import inquirer from 'inquirer';
import { DBType } from '../types';
import { allocatePort } from '../helper/allocate-port.helper';
import { scaffoldDatabase } from '../services/database/create-database.service';
import { scaffoldDockerCompose } from '../services/docker/create-docker-compose.service';
import { scaffoldSequelizeTemplate } from '../operations/sequelize-files.operation';
import { logger } from '../utils/logger.utils';
import {
  addOrUpdateProjectConfig,
  loadProjectConfig,
} from '../helper/mastermind-config.helper';
import { getDynamicSeparator } from '../utils/strings.utils';
import { GO_BACK_MAIN_MENU } from '../utils/const.utils';
import { runCLI } from '../cmd/cli';

export async function createDatabaseAction() {
  const projectConfig = loadProjectConfig();
  let { rootDir } = projectConfig;
  if (!rootDir) {
    logger.error(`No root directory specified. Please run init command first`);
    process.exit(1);
  }

  const { dbType, serviceInput } = await inquirer.prompt([
    {
      type: 'input',
      name: 'serviceInput',
      message: 'Enter a unique name for the service (e.g., auth, store):',
      validate: (input) =>
        input.trim() !== '' ? true : 'Service name cannot be empty',
    },
    {
      type: 'list',
      name: 'dbType',
      message: 'Select the type of database you want to use:',
      // choices: Object.values(DBType),
      choices: [
        {
          name: '🐬 MySQL',
          value: 'mysql',
          description: 'A fast, reliable, and flexible relational database.',
        },
        {
          name: '🐘 PostgreSQL',
          value: 'postgres',
          description: 'An advanced, enterprise-class open-source database.',
        },
        new inquirer.Separator(getDynamicSeparator()),
        { name: GO_BACK_MAIN_MENU, value: 'menu' },
      ],
    },
  ]);

  if (dbType === 'menu') await runCLI();

  const { ormType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'ormType',
      message: `Select the ORM for the ${dbType.toUpperCase()} database:`,
      // choices: ['Sequelize'],
      choices: [
        {
          name: 'Sequelize',
          value: 'Sequelize',
          description:
            'A promise-based Node.js ORM for Postgres, MySQL, SQLite, MariaDB, and MSSQL.',
        },
        new inquirer.Separator(getDynamicSeparator()),
        { name: GO_BACK_MAIN_MENU, value: 'menu' },
      ],
    },
  ]);

  if (ormType === 'menu') await runCLI();

  const serviceName = `${serviceInput.toLowerCase()}`;
  const dbName = `${serviceName}_db`;
  const port = await allocatePort(dbType);
  // const databaseMap: Record<string, string> = {
  //   MySQL: 'mysql',
  //   PostgreSQL: 'postgres',
  // };

  addOrUpdateProjectConfig(serviceName, ormType, dbType, rootDir);

  await scaffoldDatabase(serviceName, dbType, dbName, port);

  switch (ormType) {
    case 'Sequelize':
      await scaffoldSequelizeTemplate(serviceName);
      break;
    default:
      throw new Error(`Unsupported ORM: ${ormType}`);
  }
  await scaffoldDockerCompose(serviceName, dbType, port);

  logger.success(`Setup for "${serviceName}" complete!`);
}
