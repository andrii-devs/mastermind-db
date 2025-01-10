import path from 'path';
import { renderTemplate } from '../helper/render-templates.helper';
import fs from 'fs-extra';
import { createSpinner } from 'nanospinner';
import kleur from 'kleur';
import { getConfigPaths } from '../helper/mastermind-config.helper';
export async function scaffoldSequelizeTemplate(serviceName: string) {
  const spinner = createSpinner(
    kleur.cyan(`Scaffolding sequelize template for service: ${serviceName}\n`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const configPaths = getConfigPaths(serviceName);
  const baseDir = path.join(configPaths.rootDir, serviceName, 'sequelize');

  await fs.ensureDir(configPaths.migrationsDir);
  await fs.ensureDir(configPaths.modelsDir);
  await fs.ensureDir(configPaths.seedersDir);

  await renderTemplate(
    `sequelize/config/config.ts.ejs`,
    `${baseDir}/config.ts`,
    {},
    spinner,
  );

  const sequelizercFilePath = path.join(baseDir, '.sequelizerc');
  await renderTemplate(
    '/sequelize/sequelizerc.ejs',
    sequelizercFilePath,
    {},
    spinner,
  );

  spinner.success(kleur.green(`Successfully scaffolded sequelize template`));
}
