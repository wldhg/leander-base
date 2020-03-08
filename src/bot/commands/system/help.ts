/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export const meta: LNDRCommandMeta = {
  section: '기타',
  commands: ['도움말', '도움', 'help'],
  conditions: {},
};

export const help: LNDRCommandHelp = {
  title: '🤷‍  도움말',
  description: '[[res:system.help.help]]',
};

export const deps: LNDRCommandDeps = ['embed'];

export const fn: LNDRCommandFunction = (lndr, acts, msg) => {
  if (msg.arguments.length === 0) {
    msg.send(lndr.helpEmbed);
  } else {
    // Construct help embed
    const command = msg.arguments[0];
    const metaContent = lndr.meta[command];
    const helpContent = lndr.help[command];

    if (helpContent) {
      // Put content to the embed
      const helpEmbed = acts.embed.create(lndr.t(helpContent.title));

      let needsServerAdminPermission = false;
      let needsLndrAdminPermission = false;

      if (helpContent.description || helpContent.fields) {
        if (helpContent.description) {
          helpEmbed.setDescription(`${lndr.t(helpContent.description)}\n${lndr.dummy}`);
        } else {
          helpEmbed.setDescription(lndr.dummy);
        }

        // Put fields
        if (helpContent.fields) {
          Object.keys(helpContent.fields).forEach((title) => {
            // Get title
            let fieldTitle = title.length > 0 ? `${lndr.t(title)} ` : `${lndr.dummy} `;
            if (
              helpContent.forServerAdmin instanceof Array
              && helpContent.forServerAdmin.includes(title)
            ) {
              fieldTitle += '<:perm_crown:686271699540377735>';
              needsServerAdminPermission = true;
            }
            if (
              helpContent.forLndrAdmin instanceof Array
              && helpContent.forLndrAdmin.includes(title)
            ) {
              fieldTitle += '🔧';
              needsLndrAdminPermission = true;
            }
            fieldTitle = lndr.util.format(fieldTitle, lndr.tDict);

            // Get body
            const fieldBody = `${lndr.t(helpContent.fields[title])}\n${lndr.dummy}`;

            // Go, field!
            helpEmbed.addField(fieldTitle, fieldBody, true);
          });
        }
      } else {
        helpEmbed.setDescription(`${lndr.t('[[res:system.help.no_content]]')}\n${lndr.dummy}`);
      }

      // Put permission message
      if (metaContent) {
        let permissionMessage = '';
        if (metaContent.conditions.DM === true) {
          permissionMessage += `${lndr.t('[[res:system.help.only_dm]]')}\n`;
        } else if (metaContent.conditions.DM === false) {
          permissionMessage += `${lndr.t('[[res:system.help.not_dm]]')}\n`;
        }
        if (metaContent.conditions.lndrAdmin === true) {
          permissionMessage += `${lndr.t('[[res:system.help.only_lndrAdmin]]')}\n`;
        }
        if (metaContent.conditions.guildAdmin === true) {
          permissionMessage += `${lndr.t('[[res:system.help.only_guildAdmin]]')}\n`;
        }
        if (
          metaContent.conditions.author
          && metaContent.conditions.author.length > 0
        ) {
          permissionMessage += `${lndr.t('[[res:system.help.some_author]]')}\n`;
        }
        if (
          metaContent.conditions.channel
          && metaContent.conditions.channel.length > 0
        ) {
          permissionMessage += `${lndr.t('[[res:system.help.some_channel]]')}\n`;
        }
        if (
          metaContent.conditions.guild
          && metaContent.conditions.guild.length > 0
        ) {
          permissionMessage += `${lndr.t('[[res:system.help.some_guild]]')}\n`;
        }
        if (needsServerAdminPermission) {
          permissionMessage += `<:perm_crown:686271699540377735> : ${lndr.t('[[res:system.help.need_guildAdmin]]')}\n`;
        }
        if (needsLndrAdminPermission) {
          permissionMessage += `🔧 : ${lndr.t('[[res:system.help.need_lndrAdmin]]')}\n`;
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
      msg.send(lndr.t('[[res:system.help.no_command]]', command));
    }
  }
};
