import path from 'path';
import fs from 'fs-extra';
import { loadProjectConfig } from '../helper/mastermind-config.helper';

export const getServiceFolders = (): string[] => {
  const projectConfig = loadProjectConfig();
  const rootFolder = projectConfig.rootDir;
  return fs.existsSync(rootFolder)
    ? fs
        .readdirSync(rootFolder)
        .filter((folder) =>
          fs.lstatSync(path.join(rootFolder, folder)).isDirectory(),
        )
    : [];
};

export const getTimestamp = (): string => {
  return new Date().toISOString().replace(/[-T:.Z]/g, '');
};
