const presenceList = [];
let intervalNo;
let cli;

const changePresence = () => {
  const presence = presenceList.shift();
  cli.user.setPresence(presence);
  presenceList.push(presence);
};

export const on = (kernel, lndr) => {
  // eslint-disable-next-line prefer-destructuring
  cli = lndr.cli;

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
      if (item.message && item.url) {
        presenceList.push({
          game: {
            name: item.message,
            url: item.url,
            type: 'STREAMING',
          },
          status: 'online',
        });
      } else {
        kernel.log.warn('Unknown presence object detected.');
        kernel.log.debug(item);
      }
    } else {
      kernel.log.warn(`Unknown presence type detected: ${typeof item}`);
      kernel.log.debug(item);
    }
  });

  if (presenceList.length < 1) {
    kernel.log.info('No presence set. Only online sign will be displayed.');
    presenceList.push({ status: 'online' });
  }

  // Launch presence
  changePresence();
  intervalNo = setInterval(changePresence, lndr.presence.interval * 1000);
};

export const off = (kernel, lndr) => {
  // Clear presence changements first
  clearInterval(intervalNo);

  // Set offline
  lndr.cli.user.setStatus('invisible');
  lndr.cli.user.setPresence({ game: null, status: 'invisible' });

  // Make log
  kernel.log.info('Interval cleared and changed to offline.');
};
