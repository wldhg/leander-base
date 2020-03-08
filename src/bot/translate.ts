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
  botDict['bot:emoji'] = lndrConf.emoji ? lndrConf.emoji : ':robot:';
  botDict['bot:prefix'] = lndrConf.prefix;

  const traversal = (obj: object, prefix: string): void => {
    const elems = Object.keys(obj);
    for (let i = 0; i < elems.length; i += 1) {
      if (typeof obj[elems[i]] === 'string') {
        botDict[`res:${prefix}.${elems[i]}`] = obj[elems[i]];
      } else if (typeof obj[elems[i]] === 'object') {
        traversal(obj[elems[i]], prefix.length > 0 ? `${prefix}.${elems[i]}` : elems[i]);
      } else {
        core.log.warn(`잘못된 언어 항목을 발견했습니다. 모든 언어 항목은 object 혹은 string이어야 합니다: ${elems[i]}`);
      }
    }
  };
  const charPath = core.config.dir.res(['lang', `${lndrConf.lang}.yml`]);
  let chars = {};
  try {
    chars = yml.safeLoad(fs.readFileSync(charPath, 'utf8'));
    traversal(chars, '');
  } catch (e) {
    core.err.parse('언어 파일을 불러올 수 없습니다.')(e);
  }

  // Export Translator
  return (sentence: string, ...args: string[]): string => {
    let translated;
    if (typeof sentence === 'string') {
      const dict = Object.assign(botDict, args);
      translated = core.util.format(sentence, dict).replace(/\\n/g, '\n');
    } else {
      core.log.error(`언어 번역을 완료할 수 없습니다: ${sentence}`);
      translated = sentence;
    }
    return translated;
  };
};
