import DISCORD from 'discord.js';
import yml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';

let lndr;
let kernel;
const ships = {};
const shipSkins = {};

export const getShipSkinImage = (shipSkin) => {
  const shipImagePath = path.join(
    kernel.config.dir.base,
    kernel.config.dir.shipImages,
    `${shipSkin.side}_${shipSkin.shipID.replace(/\W/g, '_')}@${shipSkin.skinID.replace(/\W/g, '_')}.png`,
  );

  let imageStream;
  try {
    fs.accessSync(shipImagePath);
    imageStream = new DISCORD.Attachment(fs.createReadStream(
      shipImagePath,
    ));
  } catch (accErr) {
    kernel.log('blhx::getShipSkinImage - Failed to fetch ship skin image.');
    kernel.debug(accErr);
    imageStream = new DISCORD.Attachment(fs.createReadStream(
      kernel.config.dir.baseR,
      'fallbackShip.png',
    ));
  }
  return imageStream;
};

const shipQueryOption = {
  shouldSort: true,
  includeScore: true,
  threshold: 0.8,
  location: 0,
  distance: 100,
  maxPatternLength: 16,
  minMatchCharLength: 1,
  keys: ['name', 'nickname'],
};
const fuseShip = new Fuse(Object.values(ships), shipQueryOption);
export const queryShip = query => fuseShip.search(query);

const shipSkinQueryOption = {
  shouldSort: true,
  includeScore: true,
  threshold: 0.8,
  location: 0,
  distance: 100,
  maxPatternLength: 25,
  minMatchCharLength: 1,
  keys: ['shipName', 'skinName'],
};
const fuseShipSkin = new Fuse(Object.values(shipSkins), shipSkinQueryOption);
export const queryShipSkin = query => fuseShipSkin.search(query);

export const init = (_kernel, _lndr) => {
  kernel = _kernel;
  lndr = _lndr;

  const blhxCache = path.join(
    kernel.config.dir.base,
    kernel.config.dir.blhxCache,
  );

  // Load base informations
  // TODO: Divide ships by origin
  Object.assign(ships, yml.safeLoad(
    fs.readFileSync(path.join(kernel.config.dir.base, 'blhxShipsGen.yml')),
  ));
  Object.assign(ships, yml.safeLoad(
    fs.readFileSync(path.join(kernel.config.dir.base, 'blhxShipsCollab.yml')),
  ));
  Object.assign(ships, yml.safeLoad(
    fs.readFileSync(path.join(kernel.config.dir.base, 'blhxShipsSP.yml')),
  ));

  // Load additional informations
  const shipAddis = {};
  try {
    Object.assign(shipAddis, yml.safeLoad(
      fs.readFileSync(path.join(blhxCache, 'shipsAddiGen.yml')),
    ));
    Object.assign(shipAddis, yml.safeLoad(
      fs.readFileSync(path.join(blhxCache, 'shipsAddiCollab.yml')),
    ));
    Object.assign(shipAddis, yml.safeLoad(
      fs.readFileSync(path.join(blhxCache, 'shipsAddiSP.yml')),
    ));
  } catch (readErr) {
    kernel.err.parse('blhx::init - Failed to load additional informations. Do crawl.')(readErr);
  }

  // Merge informations
  const shipIDs = Object.keys(ships);
  shipIDs.forEach((id) => {
    // Ship object
    if (shipAddis[id]) {
      ships[id] = Object.assign(ships[id], shipAddis[id]);
    }
    ships[id].id = id;

    // Ship skin object
    shipSkins.Default = {
      skinID: 'Default',
      shipID: id,
      side: ships[id].side,
      skinName: ships[id].name,
      shipName: ships[id].name,
    };
    if (ships[id].retrofitable) {
      shipSkins.Retrofit = {
        skinID: 'Retrofit',
        shipID: id,
        side: ships[id].side,
        skinname: `${ships[id].name}·改`,
        shipName: ships[id].name,
      };
    }
    if (ships[id].skins) {
      const eachSkins = Object.keys(ships[id].skins);
      eachSkins.forEach((skinID) => {
        shipSkins[skinID] = {
          skinID,
          shipID: id,
          side: ships[id].side,
          skinName: ships[id].skins[skinID],
          shipName: ships[id].name,
        };
      });
    }
  });

  lndr.getShipSkinImage = getShipSkinImage;
  lndr.queryShip = queryShip;
  lndr.queryShipSkin = queryShipSkin;

  return lndr;
};
