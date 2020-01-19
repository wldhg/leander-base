/*import sEval from 'safe-eval'
import moment from 'moment'
import util from 'util'
import os from 'os'
import * as json from '../../../util/json.mjs'

// NOTE: Do not change the type of each properties
// NOTE: The first element of `commands` array will be appeared in `help`.
//       This is generally in Korean.
export default {
  name: '🕵️ Silent EVAL',
  help: null, // If null, fallback text will be displayed.
  class: null, // If null, this command will not be displayed in `help`.
  commands: ['seval'], // If nothing, this command will not be displayed in `help`.
  callCommands: [], // The word '리엔더' must be included in text.
  conditions: {
    author: ['414824216765136897']
  }, // author:Array, channel:Array, DM:boolean
  fn: (log, blhx, help, cli, msg, more) => {
    const context = {
      log, blhx, help, cli, msg, more, moment, json, os
    }
    msg.channel.startTyping()
    if (msg.deletable) {
      msg.delete()
    }
    // Analyzing text to detect the input text
    var firstGA = msg.content.indexOf('`')
    var lastGA = msg.content.lastIndexOf('`')
    var input = firstGA === lastGA ? msg.content : msg.content.substring(firstGA + 1, lastGA)
    // Send result
    try {
      sEval(input, context)
    } catch (error) {
      var output = util.format('%o', error)
      msg.channel.send('🚨  ***[Error Report] Code Execution Failed***')
      msg.channel.send(`**Input:**\n\`\`\`${input}\`\`\``)
      msg.channel.send(`**Output Error:**\n`)
      msg.channel.send(`\`\`\`${output.substring(0, output.indexOf('[stack]'))}}\`\`\``)
      msg.channel.send(`**Reported Time:** ${moment()}`)
    }
    msg.channel.stopTyping()
  }
}
*/
export default {};
