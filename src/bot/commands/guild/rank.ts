/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '커뮤니티',
  commands: ['랭킹', '순위', 'rank'],
  conditions: { DM: false },
};

export const help: LNDRCommandHelp = {
  title: '🏆  포인트 순위',
  description: '[[res:guild.rank.help]]',
};

export const deps: LNDRCommandDeps = ['point', 'embed', 'tools'];

export const fn: LNDRCommandFunction = (lndr, acts, msg) => {
  const rankDispLimit = 30;

  acts.point.getRankList(msg.guild).then((list) => {
    const rankdoc = list.map((item) => {
      const rankUsers = item.users.map((id) => acts.tools.getName(msg.guild.member(id))).filter(
        (name) => name !== acts.tools.getUnknownMemberString(),
      );
      return rankUsers.length > 0
        ? `(${rankUsers.length}명) =\n:${item.point} 포인트: ${rankUsers.join(', ')}`
        : '';
    }).filter((_) => _.length > 0).map((item, idx) => `= ${idx + 1}위 ${item}`)
      .slice(0, rankDispLimit)
      .join('\n\n');
    acts.point.getUserRank(msg.guild, msg.member).then(({ rank, point }) => {
      const myRank = rank === -1
        ? lndr.t('[[res:guild.rank.my_unknown]]', acts.tools.getName(msg))
        : lndr.t('[[res:guild.rank.my_known]]', acts.tools.getName(msg),
          point.toString(), (rank + 1).toString());
      const rankEmbed = acts.embed.create(
        '🏆  **포인트 순위**',
        `${lndr.t('[[res:guild.rank.greeting]]', acts.tools.wa(`**${msg.guild.name}**`))}\n${lndr.dummy}`,
        {
          title: '전체 순위',
          body: `\`\`\`asciidoc\n${
            rankdoc || lndr.t('[[res:guild.rank.no_record]]')
          }\n\`\`\`${lndr.dummy}`,
        },
        {
          title: '나의 순위',
          body: `${myRank}\n${lndr.dummy}`,
        },
        0xffbd1b,
      );
      rankEmbed.setFooter(lndr.t('[[res:guild.rank.disp_limit]]', rankDispLimit.toString()));
      msg.send(rankEmbed);
    });
  });
};
