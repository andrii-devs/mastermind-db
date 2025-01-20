import path from 'path';
import {
  getConfigPaths,
  getRelativePath,
} from '../helper/mastermind-config.helper';
import { createSpinner, Spinner } from 'nanospinner';
import kleur from 'kleur';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { execAsync } from '../utils/strings.utils';
export async function enforceBackupRetention(
  serviceName: string,
  retentionPeriod: number,
  spinner: Spinner,
) {
  const configPaths = getConfigPaths(serviceName);
  const backupDir = path.join(configPaths.rootDir, serviceName, 'backups');

  spinner.info(kleur.cyan(`Checking backups in: ${backupDir}`));

  if (!(await fs.pathExists(backupDir))) {
    spinner.warn(kleur.yellow(`No backups directory found in ${backupDir}`));
    return;
  }

  const now = Date.now();
  const retentionThreshold = retentionPeriod * 24 * 60 * 60 * 1000;

  const backupsFiles = fs.readdirSync(backupDir);

  const deletions: string[] = [];

  for (const file of backupsFiles) {
    const filePath = path.join(backupDir, file);
    const stats = await fs.stat(filePath);

    if (now - stats.mtimeMs > retentionThreshold) {
      await fs.remove(filePath);
      deletions.push(filePath);
      spinner.info(kleur.cyan(`Deleted backup file: ${filePath}`));
    }
  }

  if (deletions.length === 0) {
    spinner.info(
      kleur.cyan(
        `No backups executed the retention period of ${retentionPeriod} days`,
      ),
    );
  } else {
    spinner.success(
      kleur.green(
        `Retention applied: Deleted ${deletions.length} backups that were older than ${retentionPeriod} days`,
      ),
    );
  }
}

export async function viewBackupCronStatus(serviceName: string) {
  const spinner = createSpinner(kleur.cyan(`Retrieving cron jobs...`)).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    spinner.stop();
    const { stdout } = await execAsync('crontab -l');

    if (!stdout.trim()) {
      spinner.warn(`No cron jobs found for the current user`);
      return;
    }

    const cronJobs = stdout
      .split('\n')
      .filter((job) => job.includes(serviceName));

    if (cronJobs.length === 0) {
      spinner.warn(`No cron jobs for the service "${serviceName}"`);
    } else {
      console.log(kleur.green(`📋 Current Cron Jobs for "${serviceName}":`));
      console.log(kleur.cyan('------------------------'));
      cronJobs.forEach((job, index) => {
        console.log(`${index + 1}. ${kleur.gray(job.trim())}`);
      });
      console.log(kleur.cyan('------------------------'));
    }
  } catch (err) {
    spinner.error(kleur.red(`Error retrieving cron jobs: ${err}`));
  }
}

export async function configureSystemCronBackup(
  serviceName: string,
  dbType: string,
  dbName: string,
) {
  const spinner = createSpinner(
    kleur.cyan(`🛠️ Configuring system-level backup for "${serviceName}"...`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Define backup directory

  const configPaths = getConfigPaths(serviceName);
  const backupDir = path.join(
    configPaths.rootDir,
    serviceName,
    'database',
    'backups',
    'scheduled',
  );

  await fs.ensureDir(backupDir);
  spinner.stop();

  const { frequency } = await inquirer.prompt([
    {
      type: 'list',
      name: 'frequency',
      message: 'How often do you want to back up the database?',
      choices: [
        { name: '⏰ Every Hour', value: '0 * * * *' },
        { name: '🌙 Daily at Midnight', value: '0 0 * * *' },
        { name: '📅 Weekly (Sunday at Midnight)', value: '0 0 * * 0' },
        { name: '🔧 Custom Cron Expression (Advanced)', value: 'custom' },
      ],
    },
  ]);

  let cronExpression = frequency;
  if (frequency === 'custom') {
    const { customFrequency } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customFrequency',
        message: 'Enter your custom cron expression:',
        validate: (input) => {
          const cronRegex =
            /^(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)$/;
          return cronRegex.test(input)
            ? true
            : 'Invalid cron expression! Please follow the format: "min hour day month day-of-week". Example for every hour ("0 * * * *")';
        },
      },
    ]);
    cronExpression = customFrequency;
  }

  const config = {
    service: serviceName,
    frequency: cronExpression,
    retentionPeriod: 0,
    backupDir,
  };

  const configFilePath = path.join(backupDir, 'cron-config.json');
  spinner.info(
    kleur.cyan(
      `Ensure backup config file exists: ${kleur.bold(configFilePath)}`,
    ),
  );
  await fs.ensureDir(backupDir);
  await fs.writeJson(configFilePath, config, { spaces: 2 });

  const backupScriptDir = path.join(
    configPaths.rootDir,
    serviceName,
    'database',
    'scripts',
  );
  await fs.ensureDir(backupScriptDir);

  const scriptPath = await ensureBackupScriptExists(backupScriptDir, spinner);
  const cronCommand = `${cronExpression} export MYSQL_ROOT_PASSWORD=root_password && bash ${path.resolve(
    scriptPath,
  )} ${serviceName} ${dbType} ${dbName} ${path.resolve(
    backupDir,
  )} | # Backup for ${serviceName}`;

  try {
    spinner.info(kleur.cyan(`Executing command: ${kleur.gray(cronCommand)}`));
    await execAsync(`(crontab -l ; echo "${cronCommand}") | crontab -`);
    spinner.success(kleur.green(`Cron job added successfully!`));
  } catch (err) {
    spinner.error(kleur.red(`Failed to add cron job: ${err}`));
  }
}

export async function removeBackupCronJob(serviceName: string) {
  const spinner = createSpinner(
    kleur.cyan(`Removing cron job for ${serviceName}`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const { stdout } = await execAsync('crontab -l');
    if (!stdout.trim()) {
      spinner.warn(kleur.yellow(`No cron jobs found for current user.`));
      return;
    }

    const cronJobs = stdout
      .split('\n')
      .filter((job) => job.includes(serviceName));

    if (cronJobs.length === 0) {
      spinner.warn(
        `No backup cron jobs found for the service "${serviceName}".`,
      );
      return;
    }

    const cronJobsList = cronJobs.map((job, index) => ({
      name: `📋 Job ${index + 1}: ${kleur.gray(job)}`,
      value: job,
    }));
    cronJobsList.push({
      name: '🔥 Delete All Jobs',
      value: 'deleteAll',
    });

    spinner.stop();

    const { selectedJob } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedJob',
        message: 'Select the cron job you want to remove:',
        choices: cronJobsList,
      },
    ]);

    if (selectedJob === 'deleteAll') {
      const { confirmDeleteAll } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDeleteAll',
          message: `Are you sure you want to delete all backup cron jobs for "${serviceName}"? This action cannot be undone.`,
          default: false,
        },
      ]);

      if (!confirmDeleteAll) {
        spinner.warn(kleur.yellow('Operation cancelled.'));
        return;
      }

      const updatedCronJobs = stdout
        .split('\n')
        .filter((job) => !job.includes(`# Backup for ${serviceName}`))
        .join('\n')
        .trim();

      if (updatedCronJobs) {
        await execAsync(`echo "${updatedCronJobs}" | crontab -`);
      } else {
        await execAsync('crontab -r');
      }

      spinner.success(
        kleur.green(
          `Successfully removed all backup cron jobs for "${serviceName}".`,
        ),
      );
    } else {
      const updatedCronJobs = stdout
        .split('\n')
        .filter((job) => job !== selectedJob)
        .join('\n')
        .trim();

      if (updatedCronJobs) {
        await execAsync(`echo "${updatedCronJobs}" | crontab -`);
      } else {
        await execAsync('crontab -r');
      }

      spinner.success(
        kleur.green(
          `Successfully removed the selected cron job for "${serviceName}".`,
        ),
      );
    }
  } catch (err) {
    spinner.error(kleur.red(`Failed to remove cron job for ${serviceName}`));
  }
}

async function ensureBackupScriptExists(scriptDir: string, spinner: Spinner) {
  const scriptPath = path.join(process.cwd(), scriptDir, 'backup.sh');
  if (await fs.pathExists(scriptPath)) {
    spinner.info(
      kleur.cyan(
        `Backup script already exists: ${kleur.bold(getRelativePath(process.cwd(), scriptPath))}`,
      ),
    );
    return scriptPath;
  }

  spinner.info(
    kleur.cyan(
      `Creating backup script at: ${kleur.bold(getRelativePath(process.cwd(), scriptPath))}`,
    ),
  );
  const scriptContent = `
#!/bin/bash

SERVICE_NAME=$1
DB_TYPE=$2
DB_NAME=$3
BACKUP_DIR=$4
RETENTION_PERIOD=$5

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/dump-$SERVICE_NAME-$TIMESTAMP.sql"

echo "Starting backup for service: $SERVICE_NAME"

# Export database
if [ "$DB_TYPE" == "mysql" ]; then
  docker exec $SERVICE_NAME-db sh -c "mysqldump -uroot -p\"$MYSQL_ROOT_PASSWORD\" $DB_NAME" > "$BACKUP_FILE"
  if [ $? -ne 0 ]; then
    echo "Error: MySQL backup failed for service: $SERVICE_NAME"
    exit 1
  fi
elif [ "$DB_TYPE" == "postgres" ]; then
  docker exec $SERVICE_NAME-db sh -c "pg_dump -U postgres $DB_NAME" > "$BACKUP_FILE"
  if [ $? -ne 0 ]; then
    echo "Error: PostgreSQL backup failed for service: $SERVICE_NAME"
    exit 1
  fi
else
  echo "Error: Unsupported database type: $DB_TYPE"
  exit 1
fi

# Retention logic
if [ "$RETENTION_PERIOD" -gt 0 ]; then
  echo "Applying retention policy: Deleting files older than $RETENTION_PERIOD days."
  find "$BACKUP_DIR" -type f -mtime +$RETENTION_PERIOD -exec rm {} \;
  if [ $? -eq 0 ]; then
    echo "Old backups older than $RETENTION_PERIOD days were deleted successfully."
  else
    echo "Warning: Failed to delete old backups in $BACKUP_DIR"
  fi
else
  echo "Retention period is set to 0. Skipping cleanup."
fi

echo "Backup completed successfully for service: $SERVICE_NAME"
`;

  await fs.ensureDir(path.dirname(scriptPath));
  await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });
  spinner.info(kleur.cyan(`Backup script created successfully.`));
  return scriptPath;
}

export async function configureDataPurge(serviceName: string) {
  const spinner = createSpinner(
    kleur.cyan(`Configuring data purge for ${serviceName}`),
  ).start();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const configPaths = getConfigPaths(serviceName);
  const configFilePath = path.join(
    configPaths.rootDir,
    serviceName,
    'database',
    'backups',
    'scheduled',
    'cron-config.json',
  );

  if (!(await fs.pathExists(configFilePath))) {
    spinner.error(
      kleur.red(`Backup routing is not configured. Configure backups first.`),
    );
    return;
  }

  spinner.stop();

  const { retentionPeriod } = await inquirer.prompt([
    {
      type: 'input',
      name: 'retentionPeriod',
      message:
        'Enter the retention period in days (e.g., backups older than this will be deleted):',
      validate: (input) => {
        const days = parseInt(input.trim());
        return !isNaN(days) && days > 0
          ? true
          : 'Please enter a valid number greater than 0.';
      },
    },
  ]);
  spinner.start();

  const config = await fs.readJson(configFilePath);
  config.retentionPeriod = parseInt(retentionPeriod, 10);

  await fs.writeJson(configFilePath, config, { spaces: 2 });

  spinner.info(
    kleur.cyan(`Retention period updated to: ${retentionPeriod} days.`),
  );

  const scriptPath = path.join(
    configPaths.rootDir,
    serviceName,
    'database',
    'scripts',
    'backup.sh',
  );
  const cronCommand = `${config.frequency} bash ${path.resolve(
    scriptPath,
  )} ${serviceName} ${configPaths.database} ${serviceName}_db ${config.backupDir} ${config.retentionPeriod} | # Backup for ${serviceName}`;

  try {
    await execAsync(
      `(crontab -l | grep -v "# Backup for ${serviceName}") | crontab -`,
    );
    await execAsync(`(crontab -l ; echo "${cronCommand}") | crontab -`);
    spinner.success(kleur.green(`Cron job updated successfully.`));
  } catch (err) {
    spinner.error(kleur.red(`Failed to update cron job: ${err}`));
  }
}

export async function manualPurge(serviceName: string) {
  const spinner = createSpinner(
    kleur.cyan(`🧹 Starting manual purge for "${serviceName}"...`),
  ).start();

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const configPaths = getConfigPaths(serviceName);
  const configFilePath = path.join(
    configPaths.rootDir,
    serviceName,
    'database',
    'backups',
    'scheduled',
    'cron-config.json',
  );

  if (!(await fs.pathExists(configFilePath))) {
    spinner.error(
      kleur.red(`Configuration file not found at: ${configFilePath}`),
    );
    return;
  }

  const config = await fs.readJson(configFilePath);
  const retentionPeriod = config.retentionPeriod;
  const backupDir = config.backupDir;

  if (!retentionPeriod || retentionPeriod <= 0) {
    spinner.warn(
      kleur.yellow(
        `Retention period is not set or is 0. No files will be deleted.`,
      ),
    );
    return;
  }

  spinner.info(
    kleur.cyan(
      `Applying retention policy: Deleting files older than ${retentionPeriod} days in ${backupDir}`,
    ),
  );

  if (!(await fs.pathExists(backupDir))) {
    spinner.warn(kleur.yellow(`Backup directory does not exist: ${backupDir}`));
    return;
  }

  const now = Date.now();
  const retentionThreshold = retentionPeriod * 24 * 60 * 60 * 1000;
  const files = await fs.readdir(backupDir);

  const deletions = [];

  for (const file of files) {
    const filePath = path.join(backupDir, file);
    const stats = await fs.stat(filePath);

    if (now - stats.mtimeMs > retentionThreshold) {
      await fs.remove(filePath);
      deletions.push(filePath);
      spinner.info(kleur.cyan(`Deleted backup file: ${filePath}`));
    }
  }

  if (deletions.length === 0) {
    spinner.success(
      kleur.green(
        `No backups older than ${retentionPeriod} days were found to delete.`,
      ),
    );
  } else {
    spinner.success(
      kleur.green(`Retention applied: Deleted ${deletions.length} backup(s).`),
    );
  }
}
