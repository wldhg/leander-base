/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '기타',
  commands: ['도움말', '도움', 'help'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '🤷‍  도움말',
  description: 't:system.help.help',
};

export const fn: LNDRCommandFunction = (core, lndr, msg) => {
  const translate = (sentence: string): string => {
    let translated = '';
    if (sentence.indexOf('t:') === 0) {
      translated = lndr.t(sentence.substring(2));
    } else {
      translated = core.util.format(sentence, lndr.tDict);
    }
    return translated;
  };

  if (msg.arguments.length === 0) {
    msg.send(lndr.helpEmbed);
  } else {
    // Construct help embed
    const command = msg.arguments[0];
    const metaContent = lndr.meta[command];
    const helpContent = lndr.help[command];

    if (helpContent) {
      // Put content to the embed
      const helpEmbed = lndr.embed.create(translate(helpContent.title));

      let needsServerAdminPermission = false;
      let needsLndrAdminPermission = false;

      if (helpContent.description || helpContent.fields) {
        if (helpContent.description) {
          helpEmbed.setDescription(`${translate(helpContent.description)}\n${lndr.dummy}`);
        } else {
          helpEmbed.setDescription(lndr.dummy);
        }

        // Put fields
        if (helpContent.fields) {
          Object.keys(helpContent.fields).forEach((title) => {
            // Get title
            let fieldTitle = title.length > 0 ? `${translate(title)} ` : `${lndr.dummy} `;
            if (
              helpContent.forServerAdmin instanceof Array
              && helpContent.forServerAdmin.includes(title)
            ) {
              fieldTitle += '👑';
              needsServerAdminPermission = true;
            }
            if (
              helpContent.forLndrAdmin instanceof Array
              && helpContent.forLndrAdmin.includes(title)
            ) {
              fieldTitle += '🔧';
              needsLndrAdminPermission = true;
            }
            fieldTitle = core.util.format(fieldTitle, lndr.tDict);

            // Get body
            const fieldBody = `${translate(helpContent.fields[title])}\n${lndr.dummy}`;

            // Go, field!
            helpEmbed.addField(fieldTitle, fieldBody, true);
          });
        }
      } else {
        helpEmbed.setDescription(`${lndr.t('system.help.no_content')}\n${lndr.dummy}`);
      }

      // Put permission message
      if (metaContent) {
        let permissionMessage = '';
        if (metaContent.conditions.DM === true) {
          permissionMessage += `${lndr.t('system.help.only_dm')}\n`;
        } else if (metaContent.conditions.DM === false) {
          permissionMessage += `${lndr.t('system.help.not_dm')}\n`;
        }
        if (metaContent.conditions.lndrAdmin === true) {
          permissionMessage += `${lndr.t('system.help.only_lndrAdmin')}\n`;
        }
        if (metaContent.conditions.guildAdmin === true) {
          permissionMessage += `${lndr.t('system.help.only_guildAdmin')}\n`;
        }
        if (
          metaContent.conditions.author
          && metaContent.conditions.author.length > 0
        ) {
          permissionMessage += `${lndr.t('system.help.some_author')}\n`;
        }
        if (
          metaContent.conditions.channel
          && metaContent.conditions.channel.length > 0
        ) {
          permissionMessage += `${lndr.t('system.help.some_channel')}\n`;
        }
        if (
          metaContent.conditions.guild
          && metaContent.conditions.guild.length > 0
        ) {
          permissionMessage += `${lndr.t('system.help.some_guild')}\n`;
        }
        if (needsServerAdminPermission) {
          permissionMessage += `👑 : ${lndr.t('system.help.need_guildAdmin')}\n`;
        }
        if (needsLndrAdminPermission) {
          permissionMessage += `🔧 : ${lndr.t('system.help.need_lndrAdmin')}\n`;
        }
        if (permissionMessage.length > 0) {
          helpEmbed.addField('**─**', `${permissionMessage.trim()}`);
        }
      }

      // Finalioze and send help embed
      helpEmbed.setColor(0xe5a9c3);
      helpEmbed.setFooter(`${metaContent.section === null ? '알 수 없음' : metaContent.section} > ${command}`);
      msg.send(helpEmbed);
    } else {
      msg.send(lndr.t('system.help.no_command', command));
    }
  }
};
