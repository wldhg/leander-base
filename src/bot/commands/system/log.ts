/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as util from 'util';

export const meta: LNDRCommandMeta = {
  section: null,
  commands: ['log'],
  conditions: {
    lndrAdmin: true,
  },
};

export const help: LNDRCommandHelp = {
  title: '🎫  로그',
};

export const deps: LNDRCommandDeps = ['embed'];

export const fn: LNDRCommandFunction = (lndr, acts, msg) => {
  lndr.log.debug(util.inspect(msg));
  const logMessage = acts.embed.create(
    '🎫  **기록 성공!**',
    lndr.t('[[res:system.log.success]]', lndr.log.i.toString()),
    0xbcbcbc,
  );
  msg.send(logMessage);
};
