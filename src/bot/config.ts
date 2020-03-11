/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty */

export const CONFIG_ERROR = 'ERRR! WHAT\'S WRONG WITH YOUR CONFIGURATION??? ㅠㅠㅠ';

export const check = (
  core: AppCore, conf: LNDRConfig,
): Promise<string|null> => new Promise<string|null>((ok, fail) => {
  // Requried but did not exist
  const rx = (item: string, t?: string): any => {
    const ix = item.split('.');
    let realItem = conf;
    for (let i = 0; i < ix.length; i += 1) {
      if (typeof realItem[ix[i]] !== 'undefined') {
        realItem = realItem[ix[i]];
      } else {
        throw new Error(
          `\`${item}\` 항목은 반드시 있어야 하지만 설정 파일에서 찾을 수 없었습니다.`,
        );
      }
    }
    if (t && typeof realItem !== t) {
      if (t === 'array' && realItem instanceof Array) {
        return realItem;
      }
      throw new Error(`\`${item}\` 항목에 요구되는 타입은 ${t}이지만 읽어온 타입은 ${typeof realItem}(으)로 달랐습니다.`);
    } else {
      return realItem;
    }
  };

  // Conditionally required but did not exist
  const cx = (cond: string, item: string, t?: string): void => {
    const ix = item.split('.');
    let realItem = null;
    try {
      realItem = rx(cond);
    } catch (e) {}
    if (realItem !== null) {
      if (item.length > 0) {
        for (let i = 0; i < ix.length; i += 1) {
          if (typeof realItem[ix[i]] !== 'undefined') {
            realItem = realItem[ix[i]];
          } else {
            throw new Error(
              `\`${cond}\` 항목이 존재한다면 \`${cond}.${item}\` 항목도 반드시 있어야 하지만 설정 파일에서 찾을 수 없었습니다.`,
            );
          }
        }
      }
      if (t && typeof realItem !== t) {
        if (t === 'array' && realItem instanceof Array) {
          return;
        }
        throw new Error(`\`${cond}${item.length > 0 ? `.${item}` : ''}\` 항목에 요구되는 타입은 ${t} 이지만 읽어온 타입은 ${typeof realItem} (으)로 달랐습니다.`);
      }
    }
  };

  try {
    /* discord */
    rx('discord', 'object');
    rx('discord.token', 'string');
    rx('discord.clientID', 'string');
    rx('discord.permission', 'string');
    rx('discord.adminID', 'string');
    rx('discord.invitable', 'boolean');

    /* serverlock */
    cx('serverlock', '', 'array');

    /* web */
    cx('web', '', 'object');
    cx('web', 'frontend', 'object');
    cx('web.frontend.domain', '', 'string');
    cx('web.frontend', 'port', 'number');
    cx('web.frontend.https', '', 'boolean');
    cx('web', 'backend', 'object');
    cx('web.backend', 'domain', 'string');
    cx('web.backend.port', '', 'number');
    cx('web.backend.tls', 'privkey', 'string');
    cx('web.backend.tls', 'fullchain', 'string');

    /* prefix */
    rx('prefix', 'string');

    /* presence */
    cx('presence', '', 'object');
    cx('presence', 'timeout', 'number');
    cx('presence', 'active', 'object');
    cx('presence.active', 'interval', 'number');
    cx('presence.active', 'list', 'array');
    cx('presence.rest', '', 'object');
    cx('presence.rest', 'interval', 'number');
    cx('presence.rest', 'list', 'array');

    /* lang */
    rx('lang', 'string');

    /* addressing */
    rx('addressing', 'string');

    /* name */
    rx('name', 'string');

    /* emoji */
    cx('emoji', '', 'string');

    /* point */
    cx('point', '', 'boolean');

    ok();
  } catch (err) {
    if (err instanceof Error) {
      core.log.error(err.message);
    } else {
      core.log.error('설정 파일 검사 중 알 수 없는 오류가 발생했습니다.');
      core.log.debug(err);
    }
    fail(CONFIG_ERROR);
  }
});
