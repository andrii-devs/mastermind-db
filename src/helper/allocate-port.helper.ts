import fs from 'fs-extra';
import { logger } from '../utils/logger.utils';

export async function allocatePort(dbType: string): Promise<number> {
  const basePorts = { MySQL: 3306, PostgreSQL: 5432, SQLite: 0 } as any;
  const basePort = basePorts[dbType] || 3306;

  let port = basePort;
  const dockerCompose = fs.existsSync('./docker-compose.yml')
    ? await fs.readFile('./docker-compose.yml', 'utf8')
    : '';

  while (dockerCompose.includes(`${port}:${basePort}`)) {
    port++;
  }

  logger.info(`Allocated port: ${port} for db ${dbType}`);
  return port;
}
