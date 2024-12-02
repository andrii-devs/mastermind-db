import fs from 'fs-extra';
import path from 'path';
import { renderTemplate } from './render-templates.service';
import {
  getConfigPath,
  getRootDir,
} from '../helper/generate-sequelize-config.helper';
import { DBType } from '../types';

export async function scaffoldDatabase(
  serviceName: string,
  dbType: string,
  dbName: string,
  port: number,
) {
  const config = getRootDir();
  const baseDir = path.join(config, serviceName);
  const subfolders = ['migrations', 'models', 'seeders', 'docker'];
  // Create folders
  await Promise.all(
    subfolders.map((folder) => fs.ensureDir(path.join(baseDir, folder))),
  );

  if (dbType === DBType.PostgreSQL) {
    await renderTemplate(
      `database/${dbType}/docker/Dockerfile.${dbType}.ejs`,
      `${baseDir}/docker/Dockerfile`,
      {
        dbName,
        port,
        dbUsername: `${serviceName}User`,
        dbPassword: `${serviceName}Password`,
      },
    );

    await renderTemplate(
      `database/${dbType}/docker/env.${dbType}.ejs`,
      `${baseDir}/docker/.env`,
      {
        port,
        dbName,
        dbUsername: `${serviceName}User`,
        dbPassword: `${serviceName}Password`,
      },
    );
  } else {
    await renderTemplate(
      `database/${dbType}/docker/Dockerfile.${dbType}.ejs`,
      `${baseDir}/docker/Dockerfile`,
      { dbName, port },
    );

    await renderTemplate(
      `database/${dbType}/docker/env.${dbType}.ejs`,
      `${baseDir}/docker/.env`,
      {
        port,
        dbName,
        dbUsername: `${serviceName}_user`,
        dbPassword: `${serviceName}_password`,
      },
    );
  }

  await renderTemplate(
    `database/${dbType}/config/config.ts.ejs`,
    `${baseDir}/config.ts`,
    {
      dbType,
      port,
      dbName,
    },
  );

  // Generate init.sql for MySQL
  if (dbType === DBType.MySQL || dbType === DBType.PostgreSQL) {
    await renderTemplate(
      `database/${dbType}/init.sql`,
      `${baseDir}/docker/init.sql`,
      {
        dbName,
        dbUsername: `${serviceName}_user`,
        dbPassword: `${serviceName}_password`,
      },
    );
  }
  console.log(`Scaffolded database structure for "${serviceName}".`);
}
