import fs from 'fs-extra';
import yaml from 'js-yaml';
import { getRootDir } from './sequelize-blueprint-config.helper';
import path from 'path';
import { logger } from '../utils/logger.utils';
import { createSpinner } from 'nanospinner';
import kleur from 'kleur';

function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, '-');
}

export async function buildDockerCompose(
  serviceName: string,
  dbType: string,
  port: number,
) {
  const dockerComposeFile = './docker-compose.yml';
  const rootDir = getRootDir();
  const serviceDir = path.join(rootDir, serviceName);

  const spinner = createSpinner(
    kleur.cyan(`Adding service ${serviceName} into the docker-compose.yml`),
  ).start();

  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const relativeContextPath = path.relative(
      path.dirname(dockerComposeFile),
      path.join(serviceDir, 'docker'),
    );

    const volumeMappingPaths: Record<string, string> = {
      mysql: '/var/lib/mysql',
      postgresql: '/var/lib/postgresql/data',
      sqlite: '/data/sqlite',
    };
    const defaultPorts: Record<string, number> = {
      mysql: 3306,
      postgresql: 5432,
    };

    const sanitizedServiceName = sanitizeName(serviceName);
    const serviceKey = `${sanitizedServiceName}-db`;
    const volumeKey = `${sanitizedServiceName}-data`;

    const volumePath = volumeMappingPaths[dbType] || '/data/unknown';
    const dbPort = defaultPorts[dbType] || 3306;

    let dockerCompose: any = {
      version: '3.8',
      services: {},
      networks: {
        'db-network': {},
      },
      volumes: {},
    };

    if (fs.existsSync(dockerComposeFile)) {
      const existingContent = await fs.readFile(dockerComposeFile, 'utf8');
      dockerCompose = yaml.load(existingContent) as any;
    }

    dockerCompose.services = dockerCompose.services || {};
    dockerCompose.volumes = dockerCompose.volumes || {};
    dockerCompose.networks = dockerCompose.networks || { 'db-network': {} };

    if (!dockerCompose.services[serviceKey]) {
      dockerCompose.services[serviceKey] = {
        container_name: serviceKey,
        build: {
          context: relativeContextPath,
          dockerfile: 'Dockerfile',
        },
        restart: 'unless-stopped',
        env_file: path.join(relativeContextPath, '.env'),
        networks: ['db-network'],
        ports: [`${port}:${dbPort}`],
        volumes: [`${volumeKey}:${volumePath}`],
      };
      spinner.stop();
      logger.info(`Added service: "${serviceKey}"`);
      spinner.start();
    } else {
      spinner.stop();
      logger.warn(`Service "${serviceKey}" already exists.`);
      spinner.start();
    }

    // Add the volume
    if (!dockerCompose.volumes[volumeKey]) {
      dockerCompose.volumes[volumeKey] = {};
      spinner.stop();
      logger.info(`Added volume: "${volumeKey}"`);
      spinner.start();
    } else {
      spinner.stop();
      logger.warn(`Volume "${volumeKey}" already exists.`);
      spinner.start();
    }

    // Write the updated docker-compose.yml
    const updatedContent = yaml.dump(dockerCompose, { lineWidth: -1 });
    await fs.writeFile(dockerComposeFile, updatedContent, 'utf8');
    // logger.success(`Successfully updated docker-compose.yml`);
    spinner.success(kleur.green(`Successfully updated docker-compose.yml`));
  } catch (err) {
    spinner.error(kleur.red(`Failed to update docker-compose.yml: ${err}`));
  }
}

export async function createDockerComposeFile() {
  if (!fs.existsSync('./docker-compose.yml')) {
    logger.info('No docker-compose.yml found. Creating a new one...');

    const dockerCompose = yaml.dump({
      version: '3.8',
      services: {},
      networks: {
        'db-network': {},
      },
      volumes: {},
    });
    fs.writeFileSync('./docker-compose.yml', dockerCompose, 'utf8');
  }
}
