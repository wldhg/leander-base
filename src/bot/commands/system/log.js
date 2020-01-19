import util from 'util';

export default {
  name: '🎫  로그',
  help: null,
  section: null,
  commands: ['log'],
  conditions: {
    lndrAdmin: true,
  },
  fn: (kernel, lndr, msg, pmsg) => { // eslint-disable-line no-unused-vars
    kernel.log.debug(util.inspect(msg));
    const logMessage = lndr.createEmbed(
      '🎫  **기록 성공!**',
      `지휘관님, 보내신 메시지가 \`${kernel.log.i}\` 번 로그에 저장되었어요.`,
      0xbcbcbc,
    );
    msg.channel.send(logMessage);
  },
};
