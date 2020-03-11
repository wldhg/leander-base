/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as yaml from 'js-yaml';

export const meta: LNDRCommandMeta = {
  section: null,
  commands: ['chkperm'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '⛑  권한 확인',
};

export const deps: LNDRCommandDeps = ['embed'];

export const fn: LNDRCommandFunction = (lndr, acts, msg) => {
  const permEmbed = acts.embed.create(
    '⛑  **권한 확인!**',
    lndr.t('[[res:system.chkperm.info]]', acts.tools.mention(msg)),
    {
      title: 'Serialized Permissions',
      body: `\`\`\`yaml\n${yaml.safeDump(msg.member.permissions.serialize())}\n\`\`\``,
    },
    0xbcbcbc,
  );
  msg.send(permEmbed);
};
