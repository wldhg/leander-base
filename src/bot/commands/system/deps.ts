/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as yaml from 'js-yaml';

export const meta: LNDRCommandMeta = {
  section: null,
  commands: ['chkdeps'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '⛓  의존성 패키지 목록',
};

export const deps: LNDRCommandDeps = ['embed'];

export const fn: LNDRCommandFunction = (lndr, acts, msg) => {
  const depsEmbed = acts.embed.create(
    '⛓  **의존성 패키지 목록**',
    lndr.t(
      '[[res:system.chkdeps.info]]',
      lndr.version,
      Object.keys(lndr.pkg.dependencies).length.toString(),
      Object.keys(lndr.pkg.devDependencies).length.toString(),
    ),
    {
      title: 'Dependencies',
      body: `\`\`\`yaml\n${yaml.safeDump(lndr.pkg.dependencies)}\n\`\`\``,
    },
    {
      title: 'Development Dependencies',
      body: `\`\`\`yaml\n${yaml.safeDump(lndr.pkg.devDependencies)}\n\`\`\``,
    },
    0xbcbcbc,
  );
  msg.send(depsEmbed);
};
