import inquirer from 'inquirer';
import { getTimestamp } from '../utils/file-path.utils';
import path from 'path';
import { getConfig, getRootDir } from './sequelize-blueprint-config.helper';
import { renderTemplate } from './render-templates.helper';

export async function generateSequelizeFiles(
  serviceName: string,
  fileTypes: string[],
) {
  const config = getConfig();
  const rootDir = getRootDir();

  for (const type of fileTypes) {
    switch (type) {
      case 'Migrations':
        const { migrationName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'migrationName',
            message: 'Enter migration name (kebab-case):',
            validate: (input) =>
              input.trim() !== '' ? true : 'Migration name cannot be empty',
          },
        ]);
        const timestamp = getTimestamp();
        const fileName = `${timestamp}-${migrationName.toLocaleLowerCase()}.ts`;
        const migrationPath = path.join(
          rootDir,
          serviceName,
          config.migrationsDir,
          fileName,
        );

        await renderTemplate(
          'sequelize/migrations/migration.ejs',
          migrationPath,
          {
            migrationName,
          },
        );

        break;
      case 'Seeders':
        const { seederName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'seederName',
            message: 'Enter seed name:',
            validate: (input) =>
              input.trim() !== '' ? true : 'Seed name cannot be empty',
          },
        ]);

        const { seedTableName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'seedTableName',
            message: 'Enter table name:',
            default: seederName,
          },
        ]);

        const seedFileName = `${seederName}.seed.ts`;
        const seederPath = path.join(
          rootDir,
          serviceName,
          config.seedersDir,
          seedFileName,
        );

        await renderTemplate('sequelize/seeders/seed.ejs', seederPath, {
          seederName,
          tableName: seedTableName,
        });

        break;
      case 'Models':
        const { modelName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'modelName',
            message: 'Enter model name:',
            validate: (input) =>
              input.trim() !== '' ? true : 'Model name cannot be empty',
          },
        ]);

        const { tableName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'tableName',
            message: 'Enter table name:',
            default: modelName,
          },
        ]);
        const modelFileName = `${modelName}.model.ts`;
        const filePath = path.join(
          rootDir,
          serviceName,
          config.modelsDir,
          modelFileName,
        );

        await renderTemplate('/sequelize/models/model.ejs', filePath, {
          modelName,
          tableName,
        });

        break;
      default:
        break;
    }
  }
}
