export default {
  name: '<:lndrcircle:590238436758257719>  버전 정보',
  help: '리엔더 봇의 버전 정보를 표시합니다.',
  section: '기타',
  commands: ['버전', 'version'],
  conditions: {},
  fn: (kernel, lndr, msg, pmsg) => { // eslint-disable-line no-unused-vars
    msg.channel.send(`저는 리엔더 \`${kernel.config.version}\` 판이에요.`);
  },
};
