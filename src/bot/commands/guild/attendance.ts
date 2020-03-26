/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as moment from 'moment';

moment.locale('ko');

export const meta: LNDRCommandMeta = {
  section: '커뮤니티',
  commands: ['출석', 'ㅊㅊ'],
  conditions: { DM: false },
};

export const help: LNDRCommandHelp = {
  title: '📆  출석 체크',
  description: '[[res:guild.att.help]]',
};

export const deps: LNDRCommandDeps = ['guild', 'point', 'embed', 'tools'];

const attDefault = {
  recent: '0000-00-00',
  regularFrom: '0000-00-00',
  regularMax: 0,
  regularMaxFrom: '0000-00-00',
  regularMaxTo: '0000-00-00',
  count: 0,
  log: [],
};

export const fn: LNDRCommandFunction = (lndr, acts, msg) => acts.guild.getGuildDB<AttDB>(
  msg.guild, 'attendance',
).then((db) => {
  const guild: AttByUser = db.get('guild').defaults(attDefault).value();
  const data: AttByUser = db.get(msg.member.id).defaults(attDefault).value();
  const today = moment();
  const todayString = today.format('YYYY-MM-DD');
  const tomorrow = moment().add(1, 'day');
  tomorrow.millisecond(0);
  tomorrow.second(0);
  tomorrow.minute(0);
  tomorrow.hour(0);

  const isRegular = moment(data.recent).add(1, 'day').format('YYYY-MM-DD') === todayString;
  let point = 50;
  let reason = today.format('YYYY년 MM월 DD일 출석 보상');
  let title = '[[res:guild.att.accept_title]]';
  let description = '[[res:guild.att.accept_point]]';
  let icon = '✅';

  // Process attendance
  if (data.recent === '0000-00-00') {
    // First attendance!
    point = 1000;
    reason = '처음으로 출석 도장을 찍은 날';
    title = '[[res:guild.att.first_title]]';
    description = '[[res:guild.att.first_point]]';
  } else if (data.recent === todayString) {
    // Already finished!
    point = 0;
    title = '[[res:guild.att.done_title]]';
    description = lndr.t('[[res:guild.att.done_point]]', tomorrow.from(today));
  } else if (guild.recent !== todayString) {
    // Today's First Attendance!
    point = 200;
    reason += ' (1등)';
    title = '[[res:guild.att.accept_title_first]]';
    icon = ':first_place:';
  }

  // Today's first
  if (guild.recent !== todayString) {
    guild.recent = todayString;
    db.set('guild', guild).write();
  }

  // Point change
  const regular = Math.ceil(moment.duration(today.diff(moment(
    isRegular ? data.regularFrom : todayString,
  ))).as('days'));
  if (point > 0) {
    if (isRegular) {
      data.count += 1;
    } else {
      data.count = 1;
      data.regularFrom = todayString;
    }
    data.recent = todayString;
    data.log.push({
      date: todayString,
      wasFirst: point > 50,
    });
    if (data.log.length > 100) {
      data.log = data.log.slice(Math.max(data.log.length - 100, 0), data.log.length);
    }
    if (data.regularMax < regular) {
      data.regularMaxFrom = data.regularFrom;
      data.regularMax = regular;
      data.regularMaxTo = todayString;
    }
    db.set(`${msg.member.id}`, data).write();
    acts.point.changePoint(msg.guild, msg.member, {
      time: (new Date()).toISOString(),
      reason,
      change: point,
    });
  } else {
    icon = '🆖';
  }

  // Create embed
  const embed = acts.embed.create(`:sponge:  ${lndr.t(title)}`, lndr.dummy);
  embed.addField(`${icon}  ${lndr.t(description, point.toString())}`, lndr.dummy, false);
  embed.addField('연속 출석', `${regular}일\n${lndr.dummy}`, true);
  embed.addField('최장 연속 기록', `${data.regularMax}일\n\`${data.regularMaxFrom} ~ ${data.regularMaxTo}\`\n${lndr.dummy}`, true);
  embed.addField('총 출석일', `${data.count}일\n${lndr.dummy}`, true);
  embed.addField('출석 기록', lndr.t(`달력 형태로 볼 수 있는 이전과 같은 시스템이 개발 중에 있습니다.\n\`[[bot:prefix]]포인트\` 에서 기록을 봐 주세요.\n${lndr.dummy}`));
  embed.setFooter(lndr.t('[[res:guild.att.detail_contact]]'));
  embed.setColor(0xfd7f2c);
  msg.send(embed);
});

interface AttLog {
  date: string;
  wasFirst: boolean;
}

interface AttByUser {
  recent: string;
  regularFrom: string;
  regularMax: number;
  regularMaxFrom: string;
  regularMaxTo: string;
  count: number;
  log: AttLog[];
}

interface AttDB {
  [key: string]: AttByUser;
}
