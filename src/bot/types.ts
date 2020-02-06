/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

/* eslint-disable @typescript-eslint/no-explicit-any */

type LNDRModuleNames = 'dialog' | 'tools' | 'embed';

type LNDR = {
  config: LNDRConfig;
  cli: import('discord.js').Client;
  commands?: LNDRCommand[];
  modules?: LNDRModule[];
  hooks?: {
    [key in import('./message').MessageType]?: LNDRModuleHook[];
  };
  dummy: '\u200B';
  t: LNDRTranslateFunction;
  tDict: object;
  fn: {
    [key: string]: LNDRCommandFunction;
  };
  help: {
    [key: string]: LNDRCommandHelp;
  };
  meta: {
    [key: string]: LNDRCommandMeta;
  };
  helpEmbed?: import('discord.js').RichEmbed;
  [key: string]: LNDRModuleActs | any;
}

interface LNDRConfig {
  discord: {
    token: string;
    clientID: string;
    permission: string;
    adminID: string;
    invitable: boolean;
  };
  domain?: {
    name: string;
    port?: number;
    tls?: {
      key: string;
      cert: string;
    };
  };
  prefix: string;
  presence?: {
    interval: number;
    list: LNDRPresence[];
  };
  lang: 'ko-kr' | string;
  addressing: string;
  name: string;
  emoji?: string;
}

type LNDRPresence = string | {
  name: string;
  url: string;
  type: import('discord.js').ActivityType | number;
};

interface LNDRModule {
  name: string;
  init: (core: AppCore, lndr: LNDR) => Promise<void>;
  acts?: LNDRModuleActs;
  hooks?: LNDRModuleHook[];
}
interface LNDRModuleActs {
  [key: string]: (...args: any[]) => any;
}
interface LNDRModuleHook {
  on: import('./message').MessageType;
  checker: (msg: import('discord.js').Message) => boolean;
  fn: (msg: import('discord.js').Message) => void;
}

interface LNDRCommandMeta {
  section: string | null;
  commands: string[];
  conditions: {
    DM?: boolean;
    channel?: string[];
    author?: string[];
    guild?: string[];
    lndrAdmin?: boolean;
    guildAdmin?: boolean;
  };
}

interface LNDRCommandHelp {
  title: string;
  description?: string;
  fields?: {
    [key: string]: string;
  };
  forServerAdmin?: string[];
  forLndrAdmin?: string[];
}

type LNDRCommandFunction = (core: AppCore, lndr: LNDR, msg: LNDRParsedMessage) => void;

interface LNDRCommand {
  meta: LNDRCommandMeta;
  help: LNDRCommandHelp;
  fn: LNDRCommandFunction;
}

type LNDRTranslateFunction = (sentence: string, ...args: string[]) => string;

interface LNDRParsedMessage {
  serial?: boolean;
  command?: string;
  rawContent?: string;
  segments?: LNDRParsedMessageSegment[];
  codeSegments?: LNDRParsedMessageSegment[];
  arguments?: string[];
  raw?: import('discord.js').Message;
  send?: (content?: import('discord.js').StringResolvable, opts?: import('discord.js').MessageOptions | import('discord.js').Attachment | import('discord.js').RichEmbed) => Promise<import('discord.js').Message | import('discord.js').Message[]>;
  channel?: import('discord.js').Channel;
  author?: import('discord.js').User;
  guild?: import('discord.js').Guild;
  member?: import('discord.js').GuildMember;
}

type LNDRParsedMessageSegment = {
  type: string;
  data: string;
};
