import path from 'path';
import { renderTemplate } from '../helper/render-templates.helper';
import fs from 'fs-extra';
import { createSpinner } from 'nanospinner';
import kleur from 'kleur';
import {
  getConfigPaths,
  getRelativePath,
} from '../helper/mastermind-config.helper';
import { getTimestamp } from '../utils/file-path.utils';
import inquirer from 'inquirer';
import { capitalizeString, execAsync } from '../utils/strings.utils';
import { handlerSequelizeMessage, logger } from '../utils/logger.utils';
import { handlerError } from '../utils/error-handler.utils';
import os from 'os';

export async function scaffoldSequelizeTemplate(serviceName: string) {
  const spinner = createSpinner(
    kleur.cyan(`Scaffolding sequelize template for service: ${serviceName}\n`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const configPaths = getConfigPaths(serviceName);
  const baseDir = path.join(configPaths.rootDir, serviceName, 'sequelize');

  await fs.ensureDir(configPaths.migrationsDir);
  await fs.ensureDir(configPaths.modelsDir);
  await fs.ensureDir(configPaths.seedersDir);

  await renderTemplate(
    `sequelize/config/config.ts.ejs`,
    `${baseDir}/config.ts`,
    {},
    spinner,
  );

  const sequelizercFilePath = path.join(baseDir, '.sequelizerc');
  await renderTemplate(
    '/sequelize/sequelizerc.ejs',
    sequelizercFilePath,
    {},
    spinner,
  );

  spinner.success(kleur.green(`Successfully scaffolded sequelize template`));
}

export async function generateSequelizeFiles(
  serviceName: string,
  fileTypes: string[],
) {
  const configPaths = getConfigPaths(serviceName);
  const timestamp = getTimestamp();

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
        const fileName = `${timestamp}-${migrationName.toLocaleLowerCase()}.ts`;
        const migrationPath = path.join(configPaths.migrationsDir, fileName);

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

        const seedFileName = `${timestamp}-${seederName.toLocaleLowerCase()}.seed.ts`;
        const seederPath = path.join(configPaths.seedersDir, seedFileName);

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
        const modelFileName = `${modelName.toLocaleLowerCase()}.model.ts`;
        const filePath = path.join(configPaths.modelsDir, modelFileName);
        const modelClassName = capitalizeString(modelName);

        await renderTemplate('/sequelize/models/model.ejs', filePath, {
          modelName,
          tableName,
          modelClassName,
        });

        break;
      default:
        break;
    }
  }
}

export async function runSequelizeCommand(
  command: string,
  servicePath: string,
  environment: string,
) {
  const sequelizercPath = path.resolve(
    servicePath,
    'sequelize',
    '.sequelizerc',
  );

  logger.info(
    `Using .sequelizerc: ${getRelativePath(process.cwd(), sequelizercPath)}`,
  );

  const spinner = createSpinner(
    `Running: npx sequelize-cli ${command} in ${getRelativePath(process.cwd(), servicePath)} with environment ${environment}`,
  ).start();

  try {
    const { stdout } = await execAsync(
      `export NODE_ENV=${environment} && npx sequelize-cli ${command} --options-path ${sequelizercPath}`,
      {
        cwd: servicePath,
        env: {
          ...process.env,
          NODE_ENV: environment,
        },
        shell: os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash',
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    stdout.split('\n').forEach((line) => {
      handlerSequelizeMessage(line);
    });

    spinner.success('Done!');
  } catch (err: any) {
    spinner.stop();
    handlerError(err, 'Database Migration');
  }
}

export function getFilesInFolder(
  folderPath: string,
  extension: string,
): string[] {
  if (!fs.existsSync(folderPath)) return [];
  return fs
    .readdirSync(folderPath)
    .filter((file: any) => file.endsWith(extension));
}
