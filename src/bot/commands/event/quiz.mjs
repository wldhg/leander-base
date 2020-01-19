/*import path from 'path'
import moment from 'moment'
import * as json from '../../../util/json.mjs'
import { GUILD_DIR } from '../../../core/const.mjs'
import DISCORD from 'discord.js'

// NOTE: Do not change the type of each properties
// NOTE: The first element of `commands` array will be appeared in `help`.
//       This is generally in Korean.
// NOTE: `help` can be (help, command) => {}. This must return value like below.
//       - {description:String, content:Array[...{name, value, ?inline}]}
//       - Array[...{name:String, value:String, ?inline:Boolean}]
export default {
  name: '⁉ 퀴즈',
  help: (help, command) => {
    return {
      description: `진행 중인 퀴즈 이벤트 목록을 보거나 참여 또는 새로운 퀴즈 이벤트를 생성합니다.${help.embedLN}`,
      content: [
        {
          name: '퀴즈 목록 보기',
          value: `기본으로 진행 중이거나 이후 진행 예정인 퀴즈 목록을 보여줍니다.\`\`\`?${command} / ?${command} 목록\n?${command} 과거\n?${command} 전체\`\`\`${help.embedLN}`
        },
        {
          name: '퀴즈 생성하기',
          value: `\`\`\`?${command} 생성\`\`\`${help.embedLN}`,
          inline: true
        },
        {
          name: '퀴즈 풀기',
          value: `\`\`\`?${command} 시작\`\`\`${help.embedLN}`,
          inline: true
        },
        {
          name: '퀴즈 결과 보기',
          value: `결과가 공개되는 퀴즈인 경우 전체 참가자의 결과를 볼 수 있습니다.\`\`\`?${command} 결과\`\`\`${help.embedLN}`
        }
      ]
    }
  }, // If null, fallback text will be displayed.
  class: '이벤트', // If null, this command will not be displayed in `help`.
  commands: ['퀴즈'], // If nothing, this command will not be displayed in `help`.
  callCommands: [], // The word '리엔더' must be included in text.
  conditions: {
    'DM': false
  }, // author:Array, channel:Array, DM:boolean
  fn: (log, blhx, help, cli, msg, more) => {
    var context = { log, blhx, help, cli, msg, more } // eslint-disable-line no-unused-vars
    msg.channel.startTyping()

    // Inner constants
    const quizDesc = (data, isForSingleEmbed = false) => `${typeof data.description === 'string' && data.description.length > 0 ? '**' + data.description + '**\n' : ''}  → ${moment(data.start).format('YYYY년 M월 D일 H시 m분')} ~ ${moment(data.end).format('YYYY년 M월 D일 H시 m분')}\n  → *총 ${data.quizCount}문제 / 소요 시간 ${moment.utc(data.maxTime * 1000).format('m분 s초')} / 결과 ${data.resultOpen ? '공개' : '비공개'}*${isForSingleEmbed ? '' : help.embedLN}`
    const quizCard = (title, data) => help.embed(title, quizDesc(data, true), 0xff0000)
    const compQuiz = (meta) => {
      return (a, b) => {
        var ma = meta[a]
        var mb = meta[b]
        if (ma.start < mb.start) {
          return -1
        } else if (ma.start === mb.start) {
          if (ma.end < mb.end) {
            return -1
          } else if (ma.end === mb.end) {
            return ma > mb ? 1 : -1
          } else {
            return 1
          }
        } else {
          return 1
        }
      }
    }
    const questCard = (i, data) => {
      var q = data.question
      var embed = help.embed(`***Q ${i}:***    **${q.title}**${typeof data.point === 'number' ? '  (' + data.point + '점)' : ''}`, `제한 시간 ${data.time}초`)
      if (typeof q.image === 'string' && q.image.length > 0) {
        embed.setThumbnail(q.image)
      }
      if (typeof q.suppImage === 'string' && q.suppImage.length > 0) {
        embed.setImage(q.suppImage)
      }
      if (q.options && q.options instanceof Array && q.options.length > 0) {
        const numberEmoji = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'keycap_ten']
        var optionField = `:${numberEmoji[0]}:    ${q.options[0]}`
        for (var j = 1; j < q.options.length; j++) {
          optionField += `${help.embedLN}${help.embedLN}:${numberEmoji[j]}:    ${q.options[j]}`
        }
        optionField += help.embedLN
        embed.addField(help.embedLN, optionField)
      }
      if (typeof data.hint === 'string' && data.hint.length > 0) {
        embed.setFooter(`HINT: ${data.hint}`)
      }
      return embed
    }
    const questAnsPxr = (msg, data, isPrintMode) => {
      const a = data.answer
      const ansCondSentence = {
        'rangedInteger': `[${a.cond && a.cond[0]} - ${a.cond && a.cond[1]}]`,
        'string': `[주관식]`
      }
      const ansCondChecker = {
        'rangedInteger': (x) => a.cond && Number(x) && Number(x) >= a.cond[0] && Number(x) <= a.cond[1] && Number(x) % 1 === 0,
        'string': (x) => x.length > 0
      }
      const ansChecker = {
        'rangedInteger': (m, a) => m.content === String(a.value),
        'string': (m, a) => {
          if (a.value instanceof Array) {
            return a.value.includes(m.content)
          } else {
            return String(a.value) === m.content
          }
        }
      }
      if (isPrintMode) {
        return new Promise((resolve) => {
          resolve([true, null, 0])
        })
      } else {
        var announce = `${data.time}초 안에 답변을 입력해주세요. \`${ansCondSentence[a.type]}\``
        return new Promise((resolve) => {
          help.waitAnswer(msg, context, ansCondChecker[a.type], announce, (msg) => {
            // Answer input
            var result = ansChecker[a.type](msg, a)
            resolve([result, msg.content, data.point * result])
          }, data.time, '뿌-뿌-뿟! 지휘관님, 시간 초과에요~!', () => {
            // Timeout
            resolve([false, null, 0])
          })
        })
      }
    }
    const ansCard = (data, result) => {
      var a = data.answer
      var embed = help.embed(`***${result ? '[O]' : '[X]'}  정답:***    **${a.value}**`, a.desc, 0x333333)
      embed.setThumbnail(result ? 'https://cdn.discordapp.com/emojis/490442539065671681.gif' : 'https://cdn.discordapp.com/emojis/456027857462755331.png')
      if (typeof a.suppImage === 'string' && a.suppImage.length > 0) {
        embed.setImage(a.suppImage)
      }
      return embed
    }
    const startQuiz = (asShikigan, asUser, guild, quizId, isPrintMode, msg) => {
      var createChannel
      if (isPrintMode) {
        createChannel = new Promise((resolve) => {
          resolve(msg.channel);
        })
      } else {
        createChannel = asUser.createDM()
      }
      createChannel.then(ch => {
        const quizError = (message) => {
          ch.send(`허어미... 퀴즈 데이터를 불러오던 도중 오류가 발생했어요.\n이 문제에 관한 기록이 ${log.fsi} 번째 로그에 저장되었어요. 저를 관리하시는 지휘관님께 오류 발생 여부를 말해주세요.`)
          log.error(`(Quiz: ${quizId}) ${message}`)
        }
        ch.startTyping()
        if (!isPrintMode) {
          ch.send(`${asShikigan.nickname || asUser.username} 지휘관님, 여기에요!`)
        }
        json.safeParse(path.join(GUILD_DIR, guild.id, 'quiz', `${quizId}.json`)).then(quiz => {
          if (typeof quiz.title !== 'string') {
            quizError('Quiz loading failed: Maybe no quiz file exists')
          } else {
            // Prepare informations
            var maxTime = 0
            var maxPoint = 0
            quiz.data.forEach(q => {
              maxTime += q.time
              maxPoint += q.point ? q.point : 0
            })
            // Create embed
            var quizInfo = help.embed(`***${quiz.title}!***`, typeof quiz.description === 'string' ? quiz.description + help.embedLN : help.embedLN, 0xff0000)
            quizInfo.addField('진행 기간', `${moment(quiz.start).format('M월 D일 H시 m분')} ~ ${moment(quiz.end).format('M월 D일 H시 m분')}${help.embedLN}`)
            quizInfo.addField('문제 수', `총 ${quiz.data.length} 문제${help.embedLN}`, true)
            quizInfo.addField('소요 시간', `${moment.utc(maxTime * 1000).format('m분 s초')}${help.embedLN}`, true)
            quizInfo.setFooter(`이 퀴즈의 결과는 ${quiz.saveResult ? '저장 및 공개됩니다' : '저장되지 않습니다'}.`)
            // Send it
            let temp = (() => { // eslint-disable-line no-unused-vars
              if (typeof quiz.banner === 'string' && quiz.banner.length > 0) {
                return ch.send(help.embedLN, { files: [quiz.banner] })
              } else {
                return ch.send(help.embedLN)
              }
            })().then(() => {
              ch.send(quizInfo).then(() => {
                ch.send(isPrintMode ? `${help.reverseLN}여기서 출력할까요?` : `${help.reverseLN}지금 참여하시겠어요?`)
                ch.stopTyping()
                if (!isPrintMode) {
                  msg = { channel: ch, author: asUser }
                }
                help.waitAnswer(msg, context, a => a === '네' || a === '아니오', '`네` 혹은 `아니오`로 답해주세요.', (msg) => {
                  if (msg.content === '네') {
                    ch.send(isPrintMode ? '퀴즈 전문이 이곳에 출력됩니다!' : '자, 마음의 준비를 하세요. 곧 시작할게요!')
                    setTimeout(() => {
                      var quizIter = 0
                      var ansRecord = []
                      var quizer = () => {
                        if (quizIter < quiz.data.length) {
                          // Continue quiz
                          ch.send(questCard(quizIter + 1, quiz.data[quizIter])).then(() => {
                            questAnsPxr(msg, quiz.data[quizIter], isPrintMode).then((ans) => {
                              // Process quiz answer
                              ansRecord.push(ans)
                              return ans[0]
                            }).then((result) => {
                              // Show answer & solution
                              ch.send(ansCard(quiz.data[quizIter], result)).then(() => {
                                // Wait 3.5 seconds
                                quizIter++
                                if (quiz.data.length !== quizIter) {
                                  setTimeout(() => {
                                    if (!isPrintMode) {
                                      ch.send(`이제 곧 다음 문제를 낼게요.${quizIter === 1 ? '\n모든 문제에는 제한 시간이 있으니, 문제가 나오면 문제를 먼저 풀어주세요!' : ''}`)
                                      if (quiz.data.length === quizIter + 1) {
                                        ch.send('다음 문제가 마지막 문제에요. 마지막까지 힘내자구요?')
                                      }
                                      setTimeout(quizer, 4000)
                                    } else {
                                      setTimeout(quizer, 500)
                                    }
                                  }, 2000)
                                } else {
                                  setTimeout(quizer, 2000)
                                }
                              })
                            })
                          })
                        } else {
                          // Quiz End
                          if (!isPrintMode) {
                            ch.send(`지휘관님, 퀴즈를 모두 푸셨어요.${help.embedLN}`).then(() => {
                              var correct = 0
                              var pointSum = 0
                              ansRecord.forEach(ans => {
                                correct += ans[0]
                                pointSum += ans[2]
                              })
                              var embed = help.embed(`:scroll:  **${asShikigan.nickname || asUser.username} 지휘관님의 퀴즈 성적**`, help.embedSpace, 0xff0000)
                              embed.addField('퀴즈 이름', `${quiz.title}${help.embedLN}`)
                              embed.addField('정답', `${correct} / ${quiz.data.length} 개${help.embedLN}`, true)
                              embed.addField('점수', `${pointSum} / ${maxPoint} 점${help.embedLN}`, true)
                              embed.addField('발행 일시', `${moment().format('YYYY년 M월 D일 H시 m분 s초 SSS')}${help.embedLN}`)
                              embed.setFooter(`${guild.name} 공식 퀴즈 감독관 리엔더 (인)`)
                              embed.setThumbnail('https://cdn.discordapp.com/attachments/507273127768883201/567814730652188712/profile_sqxc.png')
                              ch.send(embed).then(() => {
                                ch.send(`${help.reverseLN}수고하셨어요, 지휘관님!`)
                                if (typeof quiz.afterMessage === 'string' && quiz.afterMessage.length > 0) {
                                  ch.send(quiz.afterMessage)
                                }
                              })
                              if (quiz.saveResult) {
                                // TODO: Save quiz data
                                cli.users.get('414824216765136897').send(embed).catch((error) => {
                                  ch.send('하지만 결과 전송 중 오류가 발생했어요...\n저를 담당하시는 지휘관님께 문의해주세요.')
                                  ch.send(`이 문제는 ${log.fsi} 번째 로그에 저장되었어요.`)
                                  throw error
                                })
                              }
                            })
                          } else {
                            ch.send('퀴즈 문제가 모두 출력되었습니다!')
                          }
                        }
                      }
                      quizer()
                    }, 3500)
                  } else {
                    ch.send('네, 알겠어요. 언제든 참여를 원하시면 다시 `?퀴즈 시작`을 입력해주세요!')
                  }
                }, 30, '30초 동안 대답이 없으셔서 퀴즈 참여가 자동으로 취소되었어요.')
              })
            })
          }
        })
      })
    }

    // Quiz Parse
    var quizIndexFilePath = path.join(GUILD_DIR, msg.guild.id, 'quiz.json')
    json.safeParse(quizIndexFilePath).then(quizMeta => {
      // Quiz classifying
      var oldQuizMeta = {}
      var ongoingQuizMeta = {}
      var futureQuizMeta = {}
      var now = moment().valueOf()
      var quizs = Object.keys(quizMeta)
      quizs.forEach(quiz => {
        if (quizMeta[quiz].end < now) {
          oldQuizMeta[quiz] = quizMeta[quiz]
        } else if (quizMeta[quiz].start <= now) {
          ongoingQuizMeta[quiz] = quizMeta[quiz]
        } else {
          futureQuizMeta[quiz] = quizMeta[quiz]
        }
      })
      var cmdBody = msg.content.substring(more.command.length + 1).trim()
      var cmdItem = cmdBody.split(' ')
      if (cmdBody.length === 0 || cmdItem[0] === '과거' || cmdItem[0] === '전체' || cmdItem[0] === '목록') {
        var filteredMeta
        if (cmdItem[0] === '과거') {
          filteredMeta = oldQuizMeta
        } else if (cmdItem[0] === '전체') {
          filteredMeta = quizMeta
        } else {
          filteredMeta = Object.assign(ongoingQuizMeta, futureQuizMeta)
        }
        var filteredQuizs = Object.keys(filteredMeta)
        var embed = help.embed(`💯 **${msg.guild.name}에서 진행${cmdItem[0] === '과거' ? '되었던' : cmdItem[0] === '전체' ? '하는 전체' : ' 중이거나 예정된'} 퀴즈 목록**`)
        embed.setColor(0xff0000)
        embed.setDescription(`총 ${filteredQuizs.length}개의 퀴즈가 있어요.${help.embedLN}`)
        filteredQuizs = filteredQuizs.sort(compQuiz(filteredMeta))
        filteredQuizs.forEach(quiz => {
          embed.addField(quiz, quizDesc(filteredMeta[quiz]))
        })
        embed.setFooter('제게 `?퀴즈 시작`이라고 말씀해주시면 퀴즈에 참여할 수 있어요.')
        msg.channel.send(embed)
      } else if (cmdItem[0] === '시작') {
        var ongoingQuizs = Object.keys(ongoingQuizMeta)
        if (ongoingQuizs.length > 1) {
          msg.channel.send(`어서오세요! 여기 지금 **${ongoingQuizs.length} 개**의 퀴즈가 진행 중이에요.${help.embedLN}`)
          var tempI = 1
          var sendEmbeds = []
          ongoingQuizs.forEach(quiz => {
            sendEmbeds.push(msg.channel.send(quizCard(`❤ **${tempI})** __***${quiz}***__`, ongoingQuizMeta[quiz])))
            tempI += 1
          })
          Promise.all(sendEmbeds).then(() => {
            help.waitAnswer(msg, context, (a) => a === '취소' || (Number(a) <= ongoingQuizs.length && Number(a) > 0 && Number(a) % 1 === 0), `${help.reverseLN}어떤 퀴즈에 참여하시겠어요? \`[1-${ongoingQuizs.length} 혹은 '취소']\``, (msg, context) => {
              if (msg.content !== '취소') {
                startQuiz(msg.member, msg.author, msg.guild, ongoingQuizMeta[ongoingQuizs[Number(msg.content) - 1]].id, false, msg.channel)
                msg.channel.send(`네! 알림이 뜬 DM 채널을 확인해주세요. 거기서 만나요, 지휘관님!`)
              } else {
                msg.channel.send('퀴즈 게임 참여가 취소되었어요.')
              }
            })
          })
        } else if (ongoingQuizs.length === 1) {
          var quiz = ongoingQuizs[0]
          msg.channel.send(`지휘관님, 리엔더의 퀴즈 게임에 어서오세요!\n지금 **한 개**의 퀴즈가 진행중이에요.${help.embedLN}`)
          msg.channel.send(quizCard(`❤ __***${quiz}***__`, ongoingQuizMeta[quiz])).then(() => {
            help.waitAnswer(msg, context, (a) => a === '네' || a === '아니오' || a === '아뇨', `${help.reverseLN}위 퀴즈에 참여하시겠어요? \`[네/아니오]\``, (msg, context) => {
              if (msg.content === '네') {
                startQuiz(msg.member, msg.author, msg.guild, ongoingQuizMeta[quiz].id, false, msg)
                msg.channel.send(`알겠습니다, 지휘관님. 알림이 뜬 DM 채널을 확인해주세요. 거기서 만나요!`)
              } else {
                msg.channel.send('퀴즈 게임 참여가 취소되었어요.')
              }
            })
          })
        } else {
          msg.channel.send(`리엔더의 퀴즈 게임에 어서오세요.\n아쉽지만 지금은 진행 중인 퀴즈 게임이 없어요. 다음에 다시 찾아주세요!`)
        }
      } else if (cmdItem[0] === '전문출력') {
        if (msg.author.id === msg.guild.ownerID) {
          startQuiz(msg.member, msg.author, msg.guild, cmdItem[1], true, msg)
        } else {
          msg.channel.send('퀴즈를 출력할 수 있는 권한이 없어요. 리엔더는 지휘관님의 이 시도를 리엔더의 로그에 기록했으며, 관리자에게 보고했어요.')
        }
      } else if (cmdItem[0] === '결과') {
        // TODO:
        msg.channel.send('퀴즈 결과 보기 기능은 준비중이에요. 결과 보기 기능은 없어도 결과는 수집되고 있어요. (예정 구현일: 21일)')
      } else if (cmdItem[0] === '생성') {
        // TODO:
        msg.channel.send('퀴즈 생성 기능은 준비중이에요. (예정 구현일: 미정)')
      } else {
        msg.react('😪')
        msg.channel.send('지휘관님의 말을 이해할 수 없어요. 😥\n`?도움말 퀴즈` 를 입력하셔서 명령어 사용법을 확인해주세요.')
      }
    })
    msg.channel.stopTyping()
  }
}
*/
export default {};
