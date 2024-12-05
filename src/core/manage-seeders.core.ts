import inquirer from 'inquirer';
import { getServiceFolders } from '../utils/file-path.utils';
import {
  getFilesInFolder,
  runSequelizeCommand,
} from '../helper/run-sequelize-command.helper';
import { getRootDir } from '../helper/sequelize-blueprint-config.helper';

export async function manageSeedersAction(): Promise<void> {
  const services = getServiceFolders();
  const baseDir = getRootDir();

  if (services.length === 0) {
    console.log('No services found. Please create a database first.');
    return;
  }

  const { serviceName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'serviceName',
      message: 'Select a service to manage seeders:',
      choices: services,
    },
  ]);

  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: `What would you like to do with seeders for "${serviceName}"?`,
      choices: [
        'Apply All Seeders',
        'Apply a Specific Seeder',
        'Undo All Seeders',
        'Undo a Specific Seeder',
      ],
    },
  ]);

  const servicePath = `${baseDir}/${serviceName}`;
  const seederDir = `${servicePath}/seeders`;

  switch (operation) {
    case 'Apply All Seeders':
      await runSequelizeCommand('db:seed:all', servicePath);
      break;

    case 'Apply a Specific Seeder': {
      const seeders = getFilesInFolder(seederDir, '.ts');
      if (seeders.length === 0) {
        console.log('No seeders found.');
        return;
      }
      const { seeder } = await inquirer.prompt([
        {
          type: 'list',
          name: 'seeder',
          message: 'Select a seeder to apply:',
          choices: seeders,
        },
      ]);
      await runSequelizeCommand(`db:seed --name ${seeder}`, servicePath);
      break;
    }

    case 'Undo All Seeders':
      await runSequelizeCommand('db:seed:undo:all', servicePath);
      break;

    case 'Undo a Specific Seeder': {
      const seeders = getFilesInFolder(seederDir, '.ts');
      if (seeders.length === 0) {
        console.log('No seeders found.');
        return;
      }
      const { seeder } = await inquirer.prompt([
        {
          type: 'list',
          name: 'seeder',
          message: 'Select a seeder to undo:',
          choices: seeders,
        },
      ]);
      await runSequelizeCommand(`db:seed:undo --name ${seeder}`, servicePath);
      break;
    }
  }
}
