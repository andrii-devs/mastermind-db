#!/usr/bin/env node

import path from 'path';
import fs from 'fs-extra';
import { Command } from 'commander';
import { printLogo } from './utils/print-logo.utils';
import { runCLI } from './cmd/cli';
import { initCLI } from './cmd/init';
import { initConfigIfNotExists } from './service/check-configration-file.service';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'),
);
const version = packageJson.version;
const program = new Command();

program
  .name('mastermind-db')
  .description('A CLI to manage databases and ORM-based projects with ease.')
  .version(version, '-v, --version', 'Output the Master Mind DB version');

program
  .command('init')
  .description('Initialize Master Mind DB with default configuration.')
  .action(async () => {
    printLogo(version);
    initCLI();
  });

program
  .command('start')
  .description('Run the interactive Master Mind DB.')
  .action(async () => {
    await initConfigIfNotExists(version);
    await runCLI(version);
  });

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  printLogo(version);
  program.help();
}

// Parse CLI arguments
program.parse(process.argv);
