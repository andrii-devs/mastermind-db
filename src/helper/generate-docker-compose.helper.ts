import fs from 'fs-extra';

export async function generateDockerCompose() {
  if (!fs.existsSync('./docker-compose.yml')) {
    console.log('No docker-compose.yml found. Creating a new one...');
    fs.writeFileSync(
      './docker-compose.yml',
      'version: "3.8"\nservices:\nnetworks:\n  db-network:\nvolumes:\n',
      'utf8',
    );
  }
}
