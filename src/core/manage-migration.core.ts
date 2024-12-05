import inquirer from 'inquirer';
import { getServiceFolders } from '../utils/file-path.utils';
import { getRootDir } from '../helper/sequelize-blueprint-config.helper';
import {
  getFilesInFolder,
  runSequelizeCommand,
} from '../helper/run-sequelize-command.helper';

const APPLY_ALL_MIGRATION = 'Apply all migrations';
const APPLY_LATEST_MIGRATION = 'Apply the latest migration';
const UNDO_ALL_MIGRATION = 'Undo all migrations';
const UNDO_LATEST_MIGRATION = 'Undo the latest migration';

export async function manageMigrationsAction() {
  const services = getServiceFolders();
  const baseDir = getRootDir();
  if (services.length === 0) {
    console.log(
      `No services found in ${baseDir}. Please create a database first.`,
    );
    return;
  }

  const { serviceName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'serviceName',
      message: 'Select service to manage migrations:',
      choices: services,
    },
  ]);

  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: `What would you like to do with migrations for "${serviceName}"?`,
      choices: [
        APPLY_ALL_MIGRATION,
        APPLY_LATEST_MIGRATION,
        UNDO_ALL_MIGRATION,
        UNDO_LATEST_MIGRATION,
      ],
    },
  ]);

  const servicePath = `${baseDir}/${serviceName}`;
  const migrationDir = `${servicePath}/migrations`;

  switch (operation) {
    case APPLY_ALL_MIGRATION:
      await runSequelizeCommand('db:migrate', servicePath);
      break;

    case APPLY_LATEST_MIGRATION:
      const migrations = getFilesInFolder(migrationDir, '.ts');
      if (migrations.length === 0) {
        console.log('No migrations found.');
        return;
      }
      const { migration } = await inquirer.prompt([
        {
          type: 'list',
          name: 'migration',
          message: 'Select a migration to apply:',
          choices: migrations,
        },
      ]);
      await runSequelizeCommand(`db:migrate --name ${migration}`, servicePath);
      break;

    case UNDO_ALL_MIGRATION:
      const { confirmUndo } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmUndo',
          message: 'Are you sure you want to undo all migrations?',
        },
      ]);

      if (confirmUndo) {
        await runSequelizeCommand('db:migrate:undo:all', servicePath);
      }

      break;

    case UNDO_LATEST_MIGRATION:
      const migrationsFiles = getFilesInFolder(migrationDir, '.ts');
      if (migrationsFiles.length === 0) {
        console.log('No migrations found.');
        return;
      }
      const { migrationsLatest } = await inquirer.prompt([
        {
          type: 'list',
          name: 'migrationsLatest',
          message: 'Select a migration to undo:',
          choices: migrationsFiles,
        },
      ]);
      await runSequelizeCommand(
        `db:migrate:undo --name ${migrationsLatest}`,
        servicePath,
      );
      break;
  }
}
