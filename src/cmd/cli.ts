import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { createDatabaseAction } from '../core/create-database.core';
import { manageMigrationsAction } from '../core/manage-migration.core';
import { generateSequelizeAction } from '../core/generate-sequelize.core';
import { manageSeedersAction } from '../core/manage-seeders.core';
import kleur from 'kleur';
import { printLogo } from '../utils/print-logo.utils';

dotenv.config();

const CREATE_DATABASE = 'Create a New Database';
const GENERATE_FILES = 'Generate Sequelize files (Migrations/Models/Seeders):';
const MANAGE_MIGRATIONS = 'Manage migrations';
const MANAGE_SEEDERS = 'Manage Seeders';
const EXIT_CLI = kleur.red('Exit CLI');

export async function runCLI(version: string) {
  let exitCLI = false;

  while (!exitCLI) {
    printLogo(version);

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
          EXIT_CLI,
        ],
        loop: false,
      },
    ]);

    switch (action) {
      case CREATE_DATABASE:
        await createDatabaseAction();
        await askForReturnOrExit();
        break;

      case GENERATE_FILES:
        await generateSequelizeAction();
        await askForReturnOrExit();
        break;

      case MANAGE_MIGRATIONS:
        await manageMigrationsAction();
        await askForReturnOrExit();
        break;

      case MANAGE_SEEDERS:
        await manageSeedersAction();
        await askForReturnOrExit();
        break;

      case EXIT_CLI:
        console.log(
          kleur.green('\nThank you for using Sequelize Blueprint CLI!'),
        );
        exitCLI = true;
        break;

      default:
        console.log(kleur.red('Invalid action selected. Exiting...'));
        exitCLI = true;
    }
  }
}

async function askForReturnOrExit() {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'What would you like to do next?',
      choices: [
        { name: 'Go back to the main menu', value: 'menu' },
        { name: 'Exit CLI', value: 'exit' },
      ],
    },
  ]);

  if (choice === 'exit') {
    console.log(kleur.green('\nExiting Sequelize Blueprint CLI. Goodbye!'));
    process.exit(0);
  }
}

// export async function runCLI() {
//   const { action } = await inquirer.prompt([
//     {
//       type: 'list',
//       name: 'action',
//       message: 'What would you like to do?',
//       choices: [
//         CREATE_DATABASE,
//         GENERATE_FILES,
//         MANAGE_MIGRATIONS,
//         MANAGE_SEEDERS,
//       ],
//     },
//   ]);

//   switch (action) {
//     case CREATE_DATABASE:
//       await createDatabaseAction();
//       break;

//     case GENERATE_FILES:
//       await generateSequelizeAction();
//       break;

//     case MANAGE_MIGRATIONS:
//       await manageMigrationsAction();
//       break;

//     case MANAGE_SEEDERS:
//       await manageSeedersAction();
//       break;

//     default:
//       console.log('Invalid action selected. Exiting...');
//       process.exit(1);
//   }
// }
