import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { createDatabaseAction } from '../core/create-database.core';
import { manageMigrationsAction } from '../core/manage-migration.core';
import { generateSequelizeAction } from '../core/generate-sequelize.core';
import { manageSeedersAction } from '../core/manage-seeders.core';

dotenv.config();

const CREATE_DATABASE = 'Create a New Database';
const GENERATE_FILES = 'Generate Sequelize files (Migrations/Models/Seeders):';
const MANAGE_MIGRATIONS = 'Manage migrations';
const MANAGE_SEEDERS = 'Manage Seeders';

export async function runCLI() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        CREATE_DATABASE,
        GENERATE_FILES,
        MANAGE_MIGRATIONS,
        MANAGE_SEEDERS,
      ],
    },
  ]);

  switch (action) {
    case CREATE_DATABASE:
      await createDatabaseAction();
      break;

    case GENERATE_FILES:
      await generateSequelizeAction();
      break;

    case MANAGE_MIGRATIONS:
      await manageMigrationsAction();
      break;

    case MANAGE_SEEDERS:
      await manageSeedersAction();
      break;

    default:
      console.log('Invalid action selected. Exiting...');
      process.exit(1);
  }

  // if (action === CREATE_DATABASE) {
  //   await createDatabaseAction();
  // } else {
  //   const folders = getServiceFolders();
  //   const baseDir = getRootDir();
  //   if (folders.length === 0) {
  //     console.log(
  //       `No existing services found in ${baseDir}. Please create a database first.`,
  //     );
  //     return;
  //   }

  //   const { serviceName, fileTypes } = await inquirer.prompt([
  //     {
  //       type: 'list',
  //       name: 'serviceName',
  //       message: 'Select the service for which you want to generate files:',
  //       choices: folders,
  //     },
  //     {
  //       type: 'checkbox',
  //       name: 'fileTypes',
  //       message: 'Select the type(s) of files to generate:',
  //       choices: ['Migrations', 'Models', 'Seeders'],
  //     },
  //   ]);

  //   await generateSequelizeFiles(serviceName, fileTypes);
  // }
}
