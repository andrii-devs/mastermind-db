import fs from 'fs-extra';
import { generateDockerCompose } from '../helper/generate-docker-compose.helper';

export async function updateDockerCompose(
  serviceName: string,
  dbType: string,
  port: number,
  dbName: string,
) {
  const dockerComposeFile = './docker-compose.yml';
  const dockerServiceName = `${serviceName}-db`;

  // Ensure docker-compose.yml exists
  if (!fs.existsSync(dockerComposeFile)) {
    generateDockerCompose();
  }

  let dockerComposeContent = await fs.readFile(dockerComposeFile, 'utf8');

  // Check if the service already exists
  if (dockerComposeContent.includes(dockerServiceName)) {
    console.log(
      `Service "${dockerServiceName}" already exists in docker-compose.yml.`,
    );
    return;
  }

  // Define the new service
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

  // Add the new service under "services:"
  dockerComposeContent = dockerComposeContent.replace(
    'services:',
    `services:\n${newService}`,
  );

  // Ensure "networks:" exists
  if (!dockerComposeContent.includes('networks:')) {
    dockerComposeContent += '\nnetworks:\n  db-network:\n';
  }

  // Ensure "volumes:" exists and add the new volume
  if (!dockerComposeContent.includes('volumes:')) {
    dockerComposeContent += '\nvolumes:\n';
  }
  const volumeEntry = `  ${serviceName}-data:`;
  if (!dockerComposeContent.includes(volumeEntry)) {
    dockerComposeContent = dockerComposeContent.replace(
      'volumes:\n',
      `volumes:\n${volumeEntry}\n`,
    );
  }

  // Write the updated content back to docker-compose.yml
  await fs.writeFile(dockerComposeFile, dockerComposeContent, 'utf8');
  console.log(
    `Updated docker-compose.yml with service "${dockerServiceName}" and volume "${serviceName}-data}".`,
  );
}
