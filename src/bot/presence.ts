/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

const presenceList = [];
let intervalNo;
let cli;

const changePresence = () => {
  const presence = presenceList.shift();
  cli.user.setPresence(presence);
  presenceList.push(presence);
};

export const on = (core, lndr) => {
  lndr.presence.list.forEach((item) => {
    if (typeof item === 'string') {
      presenceList.push({
        game: {
          name: item,
          type: 'PLAYING',
        },
        status: 'online',
      });
    } else if (typeof item === 'object') {
      switch (item.type) {
        case 'WATCHING':
        case 'PLAYING':
        case 'STREAMING':
        case 'LISTENING':
          presenceList.push({
            game: item,
            status: 'online',
          });
          break;

        default:
          core.log.warn('알 수 없는 상태 객체입니다. 상태 객체는 다음 링크를 따라야 합니다: https://discord.js.org/#/docs/main/stable/typedef/PresenceData');
          core.log.debug(item);
          break;
      }
    } else {
      core.log.warn(`알 수 없는 상태 형식입니다. 상태는 string 혹은 Game 객체 형식을 따라야 합니다: ${typeof item}`);
      core.log.debug(item);
    }
  });

  if (presenceList.length < 1) {
    core.log.info('상태가 설정되지 않았습니다. 온라인이라는 정보만이 표시됩니다.');
    presenceList.push({ status: 'online' });
  }

  // Launch presence
  changePresence();
  intervalNo = setInterval(changePresence, lndr.presence.interval * 1000);
};

export const off = (core, lndr) => {
  // Clear presence changements first
  clearInterval(intervalNo);

  // Set offline
  lndr.cli.user.setStatus('invisible');
  lndr.cli.user.setPresence({ game: null, status: 'invisible' });

  // Make log
  core.log.info('상태 표시를 없앴고 오프라인으로 보이게 전환하였습니다.');
};
