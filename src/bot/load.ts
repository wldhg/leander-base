/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import './types';

import DISCORD from 'discord.js';

// import * as character from './character';
import * as commander from './commands';
import * as moduler from './modules';
import * as presence from './presence';

export const wakeUp = (core, lndrConf): void => {
  const lndr: LNDR = {
    config: lndrConf,
    cli: new DISCORD.Client(),
  };

  // Register exit callback
  core.onExit(() => {
    if (lndr.cli) {
      presence.off(core, lndr);
    }
  });

  // Initialize leander modules
  moduler.load(core, lndr)
  // Initialize leander commands
    .then((loadedModules) => {
      lndr.modules = loadedModules;
      lndr.m = loadedModules;
      //return command.load(core, lndr);
    })
  // Create required embeds, links
    //.then(([loadedCommands, loadedActions]) => {
      //lndr.commands = loadedCommands;
    //});
  // Turn on DISCORD, start processing messages

  // Initialize leander commands
  /*
  Promise.all([
    lndr = etc.init(kernel, lndr);
    lndr = web.init(kernel, lndr);
    lndr = dialog.init(kernel, lndr);
    lndr = embed.init(kernel, lndr);
    lndr = assistant.init(kernel, lndr);
    lndr = blhx.init(kernel, lndr);
    lndr = guild.init(kernel, lndr);
  ])

  // Load all features and prepare them
  const commandMap = {};
  const helpEmbedSource = {};
  let helpEmbed;
  module.load(kernel, lndr, './bot/commands')
    .then(([loadedCommands, loadedActions]) => {
      let realModuleCount = 0;
      kernel.log(`bot::wakeUp - ${loadedCommands.length} available modules found.`);

      // Prepare {helpEmbedSource}
      module.sectionList.forEach((sectionName) => {
        helpEmbedSource[sectionName] = [];
      });

      // Process raw command objects
      loadedCommands.forEach((cmd) => {
        if (cmd.main) {
          realModuleCount += 1;

          // Mapping commands
          if (cmd.commands) {
            for (let i = 0; i < cmd.commands.length; i += 1) {
              // Add to help source
              if (i === 0) {
                if (cmd.section === null) {
                  kernel.log(
                    `bot::wakeUp - A command will not be shown in help (null) : ${cmd.moduleID}`,
                  );
                } else if (module.sectionList.includes(cmd.section)) {
                  helpEmbedSource[cmd.section].push(cmd.commands[0]);
                } else {
                  kernel.log(
                    `bot::wakeUp - A command will not be shown in help (invalid section) : ${cmd.moduleID}`,
                  );
                }
              }

              // Add to command map
              commandMap[cmd.commands[i]] = cmd;
            }
          }
        }
      });

      lndr.acts = loadedActions;
      lndr.commands = commandMap;
      kernel.log(`bot::wakeUp - ${realModuleCount} modules are successfully mapped.`);
    })
    .then(() => {
      // Create help embed
      helpEmbed = lndr.createEmbed('<:lndrcircle:590238436758257719>  명령어 목록', '리엔더에게 아래의 명령어를 사용할 수 있어요.', 0xffe2ec);
      Object.keys(helpEmbedSource).forEach((key) => {
        helpEmbed.addField(`${lndr.dummyLine}${lndr.dummyLine}${key}`, `\`${helpEmbedSource[key].join('`, `')}\``);
      });
      helpEmbed.addField(lndr.dummyChar, `\`${lndr.prefix.general}도움말 [명령어]\`를 입력해서 각 명령어에 대한 도움말을 보실 수 있어요.`);
      helpEmbed.setFooter('지휘관님, 가끔은 제게 의지하셔도 괜찮다구요?');
      lndr.helpEmbed = helpEmbed;
    })
    .then(() => {
      // Make all actions recursive
      const actionGroups = Object.keys(lndr.acts);
      actionGroups.forEach((outerGroup) => {
        actionGroups.forEach((innerGroup) => {
          if (outerGroup !== innerGroup && !lndr.acts[outerGroup][innerGroup]) {
            lndr.acts[outerGroup][innerGroup] = lndr.acts[innerGroup];
          }
        });
      });
    })
    .then(() => {
      kernel.log('bot::wakeUp - Trying to log in...');

      // Turn on DISCORD
      lndr.cli.login(lndr.discord.token);
      lndr.cli.on('ready', () => {
        presence.on(kernel, lndr);
        kernel.log.okay(`bot::wakeUp - Successfully logged in: ${lndr.cli.user.tag}`);
      });

      // Process messages
      lndr.cli.on('message', (msg) => {
        try {
          if (msg.type !== 'DEFAULT') {
            //
          } else {
            // Default type message
            const msgContext = dialog.getContext(msg);
            if (msgContext) {
              // If in conversation, go to that conversation context
              dialog.continueConversation(msg, msgContext);
            } else if (msg.content.indexOf(lndr.prefix.assistant) === 0) {
              // Google Assistant part
              const pmsg = etc.parseMessageText(lndr.prefix.assistant, msg.content);
              if (!pmsg.serial && pmsg.rawContent.length > 0) {
                // Do assist
                assistant.addToWaitList(msg.channel, pmsg.rawContent);
              }
            } else if (msg.content.indexOf(lndr.prefix.general) === 0) {
              // Leander command part
              const pmsg = etc.parseMessageText(lndr.prefix.general, msg.content);
              pmsg.raw = msg;
              pmsg.send = (data) => msg.channel.send(data);
              pmsg.channel = msg.channel;
              pmsg.author = msg.author;
              pmsg.guild = msg.guild;
              pmsg.member = msg.member;

              if (pmsg.serial && commandMap[pmsg.command]) {
                const cmd = commandMap[pmsg.command];

                // Check admin conditions
                if (cmd.conditions.lndrAdmin && msg.author.id !== lndr.discord.adminID) {
                  return;
                }
                if (
                  cmd.conditions.serverAdmin
                  && msg.member
                  && !msg.member.hasPermission('ADMINISTRATOR')
                ) {
                  return;
                }

                // Check author condition
                if (cmd.conditions.author && cmd.conditions.author.length > 0) {
                  let partialPermissionEngagement = false;

                  cmd.conditions.author.forEach((author) => {
                    if (msg.author.id === author.toString()) {
                      partialPermissionEngagement = true;
                    }
                  });

                  if (!partialPermissionEngagement) {
                    return;
                  }
                }

                // Check channel condition
                if (cmd.conditions.channel && cmd.conditions.channel.length > 0) {
                  let partialPermissionEngagement = false;

                  cmd.conditions.channel.forEach((channel) => {
                    if (msg.channel.id === channel.toString()) {
                      partialPermissionEngagement = true;
                    }
                  });

                  if (!partialPermissionEngagement) {
                    return;
                  }
                }

                // Check DM condition
                if (
                  cmd.conditions.DM === false
                  && msg.channel instanceof DISCORD.DMChannel
                ) {
                  return;
                }
                if (
                  cmd.conditions.DM === true
                  && !(msg.channel instanceof DISCORD.DMChannel)
                ) {
                  return;
                }

                // If required process it
                const tempLndr = Object.assign({}, lndr);
                tempLndr.acts = lndr.acts[cmd.moduleID];
                cmd.main(kernel, tempLndr, pmsg);
              }
            }
          }
        } catch (cmdErr) {
          kernel.err.parse(`bot::onMessage - "${msg.content}"`)(cmdErr);
          kernel.log.debug({
            content: msg.content,
            channelID: msg.channel.id,
            authorID: msg.author.id,
            time: msg.createdTimestamp,
          });
          msg.channel.stopTyping(true);
        }
      });
    }); */
};
