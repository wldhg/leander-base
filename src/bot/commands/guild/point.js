import moment from 'moment';

export const meta = {
  /**
   * Module ID string without any whitespace. This is also used as one of callable
   * commands.
   * @type {string}
   */
  moduleID: 'guildPoint',

  /**
   * Structured Help Message Format. If null, fallback text will be displayed.
   * @type {null|object}
   * @property {string} title
   * @property {string} description
   * @property {?object} fields Key will be the field title, values will be the body.
   * @property {?string[]} serverAdminPermissionRequired Names of fields which server
   *                                                    admin permission is required.
   * @property {?string[]} lndrAdminPermissionRequired Names of fields which leander
   *                                                  admin permission is required.
   */
  help: {
    title: '🔰  리엔더 포인트',
    description: '함대에서 사용하는 포인트 제도입니다.',
    fields: {
      '포인트 보기': '`[[prefix]]포인트`',
      '포인트 수정': '`[[prefix]]포인트 [+-]양 @멤버 [@멤버...]`',
    },
    serverAdminPermissionRequired: ['포인트 수정'],
  },

  /**
   * A module must belong to one section. The first element will be appeared in `help`.
   * If nothing, this command will not be displayed in `help`.
   * @type {null|string}
   * @see module.js#sectionList
   */
  section: '함대 커뮤니티',

  /**
   * A list of callable commands.
   */
  commands: ['포인트', 'LP'],

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
 */
// eslint-disable-next-line no-unused-vars
export const actions = (kernel, lndr) => ({
  safelyGetPointObject: (pointData, id) => (
    pointData[id] ? pointData[id] : { lp: 0, recent: [] }
  ),
  getPoint: (guild, userIDs) => {
    // Load point data
    const pointData = lndr.loadGuildData(guild, 'points');

    // Set targets and return values
    let targetValue;
    if (!userIDs) {
      targetValue = pointData;
    } else if (userIDs instanceof Array) {
      targetValue = {};

      userIDs.forEach((id) => {
        targetValue[id] = actions(kernel, lndr).safelyGetPointObject(pointData, id);
      });
    } else {
      targetValue = actions(kernel, lndr).safelyGetPointObject(pointData, userIDs);
    }

    return targetValue;
  },
  modifyPoint: (guild, userIDs, amount, reason) => {
    // Set modification target
    let targets;
    if (userIDs instanceof Array) {
      targets = userIDs;
    } else {
      targets = [userIDs];
    }

    // Load point data
    const pointData = actions(kernel, lndr).getPoint(guild);

    // Change each point data
    targets.forEach((target) => {
      const targetPointData = actions(kernel, lndr).safelyGetPointObject(pointData, target);
      targetPointData.lp += amount;
      targetPointData.recent.push([
        moment().format('YYYY/MM/DD'),
        reason,
        amount,
        targetPointData.lp,
      ]);

      if (targetPointData.recent.length > 30) {
        targetPointData.recent = targetPointData.recent.slice(1);
      }

      pointData[target] = targetPointData;
    });

    return lndr.saveGuildData(guild, pointData, 'points');
  },
});

/**
 * Main function.
 * @param {Kernel} kernel Waai kernel object.
 * @param {Lndr} lndr Leander object.
 * @param {DISCORD.Message} msg Discord message object.
 */
// eslint-disable-next-line no-unused-vars
export const main = (kernel, lndr, msg) => {
  if (msg.arguments.length > 1) {
    // Change point
    const change = Number.parseInt(msg.arguments[0], 10);
    const changeMessage = change > 0 ? '적립' : '사용';
    let targets = msg.arguments.slice(1);

    msg.send(`총 \`${targets.length}\`분 지휘관님의 리엔더 포인트를 \`${Math.abs(change)}\` ${changeMessage}하려고 해요.\n\`취소\` 혹은 변경 사유를 말해주세요.`);
    lndr.startConversation(msg.raw, (omsg, nmsg) => {
      if (nmsg.content === '취소') {
        nmsg.channel.send('포인트를 변경하지 않고 취소했어요.');
      } else {
        targets = targets.map(target => target.substring(2, target.length - 1));
        lndr.acts.modifyPoint(msg.guild, targets, change, nmsg.content)
          .then(() => {
            nmsg.channel.send('포인트 기록을 말씀하신대로 변경했어요.');
          });
      }
      return true;
    });
  } else {
    // Show point
    // Convert date format
    const dateRegex = /(\d{4})\/(\d{2})\/(\d{2})/;
    const targetData = lndr.acts.getPoint(msg.guild, msg.author.id);
    for (let i = 0; i < targetData.recent.length; i += 1) {
      // Change data format
      const parsedDate = dateRegex.exec(targetData.recent[i][0]);
      targetData.recent[i][0] = `${parsedDate[1]}년 ${Number.parseInt(parsedDate[2], 10)}월 ${Number.parseInt(parsedDate[3], 10)}일`;

      // Append plus symbol
      if (targetData.recent[i][2] > 0) {
        targetData.recent[i][2] = `+${targetData.recent[i][2]}`;
      }
    }

    // Create history page
    const wpCode = lndr.registerWebPage(
      lndr.composeHTML(
        `${lndr.from(msg.raw)} 지휘관님의 포인트 변경 내역`,
        {
          type: 'text',
          data: '최근 30회의 변경 내역만 기록됩니다.',
        },
        {
          type: 'table',
          data: {
            label: ['날짜', '사유', '변동 P', '누적 P'],
            content: targetData.recent,
          },
        },
        {
          type: 'padding',
          data: '60px',
        },
      ),
    );

    // Create point embed
    const pointEmbed = lndr.createEmbed(
      `💰 ${lndr.from(msg.raw)} 지휘관님의 포인트!`,
      lndr.dummyLine,
      0xf4d442,
      {
        title: '현재 포인트',
        body: `\`${targetData.lp}\` 점${lndr.dummyLine}`,
        inline: true,
      },
      {
        title: '변경 내역',
        body: `아래 링크에서 확인하실 수 있어요.\n${lndr.getWebPageURL(wpCode)}${lndr.dummyLine}`,
        inline: true,
      },
      '제공된 링크는 한 시간 뒤 만료됩니다.',
    );

    // Send
    msg.channel.send(pointEmbed);
  }
};
