import fs from 'fs-extra';
import yaml from 'js-yaml';
import { scaffoldDockerCompose } from '../src/service/scaffold-docker-compose.service';
jest.mock('fs-extra');

describe('scaffoldDockerComposer', () => {
  const mockComposeFile = './docker-compose.yml';
  const existingComposeContent = yaml.dump({
    version: '3.8',
    services: {
      existingService: {
        container_name: 'existingService-db',
        build: {
          context: './src/existingService/docker',
          dockerfile: 'Dockerfile',
        },
        restart: 'unless-stopped',
        env_file: './src/existingService/docker/.env',
        networks: ['db-network'],
        ports: ['3306:3306'],
        volumes: ['existingService-data:/var/lib/mysql'],
      },
    },
    networks: { 'db-network': {} },
    volumes: { 'existingService-data': {} },
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should create a new service and volume in docker-compose.yml', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFile as unknown as jest.Mock).mockResolvedValueOnce(
      existingComposeContent,
    );
    const writeMock = jest
      .spyOn(fs, 'writeFile')
      .mockResolvedValue(undefined as never);

    await scaffoldDockerCompose('newService', 'mysql', 3306);

    const writtenContent = yaml.load(
      writeMock.mock.calls[0][1] as string,
    ) as Record<string, any>;

    expect(writtenContent.services).toHaveProperty('newService-db');
    expect(writtenContent.volumes).toHaveProperty('newService-data');
    expect(writtenContent.services['newService-db']).toMatchObject({
      container_name: 'newService-db',
      build: {
        context: './src/newService/docker',
        dockerfile: 'Dockerfile',
      },
      restart: 'unless-stopped',
      env_file: './src/newService/docker/.env',
      networks: ['db-network'],
      ports: ['3306:3306'],
      volumes: ['newService-data:/var/lib/mysql'],
    });
  });

  it('should not duplicate an existing service or volume', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFile as unknown as jest.Mock).mockResolvedValueOnce(
      existingComposeContent,
    );

    const writeMock = jest
      .spyOn(fs, 'writeFile')
      .mockResolvedValue(undefined as never);

    await scaffoldDockerCompose('existingService', 'mysql', 3306);

    expect(writeMock).not.toHaveBeenCalledWith(
      mockComposeFile,
      expect.stringContaining('existingService-db'),
    );

    expect(writeMock).not.toHaveBeenCalledWith(
      mockComposeFile,
      expect.stringContaining('existingService-data:'),
    );
  });

  it('should create a new docker-compose.yml if does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const writeMock = jest
      .spyOn(fs, 'writeFile')
      .mockResolvedValue(undefined as never);

    await scaffoldDockerCompose('secondService', 'mysql', 3307);

    const writtenContent = yaml.load(
      writeMock.mock.calls[0][1] as string,
    ) as Record<string, any>;

    expect(writtenContent.services).toHaveProperty('secondService-db');
    expect(writtenContent.volumes).toHaveProperty('secondService-data');
    expect(writtenContent.services['secondService-db']).toMatchObject({
      container_name: 'secondService-db',
      build: {
        context: './src/secondService/docker',
        dockerfile: 'Dockerfile',
      },
      restart: 'unless-stopped',
      env_file: './src/secondService/docker/.env',
      networks: ['db-network'],
      ports: ['3307:3306'],
      volumes: ['secondService-data:/var/lib/mysql'],
    });
  });
});
