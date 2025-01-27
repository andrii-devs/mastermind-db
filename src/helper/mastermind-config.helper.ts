import path from 'path';
import fs from 'fs-extra';
import { logger } from '../utils/logger.utils';

export const DEFAULT_ROOT_DIR = './src';
export const CONFIG_FILE_NAME = '.mastermindrc';

export function getConfigFilePath(): string {
  return path.resolve(process.cwd(), CONFIG_FILE_NAME);
}

interface IProjectConfig {
  rootDir: string;
  services: {
    [serviceName: string]: {
      database: string;
      orm: string;
      migrationsDir: string;
      modelsDir: string;
      seedersDir: string;
    };
  };
}

export function loadProjectConfig(): Record<string, any> {
  const configPath = getConfigFilePath();

  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as IProjectConfig;
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
  dbType: string,
  rootDir: string = DEFAULT_ROOT_DIR,
): void {
  const projectConfig = loadProjectConfig();

  projectConfig.rootDir = rootDir;
  projectConfig.services[serviceName] = {
    database: dbType,
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

export interface IConfigPath {
  rootDir: string;
  database: string;
  orm: string;
  migrationsDir: string;
  modelsDir: string;
  seedersDir: string;
}

export function getConfigPaths(serviceName: string): IConfigPath {
  const projectConfig = loadProjectConfig();
  if (!projectConfig.services[serviceName]) {
    logger.error(`Configuration for service ${serviceName} not found`);
  }

  return {
    rootDir: projectConfig.rootDir,
    ...projectConfig.services[serviceName],
  };
}

export function getRelativePath(base: string, target: string): string {
  return path.relative(base, target);
}
