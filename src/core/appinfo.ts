/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

// Program Constants

import * as path from 'path';

// [Strings]
export const name: AppName = {
  full: '리엔더',
  abbr: 'lndr',
};

// [Directories]
export const dir: AppDir = {
  data: (p) => path.join(process.cwd(), 'data', ...p),
  res: (p) => path.join(process.cwd(), 'res', ...p),
  DATA: path.join(process.cwd(), 'data'),
  RES: path.join(process.cwd(), 'res'),
};

// [Argument Parsing]
export const arg: AppArg = {
  fn: {
    default: {
      keyword: 'bot',
      description: '리엔더 봇을 시작합니다.',
      options: [],
    },
  },
  opt: {},
};
