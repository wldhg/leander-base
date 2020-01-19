/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';
import * as yml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

class Guild implements LNDRModule {
  public name = 'guild';

  public acts = {
    savePartialData: (guild, key, value, group): object => {
      const data = this.acts.loadData(guild, group);
      data[key] = value;
      return this.acts.saveData(guild, data, group);
    },
    saveData: (guild, data, group): object => this.core.util.mkdir(
      this.core.config.dir.DATA,
      path.join('guild', guild.id),
    ).then(() => {
      try {
        fs.writeFileSync(this.pathSchemeFull(guild, group), yml.safeDump(data));
      } catch (writeErr) {
        this.core.err.parse('guild::saveData - 쓰기 스트림을 열 수 없습니다.')(writeErr);
      }
      return data;
    }, this.core.err.parse('guild::saveData - 저장 디렉토리를 만들 수 없습니다.')),
    loadPartialData: (guild, key, group): null | object => {
      const data = this.acts.loadData(guild, group);
      return data[key] || null;
    },
    loadData: (guild, group): object => {
      const data = {};
      try {
        const raw = fs.readFileSync(this.pathSchemeFull(guild, group), { encoding: 'utf-8' });
        Object.assign(data, yml.safeLoad(raw));
      } catch (readErr) {
        this.core.log.warn('guild::loadData - 길드 데이터를 가져올 수 없습니다.');
        this.core.log.debug(readErr);
      }
      return data;
    },
  };

  public init = (core: AppCore, lndr: LNDR): Promise<void> => new Promise((resolve) => {
    this.core = core;
    this.lndr = lndr;
    resolve();
  });

  private core: AppCore;

  private lndr: LNDR;

  private pathScheme = (guild, group): string => {
    let name;
    if (guild instanceof DISCORD.Guild) {
      name = group && group.length > 0 ? `${group}.yml` : 'db.yml';
    } else {
      throw this.core.err.make('유효하지 않은 길드 객체입니다.');
    }
    return path.join('guild', guild.id, name);
  };

  private pathSchemeFull = (guild, group): string => path.join(
    this.core.config.dir.DATA,
    this.pathScheme(guild, group),
  );
}

export default Guild;
