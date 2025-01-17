import fs from 'fs-extra';
import { logger } from '../src/utils/logger.utils';
import {
  addOrUpdateProjectConfig,
  CONFIG_FILE_NAME,
  DEFAULT_ROOT_DIR,
  getConfigFilePath,
  getConfigPaths,
  getRelativePath,
  loadProjectConfig,
} from '../src/helper/mastermind-config.helper';

jest.mock('fs-extra');
jest.mock('../src/utils/logger.utils');

const mockService = 'test-service';
const mockDatabase = 'mysql';
const mockOrm = 'sequelize';
const mockConfig = {
  rootDir: DEFAULT_ROOT_DIR,
  services: {
    'test-service': {
      orm: 'sequelize',
      migrationDir: 'src/test-service/sequelize/migrations',
      modelsDir: 'src/test-service/sequelize/models',
      seedersDir: 'src/test-service/sequelize/seeders',
    },
  },
};

describe('Master mind db configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct config file path', () => {
    const configFilePath = getConfigFilePath();
    expect(configFilePath).toContain(CONFIG_FILE_NAME);
  });

  it('should load project config if file exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockConfig));

    const loadedConfig = loadProjectConfig();
    expect(loadedConfig).toEqual(mockConfig);
  });

  it('should add or update project config', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({ services: {} }),
    );

    addOrUpdateProjectConfig(mockService, mockOrm, mockDatabase);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(mockService),
      'utf8',
    );
  });

  it('should get config paths for a service', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    const paths = getConfigPaths(mockService);
    expect(paths.rootDir).toBe(DEFAULT_ROOT_DIR);
    expect(paths.modelsDir).toContain('models');
  });

  it('should log error if service is not found', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    getConfigPaths('non-existent-service');
    expect(logger.error).toHaveBeenCalledWith(
      'Configuration for service non-existent-service not found',
    );
  });

  it('should return relative path between two directories', () => {
    const relativePath = getRelativePath('/base/dir', '/base/dir/subdir');
    expect(relativePath).toBe('subdir');
  });
});
