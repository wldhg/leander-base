/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import './types';
import './modules/types';

import * as DISCORD from 'discord.js';
import * as config from './config';
import * as commander from './commands';
import * as serverlock from './serverlock';
import { checkPerm, MessageType, parseMessageText } from './message';
import * as moduler from './modules';
import * as presence from './presence';
import * as translate from './translate';

const procMessageHook = (core: AppCore, lndr: LNDRBase, msg: DISCORD.Message, msgType: MessageType):
  Promise<LNDRModuleHookCheckResult> => new Promise((resolve) => {
  if (lndr.hooks[msgType]) {
    const hooks = lndr.hooks[msgType];
    const chks = [];
    for (let i = 0; i < hooks.length; i += 1) {
      chks.push(hooks[i].checker(msg));
    }
    Promise.all(chks).then((chkRes: LNDRModuleHookCheckResult[]) => {
      let isResolved = false;
      let isTriggered = false;
      for (let i = 0; i < chkRes.length; i += 1) {
        if (chkRes[i].triggered) {
          hooks[i].fn(msg);
          if (chkRes[i].preventDefault) {
            resolve({
              triggered: true,
              preventDefault: true,
            });
            isResolved = true;
          }
          isTriggered = true;
        }
      }
      if (!isResolved) {
        resolve({
          triggered: isTriggered,
          preventDefault: false,
        });
      }
    });
  } else {
    resolve({
      triggered: false,
      preventDefault: false,
    });
  }
}).then((procRes: LNDRModuleHookCheckResult) => {
  if (lndr.cli.user.presence.status === 'idle' && procRes.triggered) {
    presence.ping(core, lndr);
  }
  return procRes;
});

export const wakeUp = (core: AppCore, lndrConf: LNDRConfig): void => {
  const lndr: LNDRBase = {
    config: lndrConf,
    cli: new DISCORD.Client({
      retryLimit: 3,
      presence: { status: 'dnd' },
    }),
    pkg: core.config,
    serverlock,
    dummy: '\u200B',
    t: translate.getT(core, lndrConf),
    tDict: translate.botDict,
    tBatchim: translate.krBatchimTest,
    fn: {},
    help: {},
    meta: {},
    hooks: {},
  };

  const acts: LNDRActs = {};

  // Register exit callback
  core.onExit(() => new Promise((resolve) => {
    presence.off(core, lndr).then((pres: DISCORD.Presence|null) => {
      if (pres !== null) {
        // Make log
        core.log.info('상태 메시지 없이 오프라인으로 보이게 전환하였습니다.');
        resolve(pres);
      } else {
        resolve();
      }
    });
  }));

  // Check LNDR Configuration
  config.check(core, lndrConf)
  // Read leander modules
    .then(() => moduler.load(core, lndr))
  // Initialize leander modules, read leander commands
    .then((loadedModules) => {
      const moduleNames: string[] = [];
      loadedModules.forEach((aModule) => {
        moduleNames.push(aModule.name);
        acts[aModule.name] = aModule.acts;
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
      return commander.load(core, lndr, moduleNames);
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
      core.log.info(`${loadedCommands.length} 개의 명령어를 불러왔습니다.`);
      core.log.info(`${Object.keys(lndr.fn).length} 개의 명령어 키워드를 받을 예정입니다.`);
      return helpStructure;
    })
  // Create help embed
    .then((helpStructure) => {
      lndr.helpEmbed = new DISCORD.MessageEmbed({
        title: lndr.t('[[res:bot.help.h1]]'),
        description: `${lndr.t('[[res:bot.help.h2]]')}\n${lndr.dummy}`,
        color: 0xffe2ec,
      });
      const helpSections = Object.keys(helpStructure);
      helpSections.forEach((key, idx) => {
        lndr.helpEmbed.addField(
          key,
          `\`${helpStructure[key].join('`, `')}\`\n${
            idx === (helpSections.length - 1) ? '' : lndr.dummy
          }`,
          false,
        );
      });
      lndr.helpEmbed.addField(lndr.dummy, lndr.t('[[res:bot.help.footer]]'));
      lndr.helpEmbed.setFooter(lndr.t('[[res:bot.help.message]]'));
      core.log.info('불러온 명령어로부터 도움말 메시지를 생성하였습니다.');
    })
  // Turn on DISCORD, start processing messages
    .then(() => {
      // Do login
      core.log.info('디스코드 봇 계정으로 로그인을 시도하고 있습니다.');
      lndr.cli.login(lndr.config.discord.token);
      lndr.cli.on('ready', () => {
        presence.init(core, lndr).then(() => {
          core.log.okay('봇 상태 메시지 초기화를 완료하였습니다.');
        });
        core.log.okay(`디스코드 봇 계정으로 로그인하였습니다: ${lndr.cli.user.tag}`);
        core.log.info(`초대 링크는 다음과 같습니다: https://discordapp.com/oauth2/authorize?client_id=${lndr.config.discord.clientID}&scope=bot&permissions=${lndr.config.discord.permission}`);
        if (lndr.config.serverlock) {
          core.log.warn(`서버 제한이 설정되었습니다. ${lndr.config.serverlock.length}개의 서버에서만 반응합니다.`);
        }
        core.log.info(`지금부터 메시지를 처리하겠습니다. 명령어 접두사는 ${lndr.config.prefix} 입니다.`);
      });

      // Prepare for message handling
      lndr.cli.on('message', (msg: DISCORD.Message) => {
        // Ignore if is from bot
        if (msg.author.bot) {
          return;
        }

        // Check serverlock
        if (lndr.config.serverlock) {
          if (msg.guild && !(lndr.config.serverlock.includes(msg.guild.id))) {
            return;
          }
          if (msg instanceof DISCORD.DMChannel && !(serverlock.isException(msg.author.id))) {
            return;
          }
        }

        // Response
        try {
          switch (msg.type) {
            case 'RECIPIENT_ADD': {
              procMessageHook(core, lndr, msg, MessageType.RECIPIENT_ADD);
              break;
            }

            case 'RECIPIENT_REMOVE': {
              procMessageHook(core, lndr, msg, MessageType.RECIPIENT_REMOVE);
              break;
            }

            case 'CALL': {
              procMessageHook(core, lndr, msg, MessageType.CALL);
              break;
            }

            case 'CHANNEL_NAME_CHANGE': {
              procMessageHook(core, lndr, msg, MessageType.CHANNEL_NAME_CHANGE);
              break;
            }

            case 'CHANNEL_ICON_CHANGE': {
              procMessageHook(core, lndr, msg, MessageType.CHANNEL_ICON_CHANGE);
              break;
            }

            case 'PINS_ADD': {
              procMessageHook(core, lndr, msg, MessageType.PINS_ADD);
              break;
            }

            case 'GUILD_MEMBER_JOIN': {
              procMessageHook(core, lndr, msg, MessageType.GUILD_MEMBER_JOIN);
              break;
            }

            case 'DEFAULT': {
              procMessageHook(core, lndr, msg, MessageType.DEFAULT).then(({
                preventDefault,
              }) => {
                if (!preventDefault && msg.content.indexOf(lndr.config.prefix) === 0) {
                // Leander command part
                  const pmsg = parseMessageText(lndr.config.prefix, msg.content);
                  pmsg.raw = msg;
                  pmsg.send = (data): Promise<DISCORD.Message | DISCORD.Message[]> => msg.channel
                    .send(data);
                  pmsg.reply = (data): Promise<DISCORD.Message> => msg.channel.send(
                    lndr.t(`${acts.tools.mention(msg.author)} [[bot:addressing]]님, ${data}`),
                  );
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
                      (
                        meta.conditions.DM === false && msg.channel instanceof DISCORD.DMChannel
                      ) || (
                        meta.conditions.DM === true && !(msg.channel instanceof DISCORD.DMChannel)
                      )
                    ) return;

                    // Process command
                    const tempLndr: LNDR = {
                      ...lndr,
                      version: core.config.version,
                      log: core.log,
                      util: core.util,
                    };
                    fn(tempLndr, acts, pmsg);
                    presence.ping(core, lndr);
                  }
                }
              });
              break;
            }

            case 'USER_PREMIUM_GUILD_SUBSCRIPTION':
            case 'USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1':
            case 'USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2':
            case 'USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3':
            case 'CHANNEL_FOLLOW_ADD':
            case 'GUILD_DISCOVERY_DISQUALIFIED':
            case 'GUILD_DISCOVERY_REQUALIFIED':
              break;

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
    })
  // Catch errors
    .catch((err) => {
      if (err === config.CONFIG_ERROR) {
        core.log.error('리엔더 설정 파일이 올바르지 않아 봇 구동을 계속할 수 없습니다.');
      } else {
        core.log.error('리엔더 구동 중 오류가 발생했습니다. 봇 구동을 계속할 수 없습니다.');
        core.log.debug(err);
      }
      core.exit(1);
    });
};
