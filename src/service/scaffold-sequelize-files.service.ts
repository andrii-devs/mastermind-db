import inquirer from 'inquirer';
import { generateSequelizeFiles } from '../helper/sequelize-files.helper';

export async function scaffoldSequelizeFiles(serviceName: string) {
  const { confirmGenateFiles } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmGenateFiles',
      message: 'Do you want generate migrations, models, seeders files ?',
    },
  ]);

  if (confirmGenateFiles) {
    const { fileTypes } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'fileTypes',
        message: 'Select which files to generate',
        choices: ['Migrations', 'Models', 'Seeders'],
      },
    ]);

    await generateSequelizeFiles(serviceName, fileTypes);
  }
}
