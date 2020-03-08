/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';

export const meta: LNDRCommandMeta = {
  section: '커뮤니티',
  commands: ['포인트', 'point'],
  conditions: {
    DM: false,
  },
};

export const help: LNDRCommandHelp = {
  title: ':parking:  포인트',
  description: '[[res:guild.point.help]]',
  forServerAdmin: ['다른 멤버 포인트 보기', '포인트 변경하기'],
  fields: {
    '내 포인트 보기': '[[res:guild.point.see_mine]]',
    '다른 멤버 포인트 보기': '[[res:guild.point.see_others]]',
    '포인트 변경하기': '[[res:guild.point.change]]',
  },
};

export const deps: LNDRCommandDeps = ['point', 'embed', 'tools'];

export const fn: LNDRCommandFunction = (lndr, acts, msg) => {
  if (msg.arguments.length >= 2) {
    /* Change Point State */
    if (!msg.member.hasPermission('ADMINISTRATOR')) {
      msg.raw.reply(lndr.t('[[res:guild.point.no_perm]]'));
    } else {
      const change = Number.parseInt(msg.arguments[0], 10);
      if (Number.isNaN(change)) {
        msg.raw.reply(lndr.t('[[res:guild.point.invalid_amount]]'));
        return;
      }
      const direction = `${change > 0 ? '적립' : '사용'}`;
      const targets = msg.arguments.slice(1).map((ts) => acts.tools.getMember(msg.guild, ts));
      const mention = msg.arguments.length === 2 ? acts.tools.mention(targets[0]) : `총 ${targets.length}분`;
      msg.send(
        lndr.t('[[res:guild.point.change_confirm]]',
          mention, Math.abs(change).toString(), direction, '취소'),
      );
      acts.dialog.start(
        msg.raw,
        (omsg, nmsg) => {
          if (nmsg.content === '취소') {
            nmsg.channel.send(lndr.t('[[res:guild.point.change_cancel]]', direction));
          } else {
            const ptchPromises = [];
            for (let i = 0; i < targets.length; i += 1) {
              ptchPromises.push(new Promise((resolve) => {
                acts.point.changePoint(msg.guild, targets[i], {
                  change,
                  reason: nmsg.content,
                  time: (new Date()).toISOString(),
                }).then(() => {
                  resolve();
                }).catch((err: Error) => {
                  if (err.message.indexOf('음수가 될 수 없습니다.') > -1) {
                    nmsg.channel.send(lndr.t(
                      '[[res:guild.point.change_fail_negative]]',
                      acts.tools.from(targets[i]),
                    ));
                  } else {
                    nmsg.channel.send(lndr.t(
                      '[[res:guild.point.change_fail_unknown]]',
                      acts.tools.from(targets[i]),
                    ));
                  }
                  resolve();
                });
              }));
            }
            Promise.all(ptchPromises).then(() => {
              nmsg.channel.send(lndr.t('[[res:guild.point.change_finished]]', direction));
            });
          }
        },
        60,
        () => {
          msg.send(lndr.t('[[res:guild.point.change_timeout]]', '60', direction));
        },
      );
    }
  } else {
    /* Get Point State */
    // Set source member with checking permission
    let member: DISCORD.GuildMember;
    if (msg.arguments.length === 0) {
      member = msg.member;
    } else {
      if (!msg.member.hasPermission('ADMINISTRATOR')) {
        msg.raw.reply(lndr.t('[[res:guild.point.no_perm]]'));
        return;
      }
      member = acts.tools.getMember(msg.guild, msg.arguments[0]);
    }

    acts.point.getPoint(msg.guild, member).then((pt) => {
      const embed = acts.embed.create(
        lndr.t(`:parking:  ${acts.tools.from(member)} [[bot:addressing]]님의 포인트!`),
      );
      embed.addField(`${lndr.dummy}\n현재 포인트`, `\`${pt.total}\` 점!\n${lndr.dummy}`, false);

      if (acts.web) {
        embed.addField('적립/사용 기록', lndr.t(`${'!!링크 생성 준비중!!'}\n[[res:guild.point.link]]${lndr.dummy}`));
        embed.setFooter(lndr.t(`${lndr.dummy}\n[[res:guild.point.footer_link]]`));
      } else {
        embed.setFooter(lndr.t(
          '[[res:guild.point.footer_contact]]',
          acts.tools.mention(lndr.config.discord.adminID),
        ));
      }
      embed.setColor(0x187bcd);
      msg.send(embed);
    });
  }
};
