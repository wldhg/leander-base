/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Exit control module

let log;
let exitPromise;
let exitResolve;
let exitStarted = false;
const exitHandlers = [];

export const setLogger = (logger) => {
  log = logger;
};

export const code = (exitCode?: number) => {
  if (!exitStarted) {
    exitPromise = new Promise((resolve) => {
      exitResolve = resolve;
    });
    exitStarted = true;
    setTimeout(() => process.exit(exitCode), 0);
  }
  return exitPromise;
};

export const onExit = (fn: (...args: any[]) => any) => {
  if (typeof fn === 'function') {
    exitHandlers.push(fn);
  } else {
    throw new Error('New exit handler is not a function.');
  }
};

// Detecting process interrupt events
process.on('exit', () => {
  for (let i = 0; i < exitHandlers.length; i += 1) {
    exitHandlers[i]();
  }
  if (typeof exitResolve === 'function') {
    exitResolve();
  }
});
process.on('SIGUSR2', () => {
  log.warn('System interrupt detected.', 'SIGUSR2');
  code(0);
});
process.on('SIGUSR1', () => {
  log.warn('System interrupt detected.', 'SIGUSR1');
  code(0);
});
process.on('SIGINT', () => {
  log.warn('Shutting down, bye.', 'SIGINT');
  code(0);
});
