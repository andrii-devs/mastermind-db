import kleur from 'kleur';
import { createSpinner, Spinner } from 'nanospinner';
import { getConfigPaths } from '../helper/mastermind-config.helper';
import path from 'path';
import { execAsync, getDynamicSeparator } from '../utils/strings.utils';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.utils';

export async function exportDatabaseDump(serviceName: string) {
  const spinner = createSpinner(
    kleur.cyan(
      `📤 Starting export of database dump for service: ${kleur.green(serviceName)}`,
    ),
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const configPaths = getConfigPaths(serviceName);
  const outputDir = path.join(
    configPaths.rootDir,
    'database',
    serviceName,
    'backups',
  );
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpFilePath = path.join(
    outputDir,
    `dump-${serviceName}-${timestamp}.sql`,
  );

  await fs.ensureDir(outputDir);

  const dockerComposePath = path.resolve(process.cwd(), 'docker-compose.yml');
  if (!fs.existsSync(dockerComposePath)) {
    spinner.error(
      kleur.red(
        `No docker-compose.yml file found. Make sure you're in the correct directory for service ${serviceName}.`,
      ),
    );
    return;
  }

  try {
    let dumpCommand = '';
    const dbContainerName = `${serviceName}-db`;

    if (configPaths.database === 'mysql') {
      dumpCommand = `docker exec ${dbContainerName} sh -c 'exec mysqldump --all-databases -uroot -p"$MYSQL_ROOT_PASSWORD"'`;
    } else if (configPaths.database === 'postgresql') {
      dumpCommand = `docker exec ${dbContainerName} sh -c 'exec pg_dumpall -U postgres'`;
    } else {
      spinner.error(
        kleur.red(
          `Unsupported database type: ${configPaths.database}. Supported types are mysql and postgresql.`,
        ),
      );
      return;
    }

    spinner.info(kleur.cyan(`Executing: ${kleur.gray(dumpCommand)})`));
    await execAsync(`${dumpCommand} > ${dumpFilePath}`);

    spinner.success(
      kleur.green(
        `Database dump exported successfully: ${kleur.bold(dumpFilePath)}`,
      ),
    );
  } catch (err) {
    spinner.error(kleur.red(`❌ Failed to export database dump: ${err}`));
  }
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
  );
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
