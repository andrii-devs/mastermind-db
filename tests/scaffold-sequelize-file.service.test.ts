import { scaffoldSequelizeTemplate } from '../src/operations/sequelize-files.operation';
import fs from 'fs-extra';
import { renderTemplate } from '../src/helper/render-templates.helper';
import path from 'path';
import { getConfigPaths } from '../src/helper/mastermind-config.helper';

jest.mock('fs-extra');
jest.mock('../src/helper/render-templates.helper');

const mockServiceName = 'test-service';
const mockRootDir = 'src';
const mockConfigPaths = {
  rootDir: mockRootDir,
  orm: 'sequelize',
  migrationsDir: path.join(
    mockRootDir,
    mockServiceName,
    'sequelize',
    'migrations',
  ),
  modelsDir: path.join(mockRootDir, mockServiceName, 'sequelize', 'models'),
  seedersDir: path.join(mockRootDir, mockServiceName, 'sequelize', 'seeders'),
};

jest.mock('../src/helper/mastermind-config.helper', () => ({
  getConfigPaths: jest.fn(() => mockConfigPaths),
}));

describe('scaffoldSequelizeTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should scaffold Sequelize template successfully', async () => {
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
    (renderTemplate as jest.Mock).mockResolvedValue(undefined);

    await scaffoldSequelizeTemplate(mockServiceName);

    // Check directory creation
    expect(fs.ensureDir).toHaveBeenCalledWith(mockConfigPaths.migrationsDir);
    expect(fs.ensureDir).toHaveBeenCalledWith(mockConfigPaths.modelsDir);
    expect(fs.ensureDir).toHaveBeenCalledWith(mockConfigPaths.seedersDir);

    // Check templates rendering
    expect(renderTemplate).toHaveBeenCalledTimes(2);
    expect(renderTemplate).toHaveBeenCalledWith(
      'sequelize/config/config.ts.ejs',
      path.join(
        mockConfigPaths.rootDir,
        mockServiceName,
        'sequelize',
        'config.ts',
      ),
      {},
      expect.anything(),
    );

    expect(renderTemplate).toHaveBeenCalledWith(
      '/sequelize/sequelizerc.ejs',
      path.join(
        mockConfigPaths.rootDir,
        mockServiceName,
        'sequelize',
        '.sequelizerc',
      ),
      {},
      expect.anything(),
    );
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to scaffold');
    (fs.ensureDir as jest.Mock).mockRejectedValue(error);

    await expect(scaffoldSequelizeTemplate(mockServiceName)).rejects.toThrow(
      'Failed to scaffold',
    );
  });
});
