import ejs from 'ejs';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.utils';
import { getRelativePath } from './sequelize-blueprint-config.helper';

export async function renderTemplate(
  templatePath: string,
  outputPath: string,
  data: Record<string, any>,
) {
  const resolvedTemplatePath = path.resolve(
    __dirname,
    templatePath.startsWith('templates')
      ? templatePath
      : `../templates/${templatePath}`,
  );

  const templateContent = await fs.readFile(resolvedTemplatePath, 'utf8');
  const renderedContent = ejs.render(templateContent, data);
  await fs.outputFile(outputPath, renderedContent, 'utf8');
  logger.success(
    `Generated file: ${getRelativePath(process.cwd(), outputPath)}`,
  );
}
