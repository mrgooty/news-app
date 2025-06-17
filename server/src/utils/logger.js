function createLogger(scope) {
  return (...args) => {
    // eslint-disable-next-line no-console
    console.log(`[${scope}]`, ...args);
  };
}
module.exports = createLogger;
