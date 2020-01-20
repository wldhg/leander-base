/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as fs from 'fs';
import * as yml from 'js-yaml';

export const getT = (core: AppCore, lndrConf: LNDRConfig): LNDRTranslateFunction => {
  const charPath = core.config.dir.res(['character', `${lndrConf.character}.yml`]);
  let chars = {};
  try {
    chars = yml.safeLoad(fs.readFileSync(charPath, 'utf8'));
  } catch (e) {
    core.err.parse('인격 파일을 불러올 수 없습니다.')(e);
  }
  return (sentence: string, ...args: string[]): string => {
    const sentPath: string[] = sentence.split('.');
    let txSentence = chars;
    for (let i = 0; i < sentPath.length; i += 1) {
      if (txSentence[sentPath[i]]) {
        txSentence = txSentence[sentPath[i]];
      } else {
        core.log.error(`인격 번역을 완료할 수 없습니다: ${sentence}`);
        txSentence = sentence;
        break;
      }
    }
    let translated;
    if (typeof txSentence === 'string') {
      translated = core.util.format(txSentence, args).replace(/\\n/g, '\n');
    } else {
      core.log.error(`인격 번역을 완료할 수 없습니다: ${txSentence}`);
      translated = sentence;
    }
    return translated;
  };
};
