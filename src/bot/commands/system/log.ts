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

export const fn: LNDRCommandFunction = (core, lndr, msg) => {
  core.log.debug(util.inspect(msg));
  const logMessage = lndr.embed.create(
    '🎫  **기록 성공!**',
    lndr.t('system.log.success', core.log.i.toString()),
    0xbcbcbc,
  );
  msg.send(logMessage);
};
