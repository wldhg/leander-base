const embedColor = {
  N: 0xdbdbdb,
  R: 0xb2cfff,
  SR: 0xbb84ff,
  SSR: 0xfcc52d,
  DR: 0xcffc2d,
  PR: 0xfc2d2d,
};
const typeEmoji = {
  잠수함: '<:submarine:586160952249155594>',
  구축함: '<:destroyer:553128206014611458>',
  경순양함: '<:lightcruiser:586160952336973824>',
  중순양함: '<:heavycruiser:586160952228053003>',
  '초갑형 순양함': '<:largecruiser:586160952185978880>',
  순양전함: '<:battlecruiser:586162094815051791>',
  전함: '<:battleship:586162094718844950>',
  경항공모함: '<:lightaircraftcarrier:586162094886486017>',
  항공모함: '<:aircraftcarrier:586162095091875840>',
  모니터함: '<:monitor:586162095050194975>',
  공작함: '<:repairship:586162647599284235>',
  잠수항모: '<:submarinecarrier:586162094940880907>',
};

// TODO: Implement this
export default {
  name: '🚤 함선 정보',
  help: '벽람항로의 함선 정보를 보여줍니다.\n사용법:\n  `[[prefix]]함선` → 전체 함선 목록\n  `[[prefix]]함선 [이름|별명]` → 개별 함선 정보',
  section: '출시 제외', // '벽람항로',
  commands: ['함선', 'ship'],
  conditions: {},
  fn: (kernel, lndr, msg, pmsg) => {
    // Define useful function
    /*
    const embedAddListField = (embed, shipList) => {
      var shipListByType = {}
      shipList.forEach(ship => {
        if (shipListByType[ship.type]) {
          shipListByType[ship.type].push(`${ship.code}:${ship.name}`)
        } else {
          shipListByType[ship.type] = [`${ship.code}:${ship.name}`]
        }
      })
      for (var type in shipListByType) {
        embed.addField(type, `\`${shipListByType[type].join('` `')}\`${help.embedLN}`)
      }
      return embed
    }
    // Process query
    msg.react('🔎').then(nowReact => {
      msg.channel.startTyping()
      var query = msg.content.substring(1 + more.command.length).trim()
      var ship; var score
      // Process for static input
      if (query === '목록' || more.command === '함선목록' || query === '') {
        nowReact.remove()
        var ships = Object.values(blhx.ships)
        var listEmbed = help.embed(`🚤 함선 목록`)
        listEmbed.setColor(0x0f0f0f)
        listEmbed.setDescription(`\`?함선 [함선명|함선번호]\`를 입력하여 자세히 볼 수 있어요.${help.embedLN}`)
        listEmbed.setFooter(`표시된 함선 수: ${ships.length}`)
        msg.channel.send(embedAddListField(listEmbed, ships))
        msg.channel.stopTyping()
        return
      }
      // Try simple query
      var directResult = blhx.getShip(query)
      if (directResult !== null) {
        ship = directResult
        score = 100.0
      } else {
        // Try fuzzy search
        var fuseResult = blhx.queryShip(query)
        if (fuseResult.length === 1 || (fuseResult.length > 1 && fuseResult[0].score < 0.01 && (fuseResult[1].score - fuseResult[0].score >= 0.12))) {
          // Only one result. Displayed with score.
          ship = fuseResult[0].item
          score = (1 - fuseResult[0].score) * 100
        } else if (fuseResult.length > 0) {
          // Several results
          nowReact.remove()
          msg.react('❓')
          var resultEmbed = help.embed(`🔎 ${help.embedSpace} **'${query}' 검색 결과**`)
          resultEmbed.setDescription(`아래 결과를 참조해서 \`?함선 [함선명]\` 혹은 \`?함선 [함선번호]\`를 입력하여 자세한 정보를 보세요.${help.embedLN}`)
          resultEmbed.setFooter(`표시된 함선 수: ${fuseResult.length}`)
          resultEmbed.setColor(0x0f0f0f)
          var convertedResult = fuseResult.map(item => item.item)
          msg.channel.send(embedAddListField(resultEmbed, convertedResult))
        } else {
          // Cannot found result.
          nowReact.remove()
          msg.react('❌')
          msg.channel.send(`말씀하신 \`${query}\`에 대한 함선 검색 결과가 없어요. \`?함선 목록\`을 입력하시면 전체 함선 목록을 보실 수 있어요.`)
        }
      }
      if (ship) {
        nowReact.remove()
        msg.react('✔')
        // Construct embed
        var embed = help.embed(`***${ship.code}: ${ship.name}***`)
        embed.setColor(embedColor[ship.star])
        embed.setDescription(`*${ship.engFullName}* ${help.embedSpace} (CV: ${ship.voice})${help.embedLN}`)
        if (score < 100) {
          embed.setFooter(`검색어 일치율: ${score}%`)
        }
        embed.addField('소속 · 함종', `${ship.side} ${ship.type} ${embedTypeEmoji[ship.type]}`, true)
        embed.addField('등급', `${ship.star} — ${embedStar[ship.star]}`, true)
        embed.addField('개장 가능 여부', ship.remodelable ? '개장 가능' : '개장 불가', true)
        embed.addField('획득 상태', ship.getable ? '현재 획득 가능' : '현재 획득 불가', true)
        embed.addField('획득 방법', ship.get)
        if (ship.constructionTime !== null) {
          embed.addField('건조 소요 시간', `${ship.constructionTime}분`, true)
        }
        embed.addField('퇴역 보상', `${ship.retire.gold || 0} <:gold:495566527689523222> · ${ship.retire.oil || 0} <:abura:495567868411248641> · ${ship.retire.medal || 0} <:order:553127590592905226>`, true)
        if (ship.skins && ship.skins.length > 0) {
          embed.addField('스킨', `\`${ship.skins.join('`\n`')}\``, true)
        }
        if (ship.story && Object.keys(ship.story).length > 0) {
          var storyValue = ''
          Object.keys(ship.story).forEach(story => {
            storyValue += `***${story}*** ${help.embedSpace} ${ship.story[story]}\n`
          })
          embed.addField('캐릭터 스토리', storyValue + help.embedSpace, true)
        }
        embed.addField(help.embedSpace, ship.sentence)
        embed.setThumbnail(`https://lndr.labus.love/ships/${ship.code}-.png`)
        embed.setImage(`https://lndr.labus.love/ships/${ship.code}.png`)
        msg.channel.send(embed)
      }
      msg.channel.stopTyping()
    })
    */
  },
};
