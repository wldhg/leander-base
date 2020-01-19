import DISCORD from 'discord.js';

let kernel;
let lndr;
const contextInUse = {};

export const getContextID = (msg) => {
  let cid = '';
  if (msg instanceof DISCORD.Message && msg.type === 'DEFAULT') {
    cid += `${msg.guild ? msg.guild.id : 'DM'}:`;
    cid += `${msg.channel.id}:${msg.author.id}`;
  } else {
    if (msg instanceof DISCORD.Message) {
      msg.channel.send(`**❌ 대화 코드를 가져올 수 없었어요. (lid:${kernel.log.i})**`);
    }
    kernel.log('context::getContextID - Unexpected message type.');
    kernel.log.debug(msg);
    do {
      cid = kernel.util.random();
    } while (contextInUse[cid]);
  }
  return cid;
};

export const isOnConversation = msg => Boolean(contextInUse[getContextID(msg)]);
export const getContext = msg => contextInUse[getContextID(msg)];

const startConversationTimeout = (msg, timeout, cid, timeoutCallback) => setTimeout(
  () => {
    msg.channel.send(`${lndr.mention(msg.author)} 지휘관님, \`${timeout}\`초 간 응답이 없어 대화를 종료할게요.`);
    delete contextInUse[cid];
    timeoutCallback(msg, timeout);
  },
  timeout * 1000,
);

/**
 * Starts new conversation.
 * @param {DISCORD.Message} msg DISCORD.Message object.
 * @param {Function} answerCallback The processor of answer.
 *        Argument set (origMsg, newMsg, timeout) will be given.
 *        If this returns true, the conversation will be end.
 * @param {Number} timeout After timeout, the conversation will be automatically stopped.
 * @param {Function} timeoutCallback After timeout, this will be called.
 *        Argument set (origMsg, timeout) will be given.
 */
export const startConversation = (msg, answerCallback, timeout = 30,
  timeoutCallback = () => {}) => {
  // Get CID
  const cid = getContextID(msg);

  // Check arguments
  if (
    typeof answerCallback !== 'function'
      || !(msg instanceof DISCORD.Message)
      || typeof timeout !== 'number'
      || typeof timeoutCallback !== 'function'
      || contextInUse[cid]
  ) {
    // Unsufficient arguments
    if (msg instanceof DISCORD.Message) {
      msg.channel.send(`**❌ 대화 모듈 초기화 중 오류가 발생했어요. (lid:${kernel.log.i})**`);
      kernel.log.error('context::startConversation - Invalid argument w/o msg');
      kernel.log.debug(msg, 'msg');
    } else {
      kernel.log.error('context::startConversation - Invalid argument w/ msg');
    }
    kernel.log.debug(answerCallback, 'answerCallback');
    kernel.log.debug(timeout, 'timeout');
    kernel.log.debug(timeoutCallback, 'timeoutCallback');
    kernel.log.debug(cid, 'cid');
  } else {
    // Sufficient arguments
    const timeoutID = startConversationTimeout(msg, timeout, cid, timeoutCallback);
    contextInUse[cid] = {
      cid,
      origMsg: msg,
      answerCallback,
      timeout,
      timeoutCallback,
      timeoutID,
    };
  }
};

/**
 * Processes an answer about a conversation.
 * @param {DISCORD.Message} msg DISCORD.Message object.
 * @param {Object} context Conversation context from {getContextID}.
 */
export const continueConversation = (msg, context = contextInUse[getContextID(msg)]) => {
  if (msg instanceof DISCORD.Message) {
    // Clear original timeout
    clearTimeout(context.timeoutID);

    // Start answering
    msg.channel.startTyping();
    try {
      if (context.answerCallback(context.origMsg, msg, context.timeout)) {
        delete contextInUse[context.cid];
      } else {
        contextInUse[context.cid].timeoutID = startConversationTimeout(
          msg, context.timeout, context.cid, context.timeoutCallback,
        );
      }
    } catch (callbackErr) {
      const randomErrorCode = kernel.util.random();
      contextInUse[context.cid].timeoutID = startConversationTimeout(
        msg, context.timeout, context.cid, context.timeoutCallback,
      );
      msg.channel.send(`**❌ 대답을 확인하던 중 오류가 발생했어요. (lid:${kernel.log.i})**`);
      msg.channel.send(`대답을 이해하지는 못했지만 왜 이해하지 못했는지 내부 기록을 남겼어요.\n반복해서 오류가 발생하면 응답 시간(\`${context.timeout}\`초) 초과를 기다린 다음, 오류 코드 \`0x${randomErrorCode.toString(16)}\`을 ${lndr.mention(lndr.discord.adminID)}님께 알려주세요.\n불편을 끼쳐드려 죄송해요, 지휘관님.`);
      kernel.log.error(`context::continueConversation - Callback error (0x${randomErrorCode.toString(16)}).`);
      kernel.log.debug(callbackErr);
    }
    msg.channel.stopTyping();
  }
};

export const init = (_kernel, _lndr) => {
  kernel = _kernel;
  lndr = _lndr;
  lndr.startConversation = startConversation;
  lndr.isOnConversation = isOnConversation;
  return lndr;
};
