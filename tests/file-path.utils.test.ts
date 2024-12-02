import {
  getConfig,
  getRootDir,
} from '../src/helper/generate-sequelize-config.helper';
import fs from 'fs-extra';

jest.mock('fs-extra');

describe('file path utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve root directory from configuration file', () => {
    const mockConfig = { rootDir: './customDir' };
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockConfig));

    const rootDir = getRootDir();
    expect(rootDir).toContain('customDir');
  });
});
