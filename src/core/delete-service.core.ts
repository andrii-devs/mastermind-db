import inquirer from 'inquirer';
import {
  loadProjectConfig,
  saveProjectConfig,
} from '../helper/mastermind-config.helper';
import { logger } from '../utils/logger.utils';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { createSpinner } from 'nanospinner';
import kleur from 'kleur';
import {
  isContainerRunning,
  isDockerRunning,
  stopAndRemoveDockerContainer,
} from '../operations/manage-docker.operation';

export async function deleteServiceAction() {
  const projectConfig = loadProjectConfig();
  const services = Object.keys(projectConfig.services || {});

  if (services.length === 0) {
    logger.warn('No services found to delete. Please create one first.');
    return;
  }

  const { selectedService } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedService',
      message: 'Select the service you want to delete:',
      choices: services,
    },
  ]);

  const { confirmDelete } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmDelete',
      message: `Are you sure you want to delete the service "${selectedService}"? This action cannot be undone.`,
      default: false,
    },
  ]);

  if (!confirmDelete) {
    logger.info('Deletion canceled.');
    return;
  }

  const rootDir = projectConfig.rootDir;
  const serviceDir = path.join(rootDir, selectedService);
  const serviceKey = `${selectedService}-db`;

  const spinner = createSpinner(
    kleur.cyan(`Deleting service: ${selectedService}`),
  ).start();

  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    if (fs.existsSync(serviceDir)) {
      await fs.remove(serviceDir);
      spinner.info(kleur.cyan(`Removed service folder: ${serviceDir}`));
      // logger.info(`Removed service folder: ${serviceDir}`);
    } else {
      spinner.warn(
        kleur.yellow(`Service folder "${serviceDir}" does not exist.`),
      );
      // logger.warn(`Service folder "${serviceDir}" does not exist.`);
    }

    delete projectConfig.services[selectedService];
    saveProjectConfig(projectConfig);

    // logger.info(
    //   `Removed "${selectedService}" from .mastermindrc configuration.`,
    // );
    spinner.info(
      kleur.cyan(
        `Removed "${selectedService}" from .mastermindrc configuration`,
      ),
    );

    const dockerComposePath = './docker-compose.yml';
    if (fs.existsSync(dockerComposePath)) {
      spinner.stop();
      await deleteDockerService(dockerComposePath, selectedService);
      spinner.start();
    }
    spinner.success(
      kleur.green(`Successfully deleted service "${selectedService}".`),
    );
  } catch (err) {
    spinner.error(`Failed to delete service "${selectedService}": ${err}`);
  }
}

async function deleteDockerService(
  dockerComposePath: string,
  selectedService: string,
) {
  const { confirmDeleteFromDocker } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmDeleteFromDocker',
      message: 'Do you want to also delete the corresponding Docker service?',
      default: false,
    },
  ]);

  const serviceKey = `${selectedService}-db`;
  if (confirmDeleteFromDocker) {
    const dockerCompose = yaml.load(
      await fs.readFile(dockerComposePath, 'utf-8'),
    ) as any;

    if (dockerCompose.services && dockerCompose.services[serviceKey]) {
      delete dockerCompose.services[serviceKey];

      logger.info(`Removed service "${serviceKey}" from docker-compose.yml.`);
    } else {
      logger.warn(`Service "${serviceKey}" not found in docker-compose.yml.`);
    }

    const volumeKey = `${selectedService}-data`;
    if (dockerCompose.volumes && dockerCompose.volumes[volumeKey]) {
      delete dockerCompose.volumes[volumeKey];
      logger.info(`Removed volume "${volumeKey}" from docker-compose.yml.`);
    } else {
      logger.warn(`Volume "${volumeKey}" not found in docker-compose.yml.`);
    }

    const updatedContent = yaml.dump(dockerCompose, { lineWidth: -1 });
    await fs.writeFile(dockerComposePath, updatedContent, 'utf8');

    if (await isDockerRunning()) {
      const isRunning = await isContainerRunning(serviceKey);

      if (isRunning) {
        const { confirmDockerCleanup } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmDockerCleanup',
            message: `Docker container "${serviceKey}" is running. Do you want to stop and remove it?`,
            default: true,
          },
        ]);

        if (confirmDockerCleanup) {
          await stopAndRemoveDockerContainer(serviceKey, true);
        }
      } else {
        logger.info(
          `Docker container "${serviceKey}" is not running. Skipping cleanup step.`,
        );
      }
    }
  } else {
    logger.info('Skip deleting Docker service');
  }
}
