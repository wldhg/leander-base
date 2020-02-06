/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as fs from 'fs';
import * as yml from 'js-yaml';

export const botDict = {};

export const getT = (core: AppCore, lndrConf: LNDRConfig): LNDRTranslateFunction => {
  // Set Dictionary
  botDict['bot:name'] = lndrConf.name;
  botDict['bot:name'] = lndrConf.name;
  botDict['bot:nameForceI'] = lndrConf.name;
  botDict['bot:nameIGa'] = lndrConf.name;
  botDict['bot:nameEunNeun'] = lndrConf.name;
  botDict['bot:addressing'] = lndrConf.addressing;
  botDict['bot:emoji'] = lndrConf.emoji;
  botDict['bot:prefix'] = lndrConf.prefix;

  // Export Translator
  const charPath = core.config.dir.res(['lang', `${lndrConf.lang}.yml`]);
  let chars = {};
  try {
    chars = yml.safeLoad(fs.readFileSync(charPath, 'utf8'));
  } catch (e) {
    core.err.parse('언어 파일을 불러올 수 없습니다.')(e);
  }
  return (sentence: string, ...args: string[]): string => {
    const sentPath: string[] = sentence.split('.');
    let txSentence = chars;
    for (let i = 0; i < sentPath.length; i += 1) {
      if (txSentence[sentPath[i]]) {
        txSentence = txSentence[sentPath[i]];
      } else {
        core.log.error(`언어 번역을 완료할 수 없습니다: ${sentence}`);
        txSentence = sentence;
        break;
      }
    }
    let translated;
    if (typeof txSentence === 'string') {
      const dict = Object.assign(botDict, args);
      translated = core.util.format(txSentence, dict).replace(/\\n/g, '\n');
    } else {
      core.log.error(`언어 번역을 완료할 수 없습니다: ${txSentence}`);
      translated = sentence;
    }
    return translated;
  };
};
