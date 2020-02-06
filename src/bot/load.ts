/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import './types';

import * as DISCORD from 'discord.js';
import * as commander from './commands';
import { checkPerm, MessageType, parseMessageText } from './message';
import * as moduler from './modules';
import * as presence from './presence';
import * as translate from './translate';

export const wakeUp = (core, lndrConf): void => {
  const lndr: LNDR = {
    config: lndrConf,
    cli: new DISCORD.Client(),
    dummy: '\u200B',
    t: translate.getT(core, lndrConf),
    tDict: translate.botDict,
    fn: {},
    help: {},
    meta: {},
    hooks: {},
  };

  // Register exit callback
  core.onExit(() => {
    if (lndr.cli && lndr.cli.user) {
      presence.off(core, lndr);
    }
  });

  // Read leander modules
  moduler.load(core, lndr)
  // Initialize leander modules, read leander commands
    .then((loadedModules) => {
      loadedModules.forEach((aModule) => {
        lndr[aModule.name] = aModule.acts;
        if (aModule.hooks) {
          aModule.hooks.forEach((hook) => {
            if (!lndr.hooks[hook.on]) {
              lndr.hooks[hook.on] = [hook];
            } else {
              lndr.hooks[hook.on].push(hook);
            }
          });
        }
      });
      lndr.modules = loadedModules;
      core.log.info(`${Object.keys(loadedModules).length} 개의 모듈이 로드되었습니다.`);
      return commander.load(core, lndr);
    })
  // Initialize leander commands with compose help structure
    .then((loadedCommands: LNDRCommand[]) => {
      const helpStructure = {};
      loadedCommands.forEach((aCommand) => {
        if (aCommand.meta.commands.length > 0) {
          if (aCommand.meta.section && aCommand.meta.section.length > 0) {
            if (!helpStructure[aCommand.meta.section]) {
              helpStructure[aCommand.meta.section] = [];
            }
            helpStructure[aCommand.meta.section].push(aCommand.meta.commands[0]);
          } else {
            core.log.warn(`명령어 모음(전체 도움말)에 표시되지 않는 명령어가 있습니다: ${aCommand.meta.commands.join(', ')}`);
          }
        } else {
          core.log.warn(`접근할 수 없는 명령어가 있습니다: ${aCommand.help.title}`);
        }
        aCommand.meta.commands.forEach((cmd) => {
          lndr.fn[cmd] = aCommand.fn;
          lndr.help[cmd] = aCommand.help;
          lndr.meta[cmd] = aCommand.meta;
        });
      });
      lndr.commands = loadedCommands;
      core.log.info(`${loadedCommands.length} 개의 명령어가 로드되었습니다.`);
      core.log.info(`${Object.keys(lndr.fn).length} 개의 명령어 키워드가 등록되었습니다.`);
      return helpStructure;
    })
  // Create help embed
    .then((helpStructure) => {
      lndr.helpEmbed = new DISCORD.RichEmbed({
        title: lndr.t('bot.help.h1'),
        description: `${lndr.t('bot.help.h2')}\n${lndr.dummy}`,
        color: 0xffe2ec,
      });
      Object.keys(helpStructure).forEach((key) => {
        lndr.helpEmbed.addField(key, `\`${helpStructure[key].join('`, `')}\`\n${lndr.dummy}`);
      });
      lndr.helpEmbed.addField(lndr.dummy, lndr.t('bot.help.footer'));
      lndr.helpEmbed.setFooter(lndr.t('bot.help.message'));
    })
  // Turn on DISCORD, start processing messages
    .then(() => {
      lndr.cli.login(lndr.config.discord.token);
      lndr.cli.on('ready', () => {
        presence.on(core, lndr);
        core.log.okay(`디스코드 봇 계정으로 로그인하였습니다: ${lndr.cli.user.tag}`);
        core.log.info(`지금부터 메시지를 처리하겠습니다. 명령어 접두사는 ${lndr.config.prefix} 입니다.`);
      });
      lndr.cli.on('message', (msg) => {
        try {
          switch (msg.type) {
            case 'RECIPIENT_ADD': {
              if (lndr.hooks[MessageType.RECIPIENT_ADD]) {
                const hooks = lndr.hooks[MessageType.RECIPIENT_ADD];
                for (let i = 0; i < hooks.length; i += 1) {
                  if (hooks[i].checker(msg)) {
                    hooks[i].fn(msg);
                    return;
                  }
                }
              }
              break;
            }

            case 'RECIPIENT_REMOVE': {
              if (lndr.hooks[MessageType.RECIPIENT_REMOVE]) {
                const hooks = lndr.hooks[MessageType.RECIPIENT_REMOVE];
                for (let i = 0; i < hooks.length; i += 1) {
                  if (hooks[i].checker(msg)) {
                    hooks[i].fn(msg);
                    return;
                  }
                }
              }
              break;
            }

            case 'CALL': {
              if (lndr.hooks[MessageType.CALL]) {
                const hooks = lndr.hooks[MessageType.CALL];
                for (let i = 0; i < hooks.length; i += 1) {
                  if (hooks[i].checker(msg)) {
                    hooks[i].fn(msg);
                    return;
                  }
                }
              }
              break;
            }

            case 'CHANNEL_NAME_CHANGE': {
              if (lndr.hooks[MessageType.CHANNEL_NAME_CHANGE]) {
                const hooks = lndr.hooks[MessageType.CHANNEL_NAME_CHANGE];
                for (let i = 0; i < hooks.length; i += 1) {
                  if (hooks[i].checker(msg)) {
                    hooks[i].fn(msg);
                    return;
                  }
                }
              }
              break;
            }

            case 'CHANNEL_ICON_CHANGE': {
              if (lndr.hooks[MessageType.CHANNEL_ICON_CHANGE]) {
                const hooks = lndr.hooks[MessageType.CHANNEL_ICON_CHANGE];
                for (let i = 0; i < hooks.length; i += 1) {
                  if (hooks[i].checker(msg)) {
                    hooks[i].fn(msg);
                    return;
                  }
                }
              }
              break;
            }

            case 'PINS_ADD': {
              if (lndr.hooks[MessageType.PINS_ADD]) {
                const hooks = lndr.hooks[MessageType.PINS_ADD];
                for (let i = 0; i < hooks.length; i += 1) {
                  if (hooks[i].checker(msg)) {
                    hooks[i].fn(msg);
                    return;
                  }
                }
              }
              break;
            }

            case 'GUILD_MEMBER_JOIN': {
              if (lndr.hooks[MessageType.GUILD_MEMBER_JOIN]) {
                const hooks = lndr.hooks[MessageType.GUILD_MEMBER_JOIN];
                for (let i = 0; i < hooks.length; i += 1) {
                  if (hooks[i].checker(msg)) {
                    hooks[i].fn(msg);
                    return;
                  }
                }
              }
              break;
            }

            case 'DEFAULT': {
              if (lndr.hooks[MessageType.DEFAULT]) {
                const hooks = lndr.hooks[MessageType.DEFAULT];
                for (let i = 0; i < hooks.length; i += 1) {
                  if (hooks[i].checker(msg)) {
                    hooks[i].fn(msg);
                    return;
                  }
                }
              }
              if (msg.content.indexOf(lndr.config.prefix) === 0) {
                // Leander command part
                const pmsg = parseMessageText(lndr.config.prefix, msg.content);
                pmsg.raw = msg;
                pmsg.send = (data): Promise<DISCORD.Message | DISCORD.Message[]> => msg.channel
                  .send(data);
                pmsg.channel = msg.channel;
                pmsg.author = msg.author;
                pmsg.guild = msg.guild;
                pmsg.member = msg.member;

                if (pmsg.serial && lndr.fn[pmsg.command]) {
                  const fn = lndr.fn[pmsg.command];
                  const meta = lndr.meta[pmsg.command];

                  // Check admin conditions
                  if (
                    (meta.conditions.lndrAdmin && msg.author.id !== lndr.config.discord.adminID)
                    || (meta.conditions.guildAdmin && msg.member && !msg.member.hasPermission('ADMINISTRATOR'))
                  ) return;

                  // Check author condition
                  if (meta.conditions.author && meta.conditions.author.length > 0) {
                    if (!checkPerm(meta.conditions.author, msg.author.id)) return;
                  }

                  // Check channel condition
                  if (meta.conditions.channel && meta.conditions.channel.length > 0) {
                    if (!checkPerm(meta.conditions.channel, msg.channel.id)) return;
                  }

                  // Check guild condition
                  if (msg.guild && meta.conditions.guild && meta.conditions.guild.length > 0) {
                    if (!checkPerm(meta.conditions.guild, msg.guild.id)) return;
                  }

                  // Check DM condition
                  if (
                    (meta.conditions.DM === false && msg.channel instanceof DISCORD.DMChannel)
                    || (meta.conditions.DM === true && !(msg.channel instanceof DISCORD.DMChannel))
                  ) return;

                  // Process command
                  const tempLndr = { ...lndr };
                  fn(core, tempLndr, pmsg);
                }
              }
              break;
            }

            default: {
              throw new Error(`예상하지 못한 메시지 종류입니다: ${msg.type}`);
            }
          }
        } catch (cmdErr) {
          core.err.parse(`메시지 처리에 오류가 발생했습니다: "${msg.content}"`, 'silent')(cmdErr);
          core.log.debug({
            content: msg.content,
            channelID: msg.channel.id,
            authorID: msg.author.id,
            time: msg.createdTimestamp,
          });
          msg.channel.stopTyping(true);
        }
      });
    });
};
