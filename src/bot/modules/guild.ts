/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';
import * as low from 'lowdb';
import * as LowAsyncAdapter from 'lowdb/adapters/FileAsync';
import * as path from 'path';

interface LNDRGuildPathSet {
  baseDir: string;
  newDir: string;
  filePath: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
class Guild implements LNDRModule {
  public name = 'guild';

  public acts = {
    getGuildDB: <T>(guild, group):
    Promise<low.LowdbAsync<T>> => new Promise<low.LowdbAsync<T>>((resolve) => {
      try {
        this.getAdapter<T>(guild, group).then((db) => {
          resolve(db);
        });
      } catch (readErr) {
        this.core.log.warn('guild::loadData - 길드 데이터를 불러올 수 없습니다.');
        this.core.log.debug(readErr);
        resolve(null);
      }
    }),
  };

  public init = (core: AppCore, lndr: LNDRBase): Promise<void> => new Promise((resolve) => {
    this.core = core;
    this.lndr = lndr;
    this.db = {};
    resolve();
  });

  private db: {
    [key: string]: low.LowdbAsync<any>;
  };

  private core: AppCore;

  private lndr: LNDRBase;

  private getPath = (guild, group): LNDRGuildPathSet => {
    let name;
    if (guild instanceof DISCORD.Guild) {
      name = group && group.length > 0 ? `${group}.json` : 'main.json';
    } else {
      throw this.core.err.make('guild::getPath - 유효하지 않은 길드 객체입니다.');
    }
    return {
      baseDir: this.core.config.dir.DATA,
      newDir: path.join('guild', guild.id),
      filePath: this.core.config.dir.data(['guild', guild.id, name]),
    };
  };

  private getAdapter = <T>(guild: DISCORD.Guild, group: string): Promise<low.LowdbAsync<T>> => {
    const { baseDir, newDir, filePath } = this.getPath(guild, group);
    let adapterPromise = null;
    if (this.db[filePath]) {
      adapterPromise = Promise.resolve<low.LowdbAsync<T>>(this.db[filePath]);
    } else {
      adapterPromise = new Promise<low.LowdbAsync<T>>((resolve) => {
        this.core.util.mkdir(baseDir, newDir).then(() => {
          const adapter = new LowAsyncAdapter<T>(filePath);
          low(adapter).then((db) => {
            this.db[filePath] = db;
            resolve(db);
          });
        });
      });
    }
    return adapterPromise;
  };
}

export default Guild;
