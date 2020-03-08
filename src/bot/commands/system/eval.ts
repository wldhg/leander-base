/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';
import * as sEval from 'safe-eval';
import * as moment from 'moment';
import * as util from 'util';
import * as os from 'os';

export const meta: LNDRCommandMeta = {
  section: null,
  commands: ['eval'],
  conditions: {
    lndrAdmin: true,
  },
};

export const help: LNDRCommandHelp = {
  title: '🕵️ EVAL',
};

export const deps: LNDRCommandDeps = [];

export const fn: LNDRCommandFunction = (lndr, acts, msg) => {
  const evalContext = {
    lndr, acts, msg, moment, os, util,
  };

  if (msg.channel instanceof DISCORD.TextChannel) {
    if (msg.codeSegments.length > 0) {
      msg.channel.startTyping();
      msg.raw.react('🆗');
      try {
        const printResult = (result): void => {
          msg.send('📃 ***Eval Output***');
          msg.send(`**Input:**\n\`\`\`\n${msg.codeSegments[0].data}\n\`\`\``);
          msg.send('**Output:**\n');
          msg.send(`\`\`\`${util.format('%o', result)}\`\`\``).catch((error): void => {
            msg.send('```Error occured. Refer to below detailed error message.```');
            msg.send('🚨  ***[Error Report] Result Print Failure***');
            msg.send(`**DISCORD API Error Message:**\n\`\`\`\n${util.format('%o', error)}\n\`\`\``);
            msg.send(`**Reported Time:** ${moment()}`);
          });
        };
        const result = sEval(msg.codeSegments[0].data, evalContext);
        if (result instanceof Promise) {
          result.then(printResult);
        } else {
          printResult(result);
        }
      } catch (error) {
        const output = util.format('%o', error);
        msg.send('🚨  ***[Error Report] Code Execution Failed***');
        msg.send(`**Input:**\n\`\`\`${msg.codeSegments[0].data}\`\`\``);
        msg.send('**Output Error:**\n');
        msg.send(`\`\`\`${output.substring(0, output.indexOf('[stack]'))}}\`\`\``);
        msg.send(`**Reported Time:** ${moment()}`);
      } finally {
        msg.channel.stopTyping();
      }
    } else {
      msg.send('⚠ No code segments.');
    }
  } else {
    msg.author.createDM().then((dmChan) => {
      dmChan.send('⚠ Eval is only available in text channel.');
    });
  }
};
