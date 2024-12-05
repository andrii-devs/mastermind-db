import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs-extra';

export const execAsync = promisify(exec);

export async function runSequelizeCommand(command: string, path: string) {
  try {
    console.log(`Running: npx sequelize-cli ${command} in ${path}`);
    const { stdout } = await execAsync(`npx sequelize-cli ${command}`, {
      cwd: path,
    });
    console.log(stdout);
  } catch (err) {
    console.error(`Error running Sequelize command: ${err}`);
  }
}

export function getFilesInFolder(
  folderPath: string,
  extension: string,
): string[] {
  if (!fs.existsSync(folderPath)) return [];
  return fs
    .readdirSync(folderPath)
    .filter((file: any) => file.endsWith(extension));
}
