import ejs from 'ejs';
import fs from 'fs-extra';
import path from 'path';
import { getTemplatesDir } from './sequelize-blueprint-config.helper';

export async function renderTemplate(
  templatePath: string,
  outputPath: string,
  data: Record<string, any>,
) {
  const templatesDir = getTemplatesDir();
  const fullTemplatePath = path.join(templatesDir, templatePath);
  const templateContent = await fs.readFile(fullTemplatePath, 'utf8');
  const renderedContent = ejs.render(templateContent, data);
  await fs.outputFile(outputPath, renderedContent, 'utf8');
  console.log(`Generated file: ${outputPath}`);
}
