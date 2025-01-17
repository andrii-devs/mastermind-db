import kleur from 'kleur';
import { createSpinner, Spinner } from 'nanospinner';
import {
  getConfigPaths,
  getRelativePath,
} from '../helper/mastermind-config.helper';
import path from 'path';
import { execAsync, getDynamicSeparator } from '../utils/strings.utils';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.utils';

export async function exportDatabase(
  serviceName: string,
  dbType: string,
  dbName: string,
  targetDir: string,
  spinner: Spinner,
) {
  const containerName = `${serviceName}-db`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `dump-${serviceName}-${timestamp}.sql`;
  const filePath = path.join(targetDir, fileName);

  try {
    let dumpCommand = '';

    if (dbType === 'mysql') {
      dumpCommand = `docker exec ${containerName} sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" ${dbName}' > ${filePath}`;
    } else if (dbType === 'postgresql') {
      dumpCommand = `docker exec ${containerName} pg_dump -U postgres -d ${dbName} -F c -f ${filePath}`;
    } else {
      spinner.error(
        kleur.red(
          `Unsupported database type: ${dbType}. Supported types are mysql and postgresql.`,
        ),
      );
      return;
    }

    spinner.info(kleur.cyan(`Executing: ${kleur.gray(dumpCommand)})`));
    await execAsync(`${dumpCommand} > ${filePath}`);
    spinner.success(
      kleur.green(`Backup created successfully at: ${kleur.bold(filePath!)}`),
    );

    return filePath;
  } catch (err) {
    spinner.error(kleur.red(`❌ Failed to create backup: ${err}`));
  }
}

export async function exportDatabaseDump(serviceName: string) {
  const spinner = createSpinner(
    kleur.cyan(
      `📤 Starting export of database dump for service: ${kleur.green(serviceName)}`,
    ),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const configPaths = getConfigPaths(serviceName);
  const backupsDir = path.join(
    configPaths.rootDir,
    serviceName,
    'database',
    'backups',
    'manual',
  );
  const dbName = `${serviceName}_db`;

  await fs.ensureDir(backupsDir);

  await exportDatabase(
    serviceName,
    configPaths.database,
    dbName,
    backupsDir,
    spinner,
  );
}

export async function resetDatabase(serviceName: string, dbType: string) {
  const { confirmReset } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmReset',
      message: `⚠️  This operation will delete all data and tables in the database. Are you sure you want to proceed?`,
      default: false,
    },
  ]);

  if (!confirmReset) {
    logger.info('Reset operation canceled by the user.');
    return;
  }

  const spinner = createSpinner(
    kleur.cyan(`Resetting database for service: ${serviceName}`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const dockerComposePath = path.resolve(process.cwd(), 'docker-compose.yml');
    if (!fs.existsSync(dockerComposePath)) {
      spinner.error(
        kleur.red(
          `No docker-compose.yml file found. Make sure you're in the correct directory for service ${serviceName}.`,
        ),
      );
      return;
    }

    const dbContainerName = `${serviceName}-db`;
    const dbName = `${serviceName}_db`;

    switch (dbType) {
      case 'mysql':
        await resetMySQLDatabase(dbContainerName, dbName, spinner);
        break;
      case 'postgres':
        await resetPostgresDatabase(dbContainerName, dbName, spinner);
        break;
      default:
        spinner.error(
          kleur.red(
            `Unsupported database type: ${dbType}. Supported types are mysql and postgresql.`,
          ),
        );
        break;
    }
  } catch (err) {
    spinner.error(
      kleur.red(`Failed to reset database for ${serviceName}: ${err}`),
    );
  }
}

async function resetMySQLDatabase(
  containerName: string,
  dbName: string,
  spinner: Spinner,
) {
  spinner.info(
    kleur.cyan(`Resetting MySQL database in container ${containerName}`),
  );

  const dropCommand = `
  docker exec ${containerName} sh -c '
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "
    SET FOREIGN_KEY_CHECKS = 0;
    DROP DATABASE IF EXISTS \\\`${dbName}\\\`;
    CREATE DATABASE \\\`${dbName}\\\`;
    SET FOREIGN_KEY_CHECKS = 1;
  "'
`;

  spinner.info(kleur.cyan(`Executing: ${kleur.gray(dropCommand)}`));

  await execAsync(dropCommand);
  spinner.success(
    kleur.green(
      `MySQL database reset successfully in container ${containerName}`,
    ),
  );
}

async function resetPostgresDatabase(
  containerName: string,
  dbName: string,
  spinner: Spinner,
) {
  spinner.info(
    kleur.cyan(`Resetting PostgreSQL database in container ${containerName}`),
  );

  const dropCommand = `
  docker exec ${containerName} sh -c '
  psql -U postgres -c "
    DROP DATABASE IF EXISTS \\"${dbName}\\";
    CREATE DATABASE \\"${dbName}\\";
  "'
`;

  spinner.info(kleur.cyan(`Executing: ${kleur.gray(dropCommand)}`));

  await execAsync(dropCommand);
  spinner.success(
    kleur.green(
      `PostgreSQL database reset successfully in container ${containerName}`,
    ),
  );
}

export async function importDatabaseDump(
  serviceName: string,
  dbType: string,
  dbName: string,
) {
  const containerName = `${serviceName}-db`;
  const spinner = createSpinner(
    kleur.cyan(`Starting database dump process...`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  spinner.stop();
  const sqlFilePath = await navigateAndSelectSQLFile();
  if (!sqlFilePath) {
    spinner.warn(`No file selected. Operation cancelled.`);
    return;
  }

  spinner.info(
    kleur.cyan(
      `📄 Selected file: ${getRelativePath(process.cwd(), sqlFilePath)}`,
    ),
  );

  const { editFile } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'editFile',
      message: `Would you like to edit "${path.basename(sqlFilePath)}" before importing?`,
      default: false,
    },
  ]);

  if (editFile) {
    await editSQLFileContent(sqlFilePath, spinner);
  }

  spinner.start();
  try {
    const createDbCommand =
      dbType === 'mysql'
        ? `docker exec ${containerName} sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \\\` ${dbName}\\\`;"'`
        : `docker exec ${containerName} psql -U postgres -c "CREATE DATABASE ${dbName};"`;

    spinner.info(kleur.cyan(`Ensuring database ${dbName} exists...`));
    await execAsync(createDbCommand);

    const importCommand =
      dbType === 'mysql'
        ? `  docker exec -i ${containerName} sh -c '
      mysql -uroot -p"$MYSQL_ROOT_PASSWORD" \`${dbName}\`
      ' < ${getRelativePath(process.cwd(), sqlFilePath)}
    `
        : `docker exec -i ${containerName} psql -U postgres -d ${dbName} -f "${getRelativePath(process.cwd(), sqlFilePath)}"`;
    spinner.info(`Executing: ${kleur.gray(importCommand.trim())}`);

    await execAsync(importCommand);
    spinner.success(
      kleur.green(
        `Successfully imported data from "${path.basename(sqlFilePath)} in the database "${dbName}"`,
      ),
    );
  } catch (err) {
    spinner.error(kleur.red(`Failed to import data: ${err}`));
  }
}

async function editSQLFileContent(selectedFile: string, spinner: Spinner) {
  try {
    const fileContent = await fs.readFile(selectedFile, 'utf8');
    const { updateContent } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'updateContent',
        message: `Edit the content of ${path.basename(selectedFile)} (Save and close to continue):`,
        default: fileContent,
      },
    ]);

    await fs.writeFile(selectedFile, updateContent, 'utf8');
    spinner.info(
      kleur.cyan(`Updated and saved ${path.basename(selectedFile)}`),
    );
  } catch (err) {
    spinner.error(kleur.red(`Failed to edit the file ${err}`));
  }
}

async function navigateAndSelectSQLFile() {
  let currentDir = process.cwd();

  while (true) {
    try {
      const filesAndDirs = await fs.readdir(currentDir);
      const choices = filesAndDirs
        .map((item) => {
          const fullPath = path.join(currentDir, item);
          const isDir = fs.lstatSync(fullPath).isDirectory();
          return {
            name: isDir ? `📁 ${item}` : `📄 ${item}`,
            value: fullPath,
            disabled: !isDir && path.extname(item) !== '.sql', // Only .sql files are selectable
          };
        })
        .concat([
          { name: '🔼 Go up one level', value: '..', disabled: false },
          { name: '❌ Cancel', value: 'cancel', disabled: false },
        ]);

      const { selectedPath } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPath',
          message: `Navigate and select an SQL file (Current directory: ${kleur.cyan(currentDir)}):`,
          choices,
          loop: false,
        },
      ]);

      if (selectedPath === 'cancel') return null;
      if (selectedPath === '..') {
        currentDir = path.dirname(currentDir);
      } else if ((await fs.lstat(selectedPath)).isDirectory()) {
        currentDir = selectedPath;
      } else {
        return selectedPath;
      }
    } catch (err) {
      logger.error(`Navigation Select SQL file error: ${err}`);
      return null;
    }
  }
}
