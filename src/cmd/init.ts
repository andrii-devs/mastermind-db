import fs from 'fs-extra';
import { getConfigPath } from '../helper/sequelize-blueprint-config.helper';
import { logger } from '../utils/logger.utils';
export function initCLI(): void {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      rootDir: './src',
      migrationsDir: '/sequelize/migrations',
      modelsDir: '/sequelize/models',
      seedersDir: '/sequelize/seeders',
    };

    fs.writeFileSync(
      configPath,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8',
    );

    logger.info('Initialized sequelize-blueprint with default configuration.');
  } else {
    logger.warn(`Configuration file already exists ${configPath}`);
  }
}
