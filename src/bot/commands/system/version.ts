/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '기타',
  commands: ['버전', 'version', 'ver'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '[[bot:emoji]]  버전 정보',
  description: 't:system.version.help',
};

export const fn: LNDRCommandFunction = (core, lndr, msg) => {
  msg.raw.channel.send(lndr.t('system.version.info', core.config.version));
};
