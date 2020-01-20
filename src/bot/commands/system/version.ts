/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '기타',
  commands: ['버전', 'version'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '<:lndrcircle:590238436758257719>  버전 정보',
  description: '버전 정보를 표시합니다.',
};

export const fn: LNDRCommandFunction = (core, lndr, msg) => {
  msg.raw.channel.send(lndr.t('system.version', core.config.version));
};
