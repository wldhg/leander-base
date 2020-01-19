/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as fs from 'fs';
import * as path from 'path';

export const sectionList = ['벽람항로', '함대 커뮤니티', '이벤트', '기타'];

export const load = (kernel, lndr, target) => {
  let rawCommands = [];
  let acts = {};
  return new Promise((resolve) => {
    fs.promises.readdir(target).then((list) => {
      // Load all file (modules)
      const processList = [];
      list.forEach((item) => {
        processList.push(new Promise((resolveModule) => {
          const fullPath = path.join(target, item);
          const lstat = fs.lstatSync(fullPath);
          if (lstat.isDirectory()) {
            load(kernel, lndr, fullPath).then(([loadedRawCommands, loadedActs]) => {
              rawCommands = rawCommands.concat(loadedRawCommands);
              acts = Object.assign(acts, loadedActs);
              resolveModule();
            });
          } else if (lstat.isFile()) {
            const targetPath = path.normalize(`../../${fullPath}`).replace(/\\/g, '/');
            import(targetPath).then((rawCommand) => {
              if (rawCommand && rawCommand.main) {
                rawCommand.meta.commands.push(rawCommand.meta.moduleID);
                rawCommands.push(Object.assign(rawCommand.meta, { main: rawCommand.main }));
                acts[rawCommand.meta.moduleID] = rawCommand.actions(kernel, lndr);
              } else {
                kernel.log.warn(`This file is ignored because it's not Leander module: ${fullPath}`);
              }
              resolveModule();
            }).catch((error) => {
              kernel.err.parse(`Failed to read a command module: ${item}`)(error);
              kernel.log.warn(`This file is ignored: ${fullPath}`);
              resolveModule();
            });
          } else {
            kernel.log.warn(`${fullPath} is not file or directory. Ignored.`);
          }
        }));
      });
      Promise.all(processList).then(() => {
        resolve([rawCommands, acts]);
      });
    }, (dirReadErr) => {
      kernel.err.parse('Failed to read directory.')(dirReadErr);
      resolve([rawCommands, acts]);
    });
  });
};
