import fs from 'fs-extra';
import path from 'path';
import { renderTemplate } from '../helper/render-templates.helper';
import { getRootDir } from '../helper/sequelize-blueprint-config.helper';
import { DBType } from '../types';
import { logger } from '../utils/logger.utils';

export async function scaffoldDatabase(
  serviceName: string,
  dbType: string,
  dbName: string,
  port: number,
) {
  const config = getRootDir();
  const baseDir = path.join(config, serviceName);
  const subfolders = ['docker', 'sequelize'];
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
    `${baseDir}/sequelize/config.ts`,
    {
      dbType,
      port,
      dbName,
    },
  );

  // Generate init.sql

  switch (dbType) {
    case 'mysql':
      await renderTemplate(
        `database/${dbType}/docker/init.sql.ejs`,
        `${baseDir}/docker/init.sql`,
        {
          dbName,
          dbUsername: `${serviceName}_user`,
          dbPassword: `${serviceName}_password`,
        },
      );
      break;
    case 'potgres':
      await renderTemplate(
        `database/${dbType}/docker/init.sql.ejs`,
        `${baseDir}/docker/init.sql`,
        {
          dbName,
          dbUsername: `${serviceName}User`,
          dbPassword: `${serviceName}Password`,
        },
      );
      break;

    default:
      break;
  }

  logger.success(`Scaffolded database structure for "${serviceName}".`);
}
