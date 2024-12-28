import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs-extra';
import { handlerSequelizeMessage, logger } from '../utils/logger.utils';
import path from 'path';
import os from 'os';
import { handlerError } from '../utils/error-handler.utils';
import { createSpinner } from 'nanospinner';
import { getRelativePath } from './mastermind-config.helper';

export const execAsync = promisify(exec);

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
