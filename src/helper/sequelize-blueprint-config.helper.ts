import fs from 'fs-extra';
import path from 'path';
import kleur from 'kleur';

export const CONFIG_FILE_NAME = 'sequelize-blueprint.json';

export const getConfig = (): Record<string, string> | any => {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    console.log(kleur.red(`${CONFIG_FILE_NAME} not found. Run init command.`));
    return;
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
};

export const getRootDir = (): string => {
  const config = getConfig();
  return path.resolve(config.rootDir);
};

export const getTemplatesDir = (): string => {
  const config = getConfig();
  if (!config.templatesDir || typeof config.templatesDir !== 'string') {
    throw new Error(`Invalid or missing "templatesDir" in ${CONFIG_FILE_NAME}`);
  }
  return path.resolve(config.templatesDir);
};

export const getConfigPath = (): string => {
  return path.resolve(CONFIG_FILE_NAME);
};

export function checkIfConfigFileExists(configPath: string): boolean {
  if (!fs.existsSync(configPath)) {
    console.log(kleur.red(`${CONFIG_FILE_NAME} not found. Run init command.`));
    return false;
  } else {
    return true;
  }
}

export function getRelativePath(base: string, target: string): string {
  return path.relative(base, target);
}