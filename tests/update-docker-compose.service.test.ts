import { updateDockerCompose } from '../src/service/update-docker-compose.service';
import fs from 'fs-extra';

jest.mock('fs-extra');

describe('updateDockerCompose', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should add a new service and volume to docker-compose.yml', async () => {
    const mockComposeContent = `
version: "3.8"
services:

networks:
  db-network:

volumes:
  auth-data:
`;
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    (fs.readFile as unknown as jest.Mock).mockResolvedValue(mockComposeContent);

    const writeMock = jest
      .spyOn(fs, 'writeFile')
      .mockImplementation(async () => {});

    await updateDockerCompose('authtest', 'mysql', 3307, 'authtest_db');

    expect(writeMock).toHaveBeenCalledWith(
      './docker-compose.yml',
      expect.stringContaining('authtest-db:'),
      'utf8',
    );
    expect(writeMock).toHaveBeenCalledWith(
      './docker-compose.yml',
      expect.stringContaining('authtest-data:'),
      'utf8',
    );
  });

  it('should not duplicate an existing service or volume', async () => {
    const mockComposeContent = `
version: "3.8"
services:
  auth-db:
    container_name: auth-db

networks:
  db-network:

volumes:
  auth-data:
`;
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFile as unknown as jest.Mock).mockResolvedValue(mockComposeContent);

    const writeMock = jest
      .spyOn(fs, 'writeFile')
      .mockImplementation(async () => {});

    await updateDockerCompose('auth', 'mysql', 3306, 'auth_db');

    expect(writeMock).not.toHaveBeenCalledWith(
      './docker-compose.yml',
      expect.stringContaining('auth-db:'),
    );
    expect(writeMock).not.toHaveBeenCalledWith(
      './docker-compose.yml',
      expect.stringContaining('auth-data:'),
    );
  });
});
