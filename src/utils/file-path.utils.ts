import path from 'path';
import fs from 'fs-extra';
import { getRootDir } from '../helper/sequelize-blueprint-config.helper';

export const getServiceFolders = (): string[] => {
  const rootFolder = getRootDir();
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
