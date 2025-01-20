import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.utils';
import { createSpinner } from 'nanospinner';
import kleur from 'kleur';
import { getConfigPaths } from '../helper/mastermind-config.helper';
import path from 'path';
import yaml from 'js-yaml';
import inquirer from 'inquirer';
import { execAsync, sanitizeName } from '../utils/strings.utils';

export async function stopAndRemoveDockerContainer(
  containerName: string,
  removeVolumes: boolean = true,
) {
  const spinner = createSpinner(
    kleur.cyan(`Stopping and removing Docker container: ${containerName}`),
  ).start();

  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const { stdout: containerStatus } = await execAsync(
      `docker ps -q --filter name=${containerName}`,
    );
    if (containerStatus.trim()) {
      await execAsync(`docker stop ${containerName}`);
      logger.info(`Stopped Docker container: ${containerName}`);

      const rmCommand = removeVolumes
        ? `docker rm -v ${containerName}` //remove volumes option
        : `docker rm ${containerName}`;

      await execAsync(rmCommand);
      spinner.success(
        kleur.green(`Removed Docker container: ${containerName}`),
      );
    } else {
      logger.warn(`Docker container "${containerName}" is not running.`);
    }
  } catch (err) {
    spinner.error(
      kleur.red(
        `Failed to stop/remove Docker container "${containerName}": ${err}`,
      ),
    );
  }
}

export async function startDockerContainer(serviceName: string) {
  const spinner = createSpinner(
    kleur.cyan(`Starting ${serviceName} docker container`),
  ).start();

  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const dockerComposePath = './docker-compose.yml';
    if (fs.existsSync(dockerComposePath)) {
      await execAsync(`docker compose up -d ${serviceName}`);
      // logger.info(`Started Docker container: ${serviceName}-db`);
      spinner.success(kleur.green(`Started Docker container: ${serviceName}`));
    } else {
      logger.warn(
        'docker-compose.yml file not found. Cannot start Docker container.',
      );
    }
  } catch (err) {
    spinner.error(
      kleur.red(`Failed to start Docker container "${serviceName}": ${err}`),
    );
  }
}

export async function isDockerRunning(): Promise<boolean> {
  try {
    await execAsync('docker info');
    logger.info('Docker is installed and running.');

    return true;
  } catch {
    logger.error(
      'Docker is not installed or running. Please install/start Docker to use container features.',
    );
    return false;
  }
}

export async function isContainerRunning(
  containerName: string,
): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `docker ps --filter "name=${containerName}" --filter "status=running" --format "{{.Names}}"`,
    );
    return stdout.trim() === containerName;
  } catch (err) {
    logger.error(`Error checking Docker container status: ${err}`);
    return false;
  }
}

export async function buildDockerCompose(
  serviceName: string,
  dbType: string,
  port: number,
) {
  const dockerComposeFile = './docker-compose.yml';
  const configPaths = getConfigPaths(serviceName);
  const serviceDir = path.join(configPaths.rootDir, serviceName);

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
      postgres: '/var/lib/postgresql/data',
      sqlite: '/data/sqlite',
    };
    const defaultPorts: Record<string, number> = {
      mysql: 3306,
      postgres: 5432,
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
      spinner.info(kleur.cyan(`Added service: "${serviceKey}"`));
      // logger.info(`Added service: "${serviceKey}"`);
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
      spinner.info(kleur.cyan(`Added volume: "${volumeKey}"`));
      // logger.info(`Added volume: "${volumeKey}"`);
      spinner.start();
    } else {
      spinner.stop();
      logger.warn(`Volume "${volumeKey}" already exists.`);
      spinner.start();
    }

    const updatedContent = yaml.dump(dockerCompose, { lineWidth: -1 });
    await fs.writeFile(dockerComposeFile, updatedContent, 'utf8');
    spinner.success(kleur.green(`Successfully updated docker-compose.yml`));

    await aksForStartDockerCompose(serviceKey);
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

export async function aksForStartDockerCompose(serviceKey: string) {
  if (await isDockerRunning()) {
    const isRunning = await isContainerRunning(serviceKey);
    if (!isRunning) {
      const { startContainer } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'startContainer',
          message: 'Docker container is not running. Do you want to start it?',
          default: true,
        },
      ]);

      if (startContainer) {
        await startDockerContainer(serviceKey);
      } else {
        logger.info(`Skipped starting docker container ${serviceKey}`);
      }
    }
  }
}

export async function stopDockerContainer(containerName: string) {
  const spinner = createSpinner(
    kleur.cyan(`Stopping Docker container: ${containerName}`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  try {
    await execAsync(`docker stop ${containerName}`);
    spinner.info(
      kleur.green(`Docker container ${containerName} stopped successfully`),
    );
  } catch (err) {
    spinner.error(
      kleur.red(`Failed to stop Docker container "${containerName}": ${err}`),
    );
  }
}

export async function refreshDockerContainer(containerName: string) {
  const spinner = createSpinner(
    kleur.cyan(`Refreshing Docker container: ${containerName}`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    spinner.stop();
    await stopDockerContainer(containerName);
    spinner.start();
    await execAsync(`docker rm ${containerName}`);
    await execAsync(`docker compose up -d ${containerName}`);
    spinner.success(
      kleur.green(`Docker container ${containerName} refreshed successfully`),
    );
  } catch (err) {
    spinner.error(
      kleur.red(
        `Failed to refresh Docker container "${containerName}": ${err}`,
      ),
    );
  }
}

export async function purgeDockerContainer(containerName: string) {
  const spinner = createSpinner(
    kleur.cyan(`Purging Docker container: ${containerName}`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    await execAsync(`docker stop ${containerName}`);
    await execAsync(`docker rm -v ${containerName}`);
    spinner.success(
      kleur.green(`Docker container ${containerName} purged successfully`),
    );
  } catch (err) {
    spinner.error(
      kleur.red(`Failed to purge Docker container "${containerName}": ${err}`),
    );
  }
}
