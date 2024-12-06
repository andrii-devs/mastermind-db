#!/usr/bin/env node

import path from 'path';
import fs from 'fs-extra';
import { Command } from 'commander';
import { printLogo } from './utils/print-logo.utils';
import { runCLI } from './cmd/cli';
import { initCLI } from './cmd/init';
import {
  checkIfConfigFileExists,
  getConfigPath,
} from './helper/sequelize-blueprint-config.helper';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'),
);
const version = packageJson.version;
const program = new Command();

program
  .name('sequelize-blueprint')
  .description('A CLI to manage Sequelize-based projects with ease.')
  .version(version, '-v, --version', 'Output the CLI version');

// Define `init` command
program
  .command('init')
  .description('Initialize the CLI with default configuration.')
  .action(async () => {
    printLogo(version);
    initCLI();
  });

// Define `wizard` command
program
  .command('start')
  .description('Run the interactive setup wizard.')
  .action(async () => {
    if (!checkIfConfigFileExists(getConfigPath())) {
      process.exit(1);
    }

    await runCLI(version);
  });

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  printLogo(version);
  program.help();
}

// Parse CLI arguments
program.parse(process.argv);
