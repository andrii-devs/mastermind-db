import { logger } from '../utils/logger.utils';
import {
  DEFAULT_ROOT_DIR,
  loadProjectConfig,
  saveProjectConfig,
} from '../helper/mastermind-config.helper';
export function initCLI(): void {
  const projectConfig = loadProjectConfig();
  let { rooDir } = loadProjectConfig();
  if (rooDir) {
    logger.warn(
      `Configuration file already exists ${rooDir}. To change it choose configuration into CLI menu!`,
    );
  } else {
    projectConfig.rootDir = DEFAULT_ROOT_DIR;
    saveProjectConfig(projectConfig);
    logger.info('Initialized .mastermindrc with default configuration.');
  }
}
