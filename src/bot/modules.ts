/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as fs from 'fs';
import * as path from 'path';

const loadAModule = (core, lndr, modulePath, newModule, deps, callback): void => {
  if (newModule && newModule.init && newModule.name) {
    newModule.init(core, lndr, deps).then(() => {
      callback(newModule);
    }, (initErr) => {
      core.err.parse('모듈이 하나 로드되지 않았습니다. 무시하고 계속합니다.', 'silent')(initErr);
      callback();
    });
  } else {
    core.log.warn(`이 파일은 올바른 모듈이 아닙니다. 무시하고 계속합니다: ${modulePath}`);
    callback();
  }
};

const loadPartial = (core, lndr, target): Promise<[LNDRModule[], LNDRModuleDepNotResolved[]]> => {
  let modules: LNDRModule[] = [];
  let notLoadedModules: LNDRModuleDepNotResolved[] = [];
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
              modules = modules.concat(loadedModules[0]);
              notLoadedModules = notLoadedModules.concat(loadedModules[1]);
              resolveModule();
            });
          } else if (lstat.isFile()) {
            if (item === 'types.ts') {
              // Ignore type definition file
              resolveModule();
            } else {
              const targetPath = path.normalize(`../../${fullPath}`).replace(/\\/g, '/');
              import(targetPath).then((loadedModule) => {
                const LoadedModule = loadedModule.default;
                const LoadedModuleDependencies = loadedModule.deps || loadedModule.dependencies;
                const newModule = new LoadedModule();
                if (LoadedModuleDependencies?.length > 0) {
                  // Add to dependency waiting list
                  notLoadedModules.push({
                    module: newModule,
                    deps: LoadedModuleDependencies,
                    path: fullPath,
                  });
                  resolveModule();
                } else {
                  // Load and add to module list
                  loadAModule(core, lndr, fullPath, newModule, {}, (mod) => {
                    if (mod) {
                      modules.push(mod);
                    }
                    resolveModule();
                  });
                }
              }).catch((error) => {
                core.err.parse(`모듈을 읽을 수 없습니다: ${item}`, 'silent')(error);
                core.log.warn(`파일을 무시하고 계속합니다: ${fullPath}`);
                resolveModule();
              });
            }
          } else {
            core.log.warn(`${fullPath} 은 파일 혹은 디렉토리가 아닙니다. 무시하고 계속합니다.`);
          }
        }));
      });
      Promise.all(processList).then(() => {
        resolve([modules, notLoadedModules]);
      });
    }, (dirReadErr) => {
      core.err.parse('모듈 디렉토리를 읽을 수 없습니다. 디렉토리를 무시합니다.', 'silent')(dirReadErr);
      resolve([modules, notLoadedModules]);
    });
  });
};

export const load = (core, lndr): Promise<LNDRModule[]> => loadPartial(core, lndr, './src/bot/modules')
  .then(([loaded, notLoaded]): LNDRModule[] => {
    let targets: LNDRModuleDepNotResolved[] = notLoaded;
    while (targets.length > 0) {
      let newlyLoaded = 0;
      const newTargets: LNDRModuleDepNotResolved[] = [];
      const loadedModuleNames = [];
      for (let i = 0; i < loaded.length; i += 1) {
        loadedModuleNames.push(loaded[i].name);
      }
      for (let i = 0; i < targets.length; i += 1) {
        let isModuleCanBeLoaded = true;
        const deps: LNDRModuleDep = {};
        for (let j = 0; j < targets[i].deps.length; j += 1) {
          const foundDepIndex = loadedModuleNames.indexOf(targets[i].deps[j]);
          if (foundDepIndex === -1) {
            isModuleCanBeLoaded = false;
            break;
          } else {
            deps[targets[i].deps[j]] = loaded[foundDepIndex];
          }
        }
        if (isModuleCanBeLoaded) {
          loadAModule(core, lndr, targets[i].path, targets[i].module, deps, (mod) => {
            if (mod) {
              loaded.push(mod);
            }
          });
          newlyLoaded += 1;
        } else {
          newTargets.push(targets[i]);
        }
      }
      if (newlyLoaded === 0) {
        core.log.error('의존성이 해결되지 않은 모듈이 있습니다. 무시하고 계속합니다.');
        core.log.debug(targets.map((_) => _.module.name));
        break;
      } else {
        targets = newTargets;
      }
    }
    return loaded;
  });
