import fs from 'fs-extra';
import inquirer from 'inquirer';
import {
  generateDockerCompose,
  updateDockerCompose,
} from '../helper/docker-compose.helper';

export async function scaffoldDockerCompose(
  serviceName: string,
  dbType: string,
  port: number,
) {
  if (!fs.existsSync('./docker-compose.yml')) {
    const { confimCreatingDockerCompose } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confimCreatingDockerCompose',
        message:
          'No docker-compose.yml file found. Would you like to create one?',
      },
    ]);

    if (confimCreatingDockerCompose) {
      await generateDockerCompose();
      await updateDockerCompose(serviceName, dbType, port);
    }
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
      await updateDockerCompose(serviceName, dbType, port);
    }
  }
}
