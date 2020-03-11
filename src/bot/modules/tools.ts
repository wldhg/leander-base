/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';

type GuildMembers = DISCORD.GuildMember[];

class Tools implements LNDRModule {
  public name = 'tools';

  public acts = {
    getMembers: (guild: DISCORD.Guild, memberLike: string|string[]): Promise<{
      members: GuildMembers;
      unresolved: string[];
    }> => new Promise((resolveMembers) => {
      const unresolvedMemberLikes = [];
      const getMemberPromise = (resolvable): Promise<GuildMembers> => new Promise((resolve) => {
        let snowflake = resolvable;
        if (
          (resolvable.indexOf('<@!') === 0 || resolvable.indexOf('<@&') === 0)
          && resolvable.lastIndexOf('>') === (resolvable.length - 1)
        ) {
          snowflake = resolvable.substring(3, resolvable.length - 1);
        }
        const member = guild.member(snowflake);
        if (member === null) {
          // Retry with role
          guild.roles.fetch(snowflake).then((role: DISCORD.Role) => {
            resolve(role.members.array());
          }).catch(() => {
            unresolvedMemberLikes.push(resolvable);
            resolve([]);
          });
        } else {
          resolve([member]);
        }
      });
      if (memberLike instanceof Array) {
        Promise.all(memberLike.map(getMemberPromise)).then((members) => {
          const memberList = [];
          for (let i = 0; i < members.length; i += 1) {
            memberList.push(...members[i]);
          }
          resolveMembers({
            members: memberList,
            unresolved: unresolvedMemberLikes,
          });
        });
      } else {
        getMemberPromise(memberLike).then((members) => {
          resolveMembers({
            members,
            unresolved: unresolvedMemberLikes,
          });
        });
      }
    }).then(({ members, unresolved }) => ({
      members: Array.from(new Set(members)),
      unresolved,
    })),

    getName: (obj): string => {
      let name;
      if (obj instanceof DISCORD.User) {
        name = obj.username;
      } else if (obj instanceof DISCORD.GuildMember) {
        name = obj.nickname || obj.user.username;
      } else if (obj && obj.member) {
        name = obj.member.nickname || obj.author.username;
      } else if (obj && obj.author) {
        name = obj.author.username;
      } else {
        name = this.UNKNOWN_MEMBER;
      }
      return name;
    },

    getUnknownMemberString: (): string => this.UNKNOWN_MEMBER,

    isURL: (urlLike): boolean => {
      try {
        // eslint-disable-next-line no-new
        new URL(urlLike);
        return true;
      } catch (_) {
        return false;
      }
    },

    mention: (obj): string => {
      let user;
      if (obj instanceof DISCORD.User) {
        user = obj;
      } else if (obj && obj.author) {
        user = obj.author;
      } else if (obj && obj.user && obj.user instanceof DISCORD.User) {
        user = obj.user;
      } else if (typeof obj === 'string') {
        user = { id: obj };
      } else {
        this.core.log.warn('tools::mention - 알 수 없는 객체입니다.');
        this.core.log.debug(obj);
        return '';
      }
      return `<@!${user.id}>`;
    },

    wa: (str: string): string => this.krBatchimTest(str, '와', '과'),
    i: (str: string): string => this.krBatchimTest(str, '이', '가'),
    eun: (str: string): string => this.krBatchimTest(str, '은', '는'),
    eul: (str: string): string => this.krBatchimTest(str, '을', '를'),
  };

  public init = (core: AppCore, lndr: LNDRBase): Promise<void> => new Promise((resolve) => {
    this.core = core;
    this.lndr = lndr;
    resolve();
  });

  private core: AppCore;

  private lndr: LNDRBase;

  private krBatchimTest = (str: string, app1: string, app2: string): string => {
    let waStr = `${str}${app2}`;
    if (str.length > 0) {
      const testStr = str.replace(/[^a-zA-Z가-힣]/gi, '');
      const lastChar = testStr.charCodeAt(testStr.length - 1);
      if (
        lastChar === 0x0041 || lastChar === 0x0061
        || lastChar === 0x0045 || lastChar === 0x0065
        || lastChar === 0x0049 || lastChar === 0x0069
        || lastChar === 0x004f || lastChar === 0x006f
        || lastChar === 0x0055 || lastChar === 0x0075
      ) {
        waStr = `${str}${app1}`;
      } else if (((lastChar - 0xac00) % 28) === 0) {
        waStr = `${str}${app1}`;
      }
    }
    return waStr;
  }

  private UNKNOWN_MEMBER = '(없는 멤버)';
}

export default Tools;
