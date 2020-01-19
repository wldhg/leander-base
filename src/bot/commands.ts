/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as fs from 'fs';
import * as path from 'path';

const loadPartial = (core, lndr, target): Promise<LNDRCommand[]> => {
  let commands: LNDRCommand[] = [];
  return new Promise((resolve) => {
    fs.promises.readdir(target).then((list) => {
      // Load all file (commands)
      const processList = [];
      list.forEach((item) => {
        processList.push(new Promise((resolveCmd) => {
          const fullPath = path.join(target, item);
          const lstat = fs.lstatSync(fullPath);
          if (lstat.isDirectory()) {
            loadPartial(core, lndr, fullPath).then((loadedCommands) => {
              commands = commands.concat(loadedCommands);
              resolveCmd();
            });
          } else if (lstat.isFile()) {
            const targetPath = path.normalize(`../../${fullPath}`).replace(/\\/g, '/');
            import(targetPath).then((loadedCommand) => {
              if (loadedCommand && loadedCommand.meta && loadedCommand.fn
                && loadedCommand.help && loadedCommand.help.title) {
                commands.push(loadedCommand);
              } else {
                core.log.warn(`이 파일은 올바른 명령어 정의가 아닙니다. 무시하고 계속합니다: ${fullPath}`);
              }
              resolveCmd();
            }).catch((error) => {
              core.err.parse(`명령어를 읽을 수 없습니다: ${item}`, 'silent')(error);
              core.log.warn(`파일을 무시하고 계속합니다: ${fullPath}`);
              resolveCmd();
            });
          } else {
            core.log.warn(`${fullPath} 은 파일 혹은 디렉토리가 아닙니다. 무시하고 계속합니다.`);
          }
        }));
      });
      Promise.all(processList).then(() => {
        resolve(commands);
      });
    }, (dirReadErr) => {
      core.err.parse('명령어 디렉토리를 읽을 수 없습니다. 디렉토리를 무시합니다.', 'silent')(dirReadErr);
      resolve(commands);
    });
  });
};

export const load = (core, lndr): Promise<LNDRCommand[]> => loadPartial(core, lndr, './src/bot/commands');
