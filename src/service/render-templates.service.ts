import ejs from 'ejs';
import fs from 'fs-extra';
import path from 'path';

export async function renderTemplate(
  templatePath: string,
  outputPath: string,
  data: Record<string, any>,
) {
  const fullTemplatePath = path.join(
    __dirname,
    '..',
    'templates',
    templatePath,
  );
  const templateContent = await fs.readFile(fullTemplatePath, 'utf8');
  const renderedContent = ejs.render(templateContent, data);
  await fs.outputFile(outputPath, renderedContent, 'utf8');
  console.log(`Generated file: ${outputPath}`);
}
