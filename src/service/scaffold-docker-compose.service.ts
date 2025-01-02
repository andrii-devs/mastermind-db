import fs from 'fs-extra';
import inquirer from 'inquirer';
import {
  createDockerComposeFile,
  buildDockerCompose,
} from '../helper/docker-compose.helper';
import { logger } from '../utils/logger.utils';

export async function scaffoldDockerCompose(
  serviceName: string,
  dbType: string,
  port: number,
) {
  if (!fs.existsSync('./docker-compose.yml')) {
    const { confirmCreatingDockerCompose } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmCreatingDockerCompose',
        message:
          'No docker-compose.yml file found. Would you like to create one?',
      },
    ]);

    if (!confirmCreatingDockerCompose) {
      logger.info('Skipped creating docker-compose.yml');
      return;
    }

    await createDockerComposeFile();
    await buildDockerCompose(serviceName, dbType, port);
  } else {
    const { useCompose } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useCompose',
        message:
          'Would you like to update your existing docker-compose.yml file?',
      },
    ]);

    if (useCompose) {
      await buildDockerCompose(serviceName, dbType, port);
    }
  }
}
