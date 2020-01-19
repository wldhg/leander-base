/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as yml from 'js-yaml';
import * as fs from 'fs';
import * as core from './core/load';

core.init.then(() => {
  core.log.info(`${core.config.name.full} ${core.config.version} 시작합니다.`);

  switch (core.arg.fn.keyword) {
    default:
    case 'bot': {
      // Leander bot
      import('./bot/load').then((bot) => {
        try {
          return [bot, yml.safeLoad(
            fs.readFileSync(core.config.dir.data(['config.yml']), 'utf8'),
          )];
        } catch (e) {
          core.err.parse('설정 파일을 불러올 수 없습니다.')(e);
        }
      }).then(([bot, lndrConf]) => {
        bot.wakeUp(core, lndrConf);
      });
      break;
    }
  }
}).catch(core.err.parse('예상치 못한 오류가 발생하였습니다.'));
