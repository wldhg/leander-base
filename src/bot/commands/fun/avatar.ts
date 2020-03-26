/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '장난거리',
  commands: ['프사', '프로필', 'avatar'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '👧  프로필 사진 보기',
  description: '[[res:guild.rank.help]]',
};

export const deps: LNDRCommandDeps = ['embed', 'tools'];

export const fn: LNDRCommandFunction = (lndr, acts, msg) => {
  let targetID = msg.author.id;
  if (msg.arguments.length > 0) {
    targetID = acts.tools.getID(msg.arguments[0]);
  }
  const fetchUser = lndr.cli.users.fetch(targetID, false);
  fetchUser.then((user) => {
    if (user) {
      const embed = acts.embed.create(user.tag);
      const avatar = user.avatarURL({
        format: 'png', dynamic: true, size: 2048,
      });
      if (avatar) {
        embed.setImage(avatar);
      } else {
        embed.setDescription(lndr.t('[[res:fun.avatar.no_file]]'));
      }
      msg.send(embed);
    } else {
      msg.reply(lndr.t('[[res:fun.avatar.failed]]'));
    }
  }).catch(() => {
    msg.reply(lndr.t('[[res:fun.avatar.failed]]'));
  });
};
