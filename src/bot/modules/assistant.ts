/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import path from 'path';
import Assistant from 'google-assistant';

let lndr;
let kernel;
let assistant;
let isAssistantPrepared = false;
let replyChannel;

const waitList = [];

export const processConversation = () => {
  if (isAssistantPrepared && waitList.length > 0) {
    isAssistantPrepared = false;
    const { ch, msg } = waitList.splice(0, 1)[0];
    replyChannel = ch;
    assistant.start({
      lang: 'ko-KR',
      textQuery: msg,
      isNew: true,
    });
  }
};

export const addToWaitList = (ch, msg) => {
  waitList.push({ ch, msg });
  processConversation();
};

export const init = (_kernel, _lndr) => {
  kernel = _kernel;
  lndr = _lndr;

  const auth = {
    keyFilePath: path.join(kernel.config.dir.base, 'gaAuth.json'),
    savedTokensPath: path.join(kernel.config.dir.base, 'gaToken.json'),
  };

  assistant = new Assistant(auth);

  assistant.on('ready', () => {
    isAssistantPrepared = true;
    kernel.log('bot::assistant - Assistant is now ready.');
    processConversation();
  });

  assistant.on('started', (conversation) => {
    conversation.on('response', (_text) => {
      let text = _text;

      // Replace GA to Leander
      text = text.replace(/Google 어시스턴트/g, '리엔더');
      text = text.replace(/Google/g, '리엔더');
      text = text.replace(/어시스턴트/g, '리엔더');
      text = text.replace(/엔더 님/g, '지휘관님');

      // Replace some other words
      text = text.replace(/오케이/g, '네');
      text = text.replace('소중한 의견을 지금 보내 주세요', `저를 관리하시는 ${lndr.mention(lndr.discord.adminID)}님에게 말씀해주세요.`);

      // Delete contents under dash
      const dashIndex = text.indexOf('---\n');
      if (dashIndex > -1) {
        text = text.substring(0, dashIndex);
      }

      // Fallback
      if (text.length === 0) {
        text = '지휘관님의 말씀을 이해하지 못했어요.';
      }

      replyChannel.send(text).then(() => {
        isAssistantPrepared = true;
        processConversation();
      });
    }).on('error', kernel.err.parse('bot::assistant - Unknown error occured.'));
  });

  return lndr;
};
