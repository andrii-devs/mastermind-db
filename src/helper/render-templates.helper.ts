import ejs from 'ejs';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.utils';
import { createSpinner } from 'nanospinner';
import { getRelativePath } from './mastermind-config.helper';
import kleur from 'kleur';

export async function renderTemplate(
  templatePath: string,
  outputPath: string,
  data: Record<string, any>,
  spinner?: ReturnType<typeof createSpinner>,
) {
  const resolvedTemplatePath = path.resolve(
    __dirname,
    templatePath.startsWith('templates')
      ? templatePath
      : `../templates/${templatePath}`,
  );

  try {
    const templateContent = await fs.readFile(resolvedTemplatePath, 'utf8');
    const renderedContent = ejs.render(templateContent, data);
    await fs.outputFile(outputPath, renderedContent, 'utf8');

    const relativeOutputPath = getRelativePath(process.cwd(), outputPath);
    spinner?.stop();
    spinner?.info(kleur.cyan(`Generated file: ${relativeOutputPath}`));
    // logger.info(`Generated file: ${relativeOutputPath}`);
    spinner?.start();
  } catch (err) {
    spinner?.stop();
    logger.error(`Error processing template ${templatePath}: ${err}`);
    spinner?.start();
  }
}
