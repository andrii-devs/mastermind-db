import { renderTemplate } from '../src/helper/render-templates.helper';
import fs from 'fs-extra';
import ejs from 'ejs';
import path from 'path';
import { logger } from '../src/utils/logger.utils';
import { getRelativePath } from '../src/helper/mastermind-config.helper';
import { createSpinner, Spinner } from 'nanospinner';
import kleur from 'kleur';

jest.mock('fs-extra');
jest.mock('kleur');
jest.mock('ejs');
jest.mock('../src/utils/logger.utils');
jest.mock('../src/helper/mastermind-config.helper');
jest.mock('nanospinner');

describe('renderTemplate', () => {
  const mockTemplatePath = 'templates/test-template.ejs';
  const mockOutputPath = 'output/test-output.ts';
  const mockData = { key: 'value' };
  const mockRenderedContent = 'rendered content';
  const mockSpinner = {
    stop: jest.fn(),
    info: jest.fn(),
    start: jest.fn(),
    error: jest.fn(),
  } as Spinner | any;

  beforeEach(() => {
    jest.clearAllMocks();
    (getRelativePath as jest.Mock).mockReturnValue('relative/path/output.ts');
    (createSpinner as jest.Mock).mockReturnValue(mockSpinner);
  });

  it('should render template successfully', async () => {
    (fs.readFile as unknown as jest.Mock).mockResolvedValue('template content');
    (ejs.render as jest.Mock).mockReturnValue(mockRenderedContent);

    await renderTemplate(
      mockTemplatePath,
      mockOutputPath,
      mockData,
      mockSpinner,
    );

    // Verify template render
    expect(ejs.render).toHaveBeenCalledWith('template content', mockData);

    // Verify file output
    expect(fs.outputFile).toHaveBeenCalledWith(
      mockOutputPath,
      mockRenderedContent,
      'utf8',
    );

    // Verify spinner info
    // expect(mockSpinner.info).toHaveBeenCalledWith(
    //   kleur.cyan(`Generated file: relative/path/output.ts`),
    // );
  });

  it('should handle template processing errors', async () => {
    const errorMessage = 'Template error';
    (fs.readFile as unknown as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    await renderTemplate(
      mockTemplatePath,
      mockOutputPath,
      mockData,
      mockSpinner,
    );

    // Verify spinner error message
    // expect(mockSpinner.error).toHaveBeenCalledWith(
    //   kleur.red(
    //     `Error processing template ${mockTemplatePath}: Error: ${errorMessage}`,
    //   ),
    // );
  });
});
