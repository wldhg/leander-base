/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

// Exit control module

let log;
let exitStarted = false;
const exitHandlers = [];

export const setLogger = (logger): void => {
  log = logger;
};

export const code = (exitCode?: number): void => {
  if (!exitStarted) {
    exitStarted = true;
    setTimeout(() => process.exit(exitCode), 0);
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const onExit = (fn: () => Promise<any>): void => {
  if (typeof fn === 'function') {
    exitHandlers.push(fn);
  } else {
    throw new Error('입력 받은 새 종료 핸들러가 함수가 아닙니다.');
  }
};

const procExitHandlers = (exitCode): Promise<any> => {
  // Start handling handlers
  const exitHandled: Promise<any>[] = [];
  for (let i = 0; i < exitHandlers.length; i += 1) {
    exitHandled.push(exitHandlers[i]());
  }
  const all = Promise.all(exitHandled);

  // Burn the bridges
  const bridgeTimeout = setTimeout(() => {
    log.warn('모든 종료 핸들러가 처리되지 않았습니다.');
    code(exitCode);
  }, 20000);

  return all.then(() => {
    clearTimeout(bridgeTimeout);
    code(exitCode);
  });
};

// Detecting process interrupt events
process.on('SIGUSR2', () => {
  log.warn('시스템 인터럽트를 받았습니다.', 'SIGUSR2');
  procExitHandlers(0);
});
process.on('SIGUSR1', () => {
  log.warn('시스템 인터럽트를 받았습니다.', 'SIGUSR1');
  procExitHandlers(0);
});
process.on('SIGINT', () => {
  log.warn('시스템 인터럽트를 받았습니다.', 'SIGINT');
  procExitHandlers(0);
});

// Bye!
process.on('exit', () => {
  log.okay('프로그램을 종료합니다. 안녕히 가세요.', 'BYE');
});
