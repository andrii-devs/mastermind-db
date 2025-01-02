import { renderTemplate } from '../src/helper/render-templates.helper';
import fs from 'fs-extra';
import ejs from 'ejs';
import path from 'path';
import { logger } from '../src/utils/logger.utils';
import { getRelativePath } from '../src/helper/mastermind-config.helper';

jest.mock('fs-extra');
jest.mock('ejs');
jest.mock('../src/utils/logger.utils');
jest.mock('../src/helper/mastermind-config.helper');

describe('renderTemplate', () => {
  const mockTemplatePath = 'templates/test-template.ejs';
  const mockOutputPath = 'output/test-output.ts';
  const mockData = { key: 'value' };
  const mockRenderedContent = 'rendered content';

  beforeEach(() => {
    jest.clearAllMocks();
    (getRelativePath as jest.Mock).mockReturnValue('relative/path/output.ts');
  });

  it('should render template successfully', async () => {
    (fs.readFile as unknown as jest.Mock).mockResolvedValue('template content');
    (ejs.render as jest.Mock).mockReturnValue(mockRenderedContent);

    await renderTemplate(mockTemplatePath, mockOutputPath, mockData);

    // Verify template render
    expect(ejs.render).toHaveBeenCalledWith('template content', mockData);

    // Verify file output
    expect(fs.outputFile).toHaveBeenCalledWith(
      mockOutputPath,
      mockRenderedContent,
      'utf8',
    );

    // Verify logger
    expect(logger.info).toHaveBeenCalledWith(
      `Generated file: relative/path/output.ts`,
    );
  });

  it('should handle template processing errors', async () => {
    const errorMessage = 'Template error';
    (fs.readFile as unknown as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    await renderTemplate(mockTemplatePath, mockOutputPath, mockData);

    // Verify logger error message
    expect(logger.error).toHaveBeenCalledWith(
      `Error processing template ${mockTemplatePath}: Error: ${errorMessage}`,
    );
  });
});
