function createLogger(scope) {
  const log = (...args) => {
    // eslint-disable-next-line no-console
    console.log(`[${scope}]`, ...args);
  };
  log.error = (...args) => {
    // eslint-disable-next-line no-console
    console.error(`[${scope}] ERROR:`, ...args);
  };
  return log;
}

export default createLogger;
