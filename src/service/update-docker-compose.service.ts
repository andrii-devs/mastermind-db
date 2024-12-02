import fs from 'fs-extra';
import { renderTemplate } from './render-templates.service';

export async function updateDockerCompose(
  serviceName: string,
  dbType: string,
  port: number,
  dbName: string,
) {
  const dockerComposeFile = './docker-compose.yml';
  const dockerServiceName = `${serviceName}-db`;

  if (!fs.existsSync(dockerComposeFile)) {
    throw new Error('docker-compose.yml not found!');
  }

  let dockerComposeContent = await fs.readFile(dockerComposeFile, 'utf8');

  if (dockerComposeContent.includes(dockerServiceName)) {
    console.log(
      `Service "${dockerServiceName}" already exists in docker-compose.yml.`,
    );
    return;
  }

  const newService = `
  ${dockerServiceName}:
    container_name: ${dockerServiceName}
    build:
      context: ./src/${serviceName}/docker
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: ./src/${serviceName}/docker/.env
    networks:
      - db-network
    ports:
      - "${port}:3306"
    volumes:
      - ${serviceName}-data:/var/lib/mysql
  `;

  dockerComposeContent.replace('services:', `services:\n${newService}`);
  if (!dockerComposeContent.includes('db-network')) {
    dockerComposeContent.concat('\nnetworks:\n  db-network:\nvolumes:\n');
  }

  // Add the new volume for the service
  if (!dockerComposeContent.includes('volumes:')) {
    dockerComposeContent += '\nvolumes:\n';
  }
  const volumeEntry = `  ${serviceName}-data:`;
  if (!dockerComposeContent.includes(volumeEntry)) {
    dockerComposeContent = dockerComposeContent.replace(
      'volumes:',
      `volumes:\n${volumeEntry}`,
    );
  }

  await fs.writeFile(dockerComposeFile, dockerComposeContent, 'utf8');
  console.log(
    `Updated docker-compose.yml with service "${dockerServiceName}".`,
  );
}
