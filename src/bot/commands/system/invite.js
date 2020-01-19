export default {
  name: '📧  초대하기',
  help: '리엔더를 다른 서버에 초대할 수 있는 링크를 말해드려요.',
  section: '기타',
  commands: ['초대'],
  conditions: {},
  fn: (kernel, lndr, msg, pmsg) => { // eslint-disable-line no-unused-vars
    if (lndr.discord.invitable) {
      const inviteEmbed = lndr.createEmbed(
        '<:lndrcircle:590238436758257719>  두근거려요!',
        `지휘관님 덕분에 더욱 많은 다른 지휘관님을 만나게 되어서 기뻐요.${lndr.dummyLine}`,
        {
          title: '초대 링크',
          body: `https://discordapp.com/oauth2/authorize?client_id=${lndr.discord.clientID}&scope=bot&permissions=${lndr.discord.permission}${lndr.dummyLine}`,
        },
        '초대 링크에서 저를 지휘관님의 다른 서버에 추가해주세요.',
      );
      msg.channel.send(inviteEmbed);
    } else {
      msg.channel.send(`저는 다른 서버에 초대받을 수 없도록 설정되어 있어요.\n더욱 자세한 정보는 ${lndr.mention(lndr.discord.adminID)} 지휘관님께 여쭈어 보아 주세요.`);
    }
  },
};
