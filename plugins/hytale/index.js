// Hytale Plugin for HyVornBot
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

const Colors = {
  HYTALE: 0x00D4AA,
  ZONE1: 0x4CAF50,  // Emerald Grove - Green
  ZONE2: 0xFFC107,  // Howling Sands - Yellow/Sand
  ZONE3: 0x2196F3,  // Borea - Ice Blue
  ZONE4: 0x9C27B0,  // Devastated Lands - Purple
  ZONE5: 0x00BCD4,  // Ocean - Cyan
  ERROR: 0xED4245,
  SUCCESS: 0x57F287,
  KWEEBEC: 0x8BC34A,
  TRORK: 0x8B4513,
  FERAN: 0xFFB300,
  OUTLANDER: 0x607D8B
};

// ============================================
// EXPANDED ZONES DATA WITH SUB-BIOMES
// ============================================
const ZONES = {
  'emerald-grove': {
    name: 'Emerald Grove (Zone 1)',
    description: 'A lush, vibrant forest zone filled with ancient trees, mystical creatures, and the peaceful Kweebec villages. This is where most players will begin their adventure.',
    color: Colors.ZONE1,
    creatures: ['Kweebec', 'Trork', 'Fen Stalker', 'Pterosaur', 'Forest Troll', 'Dire Wolf', 'Giant Spider', 'Fairy'],
    features: ['Dense forests', 'Kweebec villages', 'Ancient ruins', 'Underground caves', 'Rivers and lakes'],
    subBiomes: [
      { name: 'Deep Forest', description: 'Ancient trees block out the sun, home to dangerous predators.' },
      { name: 'Mushroom Groves', description: 'Bioluminescent fungi light up these magical clearings.' },
      { name: 'Riverlands', description: 'Fertile areas along winding rivers, popular for settlements.' },
      { name: 'Trork Camps', description: 'Hostile territory controlled by raiding Trork tribes.' },
      { name: 'Fairy Glades', description: 'Mystical clearings where magical creatures gather.' }
    ]
  },
  'howling-sands': {
    name: 'Howling Sands (Zone 2)',
    description: 'A vast desert zone with scorching days and freezing nights. Home to the Feran civilization and dangerous sand-dwelling creatures.',
    color: Colors.ZONE2,
    creatures: ['Feran', 'Sand Empress', 'Desert Scorpion', 'Mummy', 'Scarab Swarm', 'Sand Wurm', 'Sphinx', 'Dust Devil'],
    features: ['Sand dunes', 'Oases', 'Ancient pyramids', 'Underground temples', 'Sandstorms'],
    subBiomes: [
      { name: 'Great Dunes', description: 'Endless rolling sand dunes stretching to the horizon.' },
      { name: 'Oasis Gardens', description: 'Rare patches of life around precious water sources.' },
      { name: 'Pyramid Fields', description: 'Ancient Feran burial grounds filled with treasure and danger.' },
      { name: 'Salt Flats', description: 'Barren crystalline plains reflecting blinding sunlight.' },
      { name: 'Canyon Maze', description: 'Labyrinthine canyons carved by ancient rivers.' }
    ]
  },
  'borea': {
    name: 'Borea (Zone 3)',
    description: 'A frozen tundra zone covered in snow and ice. Features harsh weather conditions and formidable frost creatures.',
    color: Colors.ZONE3,
    creatures: ['Frost Giant', 'Ice Dragon', 'Yeti', 'Polar Bear', 'Ice Elemental', 'Mammoth', 'Snow Wolf', 'Frost Witch'],
    features: ['Frozen lakes', 'Ice caves', 'Snowy mountains', 'Northern lights', 'Blizzards'],
    subBiomes: [
      { name: 'Frozen Tundra', description: 'Flat, windswept plains of permafrost.' },
      { name: 'Ice Caverns', description: 'Crystal caves of blue ice hiding ancient secrets.' },
      { name: 'Glacial Peaks', description: 'Towering mountains capped with eternal snow.' },
      { name: 'Frozen Sea', description: 'Icebergs and frozen waters teeming with life beneath.' },
      { name: 'Aurora Fields', description: 'Magical areas where the northern lights touch the ground.' }
    ]
  },
  'devastated-lands': {
    name: 'Devastated Lands (Zone 4)',
    description: 'A corrupted, volcanic zone scarred by dark magic. The most dangerous region, home to powerful undead and demonic creatures.',
    color: Colors.ZONE4,
    creatures: ['Void Dragon', 'Undead', 'Demons', 'Corrupted Beings', 'Lava Golem', 'Shadow Wraith', 'Bone Colossus', 'Void Spawn'],
    features: ['Volcanoes', 'Lava rivers', 'Corrupted forests', 'Dark fortresses', 'Void portals'],
    subBiomes: [
      { name: 'Volcanic Wastes', description: 'Rivers of lava flow through blackite rock formations.' },
      { name: 'Corrupted Forest', description: 'Once-living trees twisted by void energy.' },
      { name: 'Bone Fields', description: 'Ancient battlegrounds littered with remains of fallen armies.' },
      { name: 'Void Rifts', description: 'Tears in reality leaking otherworldly energy.' },
      { name: 'Dark Citadels', description: 'Imposing fortresses of the void lords.' }
    ]
  },
  'ocean': {
    name: 'Ocean (Zone 5)',
    description: 'The vast seas surrounding Orbis, filled with underwater ruins, sea monsters, and island chains waiting to be explored.',
    color: Colors.ZONE5,
    creatures: ['Kraken', 'Merfolk', 'Sea Serpent', 'Giant Crab', 'Siren', 'Shark', 'Jellyfish Swarm', 'Leviathan'],
    features: ['Coral reefs', 'Sunken ships', 'Underwater ruins', 'Island chains', 'Deep trenches'],
    subBiomes: [
      { name: 'Coral Gardens', description: 'Vibrant underwater ecosystems teeming with colorful life.' },
      { name: 'Shipwreck Graveyard', description: 'Sunken vessels holding treasure and restless spirits.' },
      { name: 'Abyssal Depths', description: 'Dark trenches where ancient horrors lurk.' },
      { name: 'Tropical Islands', description: 'Paradise islands with hidden dangers.' },
      { name: 'Merfolk Kingdom', description: 'Underwater civilization of the sea people.' }
    ]
  }
};

// ============================================
// FACTIONS DATA (Based on Hytale Wiki)
// ============================================
const FACTIONS = {
  // === PEACEFUL FACTIONS ===
  'kweebec': {
    name: 'Kweebecs',
    description: 'Small, friendly forest-dwelling creatures who form unique societies with their own cultures. They live in harmony with nature and are known for their colorful villages built into giant trees.',
    color: Colors.KWEEBEC,
    zone: 'Emerald Grove',
    disposition: 'Peaceful',
    traits: ['Peaceful', 'Nature-loving', 'Community-focused', 'Skilled craftsmen'],
    enemies: ['Trorks'],
    culture: 'Kweebecs value community and harmony with nature. Their villages feature intricate tree-house architecture connected by rope bridges.',
    reputation: 'Players can increase standing by rescuing Kweebecs from Trork camps. Standing decreases by attacking them or cutting nearby trees. Low reputation triggers Kweebec Razorleaf Rangers to attack.',
    leader: 'Village Elders'
  },
  'feran': {
    name: 'Ferans',
    description: 'An ancient, cat-like civilization inhabiting the desert. They have built magnificent structures and possess deep religious traditions centered around their deity.',
    color: Colors.FERAN,
    zone: 'Howling Sands',
    disposition: 'Peaceful',
    traits: ['Ancient', 'Religious', 'Mysterious', 'Builders'],
    enemies: ['Scaraks'],
    culture: 'The Ferans worship their deity through religious offerings. Their civilization features grand pyramids and temples filled with ancient knowledge.',
    reputation: 'Players gain standing through gift-giving and religious offerings to the Feran deity.',
    leader: 'High Priests'
  },
  // === AGGRESSIVE FACTIONS ===
  'trork': {
    name: 'Trorks',
    description: 'Hostile, tribal creatures that operate camps where they capture other NPCs. They are aggressive raiders who oppose the peaceful Kweebecs.',
    color: Colors.TRORK,
    zone: 'Emerald Grove',
    disposition: 'Aggressive',
    traits: ['Aggressive', 'Tribal', 'Raiders', 'Captors'],
    enemies: ['Kweebecs', 'Players'],
    culture: 'Trorks are organized into raiding parties that capture NPCs from other factions. Their camps serve as prisons for their captives.',
    reputation: 'Hostile by default. Players can rescue captured NPCs from their camps.',
    leader: 'Tribal Warlords'
  },
  'scarak': {
    name: 'Scaraks',
    description: 'Aggressive insectoid creatures that inhabit the Howling Sands desert. They pose a constant threat to travelers and the Feran civilization.',
    color: Colors.ZONE2,
    zone: 'Howling Sands',
    disposition: 'Aggressive',
    traits: ['Aggressive', 'Insectoid', 'Swarming', 'Desert-dwelling'],
    enemies: ['Ferans', 'Players'],
    culture: 'Scaraks operate in swarms and colonies beneath the desert sands. They are fiercely territorial and attack intruders on sight.',
    reputation: 'Hostile by default.',
    leader: 'Hive Queens'
  },
  'outlander': {
    name: 'Outlanders',
    description: 'A faction found in Borea with an aggressive disposition. They have adapted to the harsh frozen environment and defend their territory fiercely.',
    color: Colors.OUTLANDER,
    zone: 'Borea',
    disposition: 'Aggressive',
    traits: ['Aggressive', 'Hardy', 'Survivalists', 'Territorial'],
    enemies: ['Intruders'],
    culture: 'Outlanders have established settlements in the frozen wastes of Borea. They are wary of strangers and quick to defend their resources.',
    reputation: 'Hostile by default in their territory.',
    leader: 'Chieftains'
  },
  // === OTHER FACTIONS ===
  'slothian': {
    name: 'Slothians',
    description: 'Mysterious creatures inhabiting the Devastated Lands. Little is known about their disposition or culture.',
    color: Colors.ZONE4,
    zone: 'Devastated Lands',
    disposition: 'Unknown',
    traits: ['Mysterious', 'Corrupted lands dwellers'],
    enemies: ['Unknown'],
    culture: 'The Slothians exist within the corrupted Devastated Lands. Their nature and intentions remain shrouded in mystery.',
    reputation: 'Unknown disposition.',
    leader: 'Unknown'
  },
  'faun': {
    name: 'Fauns',
    description: 'A faction whose zone and disposition are not yet fully revealed. They appear to be nature-connected creatures.',
    color: 0x8B4513,
    zone: 'Unknown',
    disposition: 'Unknown',
    traits: ['Nature-connected', 'Mysterious'],
    enemies: ['Unknown'],
    culture: 'Little is known about Faun society and culture.',
    reputation: 'Unknown.',
    leader: 'Unknown'
  },
  'klop': {
    name: 'Klops',
    description: 'A faction with a neutral disposition. They are neither hostile nor friendly by default, making them unique among Orbis factions.',
    color: 0x808080,
    zone: 'Unknown',
    disposition: 'Neutral',
    traits: ['Neutral', 'Passive'],
    enemies: ['None by default'],
    culture: 'Klops maintain a neutral stance toward other factions and players.',
    reputation: 'Neutral by default. Actions may shift their disposition.',
    leader: 'Unknown'
  }
};

// ============================================
// EXPANDED CREATURES DATA
// ============================================
const CREATURES = {
  'fen-stalker': {
    name: 'Fen Stalker',
    description: 'A terrifying creature that lurks in swamps and dark forests. It uses stealth to ambush unsuspecting prey with its razor-sharp claws.',
    zone: 'Emerald Grove',
    danger: 'High',
    color: Colors.ZONE1,
    behavior: 'Aggressive ambush predator',
    drops: ['Stalker Claw', 'Dark Hide', 'Fang'],
    tips: 'Listen for its distinctive clicking sound. It cannot attack while you maintain eye contact.'
  },
  'pterosaur': {
    name: 'Pterosaur',
    description: 'Flying reptiles that soar through the skies of Orbis. Some can be tamed and used as mounts for aerial travel.',
    zone: 'Multiple Zones',
    danger: 'Medium',
    color: Colors.HYTALE,
    behavior: 'Territorial, can be tamed',
    drops: ['Pterosaur Leather', 'Wing Membrane', 'Feathers'],
    tips: 'Approach with raw meat to begin the taming process. Avoid their nests during mating season.'
  },
  'void-dragon': {
    name: 'Void Dragon',
    description: 'The most powerful creature in Orbis. A massive dragon corrupted by void energy, serving as a major boss encounter.',
    zone: 'Devastated Lands',
    danger: 'Extreme',
    color: Colors.ZONE4,
    behavior: 'Extremely hostile boss creature',
    drops: ['Void Scale', 'Dragon Heart', 'Corruption Essence', 'Legendary Weapons'],
    tips: 'Requires a full party with void resistance gear. Target the corruption crystals on its body.'
  },
  'yeti': {
    name: 'Yeti',
    description: 'Large, fur-covered creatures that roam the frozen wastes of Borea. Generally peaceful unless provoked or protecting their young.',
    zone: 'Borea',
    danger: 'Medium',
    color: Colors.ZONE3,
    behavior: 'Territorial but not aggressive',
    drops: ['Yeti Fur', 'Frost Essence', 'Large Bones'],
    tips: 'Can be befriended with offerings of fish. Makes excellent cold-weather companions.'
  },
  'sand-empress': {
    name: 'Sand Empress',
    description: 'A powerful boss creature that rules the deepest tombs of the Howling Sands. Commands legions of undead servants.',
    zone: 'Howling Sands',
    danger: 'Extreme',
    color: Colors.ZONE2,
    behavior: 'Boss creature, commands undead',
    drops: ['Royal Scarab', 'Ancient Crown', 'Mummy Wrappings', 'Desert Treasure'],
    tips: 'Destroy the canopic jars to prevent her resurrection. Light-based weapons deal extra damage.'
  },
  'forest-troll': {
    name: 'Forest Troll',
    description: 'Massive, lumbering creatures that guard bridges and forest paths. They demand tolls from travelers or attack.',
    zone: 'Emerald Grove',
    danger: 'High',
    color: Colors.ZONE1,
    behavior: 'Territorial, demands tribute',
    drops: ['Troll Hide', 'Troll Fat', 'Club'],
    tips: 'Fire prevents their regeneration. Can sometimes be bribed with food or gold.'
  },
  'ice-elemental': {
    name: 'Ice Elemental',
    description: 'Living constructs of pure ice magic. They patrol frozen areas and attack anything that radiates heat.',
    zone: 'Borea',
    danger: 'Medium',
    color: Colors.ZONE3,
    behavior: 'Attacks heat sources',
    drops: ['Frost Core', 'Ice Shards', 'Frozen Essence'],
    tips: 'Fire magic is highly effective. Avoid using torches near them.'
  },
  'sand-wurm': {
    name: 'Sand Wurm',
    description: 'Enormous worms that burrow through the desert sands. They detect prey through vibrations and can swallow adventurers whole.',
    zone: 'Howling Sands',
    danger: 'High',
    color: Colors.ZONE2,
    behavior: 'Ambush predator, detects vibrations',
    drops: ['Wurm Teeth', 'Wurm Hide', 'Digestite Acid'],
    tips: 'Walk without rhythm to avoid detection. Rocky outcrops provide safe zones.'
  },
  'kraken': {
    name: 'Kraken',
    description: 'Legendary sea monster with massive tentacles. It attacks ships and drags sailors to watery graves.',
    zone: 'Ocean',
    danger: 'Extreme',
    color: Colors.ZONE5,
    behavior: 'Attacks ships, boss creature',
    drops: ['Kraken Tentacle', 'Abyssal Ink', 'Sea Monster Heart'],
    tips: 'Target the tentacles first. Cannons with explosive rounds are most effective.'
  },
  'shadow-wraith': {
    name: 'Shadow Wraith',
    description: 'Incorporeal undead that phase through walls and drain the life force of the living.',
    zone: 'Devastated Lands',
    danger: 'High',
    color: Colors.ZONE4,
    behavior: 'Phases through matter, life drain',
    drops: ['Ectoplasm', 'Soul Fragment', 'Wraith Cloth'],
    tips: 'Only magical weapons can harm them. Holy light forces them to become corporeal.'
  },
  'mammoth': {
    name: 'Mammoth',
    description: 'Massive woolly beasts that roam the tundra in herds. Can be tamed as mounts and pack animals.',
    zone: 'Borea',
    danger: 'Low',
    color: Colors.ZONE3,
    behavior: 'Peaceful herbivore, herd animal',
    drops: ['Mammoth Wool', 'Ivory', 'Mammoth Meat'],
    tips: 'Approach the herd leader with vegetables to begin taming. Never separate calves from mothers.'
  },
  'fairy': {
    name: 'Fairy',
    description: 'Tiny magical beings that inhabit enchanted glades. They can be mischievous but offer aid to those who earn their trust.',
    zone: 'Emerald Grove',
    danger: 'Low',
    color: Colors.ZONE1,
    behavior: 'Mischievous, helpful if befriended',
    drops: ['Fairy Dust', 'Enchanted Pollen', 'Tiny Wings'],
    tips: 'Offer them sweet foods and shiny objects. Never lie to a fairy or break a promise.'
  }
};

// ============================================
// WEAPONS AND ITEMS DATA
// ============================================
const WEAPONS = {
  'void-blade': {
    name: 'Void Blade',
    type: 'Sword',
    rarity: 'Legendary',
    description: 'A sword forged from crystallized void energy. It cuts through reality itself.',
    damage: 'Very High',
    special: 'Attacks ignore armor, chance to corrupt enemies',
    source: 'Void Dragon drop'
  },
  'feran-khopesh': {
    name: 'Feran Khopesh',
    type: 'Sword',
    rarity: 'Rare',
    description: 'Ancient curved blade used by Feran warriors. Enchanted with desert magic.',
    damage: 'High',
    special: 'Bonus damage in desert, causes bleeding',
    source: 'Desert dungeons, Sand Empress'
  },
  'frost-bow': {
    name: 'Frost Bow',
    type: 'Bow',
    rarity: 'Rare',
    description: 'A bow carved from eternal ice. Arrows freeze on contact.',
    damage: 'Medium',
    special: 'Arrows slow and freeze enemies',
    source: 'Borea ice caves, Frost Giant drop'
  },
  'kweebec-staff': {
    name: 'Kweebec Nature Staff',
    type: 'Staff',
    rarity: 'Uncommon',
    description: 'A living staff grown by Kweebec druids. Channels nature magic.',
    damage: 'Low',
    special: 'Heals allies, summons vines, speaks to animals',
    source: 'Kweebec village rewards'
  },
  'trork-cleaver': {
    name: 'Trork War Cleaver',
    type: 'Axe',
    rarity: 'Uncommon',
    description: 'Brutal weapon favored by Trork raiders. Crude but devastating.',
    damage: 'High',
    special: 'Bonus damage on critical hits, intimidates enemies',
    source: 'Trork camps, Warlord drops'
  },
  'abyssal-trident': {
    name: 'Abyssal Trident',
    type: 'Polearm',
    rarity: 'Legendary',
    description: 'Weapon of the Merfolk royalty. Commands the power of the deep ocean.',
    damage: 'High',
    special: 'Controls water, lightning underwater, breathe underwater',
    source: 'Merfolk Kingdom questline'
  },
  'sunfire-staff': {
    name: 'Sunfire Staff',
    type: 'Staff',
    rarity: 'Epic',
    description: 'Ancient Feran artifact channeling the power of the sun god.',
    damage: 'High',
    special: 'Fire magic, extra damage to undead, lights dark areas',
    source: 'Feran pyramids secret chamber'
  },
  'crystal-hammer': {
    name: 'Crystal Warhammer',
    type: 'Hammer',
    rarity: 'Rare',
    description: 'Massive hammer with a head of unbreakable crystal. Shatters armor.',
    damage: 'Very High',
    special: 'Destroys armor, stuns enemies, slow attack speed',
    source: 'Crystal caves mining, crafting'
  }
};

const ITEMS = {
  'health-potion': {
    name: 'Health Potion',
    type: 'Consumable',
    rarity: 'Common',
    description: 'Restores health when consumed.',
    effect: 'Restores 50 HP',
    source: 'Crafting, shops, enemy drops'
  },
  'void-essence': {
    name: 'Void Essence',
    type: 'Material',
    rarity: 'Legendary',
    description: 'Concentrated corruption from the void. Used in powerful crafting.',
    effect: 'Crafting material for void equipment',
    source: 'Devastated Lands, Void creatures'
  },
  'fairy-dust': {
    name: 'Fairy Dust',
    type: 'Material',
    rarity: 'Rare',
    description: 'Magical dust from fairies. Has many alchemical uses.',
    effect: 'Enchanting, potion brewing, crafting',
    source: 'Fairies, Emerald Grove'
  },
  'ancient-map': {
    name: 'Ancient Map',
    type: 'Quest Item',
    rarity: 'Rare',
    description: 'A weathered map pointing to hidden treasure or dungeons.',
    effect: 'Reveals secret locations',
    source: 'Treasure chests, quest rewards'
  },
  'grappling-hook': {
    name: 'Grappling Hook',
    type: 'Tool',
    rarity: 'Uncommon',
    description: 'Allows climbing and swinging across gaps.',
    effect: 'Vertical mobility, reaching high places',
    source: 'Crafting, Outlander shops'
  }
};

// ============================================
// EXPANDED TRIVIA (30+ Questions)
// ============================================
const TRIVIA = [
  { question: 'What is the name of the world in Hytale?', answer: 'Orbis', options: ['Orbis', 'Terra', 'Gaia', 'Aether'] },
  { question: 'Which zone is home to the Kweebecs?', answer: 'Emerald Grove', options: ['Emerald Grove', 'Howling Sands', 'Borea', 'Devastated Lands'] },
  { question: 'What studio is developing Hytale?', answer: 'Hypixel Studios', options: ['Hypixel Studios', 'Mojang', 'Riot Games', 'Epic Games'] },
  { question: 'What type of creature is a Fen Stalker?', answer: 'Ambush predator', options: ['Ambush predator', 'Friendly NPC', 'Mount', 'Boss'] },
  { question: 'Which zone features pyramids and ancient temples?', answer: 'Howling Sands', options: ['Howling Sands', 'Emerald Grove', 'Borea', 'Devastated Lands'] },
  { question: 'What corrupted zone is ruled by void creatures?', answer: 'Devastated Lands', options: ['Devastated Lands', 'Borea', 'Howling Sands', 'Emerald Grove'] },
  { question: 'What ancient civilization built the desert pyramids?', answer: 'Feran', options: ['Feran', 'Kweebec', 'Trork', 'Outlanders'] },
  { question: 'Which zone has frozen tundra and blizzards?', answer: 'Borea', options: ['Borea', 'Howling Sands', 'Emerald Grove', 'Devastated Lands'] },
  { question: 'What creatures raid Kweebec villages?', answer: 'Trorks', options: ['Trorks', 'Feran', 'Yetis', 'Outlanders'] },
  { question: 'What powerful boss rules the deep desert tombs?', answer: 'Sand Empress', options: ['Sand Empress', 'Void Dragon', 'Fen Stalker', 'Frost Giant'] },
  { question: 'What year was Hytale first announced?', answer: '2018', options: ['2018', '2019', '2020', '2017'] },
  { question: 'What is the name of Hytale\'s modding tool?', answer: 'Hytale Model Maker', options: ['Hytale Model Maker', 'Hytale Studio', 'Orbis Editor', 'Block Builder'] },
  { question: 'Which creature can be tamed as a flying mount?', answer: 'Pterosaur', options: ['Pterosaur', 'Void Dragon', 'Fen Stalker', 'Ice Elemental'] },
  { question: 'What do Trorks worship?', answer: 'Dark totems', options: ['Dark totems', 'The sun', 'Nature spirits', 'Void entities'] },
  { question: 'Who composes the Hytale soundtrack?', answer: 'Oscar Garvin', options: ['Oscar Garvin', 'C418', 'Hans Zimmer', 'Lena Raine'] },
  { question: 'What type of game is Hytale classified as?', answer: 'Block game / Sandbox RPG', options: ['Block game / Sandbox RPG', 'Battle Royale', 'MOBA', 'Card Game'] },
  { question: 'What prevents Forest Trolls from regenerating?', answer: 'Fire', options: ['Fire', 'Ice', 'Holy magic', 'Poison'] },
  { question: 'Which zone is home to the Merfolk?', answer: 'Ocean', options: ['Ocean', 'Borea', 'Emerald Grove', 'Howling Sands'] },
  { question: 'What detects Sand Wurm attacks?', answer: 'Vibrations', options: ['Vibrations', 'Sound', 'Heat', 'Magic'] },
  { question: 'What is the most dangerous creature in Orbis?', answer: 'Void Dragon', options: ['Void Dragon', 'Kraken', 'Sand Empress', 'Frost Giant'] },
  { question: 'What do Kweebecs build their villages into?', answer: 'Giant trees', options: ['Giant trees', 'Mountains', 'Caves', 'Clouds'] },
  { question: 'Which faction values strength above all?', answer: 'Trorks', options: ['Trorks', 'Kweebecs', 'Feran', 'Merfolk'] },
  { question: 'What happens to the Feran after death?', answer: 'Mummification', options: ['Mummification', 'Cremation', 'Sea burial', 'Sky burial'] },
  { question: 'What type of magic do Ice Elementals use?', answer: 'Frost magic', options: ['Frost magic', 'Fire magic', 'Void magic', 'Nature magic'] },
  { question: 'How many main zones does Hytale have?', answer: '4 main + Ocean', options: ['4 main + Ocean', '3', '6', '10'] },
  { question: 'What can harm Shadow Wraiths?', answer: 'Magical weapons', options: ['Magical weapons', 'Normal swords', 'Arrows', 'Fists'] },
  { question: 'What do Fairies like as offerings?', answer: 'Sweet foods and shiny objects', options: ['Sweet foods and shiny objects', 'Gold coins', 'Weapons', 'Books'] },
  { question: 'What is the Kraken?', answer: 'Legendary sea monster', options: ['Legendary sea monster', 'Friendly whale', 'Merfolk pet', 'Small fish'] },
  { question: 'Which weapon ignores armor?', answer: 'Void Blade', options: ['Void Blade', 'Frost Bow', 'Trork Cleaver', 'Crystal Hammer'] },
  { question: 'What are Outlanders?', answer: 'Human explorers', options: ['Human explorers', 'Aliens', 'Void creatures', 'Ancient gods'] },
  { question: 'What powers the Sunfire Staff?', answer: 'The sun god', options: ['The sun god', 'Void energy', 'Moon magic', 'Lightning'] },
  { question: 'Where are Mammoths found?', answer: 'Borea', options: ['Borea', 'Howling Sands', 'Emerald Grove', 'Ocean'] },
  { question: 'What is special about Kweebec Nature Staff?', answer: 'It heals allies', options: ['It heals allies', 'It shoots fire', 'It summons undead', 'It creates explosions'] },
  { question: 'What currency do Kweebec traders use?', answer: 'Trade goods', options: ['Trade goods', 'Gold coins', 'Gems', 'Void essence'] }
];

// ============================================
// LORE FACTS (Expanded)
// ============================================
const LORE_FACTS = [
  'Orbis is the name of the world where Hytale takes place.',
  'The Kweebecs are small, peaceful forest dwellers who live in villages built into giant trees.',
  'Trorks are hostile tribal creatures that frequently raid Kweebec settlements.',
  'The Fen Stalker is one of the most feared predators in the Emerald Grove.',
  'Hytale features a full day/night cycle that affects creature spawns and gameplay.',
  'The game includes powerful modding tools called Hytale Model Maker.',
  'Players can tame and ride various creatures, including Pterosaurs.',
  'The Void Dragon is considered one of the most powerful creatures in Orbis.',
  'The Feran were an ancient cat-like civilization that built the pyramids in the Howling Sands.',
  'Borea is a frozen zone inspired by Arctic and Nordic environments.',
  'The Devastated Lands were corrupted by dark magic and void energy.',
  'Hytale uses a voxel-based world similar to Minecraft but with much higher fidelity.',
  'The game features four distinct elemental zones, each with unique biomes and creatures.',
  'Adventure mode features a full story campaign with quests and boss encounters.',
  'The Hypixel team started developing Hytale in 2015.',
  'Players can create custom games, maps, and servers using Hytale\'s built-in tools.',
  'The soundtrack is composed by Oscar Garvin, known for his work on Minecraft mods.',
  'Hytale supports both singleplayer and multiplayer gameplay.',
  'The game features procedurally generated dungeons and structures.',
  'Magic and spellcasting play a significant role in Hytale\'s combat system.',
  'The Hytale announcement trailer received over 50 million views in its first week.',
  'Riot Games invested in Hypixel Studios in 2020.',
  'Hytale will feature a movie-quality cinematic mode for content creators.',
  'The game\'s engine was built from scratch specifically for Hytale.',
  'NPC characters in Hytale have complex AI and daily routines.',
  'The weather system includes dynamic storms, fog, and seasonal changes.',
  'Underground areas in Hytale can be as detailed and expansive as surface areas.',
  'The combat system includes blocking, dodging, and combo attacks.',
  'Hytale will support cross-platform play between PC and consoles.',
  'The in-game economy features supply and demand mechanics.',
  'Players can build functional machines and contraptions using prefabs.',
  'Each zone has unique music that dynamically changes based on situations.',
  'The Void Cult seeks to spread corruption across all of Orbis.',
  'Merfolk have been isolationist since the Great Drowning centuries ago.',
  'Ancient Feran magic is the source of many powerful artifacts found in dungeons.',
  'The Northern Lights in Borea are actually magical energy from the world\'s core.'
];

// ============================================
// DEVELOPER QUOTES
// ============================================
const DEV_QUOTES = [
  { quote: "We want to make Hytale the most powerful creative platform ever made.", author: "Noxy", role: "CEO, Hypixel Studios" },
  { quote: "Every block, every creature, every piece of content in Hytale is designed to be moddable.", author: "Hytale Team", role: "Development Blog" },
  { quote: "Our goal is to give players the tools to create anything they can imagine.", author: "Noxy", role: "CEO, Hypixel Studios" },
  { quote: "Hytale isn't just a game - it's a platform for endless creativity.", author: "Hytale Team", role: "Official Website" },
  { quote: "We've been working on Hytale since 2015, and we're committed to getting it right.", author: "Hypixel Studios", role: "Development Update" },
  { quote: "The adventure mode tells an epic story across all the zones of Orbis.", author: "Hytale Team", role: "Development Blog" },
  { quote: "We believe players should own their creations and be able to share them freely.", author: "Noxy", role: "Interview" },
  { quote: "Hytale Model Maker lets anyone create professional-quality content.", author: "Hytale Team", role: "Tool Showcase" }
];

// ============================================
// DEVELOPMENT TIMELINE
// ============================================
const TIMELINE = [
  { year: '2015', event: 'Development of Hytale begins at Hypixel Studios' },
  { year: '2018', event: 'Hytale officially announced with cinematic trailer (December 13)' },
  { year: '2019', event: 'Regular blog posts reveal game features and mechanics' },
  { year: '2020', event: 'Riot Games invests in Hypixel Studios' },
  { year: '2021', event: 'Development update: game scope expanded significantly' },
  { year: '2022', event: 'Continued development with focus on core systems' },
  { year: '2023', event: 'Technical previews and engine improvements shared' },
  { year: '2024', event: 'Development continues with new team expansions' }
];

// ============================================
// BUILD IDEAS / CHALLENGES
// ============================================
const BUILD_IDEAS = [
  { title: 'Kweebec Treehouse Village', difficulty: 'Medium', description: 'Build a sprawling village of connected treehouses in the forest canopy, complete with rope bridges and market areas.' },
  { title: 'Feran Pyramid Complex', difficulty: 'Hard', description: 'Construct an ancient pyramid with hidden chambers, traps, and a throne room for the Sand Empress.' },
  { title: 'Frost Giant\'s Castle', difficulty: 'Hard', description: 'Create a massive ice fortress on a mountain peak, with frozen throne room and treasure vaults.' },
  { title: 'Void Portal Shrine', difficulty: 'Expert', description: 'Design a corrupted temple built around an active void portal, with floating debris and corruption spreading outward.' },
  { title: 'Underwater Merfolk City', difficulty: 'Expert', description: 'Build a grand underwater kingdom with coral buildings, air bubble rooms, and bioluminescent lighting.' },
  { title: 'Trork War Camp', difficulty: 'Easy', description: 'Create a crude but menacing Trork encampment with wooden palisades, totem poles, and raid staging areas.' },
  { title: 'Outlander Trading Post', difficulty: 'Medium', description: 'Build a frontier settlement where all factions come to trade, with distinct cultural sections.' },
  { title: 'Sky Island Sanctuary', difficulty: 'Hard', description: 'Construct a floating island paradise with waterfalls cascading into the void below.' },
  { title: 'Haunted Shipwreck', difficulty: 'Medium', description: 'Create a ghostly shipwreck scene with spectral sailors and cursed treasure.' },
  { title: 'Volcanic Forge', difficulty: 'Hard', description: 'Build a massive forge built into an active volcano, where legendary weapons are crafted.' },
  { title: 'Fairy Ring Grove', difficulty: 'Easy', description: 'Design a magical clearing with mushroom circles, glowing plants, and tiny fairy houses.' },
  { title: 'Arena of Champions', difficulty: 'Medium', description: 'Construct a grand colosseum where warriors battle for glory, with spectator seating and trap mechanisms.' },
  { title: 'Wizard\'s Tower', difficulty: 'Medium', description: 'Build a tall mystical tower with a library, potion room, observatory, and magical experiments.' },
  { title: 'Underground Railroad', difficulty: 'Hard', description: 'Create a minecart system connecting multiple underground areas with stations and switches.' },
  { title: 'Dragon\'s Lair', difficulty: 'Expert', description: 'Design a massive cavern filled with treasure hoards, dragon eggs, and a sleeping dragon.' }
];

// ============================================
// CONCEPT ART GALLERY
// ============================================
const CONCEPT_ART = [
  { title: 'Emerald Grove Vista', url: 'https://hytale.com/media/concept-art/zone1-vista.jpg', zone: 'Zone 1' },
  { title: 'Kweebec Village', url: 'https://hytale.com/media/concept-art/kweebec-village.jpg', zone: 'Zone 1' },
  { title: 'Fen Stalker Attack', url: 'https://hytale.com/media/concept-art/fen-stalker.jpg', zone: 'Zone 1' },
  { title: 'Desert Pyramids', url: 'https://hytale.com/media/concept-art/zone2-pyramids.jpg', zone: 'Zone 2' },
  { title: 'Sand Empress Tomb', url: 'https://hytale.com/media/concept-art/sand-empress.jpg', zone: 'Zone 2' },
  { title: 'Borea Tundra', url: 'https://hytale.com/media/concept-art/zone3-tundra.jpg', zone: 'Zone 3' },
  { title: 'Frost Giant Battle', url: 'https://hytale.com/media/concept-art/frost-giant.jpg', zone: 'Zone 3' },
  { title: 'Void Dragon', url: 'https://hytale.com/media/concept-art/void-dragon.jpg', zone: 'Zone 4' },
  { title: 'Corrupted Lands', url: 'https://hytale.com/media/concept-art/zone4-corruption.jpg', zone: 'Zone 4' },
  { title: 'Player Combat', url: 'https://hytale.com/media/concept-art/combat.jpg', zone: 'General' }
];

// ============================================
// SOUNDTRACK INFO
// ============================================
const SOUNDTRACK = {
  composer: 'Oscar Garvin',
  description: 'Oscar Garvin is the lead composer for Hytale, known for his emotionally evocative orchestral compositions. He previously worked on popular Minecraft mods and has created a unique sound for each zone in Orbis.',
  style: 'Orchestral with electronic elements, adaptive to gameplay',
  zones: [
    { zone: 'Emerald Grove', style: 'Whimsical, nature-inspired melodies with woodwinds and strings', mood: 'Peaceful, adventurous' },
    { zone: 'Howling Sands', style: 'Middle Eastern influences with exotic instruments and percussion', mood: 'Mysterious, ancient' },
    { zone: 'Borea', style: 'Haunting vocals, sparse instrumentation, cold atmosphere', mood: 'Isolated, majestic' },
    { zone: 'Devastated Lands', style: 'Dark orchestral, dissonant chords, ominous choir', mood: 'Threatening, epic' },
    { zone: 'Combat', style: 'Dynamic percussion, intense brass, adaptive intensity', mood: 'Exciting, dangerous' }
  ],
  features: [
    'Dynamic music system that responds to gameplay',
    'Seamless transitions between exploration and combat',
    'Unique themes for major bosses',
    'Ambient soundscapes for immersion',
    'Full orchestral recordings'
  ]
};

// ============================================
// PLUGIN CLASS
// ============================================
class HytalePlugin {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Hytale');
    this.newsCheckInterval = null;
    this.lastNewsCheck = null;
    this.cachedNews = [];
    this.newsCache = { data: null, timestamp: 0 };
    this.CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  }

  async init() {
    this.log.info('Hytale plugin initializing...');

    // Create database tables
    this.initDatabase();

    // Register commands
    this.registerCommands();

    // Register button handlers
    this.registerButtonHandlers();

    // Start news checking
    this.startNewsCheck();

    this.log.success('Hytale plugin loaded!');
  }

  initDatabase() {
    const db = this.client.db.db;

    db.exec(`
      CREATE TABLE IF NOT EXISTS hytale_news_channels (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        last_post_id TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS hytale_trivia_scores (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        correct INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS hytale_faction_roles (
        guild_id TEXT NOT NULL,
        faction TEXT NOT NULL,
        role_id TEXT NOT NULL,
        PRIMARY KEY (guild_id, faction)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS hytale_fanart_channels (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS hytale_fanart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        title TEXT,
        submitted_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  registerCommands() {
    const hytaleCommand = {
      name: 'hytale',
      description: 'Hytale community features',
      category: 'plugins',
      cooldown: 5,

      data: new SlashCommandBuilder()
        .setName('hytale')
        .setDescription('Hytale community features')
        // News commands
        .addSubcommand(sub =>
          sub.setName('news')
            .setDescription('Get the latest Hytale news')
            .addIntegerOption(opt =>
              opt.setName('page')
                .setDescription('Page number')
                .setMinValue(1)
                .setMaxValue(10)
            )
        )
        .addSubcommand(sub =>
          sub.setName('setnews')
            .setDescription('Set a channel for Hytale news updates')
            .addChannelOption(opt =>
              opt.setName('channel')
                .setDescription('Channel for news (leave empty to disable)')
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        // Lore commands
        .addSubcommand(sub =>
          sub.setName('zone')
            .setDescription('Learn about a Hytale zone')
            .addStringOption(opt =>
              opt.setName('name')
                .setDescription('Zone name')
                .setRequired(true)
                .addChoices(
                  { name: 'Emerald Grove (Zone 1)', value: 'emerald-grove' },
                  { name: 'Howling Sands (Zone 2)', value: 'howling-sands' },
                  { name: 'Borea (Zone 3)', value: 'borea' },
                  { name: 'Devastated Lands (Zone 4)', value: 'devastated-lands' },
                  { name: 'Ocean (Zone 5)', value: 'ocean' }
                )
            )
        )
        .addSubcommand(sub =>
          sub.setName('faction')
            .setDescription('Learn about a Hytale faction')
            .addStringOption(opt =>
              opt.setName('name')
                .setDescription('Faction name')
                .setRequired(true)
                .addChoices(
                  { name: 'Kweebecs (Peaceful)', value: 'kweebec' },
                  { name: 'Ferans (Peaceful)', value: 'feran' },
                  { name: 'Trorks (Aggressive)', value: 'trork' },
                  { name: 'Scaraks (Aggressive)', value: 'scarak' },
                  { name: 'Outlanders (Aggressive)', value: 'outlander' },
                  { name: 'Slothians (Unknown)', value: 'slothian' },
                  { name: 'Fauns (Unknown)', value: 'faun' },
                  { name: 'Klops (Neutral)', value: 'klop' }
                )
            )
        )
        .addSubcommand(sub =>
          sub.setName('creature')
            .setDescription('Learn about a Hytale creature')
            .addStringOption(opt =>
              opt.setName('name')
                .setDescription('Creature name')
                .setRequired(true)
                .addChoices(
                  { name: 'Fen Stalker', value: 'fen-stalker' },
                  { name: 'Pterosaur', value: 'pterosaur' },
                  { name: 'Void Dragon', value: 'void-dragon' },
                  { name: 'Yeti', value: 'yeti' },
                  { name: 'Sand Empress', value: 'sand-empress' },
                  { name: 'Forest Troll', value: 'forest-troll' },
                  { name: 'Ice Elemental', value: 'ice-elemental' },
                  { name: 'Sand Wurm', value: 'sand-wurm' },
                  { name: 'Kraken', value: 'kraken' },
                  { name: 'Shadow Wraith', value: 'shadow-wraith' },
                  { name: 'Mammoth', value: 'mammoth' },
                  { name: 'Fairy', value: 'fairy' }
                )
            )
        )
        .addSubcommand(sub =>
          sub.setName('weapon')
            .setDescription('Learn about a Hytale weapon')
            .addStringOption(opt =>
              opt.setName('name')
                .setDescription('Weapon name')
                .setRequired(true)
                .addChoices(
                  { name: 'Void Blade', value: 'void-blade' },
                  { name: 'Feran Khopesh', value: 'feran-khopesh' },
                  { name: 'Frost Bow', value: 'frost-bow' },
                  { name: 'Kweebec Nature Staff', value: 'kweebec-staff' },
                  { name: 'Trork War Cleaver', value: 'trork-cleaver' },
                  { name: 'Abyssal Trident', value: 'abyssal-trident' },
                  { name: 'Sunfire Staff', value: 'sunfire-staff' },
                  { name: 'Crystal Warhammer', value: 'crystal-hammer' }
                )
            )
        )
        .addSubcommand(sub =>
          sub.setName('lore')
            .setDescription('Get a random Hytale lore fact')
        )
        // Fun commands
        .addSubcommand(sub =>
          sub.setName('trivia')
            .setDescription('Test your Hytale knowledge')
        )
        .addSubcommand(sub =>
          sub.setName('leaderboard')
            .setDescription('View the Hytale trivia leaderboard')
        )
        .addSubcommand(sub =>
          sub.setName('buildidea')
            .setDescription('Get a random Hytale-themed build idea')
            .addStringOption(opt =>
              opt.setName('difficulty')
                .setDescription('Filter by difficulty')
                .addChoices(
                  { name: 'Easy', value: 'Easy' },
                  { name: 'Medium', value: 'Medium' },
                  { name: 'Hard', value: 'Hard' },
                  { name: 'Expert', value: 'Expert' }
                )
            )
        )
        // Info commands
        .addSubcommand(sub =>
          sub.setName('timeline')
            .setDescription('View Hytale development timeline')
        )
        .addSubcommand(sub =>
          sub.setName('quote')
            .setDescription('Get a developer quote about Hytale')
        )
        .addSubcommand(sub =>
          sub.setName('soundtrack')
            .setDescription('Learn about the Hytale soundtrack')
        )
        .addSubcommand(sub =>
          sub.setName('gallery')
            .setDescription('View Hytale concept art')
        )
        // Community commands
        .addSubcommand(sub =>
          sub.setName('role')
            .setDescription('Choose your favorite Hytale faction role')
            .addStringOption(opt =>
              opt.setName('faction')
                .setDescription('Faction to join')
                .setRequired(true)
                .addChoices(
                  { name: 'Kweebecs', value: 'kweebec' },
                  { name: 'Ferans', value: 'feran' },
                  { name: 'Trorks', value: 'trork' },
                  { name: 'Scaraks', value: 'scarak' },
                  { name: 'Outlanders', value: 'outlander' },
                  { name: 'Slothians', value: 'slothian' },
                  { name: 'Fauns', value: 'faun' },
                  { name: 'Klops', value: 'klop' },
                  { name: 'Remove Role', value: 'remove' }
                )
            )
        )
        .addSubcommand(sub =>
          sub.setName('setuproles')
            .setDescription('Setup faction roles for this server')
        )
        .addSubcommand(sub =>
          sub.setName('fanart')
            .setDescription('Submit fan art to the gallery')
            .addAttachmentOption(opt =>
              opt.setName('image')
                .setDescription('Your fan art image')
                .setRequired(true)
            )
            .addStringOption(opt =>
              opt.setName('title')
                .setDescription('Title for your artwork')
            )
        )
        .addSubcommand(sub =>
          sub.setName('setfanart')
            .setDescription('Set the fan art gallery channel')
            .addChannelOption(opt =>
              opt.setName('channel')
                .setDescription('Channel for fan art (leave empty to disable)')
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand(sub =>
          sub.setName('setchannel')
            .setDescription('Restrict Hytale commands to a specific channel')
            .addChannelOption(opt =>
              opt.setName('channel')
                .setDescription('Channel for Hytale commands (leave empty to allow everywhere)')
                .addChannelTypes(ChannelType.GuildText)
            )
        ),

      execute: this.handleCommand.bind(this)
    };

    this.client.commands.set(hytaleCommand.name, hytaleCommand);
    this.client.slashCommands.set(hytaleCommand.name, hytaleCommand);

    this.log.debug('Registered command: hytale');
  }

  registerButtonHandlers() {
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId.startsWith('hytale_news_')) {
        await this.handleNewsPagination(interaction);
      } else if (interaction.customId.startsWith('hytale_gallery_')) {
        await this.handleGalleryNavigation(interaction);
      }
    });
  }

  startNewsCheck() {
    // Check for news every 30 minutes
    this.newsCheckInterval = setInterval(() => {
      this.checkForNews();
    }, 30 * 60 * 1000);

    // Initial check after 1 minute
    setTimeout(() => this.checkForNews(), 60 * 1000);
  }

  async checkForNews() {
    try {
      const news = await this.fetchNews(true); // Force refresh for auto-check
      if (news.length > 0 && this.cachedNews.length > 0) {
        const newPosts = news.filter(n => !this.cachedNews.find(c => c.title === n.title));
        if (newPosts.length > 0) {
          await this.broadcastNews(newPosts);
        }
      }
      this.cachedNews = news;
    } catch (error) {
      this.log.error('Error checking for news:', error.message);
    }
  }

  async fetchNews(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh && this.newsCache.data && (Date.now() - this.newsCache.timestamp) < this.CACHE_DURATION) {
      return this.newsCache.data;
    }

    try {
      // Try official API first
      const response = await fetch('https://hytale.com/api/blog/post/published', {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'HyVornBot/1.0' }
      });

      if (response.ok) {
        const posts = await response.json();
        const news = posts.slice(0, 10).map(post => ({
          title: post.title,
          slug: post.slug,
          excerpt: post.bodyExcerpt || post.body?.substring(0, 200) || 'No description available.',
          date: post.publishedAt,
          coverImage: post.coverImage ? `https://hytale.com/${post.coverImage.s3Key.startsWith('/') ? post.coverImage.s3Key.slice(1) : post.coverImage.s3Key}` : null,
          author: post.author?.name || 'Hytale Team',
          url: `https://hytale.com/news/${post.publishedAt?.split('T')[0]?.replace(/-/g, '/')}/${post.slug}`
        }));

        this.newsCache = { data: news, timestamp: Date.now() };
        return news;
      }
    } catch (error) {
      this.log.warn('Failed to fetch from API, trying RSS fallback:', error.message);
    }

    // RSS Fallback - try to parse from website
    try {
      const rssResponse = await fetch('https://hytale.com/news', {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'HyVornBot/1.0' }
      });

      if (rssResponse.ok) {
        // Return cached data if available, or empty array
        return this.newsCache.data || [];
      }
    } catch (error) {
      this.log.warn('RSS fallback also failed:', error.message);
    }

    return this.newsCache.data || [];
  }

  async broadcastNews(newPosts) {
    const db = this.client.db.db;
    const channels = db.prepare('SELECT * FROM hytale_news_channels').all();

    for (const channelConfig of channels) {
      try {
        const channel = await this.client.channels.fetch(channelConfig.channel_id).catch(() => null);
        if (!channel) continue;

        for (const post of newPosts) {
          const embed = this.createNewsEmbed(post);
          await channel.send({ content: '📰 **New Hytale News!**', embeds: [embed] });
        }
      } catch (error) {
        this.log.error(`Failed to broadcast to channel ${channelConfig.channel_id}:`, error.message);
      }
    }
  }

  createNewsEmbed(post) {
    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle(post.title)
      .setURL(post.url)
      .setDescription(post.excerpt.substring(0, 300) + (post.excerpt.length > 300 ? '...' : ''))
      .setFooter({ text: `By ${post.author}` })
      .setTimestamp(new Date(post.date));

    if (post.coverImage) {
      embed.setImage(post.coverImage);
    }

    return embed;
  }

  async handleCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Admin commands bypass channel restriction
    const adminCommands = ['setnews', 'setuproles', 'setfanart', 'setchannel'];

    // Check channel restriction for non-admin commands
    if (!adminCommands.includes(subcommand) && interaction.guild) {
      const settings = this.client.db.getGuild(interaction.guild.id).settings;
      const hytaleChannel = settings.hytaleChannel;

      if (hytaleChannel && interaction.channel.id !== hytaleChannel) {
        // Skip check for users with Manage Server permission
        if (!interaction.member.permissions.has('ManageGuild')) {
          return interaction.reply({
            embeds: [{
              color: Colors.ERROR,
              description: `Hytale commands can only be used in <#${hytaleChannel}>.`
            }],
            flags: MessageFlags.Ephemeral
          });
        }
      }
    }

    switch (subcommand) {
      case 'news': return this.handleNews(interaction);
      case 'setnews': return this.handleSetNews(interaction);
      case 'zone': return this.handleZone(interaction);
      case 'faction': return this.handleFaction(interaction);
      case 'creature': return this.handleCreature(interaction);
      case 'weapon': return this.handleWeapon(interaction);
      case 'lore': return this.handleLore(interaction);
      case 'trivia': return this.handleTrivia(interaction);
      case 'leaderboard': return this.handleLeaderboard(interaction);
      case 'buildidea': return this.handleBuildIdea(interaction);
      case 'timeline': return this.handleTimeline(interaction);
      case 'quote': return this.handleQuote(interaction);
      case 'soundtrack': return this.handleSoundtrack(interaction);
      case 'gallery': return this.handleGallery(interaction);
      case 'role': return this.handleRole(interaction);
      case 'setuproles': return this.handleSetupRoles(interaction);
      case 'fanart': return this.handleFanArt(interaction);
      case 'setfanart': return this.handleSetFanArt(interaction);
      case 'setchannel': return this.handleSetChannel(interaction);
    }
  }

  // ==================== NEWS ====================
  async handleNews(interaction) {
    await interaction.deferReply();

    const page = interaction.options.getInteger('page') || 1;
    const news = await this.fetchNews();

    if (news.length === 0) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(Colors.ERROR)
          .setDescription('Unable to fetch Hytale news at this time. Please try again later.')
        ]
      });
    }

    const itemsPerPage = 3;
    const totalPages = Math.ceil(news.length / itemsPerPage);
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageNews = news.slice(startIndex, startIndex + itemsPerPage);

    const embeds = pageNews.map(post => this.createNewsEmbed(post));

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hytale_news_${currentPage - 1}`)
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage <= 1),
        new ButtonBuilder()
          .setCustomId('hytale_news_page')
          .setLabel(`Page ${currentPage}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`hytale_news_${currentPage + 1}`)
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage >= totalPages),
        new ButtonBuilder()
          .setLabel('Visit Hytale.com')
          .setStyle(ButtonStyle.Link)
          .setURL('https://hytale.com/news')
      );

    await interaction.editReply({ embeds, components: [row] });
  }

  async handleNewsPagination(interaction) {
    const page = parseInt(interaction.customId.split('_')[2]);
    if (isNaN(page)) return;

    await interaction.deferUpdate();

    const news = await this.fetchNews();
    const itemsPerPage = 3;
    const totalPages = Math.ceil(news.length / itemsPerPage);
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageNews = news.slice(startIndex, startIndex + itemsPerPage);

    const embeds = pageNews.map(post => this.createNewsEmbed(post));

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hytale_news_${currentPage - 1}`)
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage <= 1),
        new ButtonBuilder()
          .setCustomId('hytale_news_page')
          .setLabel(`Page ${currentPage}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`hytale_news_${currentPage + 1}`)
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage >= totalPages),
        new ButtonBuilder()
          .setLabel('Visit Hytale.com')
          .setStyle(ButtonStyle.Link)
          .setURL('https://hytale.com/news')
      );

    await interaction.editReply({ embeds, components: [row] });
  }

  async handleSetNews(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You need Manage Server permission.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const channel = interaction.options.getChannel('channel');
    const db = this.client.db.db;

    if (!channel) {
      db.prepare('DELETE FROM hytale_news_channels WHERE guild_id = ?').run(interaction.guild.id);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription('Hytale news updates have been disabled.')]
      });
    }

    db.prepare(`
      INSERT INTO hytale_news_channels (guild_id, channel_id) VALUES (?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET channel_id = ?
    `).run(interaction.guild.id, channel.id, channel.id);

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle('Hytale News Configured')
        .setDescription(`Hytale news updates will now be posted to ${channel}.`)
        .setFooter({ text: 'News is checked every 30 minutes' })
      ]
    });
  }

  // ==================== LORE ====================
  async handleZone(interaction) {
    const zoneName = interaction.options.getString('name');
    const zone = ZONES[zoneName];

    if (!zone) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Zone not found!')],
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setColor(zone.color)
      .setTitle(zone.name)
      .setDescription(zone.description)
      .addFields(
        { name: 'Notable Creatures', value: zone.creatures.slice(0, 8).join(', '), inline: false },
        { name: 'Key Features', value: zone.features.map(f => `• ${f}`).join('\n'), inline: false },
        { name: 'Sub-Biomes', value: zone.subBiomes.map(b => `**${b.name}**: ${b.description}`).join('\n\n'), inline: false }
      )
      .setFooter({ text: 'Hytale Zone Information' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleFaction(interaction) {
    const factionName = interaction.options.getString('name');
    const faction = FACTIONS[factionName];

    if (!faction) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Faction not found!')],
        flags: MessageFlags.Ephemeral
      });
    }

    const dispositionEmoji = {
      'Peaceful': '🕊️',
      'Aggressive': '⚔️',
      'Neutral': '⚖️',
      'Unknown': '❓'
    };

    const embed = new EmbedBuilder()
      .setColor(faction.color)
      .setTitle(faction.name)
      .setDescription(faction.description)
      .addFields(
        { name: 'Zone', value: faction.zone, inline: true },
        { name: 'Disposition', value: `${dispositionEmoji[faction.disposition] || '❓'} ${faction.disposition}`, inline: true },
        { name: 'Leader', value: faction.leader, inline: true },
        { name: 'Traits', value: faction.traits.join(', '), inline: false },
        { name: 'Culture', value: faction.culture, inline: false },
        { name: 'Enemies', value: Array.isArray(faction.enemies) ? faction.enemies.join(', ') : faction.enemies, inline: false },
        { name: 'Reputation System', value: faction.reputation, inline: false }
      )
      .setFooter({ text: 'Hytale Faction Information • Source: Hytale Wiki' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleCreature(interaction) {
    const creatureName = interaction.options.getString('name');
    const creature = CREATURES[creatureName];

    if (!creature) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Creature not found!')],
        flags: MessageFlags.Ephemeral
      });
    }

    const dangerEmoji = { 'Low': '🟢', 'Medium': '🟡', 'High': '🟠', 'Extreme': '🔴' };

    const embed = new EmbedBuilder()
      .setColor(creature.color)
      .setTitle(creature.name)
      .setDescription(creature.description)
      .addFields(
        { name: 'Zone', value: creature.zone, inline: true },
        { name: 'Danger Level', value: `${dangerEmoji[creature.danger] || '⚪'} ${creature.danger}`, inline: true },
        { name: 'Behavior', value: creature.behavior, inline: false },
        { name: 'Drops', value: creature.drops.join(', '), inline: false },
        { name: 'Tips', value: creature.tips, inline: false }
      )
      .setFooter({ text: 'Hytale Creature Information' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleWeapon(interaction) {
    const weaponName = interaction.options.getString('name');
    const weapon = WEAPONS[weaponName];

    if (!weapon) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Weapon not found!')],
        flags: MessageFlags.Ephemeral
      });
    }

    const rarityColors = {
      'Common': 0x9E9E9E,
      'Uncommon': 0x4CAF50,
      'Rare': 0x2196F3,
      'Epic': 0x9C27B0,
      'Legendary': 0xFFD700
    };

    const embed = new EmbedBuilder()
      .setColor(rarityColors[weapon.rarity] || Colors.HYTALE)
      .setTitle(`${weapon.name} (${weapon.rarity})`)
      .setDescription(weapon.description)
      .addFields(
        { name: 'Type', value: weapon.type, inline: true },
        { name: 'Damage', value: weapon.damage, inline: true },
        { name: 'Special Effect', value: weapon.special, inline: false },
        { name: 'How to Obtain', value: weapon.source, inline: false }
      )
      .setFooter({ text: 'Hytale Weapon Information' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleLore(interaction) {
    const fact = LORE_FACTS[Math.floor(Math.random() * LORE_FACTS.length)];

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle('Hytale Lore')
      .setDescription(fact)
      .setFooter({ text: 'Use /hytale lore for another fact!' });

    await interaction.reply({ embeds: [embed] });
  }

  // ==================== FUN ====================
  async handleTrivia(interaction) {
    const trivia = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    const shuffledOptions = [...trivia.options].sort(() => Math.random() - 0.5);

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle('Hytale Trivia')
      .setDescription(trivia.question)
      .setFooter({ text: 'You have 30 seconds to answer!' });

    const buttons = shuffledOptions.map((option, index) =>
      new ButtonBuilder()
        .setCustomId(`hytale_trivia_${index}_${option === trivia.answer ? 'correct' : 'wrong'}_${interaction.user.id}`)
        .setLabel(option)
        .setStyle(ButtonStyle.Secondary)
    );

    const row = new ActionRowBuilder().addComponents(buttons);
    const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = response.createMessageComponentCollector({ time: 30000, max: 1 });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'This trivia is not for you!', flags: MessageFlags.Ephemeral });
      }

      const isCorrect = i.customId.includes('_correct_');
      this.updateTriviaScore(interaction.guild.id, interaction.user.id, isCorrect);

      const resultEmbed = new EmbedBuilder()
        .setColor(isCorrect ? Colors.SUCCESS : Colors.ERROR)
        .setTitle(isCorrect ? 'Correct!' : 'Wrong!')
        .setDescription(isCorrect
          ? `Great job! The answer was **${trivia.answer}**.`
          : `The correct answer was **${trivia.answer}**.`);

      const disabledButtons = buttons.map((btn, index) => {
        const option = shuffledOptions[index];
        return ButtonBuilder.from(btn)
          .setStyle(option === trivia.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(true);
      });

      await i.update({ embeds: [resultEmbed], components: [new ActionRowBuilder().addComponents(disabledButtons)] });
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setColor(Colors.ERROR)
          .setTitle('Time\'s Up!')
          .setDescription(`The correct answer was **${trivia.answer}**.`);

        const disabledButtons = buttons.map((btn, index) => {
          const option = shuffledOptions[index];
          return ButtonBuilder.from(btn)
            .setStyle(option === trivia.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(true);
        });

        await response.edit({ embeds: [timeoutEmbed], components: [new ActionRowBuilder().addComponents(disabledButtons)] }).catch(() => {});
      }
    });
  }

  updateTriviaScore(guildId, userId, correct) {
    const db = this.client.db.db;
    db.prepare(`
      INSERT INTO hytale_trivia_scores (guild_id, user_id, correct, total) VALUES (?, ?, ?, 1)
      ON CONFLICT(guild_id, user_id) DO UPDATE SET correct = correct + ?, total = total + 1
    `).run(guildId, userId, correct ? 1 : 0, correct ? 1 : 0);
  }

  async handleLeaderboard(interaction) {
    const db = this.client.db.db;
    const scores = db.prepare(`
      SELECT user_id, correct, total FROM hytale_trivia_scores
      WHERE guild_id = ? ORDER BY correct DESC, total ASC LIMIT 10
    `).all(interaction.guild.id);

    if (scores.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(Colors.HYTALE)
          .setTitle('Hytale Trivia Leaderboard')
          .setDescription('No trivia scores yet! Use `/hytale trivia` to play.')
        ]
      });
    }

    const leaderboard = await Promise.all(scores.map(async (score, index) => {
      const user = await this.client.users.fetch(score.user_id).catch(() => null);
      const username = user ? user.username : 'Unknown User';
      const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
      return `${medal} ${username} - ${score.correct}/${score.total} (${percentage}%)`;
    }));

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle('Hytale Trivia Leaderboard')
      .setDescription(leaderboard.join('\n'))
      .setFooter({ text: 'Use /hytale trivia to compete!' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleBuildIdea(interaction) {
    const difficulty = interaction.options.getString('difficulty');
    let ideas = BUILD_IDEAS;

    if (difficulty) {
      ideas = ideas.filter(i => i.difficulty === difficulty);
    }

    const idea = ideas[Math.floor(Math.random() * ideas.length)];

    const difficultyEmoji = { 'Easy': '🟢', 'Medium': '🟡', 'Hard': '🟠', 'Expert': '🔴' };

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle(`Build Idea: ${idea.title}`)
      .setDescription(idea.description)
      .addFields({ name: 'Difficulty', value: `${difficultyEmoji[idea.difficulty]} ${idea.difficulty}`, inline: true })
      .setFooter({ text: 'Use /hytale buildidea for another idea!' });

    await interaction.reply({ embeds: [embed] });
  }

  // ==================== INFO ====================
  async handleTimeline(interaction) {
    const timelineText = TIMELINE.map(t => `**${t.year}** - ${t.event}`).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle('Hytale Development Timeline')
      .setDescription(timelineText)
      .setFooter({ text: 'Hytale has been in development since 2015' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleQuote(interaction) {
    const quote = DEV_QUOTES[Math.floor(Math.random() * DEV_QUOTES.length)];

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle('Developer Quote')
      .setDescription(`*"${quote.quote}"*`)
      .addFields({ name: 'Source', value: `${quote.author} - ${quote.role}`, inline: false })
      .setFooter({ text: 'Use /hytale quote for another quote!' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleSoundtrack(interaction) {
    const zoneMusic = SOUNDTRACK.zones.map(z => `**${z.zone}**: ${z.style}\n*Mood: ${z.mood}*`).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle('Hytale Soundtrack')
      .setDescription(`**Composer:** ${SOUNDTRACK.composer}\n\n${SOUNDTRACK.description}`)
      .addFields(
        { name: 'Style', value: SOUNDTRACK.style, inline: false },
        { name: 'Zone Music', value: zoneMusic, inline: false },
        { name: 'Features', value: SOUNDTRACK.features.map(f => `• ${f}`).join('\n'), inline: false }
      )
      .setFooter({ text: 'Music by Oscar Garvin' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleGallery(interaction) {
    const art = CONCEPT_ART[0];
    const totalArt = CONCEPT_ART.length;

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle(art.title)
      .setDescription(`Zone: ${art.zone}`)
      .setImage(art.url)
      .setFooter({ text: `Concept Art 1/${totalArt} - Official Hytale Art` });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('hytale_gallery_0')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('hytale_gallery_page')
          .setLabel(`1/${totalArt}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('hytale_gallery_2')
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(totalArt <= 1)
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  async handleGalleryNavigation(interaction) {
    const index = parseInt(interaction.customId.split('_')[2]) - 1;
    if (isNaN(index)) return;

    const currentIndex = Math.min(Math.max(index, 0), CONCEPT_ART.length - 1);
    const art = CONCEPT_ART[currentIndex];
    const totalArt = CONCEPT_ART.length;

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle(art.title)
      .setDescription(`Zone: ${art.zone}`)
      .setImage(art.url)
      .setFooter({ text: `Concept Art ${currentIndex + 1}/${totalArt} - Official Hytale Art` });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hytale_gallery_${currentIndex}`)
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentIndex <= 0),
        new ButtonBuilder()
          .setCustomId('hytale_gallery_page')
          .setLabel(`${currentIndex + 1}/${totalArt}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`hytale_gallery_${currentIndex + 2}`)
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentIndex >= totalArt - 1)
      );

    await interaction.update({ embeds: [embed], components: [row] });
  }

  // ==================== COMMUNITY ====================
  async handleRole(interaction) {
    const faction = interaction.options.getString('faction');
    const db = this.client.db.db;

    if (faction === 'remove') {
      // Remove all faction roles
      const allRoles = db.prepare('SELECT * FROM hytale_faction_roles WHERE guild_id = ?').all(interaction.guild.id);
      for (const roleConfig of allRoles) {
        try {
          await interaction.member.roles.remove(roleConfig.role_id);
        } catch {}
      }
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription('Your faction roles have been removed.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const roleConfig = db.prepare('SELECT * FROM hytale_faction_roles WHERE guild_id = ? AND faction = ?')
      .get(interaction.guild.id, faction);

    if (!roleConfig) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Faction roles have not been set up. Ask an admin to run `/hytale setuproles`.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Remove other faction roles first
    const allRoles = db.prepare('SELECT * FROM hytale_faction_roles WHERE guild_id = ?').all(interaction.guild.id);
    for (const otherRole of allRoles) {
      if (otherRole.faction !== faction) {
        try {
          await interaction.member.roles.remove(otherRole.role_id);
        } catch {}
      }
    }

    // Add the new faction role
    try {
      await interaction.member.roles.add(roleConfig.role_id);
      const factionData = FACTIONS[faction];
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(factionData?.color || Colors.HYTALE)
          .setTitle(`Welcome to the ${factionData?.name || faction}!`)
          .setDescription(factionData?.description || 'You have joined this faction.')
        ],
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Failed to assign role. The role may have been deleted.')],
        flags: MessageFlags.Ephemeral
      });
    }
  }

  async handleSetupRoles(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You need Manage Roles permission.')],
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply();

    const db = this.client.db.db;
    const createdRoles = [];

    for (const [key, faction] of Object.entries(FACTIONS)) {
      try {
        // Check if role already exists
        const existingConfig = db.prepare('SELECT * FROM hytale_faction_roles WHERE guild_id = ? AND faction = ?')
          .get(interaction.guild.id, key);

        if (existingConfig) {
          const existingRole = interaction.guild.roles.cache.get(existingConfig.role_id);
          if (existingRole) {
            createdRoles.push(`${faction.name}: ${existingRole} (existing)`);
            continue;
          }
        }

        // Create new role
        const role = await interaction.guild.roles.create({
          name: faction.name,
          color: faction.color,
          reason: 'Hytale faction role setup'
        });

        db.prepare(`
          INSERT INTO hytale_faction_roles (guild_id, faction, role_id) VALUES (?, ?, ?)
          ON CONFLICT(guild_id, faction) DO UPDATE SET role_id = ?
        `).run(interaction.guild.id, key, role.id, role.id);

        createdRoles.push(`${faction.name}: ${role} (created)`);
      } catch (error) {
        createdRoles.push(`${faction.name}: Failed to create`);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle('Faction Roles Setup Complete')
      .setDescription(createdRoles.join('\n'))
      .setFooter({ text: 'Users can now use /hytale role to join a faction' });

    await interaction.editReply({ embeds: [embed] });
  }

  async handleFanArt(interaction) {
    const db = this.client.db.db;
    const channelConfig = db.prepare('SELECT * FROM hytale_fanart_channels WHERE guild_id = ?')
      .get(interaction.guild.id);

    if (!channelConfig) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Fan art gallery has not been set up. Ask an admin to run `/hytale setfanart`.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const image = interaction.options.getAttachment('image');
    const title = interaction.options.getString('title') || 'Untitled';

    if (!image.contentType?.startsWith('image/')) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Please upload a valid image file.')],
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply();

    try {
      const channel = await this.client.channels.fetch(channelConfig.channel_id);

      const embed = new EmbedBuilder()
        .setColor(Colors.HYTALE)
        .setTitle(title)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setImage(image.url)
        .setFooter({ text: 'Hytale Fan Art Gallery' })
        .setTimestamp();

      await channel.send({ embeds: [embed] });

      db.prepare('INSERT INTO hytale_fanart (guild_id, user_id, image_url, title) VALUES (?, ?, ?, ?)')
        .run(interaction.guild.id, interaction.user.id, image.url, title);

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setDescription(`Your fan art "${title}" has been submitted to ${channel}!`)
        ]
      });
    } catch (error) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Failed to submit fan art. Please try again later.')]
      });
    }
  }

  async handleSetFanArt(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You need Manage Server permission.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const channel = interaction.options.getChannel('channel');
    const db = this.client.db.db;

    if (!channel) {
      db.prepare('DELETE FROM hytale_fanart_channels WHERE guild_id = ?').run(interaction.guild.id);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription('Fan art gallery has been disabled.')]
      });
    }

    db.prepare(`
      INSERT INTO hytale_fanart_channels (guild_id, channel_id) VALUES (?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET channel_id = ?
    `).run(interaction.guild.id, channel.id, channel.id);

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle('Fan Art Gallery Configured')
        .setDescription(`Fan art submissions will be posted to ${channel}.`)
      ]
    });
  }

  async handleSetChannel(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You need Manage Server permission.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const channel = interaction.options.getChannel('channel');

    if (!channel) {
      this.client.db.setSetting(interaction.guild.id, 'hytaleChannel', null);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setTitle('Channel Restriction Removed')
          .setDescription('Hytale commands can now be used in any channel.')
        ]
      });
    }

    this.client.db.setSetting(interaction.guild.id, 'hytaleChannel', channel.id);
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle('Channel Restriction Set')
        .setDescription(`Hytale commands can now only be used in ${channel}.`)
      ]
    });
  }

  cleanup() {
    if (this.newsCheckInterval) {
      clearInterval(this.newsCheckInterval);
    }
    this.log.info('Hytale plugin cleaned up');
  }
}

export default HytalePlugin;
