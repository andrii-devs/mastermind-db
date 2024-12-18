import fs from 'fs-extra';
import path from 'path';
import { renderTemplate } from '../helper/render-templates.helper';
import { getRootDir } from '../helper/sequelize-blueprint-config.helper';
import { logger } from '../utils/logger.utils';
import { createSpinner } from 'nanospinner';
import kleur from 'kleur';

export async function scaffoldDatabase(
  serviceName: string,
  dbType: string,
  dbName: string,
  port: number,
) {
  const spinner = createSpinner(
    kleur.cyan(
      `Initializing a ${dbType} database for the "${serviceName}" service\n`,
    ),
  ).start();

  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const config = getRootDir();
    const baseDir = path.join(config, serviceName);
    const subfolders = ['docker'];
    // Create folders
    await Promise.all(
      subfolders.map((folder) => fs.ensureDir(path.join(baseDir, folder))),
    );
    switch (dbType) {
      case 'mysql':
        await renderTemplate(
          `database/${dbType}/docker/Dockerfile.${dbType}.ejs`,
          `${baseDir}/docker/Dockerfile`,
          { dbName, port },
          spinner,
        );

        await renderTemplate(
          `database/${dbType}/docker/env.${dbType}.ejs`,
          `${baseDir}/docker/.env`,
          {
            port,
            dbName,
            dbUsername: `${serviceName}_user`,
            dbPassword: `${serviceName}_password`,
            dialect: dbType,
          },
          spinner,
        );

        await renderTemplate(
          `database/${dbType}/docker/init.sql.ejs`,
          `${baseDir}/docker/init.sql`,
          {
            dbName,
            dbUsername: `${serviceName}_user`,
            dbPassword: `${serviceName}_password`,
          },
          spinner,
        );
        break;
      case 'postgres':
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
            dialect: dbType,
          },
        );

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

    spinner.success(
      kleur.green(`Scaffolded database structure for "${serviceName}".`),
    );
  } catch (err) {
    logger.debug(`Failed to scaffolded database structure: ${err}`);
    spinner.stop();
  }

  // logger.success(`Scaffolded database structure for "${serviceName}".`);
}
