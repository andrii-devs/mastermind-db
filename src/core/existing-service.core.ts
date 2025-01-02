import inquirer from 'inquirer';
import { loadProjectConfig } from '../helper/mastermind-config.helper';
import { logger } from '../utils/logger.utils';
import { manageORMService } from '../service/manage-orm.service';

export async function manageExistingService() {
  const projectConfig = loadProjectConfig();

  if (
    !projectConfig.services ||
    Object.keys(projectConfig.services).length === 0
  ) {
    logger.warn('No existing services found. Please create a service first.');
    return;
  }

  const { serviceName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'serviceName',
      message: 'Select an existing service to manage:',
      choices: Object.keys(projectConfig.services),
    },
  ]);

  await manageORMService(serviceName);
}
