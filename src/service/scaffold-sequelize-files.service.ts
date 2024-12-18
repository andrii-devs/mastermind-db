import { getRootDir } from '../helper/sequelize-blueprint-config.helper';
import path from 'path';
import { renderTemplate } from '../helper/render-templates.helper';
import fs from 'fs-extra';
import { createSpinner } from 'nanospinner';
import kleur from 'kleur';
export async function scaffoldSequelizeTemplate(serviceName: string) {
  const spinner = createSpinner(
    kleur.cyan(`Scaffolding sequelize template for service: ${serviceName}\n`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const rootDir = getRootDir();
  const baseDir = path.join(rootDir, serviceName, 'sequelize');
  const subfolders = ['migrations', 'models', 'seeders'];

  // Create folders if not exist
  await Promise.all(
    subfolders.map((folder) => fs.ensureDir(path.join(baseDir, folder))),
  );

  await renderTemplate(
    `sequelize/config/config.ts.ejs`,
    `${baseDir}/config.ts`,
    {},
    spinner,
  );

  const sequelizercfilePath = path.join(
    rootDir,
    serviceName,
    '/sequelize/',
    '.sequelizerc',
  );
  await renderTemplate(
    '/sequelize/sequelizerc.ejs',
    sequelizercfilePath,
    {},
    spinner,
  );

  spinner.success(kleur.green(`Successfully scaffolded sequelize template`));
}
