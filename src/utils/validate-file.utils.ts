import fs from 'fs-extra';
import { getServiceFolders } from './file-path.utils';

export const validateDockerCompose = (): boolean => {
  const filePath = './docker-compose.yml';
  if (!fs.existsSync(filePath)) {
    console.log(
      'docker-compose.yml not found. Please create it before proceeding.',
    );
    return false;
  }
  return true;
};

export const validateServiceFolders = (): boolean => {
  const folders = getServiceFolders();
  if (folders.length === 0) {
    console.log('No services found in "src". Please create a database first.');
    return false;
  }
  return true;
};
