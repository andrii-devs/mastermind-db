import fs from 'fs-extra';
import yaml from 'js-yaml';
import { getRootDir } from './sequelize-blueprint-config.helper';
import path from 'path';

function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, '-');
}

export async function updateDockerCompose(
  serviceName: string,
  dbType: string,
  port: number,
) {
  const dockerComposeFile = './docker-compose.yml';
  const rootDir = getRootDir();
  const serviceDir = path.join(rootDir, serviceName);

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
    sqlite: 0, // SQLite doesn't need port mapping
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
    console.log(`Added service: "${serviceKey}"`);
  } else {
    console.log(`Service "${serviceKey}" already exists.`);
  }

  // Add the volume
  if (!dockerCompose.volumes[volumeKey]) {
    dockerCompose.volumes[volumeKey] = {};
    console.log(`Added volume: "${volumeKey}"`);
  } else {
    console.log(`Volume "${volumeKey}" already exists.`);
  }

  // Write the updated docker-compose.yml
  const updatedContent = yaml.dump(dockerCompose, { lineWidth: -1 });
  await fs.writeFile(dockerComposeFile, updatedContent, 'utf8');
  console.log(`Updated docker-compose.yml`);
}

export async function generateDockerCompose() {
  if (!fs.existsSync('./docker-compose.yml')) {
    console.log('No docker-compose.yml found. Creating a new one...');

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
