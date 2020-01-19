/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

// Exit control module

let log;
let exitPromise;
let exitResolve;
let exitStarted = false;
const exitHandlers = [];

export const setLogger = (logger): void => {
  log = logger;
};

export const code = (exitCode?: number): Promise<void> => {
  if (!exitStarted) {
    exitPromise = new Promise((resolve) => {
      exitResolve = resolve;
    });
    exitStarted = true;
    setTimeout(() => process.exit(exitCode), 0);
  }
  return exitPromise;
};

export const onExit = (fn: () => void): void => {
  if (typeof fn === 'function') {
    exitHandlers.push(fn);
  } else {
    throw new Error('입력 받은 새 종료 핸들러가 함수가 아닙니다.');
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
  log.warn('시스템 인터럽트가 감지되었습니다.', 'SIGUSR2');
  code(0);
});
process.on('SIGUSR1', () => {
  log.warn('시스템 인터럽트가 감지되었습니다.', 'SIGUSR1');
  code(0);
});
process.on('SIGINT', () => {
  log.warn('프로그램을 종료합니다. 안녕히 가세요.', 'SIGINT');
  code(0);
});
