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
              if (!loadedCommand) {
                core.log.warn(`이 파일은 올바른 명령어 정의가 아닙니다. 무시하고 계속합니다: ${fullPath}`);
              } else if (!loadedCommand.meta) {
                core.log.warn(`명령어 메타 정보가 없습니다. 무시하고 계속합니다: ${fullPath}`);
              } else if (!loadedCommand.fn) {
                core.log.warn(`명령어 처리 함수가 없습니다. 무시하고 계속합니다: ${fullPath}`);
              } else if (!loadedCommand.deps) {
                core.log.warn(`명령어 모듈 의존성 정보가 없습니다. 무시하고 계속합니다: ${fullPath}`);
              } else if (!loadedCommand.help || !loadedCommand.help.title) {
                core.log.warn(`명령어 도움말이 없습니다. 명령어를 도움말에 표시하지 않으려면 메타 정보의 \`section\` 란을 \`null\`로 설정하세요. 이 명령어 파일을 무시하고 계속합니다: ${fullPath}`);
              } else {
                commands.push(loadedCommand);
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

export const load = (core, lndr, modules: string[]):
  Promise<LNDRCommand[]> => loadPartial(core, lndr, './src/bot/commands')
  .then((cmds: LNDRCommand[]) => new Promise<LNDRCommand[]>((resolve) => {
    const checkCmds = [];
    for (let i = 0; i < cmds.length; i += 1) {
      checkCmds.push(new Promise((chkComplete) => {
        if (cmds[i].deps.length > 0) {
          for (let j = 0; j < cmds[i].deps.length; j += 1) {
            if (!modules.includes(cmds[i].deps[j])) {
              core.log.warn('모듈 의존성이 해결되지 않은 명령어가 있습니다. 무시하고 계속합니다.');
              core.log.debug({
                commandTitle: cmds[i].help.title,
                requiredModules: cmds[i].deps,
                notResolvedModules: cmds[i].deps[j],
              });
              chkComplete(null);
              break;
            } else if (j === cmds[i].deps.length - 1) {
              chkComplete(cmds[i]);
            }
          }
        } else {
          chkComplete(cmds[i]);
        }
      }));
    }
    Promise.all(checkCmds).then((checkedCmds) => {
      resolve(checkedCmds.filter((cmd) => cmd !== null));
    });
  }));
