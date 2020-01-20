/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '기타',
  commands: ['도움말', '도움', 'help'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '🤷‍  도움말',
  description: '각종 명령어와 언어에 대해 도움말을 표시합니다.\n`[[prefix]]도움말`을 입력하면 전체 명령어 목록을 볼 수 있습니다.',
};

export const fn: LNDRCommandFunction = (core, lndr, msg) => {
  if (msg.arguments.length === 0) {
    msg.send(lndr.helpEmbed);
  } else {
    // Define formatting constant
    const format = { prefix: lndr.config.prefix };

    // Construct help embed
    const command = msg.arguments[0];
    const helpContent = lndr.help[command];

    if (helpContent) {
      // Put content to the embed
      const helpEmbed = lndr.embed.create(helpContent.title);
      helpEmbed.setDescription(helpContent.description);

      let needsServerAdminPermission = false;
      let needsLndrAdminPermission = false;
      if (helpContent === null) {
        helpEmbed.setDescription(
          commandObject.help
            ? core.util.format(commandObject.help, format)
            : '이 명령어는 따로 도움말이 없습니다.',
        );
      } else {
        // Put description
        if (helpContent.description) {
          helpEmbed.setDescription(
            core.util.format(`${helpContent.description}\n${lndr.dummy}`, format),
          );
        } else {
          helpEmbed.setDescription(lndr.dummyChar);
        }

        // Put fields
        if (helpContent.fields) {
          Object.keys(helpContent.fields).forEach((title) => {
            // Get title
            let fieldTitle = title.length > 0 ? `${title} ` : `${lndr.dummy} `;
            if (
              helpContent.serverAdminPermissionRequired instanceof Array
              && helpContent.serverAdminPermissionRequired.includes(title)
            ) {
              fieldTitle += '👑';
              needsServerAdminPermission = true;
            }
            if (
              helpContent.lndrAdminPermissionRequired instanceof Array
              && helpContent.lndrAdminPermissionRequired.includes(title)
            ) {
              fieldTitle += '🔧';
              needsLndrAdminPermission = true;
            }
            fieldTitle = core.util.format(fieldTitle, format);

            // Get body
            const fieldBody = core.util.format(
              `${helpContent.fields[title]}\n${lndr.dummy}`,
              format,
            );

            // Go, field!
            helpEmbed.addField(fieldTitle, fieldBody, true);
          });
        }
      }

      // Put permission message
      if (commandObject.help) {
        let permissionMessage = '';
        if (commandObject.conditions.DM === true) {
          permissionMessage += '이 명령어는 DM 채널에서만 사용할 수 있어요.\n';
        } else if (commandObject.conditions.DM === false) {
          permissionMessage += 'DM 채널에서는 이 명령어를 사용할 수 없어요.\n';
        }
        if (commandObject.conditions.lndrAdmin === true) {
          permissionMessage += '이 명령어는 리엔더 관리자만이 사용할 수 있어요.\n';
        }
        if (commandObject.conditions.serverAdmin === true) {
          permissionMessage += '이 명령어는 디스코드 서버 관리자만이 사용할 수 있어요.\n';
        }
        if (
          commandObject.conditions.author
          && commandObject.conditions.author.length > 0
        ) {
          permissionMessage += '이 명령어는 특정 지휘관님만 사용할 수 있어요.\n';
        }
        if (
          commandObject.conditions.channel
          && commandObject.conditions.channel.length > 0
        ) {
          permissionMessage += '이 명령어는 특정 채널에서만 사용할 수 있어요.\n';
        }
        if (needsServerAdminPermission) {
          permissionMessage += '👑 : 디스코드 서버 관리자 권한이 필요해요.\n';
        }
        if (needsLndrAdminPermission) {
          permissionMessage += '🔧 : 리엔더 관리자 권한이 필요해요.\n';
        }
        if (permissionMessage.length > 0) {
          helpEmbed.addField('**─**', `${permissionMessage.trim()}`);
        }
      }

      // Finalioze and send help embed
      helpEmbed.setColor(0xe5a9c3);
      helpEmbed.setFooter(`${commandObject.section === null ? '기타' : commandObject.section} > ${command}`);
      msg.send(helpEmbed);
    } else {
      msg.send(`\`${command}\`는 없는 명령어에요. 다시 확인해주시겠어요?`);
    }
  }
};
