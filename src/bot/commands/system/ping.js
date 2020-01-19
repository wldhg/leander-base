export default {
  name: '📡  핑',
  help: '저와 디스코드 서버 사이의 통신 지연 시간을 알려드려요.',
  section: '기타',
  commands: ['핑', 'ping'],
  conditions: {},
  fn: (kernel, lndr, msg, pmsg) => { // eslint-disable-line no-unused-vars
    msg.react('💕');

    const isPingBad = lndr.cli.ping > 200;
    msg.channel.send(
      lndr.createEmbed(
        isPingBad ? '☁  잘 안 들려요.' : '🌞  아주 잘 들려요.',
        `현재 평균 지연 시간은 **${lndr.cli.ping}ms** 에요.`,
        isPingBad ? 0x5e5e5e : 0xffd400,
      ),
    );
  },
};
