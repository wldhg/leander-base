/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as fs from 'fs';
import * as path from 'path';

const preservedNames = [
  'config', 'cli', 'commands', 'modules', 'dummy', 't', 'fn', 'help', 'meta', 'helpEmbed',
];

const loadPartial = (core, lndr, target): Promise<LNDRModule[]> => {
  let modules: LNDRModule[] = [];
  return new Promise((resolve) => {
    fs.promises.readdir(target).then((list) => {
      // Load all file (modules)
      const processList = [];
      list.forEach((item) => {
        processList.push(new Promise((resolveModule) => {
          const fullPath = path.join(target, item);
          const lstat = fs.lstatSync(fullPath);
          if (lstat.isDirectory()) {
            loadPartial(core, lndr, fullPath).then((loadedModules) => {
              modules = modules.concat(loadedModules);
              resolveModule();
            });
          } else if (lstat.isFile()) {
            const targetPath = path.normalize(`../../${fullPath}`).replace(/\\/g, '/');
            import(targetPath).then((loadedModule) => {
              const LoadedModule = loadedModule.default;
              const newModule = new LoadedModule();
              if (newModule && newModule.init && newModule.name) {
                if (preservedNames.includes(newModule.name)) {
                  core.log.error(`이 모듈 이름은 사용할 수 없습니다. 모듈을 불러오지 않습니다: ${newModule.name}`);
                } else {
                  newModule.init(core, lndr).then(() => {
                    modules.push(newModule);
                    resolveModule();
                  }, core.err.parse('모듈이 하나 로드되지 않았습니다. 무시하고 계속합니다.', 'silent'));
                }
              } else {
                core.log.warn(`이 파일은 올바른 모듈이 아닙니다. 무시하고 계속합니다: ${fullPath}`);
              }
              resolveModule();
            }).catch((error) => {
              core.err.parse(`모듈을 읽을 수 없습니다: ${item}`, 'silent')(error);
              core.log.warn(`파일을 무시하고 계속합니다: ${fullPath}`);
              resolveModule();
            });
          } else {
            core.log.warn(`${fullPath} 은 파일 혹은 디렉토리가 아닙니다. 무시하고 계속합니다.`);
          }
        }));
      });
      Promise.all(processList).then(() => {
        resolve(modules);
      });
    }, (dirReadErr) => {
      core.err.parse('모듈 디렉토리를 읽을 수 없습니다. 디렉토리를 무시합니다.', 'silent')(dirReadErr);
      resolve(modules);
    });
  });
};

export const load = (core, lndr): Promise<LNDRModule[]> => loadPartial(core, lndr, './src/bot/modules');
