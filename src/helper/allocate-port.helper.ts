import fs from 'fs-extra';

export async function allocatePort(dbType: string): Promise<number> {
  const basePorts = { MySQL: 3306, PostgreSQL: 5432, SQLite: 0 } as any;
  const basePort = basePorts[dbType] || 3306;

  let port = basePort;
  const dockerCompose = fs.existsSync('./docker-compose.yml')
    ? await fs.readFile('./docker-compose.yml', 'utf8')
    : '';

  console.log(
    'Docker compose includes: ',
    dockerCompose.includes(`${port}:${basePort}`),
  );

  console.log('Docker compose base ports: ', basePort);

  while (dockerCompose.includes(`${port}:${basePort}`)) {
    port++;
  }

  console.log(`Allocated port: ${port}`);
  return port;
}
