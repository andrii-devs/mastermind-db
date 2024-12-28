import { logger } from './logger.utils';

const errorSolutions: Record<string, string[]> = {
  ECONNREFUSED: [
    'Ensure your database is running.',
    'If using Docker, check that the container is up and reachable.',
    'Verify your database configuration in ".sequelizerc".',
  ],
  ENOENT: [
    'Check if the file or directory exists.',
    'Verify the file path in your configuration.',
  ],
};

export const handlerError = async (err: any, context: string) => {
  const errorMessage = err?.message || err?.error || 'Unknown error occurred';
  if (context) {
    logger.info(`🔍 Context: ${context}`);
  }

  const matchingError = Object.keys(errorSolutions).find((key) =>
    errorMessage.includes(key),
  );

  if (matchingError) {
    logger.error(`❌ ERROR: ${matchingError}`);
    logger.warn('ℹ️  Possible solutions:');
    errorSolutions[matchingError].forEach((solution) =>
      logger.success(`   - ${solution}`),
    );
  } else {
    logger.error(`❌ An error occurred: ${errorMessage}`);
  }
};
