import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.utils';
import { createSpinner } from 'nanospinner';
import kleur from 'kleur';

const execAsync = promisify(exec);

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
