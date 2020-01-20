/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '기타',
  commands: ['핑', 'ping'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '📡  핑',
  description: '서버 통신 지연 시간을 표시합니다.',
};

export const fn: LNDRCommandFunction = (core, lndr, msg) => {
  msg.raw.react('💕');

  const isPingBad = lndr.cli.ping > 200;
  msg.send(
    lndr.embed.create(
      isPingBad ? `☁  ${lndr.t('system.ping.bad')}` : `🌞  ${lndr.t('system.ping.good')}`,
      lndr.t('system.ping.message', lndr.cli.ping.toString()),
      isPingBad ? 0x5e5e5e : 0xffd400,
    ),
  );
};
