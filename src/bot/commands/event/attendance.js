/* eslint-disable max-len */
import moment from 'moment';

moment.locale('ko');

export const meta = {
  /**
   * Module ID string without any whitespace. This is also used as one of callable
   * commands.
   * @type {string}
   */
  moduleID: 'eventAttendance',

  /**
   * Structured Help Message Format. If null, fallback text will be displayed.
   * @type {null|object}
   * @property {string} title
   * @property {string} description
   * @property {?object} fields Key will be the field title, values will be the body.
   * @property {?string[]} serverAdminPermissionRequired Names of fields which server
   *                                                     admin permission is required.
   * @property {?string[]} lndrAdminPermissionRequired Names of fields which leander
   *                                                   admin permission is required.
   */
  help: {
    title: '📆  출석 체크',
    description: '출석 체크 현황을 표시 및 관리합니다.',
    fields: {
      '출석 체크': '`[[prefix]]출석`',
      '출석 관리': '`[[prefix]]출석 [취소] (날짜) @멤버 [@멤버...]`',
    },
    serverAdminPermissionRequired: ['출석 관리'],
  },

  /**
   * A module must belong to one section. The first element will be appeared in `help`.
   * If nothing, this command will not be displayed in `help`.
   * @type {null|string}
   * @see module.js#sectionList
   */
  section: '이벤트',

  /**
   * A list of callable commands.
   */
  commands: ['출석', '출석체크', '출첵'],

  /**
  * Permissions for executing this this feature.
  * @type {object}
  * @property {?string[]} author Permitted author id list.
  * @property {?string[]} channel Permitted channel id list.
  * @property {?boolean} DM If undefined, this cond will be disabled.
  * @property {?boolean} serverAdmin If false or undefined, this cond will be disabled.
  * @property {?boolean} lndrAdmin If false or undefined, this cond will be disabled.
  */
  conditions: { DM: false },
};

/**
 * Frequently used module actions.
 * This can accessed from other modules via `lndr.acts.[moduleID][utilName]`.
 * @param {Kernel} kernel Waai kernel object.
 * @param {Lndr} lndr Leander object without `lndr.commands`, `lndr.acts` and
 *                    `lndr.helpEmbed`.
 *
 */
// eslint-disable-next-line no-unused-vars
export const actions = (kernel, lndr) => ({});

/**
 * Main function.
 * @param {Kernel} kernel Waai kernel object.
 * @param {Lndr} lndr Leander object.
 * @param {DISCORD.Message} msg Discord message object.
 */
// eslint-disable-next-line no-unused-vars
export const main = (kernel, lndr, pmsg) => {
  const msg = pmsg.raw;
  // Load existing attendance data
  const aData = lndr.loadGuildData(msg.guild, 'attendance');

  if (pmsg.arguments.length > 1) {
    // TODO: Implement this
    msg.channel.send('출석 관리 기능은 구현 예정입니다.');
  } else {
    // Get today
    const today = moment().format('YYYY/MM/DD');
    const tomorrow = moment().add(1, 'day');
    tomorrow.millisecond(0);
    tomorrow.second(0);
    tomorrow.minute(0);
    tomorrow.hour(0);

    // Show and register today's attendance
    const personalData = aData[msg.author.id] || {
      total: 0,
      serial: {
        start: '2019/01/01',
        count: 0,
      },
      recent: [],
    };

    // Check if today's attendance is checked
    const isTodayAttended = personalData.recent.includes(today);
    let isRecentYesterday = false;
    if (
      personalData.recent.length > 0
      && Math.floor(
        moment.duration(moment().diff(moment(
          new Date(personalData.recent[personalData.recent.length - 1]),
        ))).as('days'),
      ) === 1
    ) {
      isRecentYesterday = true;
    }

    // Check if it's today's first attendance
    let isTodaysFirst = true;
    if (aData.recentDate === today) {
      isTodaysFirst = false;
    }
    aData.recentDate = today;

    // Process today's attendance
    let todayMessage;
    if (!isTodayAttended) {
      // Process total count
      personalData.total += 1;

      // Process recent record
      personalData.recent.push(today);
      if (personalData.recent.length > 35) {
        personalData.recent = personalData.recent.slice(1);
      }

      // Process serial record & welcome message
      todayMessage = '✅  ';
      if (isRecentYesterday) {
        personalData.serial.count += 1;
        todayMessage += '어서오세요!';
      } else {
        personalData.serial.start = today;
        personalData.serial.count = 1;
        todayMessage += '와주셔서 고마워요!';
      }
      todayMessage += ' 오늘의 출석을 처리했어요.';

      if (isTodaysFirst) {
        todayMessage += '\n\n오늘의 출석 체크 1등이셔요! 🎉';
      }

      // Save new data
      aData[msg.author.id] = personalData;
      lndr.saveGuildData(msg.guild, aData, 'attendance');

      // Append point
      const pData = lndr.loadGuildData(msg.guild, 'points');
      if (!pData[msg.author.id]) {
        pData[msg.author.id] = { lp: 0, recent: [] };
      }
      pData[msg.author.id].lp += 50;
      pData[msg.author.id].recent.push(
        [today, `${moment().format('M/D')}일 출석 체크 보상`, 50, pData[msg.author.id].lp],
      );
      if (isTodaysFirst) {
        pData[msg.author.id].lp += 150;
        pData[msg.author.id].recent.push(
          [today, `${moment().format('M/D')}일 출석 체크 1등 보너스!`, 150, pData[msg.author.id].lp],
        );
      }
      if (personalData.serial.count > 0 && personalData.serial.count % 10 === 0) {
        pData[msg.author.id].lp += 500;
        pData[msg.author.id].recent.push(
          [today, `${personalData.serial.count}일 연속 출석 체크 보상`, 500, pData[msg.author.id].lp],
        );
      }
      if (pData[msg.author.id].recent.length > 30) {
        pData[msg.author.id].recent = pData[msg.author.id].recent.slice(
          pData[msg.author.id].recent.length - 30,
        );
      }
      lndr.saveGuildData(msg.guild, pData, 'points');
    } else {
      todayMessage = `오늘의 출석은 이미 처리했어요. 다음 출석은 ${tomorrow.from(moment())}에 하실 수 있어요.`;
    }

    // Create recent link
    const recentData = [];
    const todayMoment = moment();
    let iterMoment = todayMoment.clone().subtract(28 + todayMoment.day(), 'days');
    for (let i = 0; i < 35; i += 1) {
      // Start of a week
      if (i % 7 === 0) {
        recentData.push([]);
      }

      // Fill the record
      let dayRecord;
      if (personalData.recent.includes(iterMoment.format('YYYY/MM/DD'))) {
        dayRecord = '✅';
      } else if (iterMoment.isAfter(todayMoment)) {
        dayRecord = '-';
      } else {
        dayRecord = '❌';
      }

      // Append to the calendar
      recentData[recentData.length - 1].push(
        `<ruby><rt>${iterMoment.format('M/D')}</rt>${dayRecord}</ruby>`,
      );

      // Iterate
      iterMoment = iterMoment.add(1, 'day');
    }

    const wpCode = lndr.registerWebPage(
      lndr.composeHTML(
        `${lndr.from(msg)} 지휘관님의 출석 기록`,
        {
          type: 'text',
          data: '최근 한 달 간의 기록이에요.',
        },
        {
          type: 'table',
          data: {
            label: ['<div style="color:crimson">일</div>', '월', '화', '수', '목', '금', '<div style="color:navy">토</div>'],
            content: recentData,
          },
        },
        {
          type: 'padding',
          data: '60px',
        },
        {
          type: 'style',
          data: 'td { font-size: 1.5em !important; padding: 7px 11px !important; } ruby { display: inline-block; } rt { display: block; opacity: .6; padding-bottom: 5px; }',
        },
      ),
    );

    // Decorate embed
    const serialDate = moment(new Date(personalData.serial.start));
    const aEmbed = lndr.createEmbed(
      `💕  ${lndr.from(msg)} 지휘관님의 출석 기록`,
      `${personalData.total}일 동안 \`${msg.guild.name}\`와 함께 있어주셔서 감사드려요.${lndr.dummyLine}`,
      0xff517a,
      {
        title: todayMessage,
        body: lndr.dummyChar,
      },
      {
        title: '연속 출석일',
        body: personalData.serial.count === 1
          ? `오늘부터 **1일** 해요.${lndr.dummyLine}`
          : `${serialDate.format('M월 D일')}부터 **${personalData.serial.count}일** 연속 출석이에요.${lndr.dummyLine}`,
        inline: true,
      },
      {
        title: '출석 기록',
        body: `아래 링크에서 확인하실 수 있어요.\n${lndr.getWebPageURL(wpCode)}${lndr.dummyLine}`,
        inline: true,
      },
      '매일 50LP, 연속 10일로 500LP, 매일 1등은 150LP 보너스!',
    );

    // Send it to channel
    msg.channel.send(aEmbed);
  }
};
