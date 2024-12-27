import path from 'path';
import fs from 'fs-extra';
import { logger } from '../utils/logger.utils';

export const DEFAULT_ROOT_DIR = './src';
export const CONFIG_FILE_NAME = '.mastermindrc';

export function getConfigFilePath(): string {
  return path.resolve(process.cwd(), CONFIG_FILE_NAME);
}

export function loadProjectConfig(): Record<string, any> {
  const configPath = getConfigFilePath();

  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  return {
    services: {},
  };
}

export function saveProjectConfig(config: Record<string, any>): void {
  const configPath = getConfigFilePath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

export function addOrUpdateProjectConfig(
  serviceName: string,
  orm: string,
  rootDir: string = DEFAULT_ROOT_DIR,
): void {
  const projectConfig = loadProjectConfig();

  projectConfig.rootDir = rootDir;
  // const databases = (projectConfig.databases[dbName] = {
  //   orm,
  //   migrationsDir: path.join(rootDir, dbName, orm.toLowerCase(), '/migrations'),
  //   modelsDir: path.join(rootDir, dbName, orm.toLowerCase(), '/models'),
  //   seedersDir: path.join(rootDir, dbName, orm.toLowerCase(), '/seeders'),
  //   templatesDir: path.resolve(__dirname, '../templates', orm.toLowerCase()),
  // });

  projectConfig.services[serviceName] = {
    orm,
    migrationsDir: path.join(
      rootDir,
      serviceName,
      orm.toLowerCase(),
      '/migrations',
    ),
    modelsDir: path.join(rootDir, serviceName, orm.toLowerCase(), '/models'),
    seedersDir: path.join(rootDir, serviceName, orm.toLowerCase(), '/seeders'),
  };

  saveProjectConfig(projectConfig);
}

export function getConfigPaths(serviceName: string) {
  // const projectConfig = loadProjectConfig();
  // if (!projectConfig.databases[dbName]) {
  //   logger.error(`Configuration for database ${dbName} not found`);
  // }

  // return { rootDir: projectConfig.rootDir, ...projectConfig.databases[dbName] };

  const projectConfig = loadProjectConfig();
  if (!projectConfig.services[serviceName]) {
    logger.error(`Configuration for service ${serviceName} not found`);
  }

  return {
    rootDir: projectConfig.rootDir,
    ...projectConfig.services[serviceName],
  };
}
