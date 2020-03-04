/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';
import { MessageType } from '../message';

class Dialog implements LNDRModule {
  public name = 'dialog';

  public acts = {
    isOn: (msg): boolean => Boolean(this.contextInUse[this.getContextID(msg)]),
    start: (msg, answerCallback,
      timeout = 30, timeoutCallback = (): void => {}): void => {
      // Get CID
      const cid = this.getContextID(msg);

      // Check arguments
      if (
        typeof answerCallback !== 'function'
          || !(msg instanceof DISCORD.Message)
          || typeof timeout !== 'number'
          || typeof timeoutCallback !== 'function'
          || this.contextInUse[cid]
      ) {
        // Unsufficient arguments
        if (msg instanceof DISCORD.Message) {
          msg.channel.send(`**❌ ${this.lndr.t('module.dialog.init_fail')} (lid:${this.core.log.i})**`);
          this.core.log.error('context::startConversation - 메시지가 없는 유효하지 않은 값입니다.');
          this.core.log.debug(msg, 'msg');
        } else {
          this.core.log.error('context::startConversation - 메시지가 있는 유효하지 않은 값입니다.');
        }
        this.core.log.debug(answerCallback, 'answerCallback');
        this.core.log.debug(timeout, 'timeout');
        this.core.log.debug(timeoutCallback, 'timeoutCallback');
        this.core.log.debug(cid, 'cid');
      } else {
        // Sufficient arguments
        const timeoutID = this.startConversationTimeout(msg, timeout, cid, timeoutCallback);
        this.contextInUse[cid] = {
          cid,
          origMsg: msg,
          answerCallback,
          timeout,
          timeoutCallback,
          timeoutID,
        };
        this.lndr.serverlock.addException(msg.author.id);
      }
    },
  };

  public hooks = [
    {
      on: MessageType.DEFAULT,
      checker: (msg: DISCORD.Message):
        Promise<LNDRModuleHookCheckResult> => Promise.resolve({
        triggered: Boolean(this.getContext(msg)),
        preventDefault: true,
      }),
      fn: (msg: DISCORD.Message): void => {
        this.continueConversation(msg, this.getContext(msg));
      },
    },
  ];

  public init = (core: AppCore, lndr: LNDR): Promise<void> => new Promise((resolve) => {
    this.core = core;
    this.lndr = lndr;
    resolve();
  });

  private core: AppCore;

  private lndr: LNDR;

  private contextInUse = {};

  private getContext = (msg): object => this.contextInUse[this.getContextID(msg)];

  private getContextID = (msg: DISCORD.Message): string => {
    let cid = '';
    if (msg instanceof DISCORD.Message && msg.type === 'DEFAULT') {
      cid += `${msg.guild ? msg.guild.id : 'DM'}:`;
      cid += `${msg.channel.id}:${msg.author.id}`;
    } else {
      if (msg instanceof DISCORD.Message) {
        msg.channel.send(`**❌ ${this.lndr.t('module.dialog.code_fail')} (lid:${this.core.log.i})**`);
      }
      this.core.log('context::getContextID - 예상하지 못한 메시지 종류입니다.');
      this.core.log.debug(msg);
      do {
        cid = this.core.util.random();
      } while (this.contextInUse[cid]);
    }
    return cid;
  };

  private startConversationTimeout = (msg, timeout, cid,
    timeoutCallback): NodeJS.Timeout => setTimeout(
    () => {
      msg.channel.send(this.lndr.t('module.dialog.close', this.lndr.tools.mention(msg.author), String(timeout)));
      delete this.contextInUse[cid];
      this.lndr.serverlock.removeException(msg.author.id);
      timeoutCallback(msg, timeout);
    },
    timeout * 1000,
  );

  private continueConversation = (msg,
    context = this.contextInUse[this.getContextID(msg)]): void => {
    if (msg instanceof DISCORD.Message) {
      // Clear original timeout
      clearTimeout(context.timeoutID);

      // Start answering
      msg.channel.startTyping();
      try {
        if (context.answerCallback(context.origMsg, msg, context.timeout)) {
          delete this.contextInUse[context.cid];
          this.lndr.serverlock.removeException(msg.author.id);
        } else {
          this.contextInUse[context.cid].timeoutID = this.startConversationTimeout(
            msg, context.timeout, context.cid, context.timeoutCallback,
          );
        }
      } catch (callbackErr) {
        const randomErrorCode = this.core.util.random();
        this.contextInUse[context.cid].timeoutID = this.startConversationTimeout(
          msg, context.timeout, context.cid, context.timeoutCallback,
        );
        msg.channel.send(`**❌ ${this.lndr.t('module.dialog.chk_fail')} (lid:${this.core.log.i})**`);
        msg.channel.send(this.lndr.t('module.dialog.chk_log', context.timeout, randomErrorCode.toString(16), this.lndr.tools.mention(this.lndr.config.discord.adminID)));
        this.core.log.error(`context::continueConversation - 콜백 오류 (0x${randomErrorCode.toString(16)}).`);
        this.core.log.debug(callbackErr);
      }
      msg.channel.stopTyping();
    }
  };
}

export default Dialog;
