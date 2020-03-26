/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';
import * as moment from 'moment';

/* eslint-disable no-loop-func, no-else-return */

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
      msg.reply(lndr.t('[[res:guild.point.no_perm]]'));
    } else {
      const change = Number.parseInt(msg.arguments[0], 10);
      if (Number.isNaN(change)) {
        msg.reply(lndr.t('[[res:guild.point.invalid_amount]]'));
        return;
      } else if (change === 0) {
        msg.reply(lndr.t('[[res:guild.point.not_zero]]'));
        return;
      }
      const direction = `${change > 0 ? '적립' : '사용'}`;
      acts.tools.getMembers(msg.guild, msg.arguments.slice(1)).then((m) => {
        let mention = null;
        if (m.unresolved.length > 0) {
          for (let i = 0; i < m.unresolved.length; i += 1) {
            msg.send(lndr.t('[[res:guild.point.invalid_member]]', m.unresolved[i]));
          }
          if (m.members.length > 0) {
            msg.send('[[res:guild.point.invalid_contiune]]');
          }
        }
        if (m.members.length > 1) {
          mention = `총 ${m.members.length}분`;
        } else if (m.members.length === 1) {
          mention = acts.tools.mention(m.members[0]);
        } else {
          msg.send('[[res:guild.point.invalid_stop]]');
        }
        return [m.members, mention];
      }).then(([m, mention]) => {
        if (mention !== '') {
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
                let isFailed = false;
                let isSucceed = false;
                for (let i = 0; i < m.length; i += 1) {
                  ptchPromises.push(new Promise((resolve) => {
                    acts.point.changePoint(msg.guild, m[i], {
                      change,
                      reason: nmsg.content,
                      time: (new Date()).toISOString(),
                    }).then(() => {
                      isSucceed = true;
                      resolve();
                    }).catch((err: Error) => {
                      isFailed = true;
                      if (err.message.indexOf('음수가 될 수 없습니다.') > -1) {
                        nmsg.channel.send(lndr.t(
                          '[[res:guild.point.change_fail_negative]]',
                          acts.tools.getName(m[i]),
                        ));
                      } else {
                        nmsg.channel.send(lndr.t(
                          '[[res:guild.point.change_fail_unknown]]',
                          acts.tools.getName(m[i]),
                        ));
                      }
                      resolve();
                    });
                  }));
                }
                Promise.all(ptchPromises).then(() => {
                  if (isFailed && isSucceed) {
                    nmsg.channel.send(lndr.t('[[res:guild.point.change_finished_partial]]', direction));
                  } else if (isFailed && !isSucceed) {
                    nmsg.channel.send(lndr.t('[[res:guild.point.change_finished_failed]]', direction));
                  } else {
                    nmsg.channel.send(lndr.t('[[res:guild.point.change_finished_success]]', direction));
                  }
                });
              }
              return true;
            },
            60,
            () => {
              msg.send(lndr.t('[[res:guild.point.change_cancel]]', direction));
            },
          );
        }
      });
    }
  } else {
    /* Get Point State */
    // Set source member with checking permission
    const resolveMember = new Promise<DISCORD.GuildMember>((resolve) => {
      if (msg.arguments.length === 0) {
        resolve(msg.member);
      } else {
        if (!msg.member.hasPermission('ADMINISTRATOR')) {
          msg.reply(lndr.t('[[res:guild.point.no_perm]]'));
          return;
        }
        acts.tools.getMembers(msg.guild, msg.arguments[0]).then((m) => {
          if (m.members.length === 0) {
            msg.reply(lndr.t('[[res:guild.point.invalid_member]]', msg.arguments[0]));
          } else if (m.members.length > 1) {
            msg.reply(lndr.t('[[res:guild.point.query_only_one]]'));
          } else {
            resolve(m.members[0]);
          }
        });
      }
    });

    resolveMember.then((member) => {
      acts.point.getPoint(msg.guild, member).then((pt) => {
        const embed = acts.embed.create(
          lndr.t(`:parking:  ${acts.tools.getName(member)} [[bot:addressing]]님의 포인트!`),
        );
        embed.addField(`${lndr.dummy}\n현재 포인트`, `\`${pt.total}\` 점!\n${lndr.dummy}`, false);
        if (acts.web) {
          embed.addField('적립/사용 기록', lndr.t(`${'!!링크 생성 준비중!!'}\n[[res:guild.point.link]]${lndr.dummy}`), false);
          embed.setFooter(lndr.t(`${lndr.dummy}\n[[res:guild.point.footer_link]]`));
        } else {
          let logBodyLength = 10;
          let logBodyContentCount = 0;
          embed.addField('적립/사용 기록', `\`\`\`md\n${pt.log.reverse().map((log) => {
            const date = moment(log.time);
            const body = `[${date.format('YYYY-MM-DD HH:mm')}](${log.change > 0 ? `+${log.change}` : log.change.toString(10)})\n>  ${log.reason}`;
            if ((logBodyLength + body.length + 1) < 1000) {
              logBodyLength += body.length + 1;
              logBodyContentCount += 1;
            }
            return body;
          }).slice(0, Math.min(10, logBodyContentCount)).join('\n')}\`\`\`${lndr.dummy}`);
          embed.setFooter(lndr.t('[[res:guild.point.footer_contact]]'));
        }
        embed.setColor(0x187bcd);
        msg.send(embed);
      });
    });
  }
};
