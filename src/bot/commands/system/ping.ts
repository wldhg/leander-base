/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '기타',
  commands: ['핑', 'ping'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '📡  핑',
  description: 't:system.ping.help',
};

export const fn: LNDRCommandFunction = (core, lndr, msg) => {
  msg.raw.react('💕');

  const isPingBad = lndr.cli.ws.ping > 200;
  msg.send(
    lndr.embed.create(
      isPingBad ? `☁  ${lndr.t('system.ping.bad')}` : `🌞  ${lndr.t('system.ping.good')}`,
      lndr.t('system.ping.message', (Math.round(lndr.cli.ws.ping * 1000) / 1000).toString()),
      isPingBad ? 0x5e5e5e : 0xffd400,
    ),
  );
};
