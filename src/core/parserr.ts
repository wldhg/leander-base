/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Error capturing module

let log;
let exit;

/**
 * Set logger used in parserr.
 */
export const setLogger = (logger) => {
  log = logger;
};

/**
 * Set exit manager used in parserr.
 */
export const setExitManager = (exitmgr) => {
  exit = exitmgr;
};

/**
 * Create an error.
 */
export const make = (message, additionals) => {
  const error: ErrorInstance = new Error(message);
  error.more = additionals;
  error.name = '_parserr';
  return error;
};

/**
 * Parse an error.
 */
export const parse = (description, exitCode = 0) => {
  const procError = (e) => {
    log.error(description);

    if (!e) {
      log.warn('Content of the error is empty.');
    } else if ((e.message || e.msg) && e.name === '_parserr') {
      log.debug(`${e.message || e.msg}`);

      if (e.stack) {
        log.debug(
          e.stack
            .toString()
            .substring(e.stack.toString().indexOf('\n')),
          'stack',
        );
      }

      if (e.more instanceof Object) {
        const keys = Object.keys(e.more);
        for (let i = 0; i < keys.length; i += 1) {
          log.debug(e.more[keys[i]], keys[i]);
        }
      } else if (e.more) {
        log.debug(e.more, 'more');
      }
    } else if (typeof e.stack !== 'undefined') {
      log.debug(e.stack.toString());
    } else {
      log.debug(e);
    }

    let returnPromise;
    if (typeof exitCode === 'number') returnPromise = exit.code(exitCode);

    return returnPromise || Promise.reject(e);
  };
  return procError;
};
