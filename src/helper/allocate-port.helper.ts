import fs from 'fs-extra';
import net from 'net';
import { createSpinner, Spinner } from 'nanospinner';
import kleur from 'kleur';

export async function allocatePort(dbType: string): Promise<number> {
  const basePorts = { MySQL: 3306, PostgreSQL: 5432, SQLite: 0 } as any;
  const basePort = basePorts[dbType] || 3306;

  const spinner = createSpinner(
    kleur.cyan(`Initiating allocating port ${basePort}`),
  ).start();

  await new Promise((resolve) => setTimeout(resolve, 1500));

  let port = basePort;
  const dockerCompose = fs.existsSync('./docker-compose.yml')
    ? await fs.readFile('./docker-compose.yml', 'utf8')
    : '';

  while (
    (await isPortInUse(port, spinner)) ||
    dockerCompose.includes(`${port}:${basePort}`)
  ) {
    port++;
  }

  spinner.success(kleur.green(`Allocated port: ${port} for db ${dbType}`));

  return port;
}

async function isPortInUse(port: number, spinner: Spinner): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      spinner.info(kleur.cyan(`Port ${port} is already in use`));
      resolve(true);
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}
