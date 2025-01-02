import { logger, handlerSequelizeMessage } from '../src/utils/logger.utils';
import kleur from 'kleur';

describe('logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log success message', () => {
    const message = 'Success message';
    logger.success(message);
    expect(consoleSpy).toHaveBeenCalledWith(kleur.green(message));
  });

  it('should log error message', () => {
    const message = 'Error message';
    logger.error(message);
    expect(consoleSpy).toHaveBeenCalledWith(kleur.red(message));
  });

  it('should log warning message', () => {
    const message = 'Warning message';
    logger.warn(message);
    expect(consoleSpy).toHaveBeenCalledWith(kleur.yellow(message));
  });

  it('should log info message', () => {
    const message = 'Info message';
    logger.info(message);
    expect(consoleSpy).toHaveBeenCalledWith(kleur.cyan(message));
  });

  it('should log debug message', () => {
    const message = 'Debug message';
    logger.debug(message);
    expect(consoleSpy).toHaveBeenCalledWith(kleur.gray(message));
  });

  it('should log custom message with color', () => {
    const message = 'Custom message';
    const customColor = kleur.magenta;
    logger.custom(message, customColor);
    expect(consoleSpy).toHaveBeenCalledWith(customColor(message));
  });
});

describe('handlerSequelizeMessage', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should handle predefined sequelize messages', () => {
    const successMessage = 'All migrations executed successfully';
    handlerSequelizeMessage(successMessage);
    expect(consoleSpy).toHaveBeenCalledWith(kleur.green(successMessage));

    const infoMessage = 'No migration to execute';
    handlerSequelizeMessage(infoMessage);
    expect(consoleSpy).toHaveBeenCalledWith(kleur.cyan(infoMessage));
  });

  it('should handle unknown messages as info', () => {
    const unknownMessage = 'Unknown message';
    handlerSequelizeMessage(unknownMessage);
    expect(consoleSpy).toHaveBeenCalledWith(kleur.cyan(unknownMessage));
  });
});
