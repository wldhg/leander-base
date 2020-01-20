/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '기타',
  commands: ['초대', 'invite'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '📧  초대하기',
  description: '봇 초대 링크를 표시합니다.',
};

export const fn: LNDRCommandFunction = (core, lndr, msg) => {
  if (lndr.config.discord.invitable) {
    const inviteEmbed = lndr.embed.create(
      lndr.t('system.invite.h1'),
      `${lndr.t('system.invite.h2')}\n${lndr.dummy}`,
      {
        title: '초대 링크',
        body: `https://discordapp.com/oauth2/authorize?client_id=${lndr.config.discord.clientID}&scope=bot&permissions=${lndr.config.discord.permission}\n${lndr.dummy}`,
      },
      lndr.t('system.invite.h3'),
    );
    msg.send(inviteEmbed);
  } else {
    msg.send(lndr.t('system.invite.denied', lndr.tools.mention(lndr.config.discord.adminID)));
  }
};
