/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';

type EmbedContentSection = {
  title: string;
  body: string;
}
type EmbedContent = number | string | EmbedContentSection[] | EmbedContentSection;

class Embed implements LNDRModule {
  public name = 'embed';

  public acts = {
    create: (title: string, description?: string, ...prop: EmbedContent[]):
    DISCORD.MessageEmbed => {
      // Ingredients
      const sections = [];
      let color = 0xff96a9;
      let footerText = '';

      // Section(field) pusher
      const addSection = (section): void => {
        if (section === null) {
          sections.push({ title: this.lndr.dummy, body: this.lndr.dummy });
        } else if (
          typeof section === 'object' && section.title && section.body
        ) {
          sections.push(section);
        } else {
          this.core.log.warn('embed::create - 유효하지 않은 Embed 구성 요소입니다.');
          this.core.log.debug(section);
        }
      };

      // Do parsing prop
      for (let i = 0; i < prop.length; i += 1) {
        if (
          typeof prop[i] === 'number' && prop[i] <= 0xffffff && prop[i] >= 0
        ) {
          color = Number(prop[i]);
        } else if (typeof prop[i] === 'string') {
          footerText = String(prop[i]);
        } else if (prop[i] instanceof Array) {
          Array(prop[i]).forEach(addSection);
        } else {
          addSection(prop[i]);
        }
      }

      // Create new embed
      const embed = new DISCORD.MessageEmbed({
        title,
        description,
        color,
        footer: { text: footerText },
      });

      // Add each sections
      sections.forEach((section) => embed.addField(section.title, section.body, section.inline));

      // Finished
      return embed;
    },
  };

  public init = (core: AppCore, lndr: LNDRBase): Promise<void> => new Promise((resolve) => {
    this.core = core;
    this.lndr = lndr;
    resolve();
  });

  public core: AppCore;

  public lndr: LNDRBase;
}

export default Embed;
