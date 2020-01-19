/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';
import * as MarkdownIt from 'markdown-it';

class Tools implements LNDRModule {
  public name = 'tools';

  public acts = {
    from: (obj): string => {
      let name;
      if (obj instanceof DISCORD.User) {
        name = obj.username;
      } else if (obj instanceof DISCORD.GuildMember) {
        name = obj.nickname || obj.user.username;
      } else if (obj instanceof DISCORD.Message) {
        if (obj.member) {
          name = obj.member.nickname || obj.author.username;
        } else {
          name = obj.author.username;
        }
      }
      return name;
    },
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
      } else if (obj instanceof DISCORD.Message) {
        user = obj.author;
      } else if (typeof obj === 'string') {
        user = { id: obj };
      } else {
        user = { id: 'unknown' };
        this.core.log.warn('etc::mention - 알 수 없는 객체입니다.');
      }
      return `<@!${user.id}>`;
    },
    parseMessageText: (prefix, content): LNDRParsedMessage => {
      // Initialize arguments
      const parsed: LNDRParsedMessage = {};
      const whitespaces = content.match(/\s/gi);
      const firstWhitespaceIndex = whitespaces ? content.indexOf(whitespaces[0]) : -1;
      const contentWithoutPrefix = content.substring(prefix.length).trim();

      // Analyze content structure
      if (
        (firstWhitespaceIndex === -1 && prefix.length === content.trim().length)
        || (firstWhitespaceIndex === prefix.length)
      ) {
        // {prefix} || {prefix} bulabula
        parsed.serial = false;
        parsed.command = prefix;
        parsed.rawContent = contentWithoutPrefix;
      } else {
        // {prefix}bulabula
        parsed.serial = true;
        if (firstWhitespaceIndex > prefix.length) {
          parsed.command = content.substring(
            prefix.length,
            firstWhitespaceIndex,
          ).trim();
          parsed.rawContent = content.substring(firstWhitespaceIndex).trim();
        } else {
          parsed.command = contentWithoutPrefix;
          parsed.rawContent = '';
        }
      }

      // type: text, code_inline, code_block
      parsed.segments = [];
      parsed.codeSegments = [];
      const segPush = (type, data): void => {
        let recentSegment;

        // Get recent segment
        if (
          type === 'text'
          && parsed.segments.length
          && parsed.segments[parsed.segments.length - 1].type === 'text'
        ) {
          recentSegment = parsed.segments.pop();
        } else {
          recentSegment = {
            type,
            data: '',
          };
        }

        // Add data
        recentSegment.data += data;
        parsed.segments.push(recentSegment);
        if (type !== 'text' && data.length > 0) {
          parsed.codeSegments.push(recentSegment);
        }
      };

      // Analyze code blocks using preorder traversal: long code, code segment
      const tokens = this.md.parse(parsed.rawContent);
      while (tokens.length) {
        // Get a token
        const token = tokens.splice(0, 1)[0];

        // Add childrens or Push to segment array
        if (token.children && token.children.length) {
          let i = 0;
          token.children.forEach((child) => {
            tokens.splice(i, 0, child);
            i += 1;
          });
        } else if (token.type === 'code_inline') {
          segPush('code_inline', token.content.trim());
        } else if (token.type === 'fence') {
          segPush('code_block', token.content.trim());
        } else if (token.content.length > 0) {
          segPush('text', token.content);
        }
      }

      // Trim segment texts
      for (let i = 0; i < parsed.segments.length; i += 1) {
        if (parsed.segments[i].type === 'text') {
          parsed.segments[i].data = parsed.segments[i].data.trim();
        }
      }

      // Analyze first text to arguments
      if (parsed.segments.length > 0 && parsed.segments[0].type === 'text') {
        parsed.arguments = parsed.segments[0].data.split(/\s/g);
      } else {
        parsed.arguments = [];
      }

      return parsed;
    },
  };

  public init = (core: AppCore, lndr: LNDR): Promise<void> => new Promise((resolve) => {
    this.core = core;
    this.lndr = lndr;
    this.md = new MarkdownIt();
    resolve();
  });

  private core: AppCore;

  private lndr: LNDR;

  private md: MarkdownIt;
}

export default Tools;
