/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';
import * as low from 'lowdb';

export interface PointChange {
  time: string;
  reason: string;
  change: number;
}

export interface PointByUser {
  total: number;
  log: PointChange[];
}

export interface PointDB {
  [key: string]: PointByUser;
}

export interface PointRank {
  point: number;
  users: string[];
}

export interface PointUserRank {
  rank: number;
  point: number;
}

class Point implements LNDRModule {
  public name = 'point';

  public acts = {
    changePoint: (guild, member, change: PointChange): Promise<number> => this.getDB(guild)
      .then((db) => new Promise<number>((resolve) => {
        const memberID = this.getMemberID(member);
        const data: PointByUser = db.get(memberID).defaults({
          total: 0,
          log: [],
        }).value();
        if (data.total + change.change < 0) {
          throw new Error('point::changePoint - 포인트는 음수가 될 수 없습니다.');
        } else {
          data.total += change.change;
          data.log.push(change);
          if (data.log.length > 100) {
            data.log = data.log.slice(Math.max(data.log.length - 100, 0), data.log.length);
          }
          db.set(`${memberID}`, data).write().then(() => {
            resolve(data.total);
          });
        }
      })),

    getPoint: (guild, member): Promise<PointByUser> => this.getDB(guild)
      .then((db) => db.get(this.getMemberID(member)).defaults({
        total: 0,
        log: [],
      }).value()),

    getUserRank: (guild, member): Promise<PointUserRank> => this.getDB(guild)
      .then((db) => {
        const id = this.getMemberID(member);
        const userData = db.get(`${id}`).value();
        const all = db.value();
        const users = Object.keys(all);
        const totalsAll = users.map((userID) => all[userID].total);
        const totalsOrdered = Array.from(new Set(totalsAll)).sort((a, b) => b - a);
        const userTotal = userData ? userData.total : -1;
        const rank = totalsOrdered.indexOf(userTotal);
        return {
          rank,
          point: userTotal,
        };
      }),

    getRankList: (guild): Promise<PointRank[]> => this.getDB(guild)
      .then((db) => {
        const all = db.value();
        const users = Object.keys(all);
        const totalsAll = users.map((userID) => all[userID].total);
        const totalsOrdered = Array.from(new Set(totalsAll)).sort((a, b) => b - a);
        const ranks = totalsOrdered.map((total) => ({
          point: total,
          users: [],
        }));
        for (let i = 0; i < users.length; i += 1) {
          ranks[totalsOrdered.indexOf(all[users[i]].total)].users.push(users[i]);
        }
        return ranks;
      }),
  };

  public init = (
    core: AppCore, lndr: LNDRBase, deps: LNDRModuleDep,
  ): Promise<void> => new Promise((resolve, reject) => {
    if (!lndr.config.point) {
      reject(new Error('point::init - 포인트를 사용하도록 설정되지 않았습니다.'));
    } else if (!deps.guild) {
      reject(new Error('point::init - Guild 모듈이 정상적으로 로드되지 않았습니다.'));
    } else {
      this.core = core;
      this.lndr = lndr;
      this.guild = deps.guild.acts;
      resolve();
    }
  });

  private core: AppCore;

  private lndr: LNDRBase;

  private guild: LNDRModuleActs;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private getDB = (guild: DISCORD.Guild): Promise<low.LowdbAsync<PointDB>> => this.guild.getGuildDB(guild, 'points');

  private getMemberID = (member): string => {
    let id = '';
    if (member instanceof DISCORD.GuildMember) {
      id = member.id;
    } else {
      throw new Error('point::getPoint - 유효하지 않은 멤버 객체입니다.');
    }
    return id;
  }
}

export default Point;
export const deps = ['guild'];
