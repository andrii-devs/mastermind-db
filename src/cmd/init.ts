import path from 'path';
import fs from 'fs-extra';
import kleur from 'kleur';
import { getConfigPath } from '../helper/sequelize-blueprint-config.helper';
import { generateDockerCompose } from '../helper/docker-compose.helper';

export function initCLI(): void {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      rootDir: './src',
      templatesDir: './src/templates',
      migrationsDir: 'migrations',
      modelsDir: 'models',
      seedersDir: 'seeders',
    };

    fs.writeFileSync(
      configPath,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8',
    );
    console.log(
      kleur.cyan('Initialized sequelize-blueprint with default configuration.'),
    );
  } else {
    console.log(
      kleur.yellow(`Configuration file already exists ${configPath}`),
    );
  }
}
