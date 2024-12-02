import fs from 'fs-extra';
import path from 'path';
import { renderTemplate } from './render-templates.service';

export async function scaffoldDatabase(
  serviceName: string,
  dbType: string,
  dbName: string,
  port: number,
) {
  const baseDir = path.join('src', serviceName);
  const subfolders = ['migrations', 'models', 'seeders', 'docker'];

  // Create folders
  await Promise.all(
    subfolders.map((folder) => fs.ensureDir(path.join(baseDir, folder))),
  );

  await fs.ensureDir(path.join(baseDir, 'docker', dbType));

  await renderTemplate(
    `docker/${dbType}/Dockerfile.${dbType}.ejs`,
    `${baseDir}/docker/Dockerfile`,
    { dbName, port },
  );

  await renderTemplate(
    `docker/${dbType}/env.${dbType}.ejs`,
    `${baseDir}/docker/.env`,
    {
      port,
      dbName,
      dbUsername: `${serviceName}_user`,
      dbPassword: `${serviceName}_password`,
    },
  );

  await renderTemplate('config/config.ts.ejs', `${baseDir}/config.ts`, {
    dbType,
    port,
    dbName,
  });

  // Generate init.sql for MySQL
  if (dbType === 'mysql') {
    const initSQL = `
  CREATE DATABASE IF NOT EXISTS ${dbName};
  CREATE USER IF NOT EXISTS '${serviceName}_user'@'%' IDENTIFIED BY '${serviceName}_password';
  GRANT ALL PRIVILEGES ON ${dbName}.* TO '${serviceName}_user'@'%';
  FLUSH PRIVILEGES;
  `;
    await fs.outputFile(path.join(baseDir, 'docker/init.sql'), initSQL, 'utf8');
  }

  console.log(`Scaffolded database structure for "${serviceName}".`);
}
