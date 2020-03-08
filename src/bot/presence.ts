/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';

const presenceList: {
  activity: LNDRActivity;
}[] = [];
let msgChangeIntervalNo: NodeJS.Timeout;
let idleTimeoutNo: NodeJS.Timeout;
let status: DISCORD.PresenceStatusData = 'dnd';
let cli: DISCORD.Client;
let recentPresenceIndex = -1;

const changePresence = (): void => {
  let newPresenceIndex = -1;
  while (newPresenceIndex === recentPresenceIndex) {
    newPresenceIndex = Math.floor(Math.random() * (presenceList.length));
  }
  const presence = presenceList[newPresenceIndex];
  cli.user.setPresence({
    ...presence,
    status,
  });
  recentPresenceIndex = newPresenceIndex;
};

export const off = (core: AppCore, lndr: LNDRBase): Promise<DISCORD.Presence | null> => {
  let prom = Promise.resolve(null);
  if (lndr.cli && lndr.cli.user) {
    // Clear presence changements first
    clearInterval(msgChangeIntervalNo);
    clearTimeout(idleTimeoutNo);

    // Set offline
    status = 'invisible';
    prom = lndr.cli.user.setActivity(null).then(
      () => lndr.cli.user.setPresence({ activity: null, status: 'invisible' }),
    );
  }
  return prom;
};

export const idle = (core: AppCore, lndr: LNDRBase): Promise<DISCORD.Presence | null> => {
  let prom = Promise.resolve(null);
  if (lndr.cli && lndr.cli.user) {
    prom = lndr.cli.user.setStatus('idle');
    status = 'idle';
  }
  return prom;
};

export const on = (core: AppCore, lndr: LNDRBase): Promise<DISCORD.Presence | null> => {
  let prom = Promise.resolve(null);
  if (lndr.cli && lndr.cli.user) {
    prom = lndr.cli.user.setStatus('online');
    status = 'online';
  }
  return prom;
};

export const ping = (core: AppCore, lndr: LNDRBase): void => {
  clearTimeout(idleTimeoutNo);
  on(core, lndr);
  idleTimeoutNo = setTimeout(() => {
    idle(core, lndr);
  }, 20000);
};

export const init = (core: AppCore, lndr: LNDRBase): Promise<void> => new Promise((resolve) => {
  lndr.cli.user.setPresence({
    activity: {
      name: `🎇 lndr ${core.config.version} init...`,
      type: 'PLAYING',
    },
    status: 'dnd',
  });

  lndr.config.presence.list.forEach((item: LNDRPresence) => {
    if (typeof item === 'string') {
      presenceList.push({
        activity: {
          name: item,
          type: 'PLAYING',
        },
      });
    } else if (typeof item === 'object') {
      switch (item.type) {
        case 'WATCHING':
        case 'PLAYING':
        case 'STREAMING':
        case 'LISTENING':
          presenceList.push({
            activity: item,
          });
          break;

        case 'CUSTOM_STATUS':
          core.log.warn('지원하지 않는 상태 종류입니다. 봇은 사용자 지정 상태를 설정할 수 없습니다.');
          core.log.warn('아래 상태 객체를 무시하고 계속 진행합니다.');
          core.log.debug(item);
          break;

        default:
          core.log.warn('알 수 없는 상태 객체입니다. 상태 객체는 LNDRActivity 형식(src/bot/types.ts 참조)을 따라야 합니다.');
          core.log.warn('아래 상태 객체를 무시하고 계속 진행합니다.');
          core.log.debug(item);
          break;
      }
    } else {
      core.log.warn(`알 수 없는 상태 형식입니다. 상태는 LNDRPresence 형식(src/bot/types.ts 참조)을 따라야 합니다: ${typeof item}`);
      core.log.warn('아래 상태 객체를 무시하고 계속 진행합니다.');
      core.log.debug(item);
    }
  });

  if (presenceList.length < 1) {
    core.log.info('상태 메시지가 설정되지 않았습니다.');
    resolve();
  } else {
    cli = lndr.cli;
    setTimeout(() => {
      ping(core, lndr);
      changePresence();
      msgChangeIntervalNo = setInterval(
        changePresence,
        lndr.config.presence.interval * 1000,
      );
      resolve();
    }, 1000);
  }
});
