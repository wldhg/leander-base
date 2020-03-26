/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as fs from 'fs';
import * as yml from 'js-yaml';

export const botDict = {};

export const krBatchimTest = (str: string, app1: string, app2: string): string => {
  let waStr = `${str}${app2}`;
  if (str.length > 0) {
    const testStr = str.replace(/[^a-zA-Z가-힣]/gi, '');
    const lastChar = testStr.charCodeAt(testStr.length - 1);
    if (
      lastChar === 0x0041 || lastChar === 0x0061
      || lastChar === 0x0045 || lastChar === 0x0065
      || lastChar === 0x0049 || lastChar === 0x0069
      || lastChar === 0x004f || lastChar === 0x006f
      || lastChar === 0x0055 || lastChar === 0x0075
    ) {
      waStr = `${str}${app1}`;
    } else if (((lastChar - 0xac00) % 28) === 0) {
      waStr = `${str}${app1}`;
    }
  }
  return waStr;
};

export const getT = (core: AppCore, lndrConf: LNDRConfig): LNDRTranslateFunction => {
  // Set Dictionary
  botDict['bot:name'] = lndrConf.name;
  botDict['bot:nameEulReul'] = krBatchimTest(lndrConf.name, '를', '을');
  botDict['bot:nameIGa'] = krBatchimTest(lndrConf.name, '가', '이');
  botDict['bot:nameEunNeun'] = krBatchimTest(lndrConf.name, '는', '은');
  botDict['bot:nameWaGwa'] = krBatchimTest(lndrConf.name, '와', '과');
  botDict['bot:addressing'] = lndrConf.addressing;
  botDict['bot:emoji'] = lndrConf.emoji ? lndrConf.emoji : ':robot:';
  botDict['bot:prefix'] = lndrConf.prefix;

  const traversal = (obj: object, prefix: string): void => {
    const elems = Object.keys(obj);
    for (let i = 0; i < elems.length; i += 1) {
      if (typeof obj[elems[i]] === 'string') {
        botDict[`res:${prefix}.${elems[i]}`] = obj[elems[i]];
      } else if (obj[elems[i]] instanceof Array) {
        botDict[`res:${prefix}.${elems[i]}`] = obj[elems[i]];
      } else if (typeof obj[elems[i]] === 'object') {
        traversal(obj[elems[i]], prefix.length > 0 ? `${prefix}.${elems[i]}` : elems[i]);
      } else {
        core.log.warn(`잘못된 언어 항목을 발견했습니다. 모든 언어 항목은 object, string 혹은 Array<string>이어야 합니다: ${elems[i]}`);
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
