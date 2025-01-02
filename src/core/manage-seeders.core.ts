import inquirer from 'inquirer';
import { runSequelizeCommand } from '../helper/run-sequelize-command.helper';
import { logger } from '../utils/logger.utils';
import path from 'path';
import { loadProjectConfig } from '../helper/mastermind-config.helper';

const APPLY_ALL_SEED = 'Apply all seeders';
const UNDO_ALL_SEED = 'Undo all seeders';
const UNDO_LATEST_SEED = 'Undo the latest seed';

export async function manageSeedersAction(serviceName: string): Promise<void> {
  const projectConfig = loadProjectConfig();
  if (
    !projectConfig.services ||
    Object.keys(projectConfig.services).length === 0
  ) {
    logger.warn('No existing services found. Please create a service first.');
    return;
  }

  const servicePath = path.join(projectConfig.rootDir, serviceName);

  const { environment } = await inquirer.prompt([
    {
      type: 'list',
      name: 'environment',
      message: 'Select the environment:',
      choices: ['development', 'production', 'test'],
      default: 'development',
    },
  ]);
  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: `What would you like to do with seeders for "${serviceName}"?`,
      choices: [APPLY_ALL_SEED, UNDO_ALL_SEED, UNDO_LATEST_SEED],
    },
  ]);

  switch (operation) {
    case APPLY_ALL_SEED:
      await runSequelizeCommand('db:seed:all', servicePath, environment);
      break;

    case UNDO_ALL_SEED:
      await runSequelizeCommand('db:seed:undo:all', servicePath, environment);
      break;

    case UNDO_LATEST_SEED: {
      await runSequelizeCommand('db:seed:undo', servicePath, environment);
      break;
    }
  }
}
