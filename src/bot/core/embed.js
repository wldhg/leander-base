import DISCORD from 'discord.js';

let lndr;
let kernel;

export const createEmbed = (title, description, ...prop) => {
  // Ingredients
  const sections = [];
  let color = 0xff96a9;
  let footerText = '';

  // Section(field) pusher
  const addSection = (section) => {
    if (section === null) {
      sections.push({ title: lndr.dummySpace, body: lndr.dummySpace });
    } else if (typeof section === 'object' && section.title && section.body) {
      sections.push(section);
    } else {
      kernel.log.warn('embed::createEmbed - Invalid array prop element.');
      kernel.log.debug(section);
    }
  };

  // Do parsing prop
  for (let i = 0; i < prop.length; i += 1) {
    if (typeof prop[i] === 'number' && prop[i] <= 0xffffff && prop[i] >= 0) {
      color = prop[i];
    } else if (typeof prop[i] === 'string') {
      footerText = prop[i];
    } else if (prop[i] instanceof Array) {
      prop[i].forEach(addSection);
    } else {
      addSection(prop[i]);
    }
  }
  const embed = new DISCORD.RichEmbed({
    title, description, color, footer: { text: footerText },
  });
  sections.forEach(section => embed.addField(section.title, section.body, section.inline));
  return embed;
};

export const init = (_kernel, _lndr) => {
  kernel = _kernel;
  lndr = _lndr;
  lndr.createEmbed = createEmbed;
  return lndr;
};
