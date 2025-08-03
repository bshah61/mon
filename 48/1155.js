import pkg from 'hardhat';
const { ethers } = pkg;
import axios from "axios";
import fs from "fs";
import { create } from "@web3-storage/w3up-client";
import { File } from 'formdata-node';
import path from 'path';
import readline from 'readline';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// w3up क्लाइंट इंस्टेंस
let client;

// Telegram Bot कॉन्फ़िगरेशन
const TELEGRAM_BOT_TOKEN = "7620164559:AAHq5ftIl5kUIjehdvyyrXyD0hd9QAGTY3s";
const TELEGRAM_CHAT_ID = "1239205720";

// Telegram मैसेज भेजने का हेल्पर फंक्शन
async function sendTelegramMessage(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        });
        logWithTimestamp("Telegram मैसेज सफलतापूर्वक भेजा गया!");
    } catch (e) {
        logWithTimestamp(`❌ Telegram मैसेज भेजने में विफल रहा: ${e.message}`);
        if (e.response) {
            logWithTimestamp(`Telegram API एरर डिटेल्स: ${JSON.stringify(e.response.data)}`);
        }
    }
}

// टाइमस्टैम्प के साथ लॉगिंग के लिए हेल्पर फ़ंक्शन (DD-MM-YY HH:MM UTC)
function logWithTimestamp(message) {
    const now = new Date();
    const day = String(now.getUTCDate()).padStart(2, '0');
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const year = String(now.getUTCFullYear()).slice(-2);
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');

    console.log(`[${day}-${month}-${year} ${hours}:${minutes} UTC] ${message}`);
}

// लोकल इमेज फ़ोल्डर का पाथ
const LOCAL_IMAGES_FOLDER = './images'; // सुनिश्चित करें कि यह फ़ोल्डर मौजूद है और इसमें इमेज/GIF हैं

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs/";
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

// 'data' डायरेक्टरी में फ़ाइलें
const DATA_DIR = './data';
const STATE_FILE = path.join(DATA_DIR, 'deploy-state-1155.json');
const LOG_FILE = path.join(DATA_DIR, 'deployment-history-1155.json');

// 'data' डायरेक्टरी बनाने का लॉजिक
try {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        logWithTimestamp(`✅ 'data' डायरेक्टरी बनाई गई: ${DATA_DIR}`);
    } else {
        logWithTimestamp(`ℹ️ 'data' डायरेक्टरी पहले से मौजूद है: ${DATA_DIR}`);
    }
} catch (e) {
    logWithTimestamp(`❌ 'data' डायरेक्टरी बनाने में एरर: ${e.message}`);
    const hostname = os.hostname();
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} में 'data' डायरेक्टरी बनाने की एरर:\n${e.message}`);
    process.exit(1);
}

// Global Error Handlers
process.on('unhandledRejection', (reason, promise) => {
  logWithTimestamp(`❌ Unhandled Rejection at: ${promise} reason: ${reason}`);
  const hostname = os.hostname();
  const scriptName = path.basename(fileURLToPath(import.meta.url));
  const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
  sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} में Unhandled Rejection:\nReason: ${reason.message || reason}`);
});

process.on('uncaughtException', async (err) => {
  logWithTimestamp(`💥 Uncaught Exception: ${err.message}`);
  const hostname = os.hostname();
  const scriptName = path.basename(fileURLToPath(import.meta.url));
  const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
  sendTelegramMessage(`🔥🔥 ${hostname} - क्रिटिकल क्रैश! ${appFolderName}/${scriptName}:\n${err.message}`);
  process.exit(1);
});

// Environment check
if (!process.env.RECEIVER_ADDRESS || !process.env.W3UP_EMAIL) {
  logWithTimestamp("❌ Critical Error: Missing required .env variables (RECEIVER_ADDRESS, W3UP_EMAIL)");
  const hostname = os.hostname();
  const scriptName = path.basename(fileURLToPath(import.meta.url));
  const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
  sendTelegramMessage(`🚨 ${hostname} - क्रिटिकल एरर: Missing required .env variables (RECEIVER_ADDRESS, W3UP_EMAIL)`);
  process.exit(1);
}

// w3up क्लाइंट को इनिशियलाइज़ और प्रमाणित करने का फ़ंक्शन
async function initializeW3upClient() {
  logWithTimestamp("Setting up w3up client...");
  try {
    client = await create();
    logWithTimestamp("Attempting to log in w3up client...");
    const agent = await client.login(process.env.W3UP_EMAIL);
    logWithTimestamp(`w3up client logged in as: ${agent.did()}`);

    // --- यहाँ विशिष्ट स्पेस का उपयोग करना है ---
    const targetSpaceDID = "did:key:z6MkiSTiF3f7HC8LCQ1pubP97VRhV4jf8FKGYzJV3hr6fB1i"; 
    
    // सभी उपलब्ध स्पेसेस की जाँच करें
    const allSpaces = await client.spaces();
    const foundSpace = allSpaces.find(space => space.did() === targetSpaceDID);

    if (foundSpace) {
      // यदि लक्षित स्पेस मिलता है, तो उसे सेट करें
      await client.setCurrentSpace(foundSpace.did());
      logWithTimestamp(`✅ Using explicitly set w3up space: ${foundSpace.did()}`);
    } else {
      // यदि लक्षित स्पेस नहीं मिलता है, तो त्रुटि दें और टेलीग्राम मैसेज भेजें
      const errorMessage = `❌ Error: The target w3up space '${targetSpaceDID}' was not found for your account.`;
      logWithTimestamp(errorMessage);
      logWithTimestamp("Please ensure this space exists and is associated with your W3UP_EMAIL.");
      const hostname = os.hostname();
      const scriptName = path.basename(fileURLToPath(import.meta.url));
      const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
      sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} में w3up क्लाइंट स्पेस एरर:\n${errorMessage}`);
      process.exit(1);
    }
    // --- बदलाव यहाँ समाप्त होता है ---

    logWithTimestamp("w3up client initialized and space set.");

  } catch (loginError) {
    logWithTimestamp(`❌ Error initializing w3up client or logging in: ${loginError.message}`);
    logWithTimestamp("Please ensure your w3up login is active via 'w3up login <email>' command and W3UP_EMAIL is correct.");
    const hostname = os.hostname();
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} में w3up क्लाइंट इनिशियलाइज़ेशन/लॉगिन एरर:\n${loginError.message}`);
    process.exit(1);
  }
}

// Second to HHh MMm SSs format
function formatSecondsToHMS(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds.toString().padStart(2, '0')}s`);

  return parts.join(' ');
}

// लाइव काउंटडाउन फ़ंक्शन
async function countdownLive(prefixMessage, totalSeconds) {
  let remainingSeconds = totalSeconds;

  return new Promise(resolve => {
    if (remainingSeconds < 0) remainingSeconds = 0;

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    let formattedTime = formatSecondsToHMS(remainingSeconds);
    process.stdout.write(`${prefixMessage} ${formattedTime} left...`);

    if (remainingSeconds <= 0) {
      console.log();
      return resolve();
    }

    remainingSeconds--;

    const interval = setInterval(() => {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);

      formattedTime = formatSecondsToHMS(remainingSeconds);
      process.stdout.write(`${prefixMessage} ${formattedTime} left...`);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        console.log();
        resolve();
      }
      remainingSeconds--;
    }, 1000);
  });
}

// साधारण देरी फ़ंक्शन
async function delay(seconds) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomName() {
  const prefixes = [
    "Epic", "Mystic", "Golden", "Shadow", "Cosmic", "Ancient", "Dark", "Silent", "Frost", "Quantum",
  "Crimson", "Iron", "Storm", "Cursed", "Blazing", "Eternal", "Arcane", "Solar", "Frozen", "Infernal",
  "Radiant", "Lunar", "Celestial", "Sacred", "Phantom", "Obsidian", "Twilight", "Vortex", "Runic", "Neon",
  "Void", "Cyber", "Mythic", "Spectral", "Shimmering", "Ghostly", "Magnetic", "Hyper", "Toxic", "Divine",
  "Flaming", "Tidal", "Glacial", "Electro", "Mechanical", "Astral", "Turbo", "Encrypted", "Savage", "Chaotic",
  "Volcanic", "Draconic", "Wicked", "Primal", "Stealth", "Temporal", "Binary", "Stellar", "Mutant", "Titanic",
  "Haunted", "Nano", "Mega", "Omega", "Alpha", "Cybernetic", "Ironclad", "Rogue", "Blitz", "Galactic",
  "Darksteel", "Feral", "Blood", "Warped", "Turbocharged", "Celestia", "Lustrous", "Plasma", "Encrypted", "Rusty",
  "Specter", "Crystalline", "Techno", "Fission", "Nova", "Ion", "Delta", "Xeno", "Turbo", "Psionic",
  "Stormborn", "Runebound", "Oblivion", "Vengeful", "Zealous", "Vigilant", "Dusk", "Neural", "Aether", "Ghost",
  "Inferno", "Clockwork", "Mirrored", "Stitched", "Wired", "Pixel", "Circuit", "Data", "Crypto", "Echo",
  "Fractal", "Nebula", "Fusion", "Omni", "Zeta", "Viral", "Grim", "Mechanized", "Chroma", "Arc",
  "Pulse", "Spiral", "Nuclear", "Antimatter", "Plasmic", "Beaming", "Ether", "Ironfist", "Pyro", "Fused",
  "Star", "Orbital", "Voidborn", "Helix", "Alloy", "Cryo", "Monolith", "Titan", "Astrid", "Flickering",
  "Rune", "Glow", "Steel", "Prophetic", "Enchanted", "Fiery", "Boundless", "Runed", "Fiendish", "Twined",
  "Glimmering", "Radiating", "Skyward", "Shrouded", "Eclipsed", "Charged", "Ember", "Blessed", "Thunderous", "Veiled",
  "Dimensional", "Split", "Interstellar", "Quantumized", "Hallowed", "Feathered", "Winged", "Cyberlight", "Sparked", "Forged",
  "Valiant", "Runeforge", "Mycelial", "Spored", "Warpstorm", "Nether", "Demonic", "Celestite", "Cratered", "Bionic",
  "Circuital", "Zodiac", "Encoded", "Sentinel", "Arcadia", "Crimsonlight", "Unholy", "Sacrificial", "Outcast", "Redshift",
  "Singularity", "Lucent", "Reactor", "Darkroot", "Lightborn", "Farsight", "Blackflame", "Elder", "Timeworn", "Starshard",
  "Chrono", "Havoc", "Pulsefire", "Tempest", "Aurora", "Polaris", "Equinox", "Solstice", "Netherbound", "Primordial",
  "Eldritch", "Specterborn", "Runecarved", "Skyshard", "Astrid", "Umbra", "Tenebris", "Shard", "Warden", "Voidstep",
  "Dust", "Planar", "Nebulite", "Gravity", "Magnetar", "Solarion", "Infinity", "Radiar", "Drift", "Whirl",
  "Blast", "Gale", "Windswept", "Echoing", "Catalyst", "Wyrm", "Fang", "Hydra", "Beast", "Lich",
  "Revenant", "Bane", "Rift", "Chaos", "Stormspire", "Shadowfall", "Ashen", "Dawn", "Forge", "Blastcore",
  "Flux", "Brimstone", "Kindled", "Phased", "Zephyr", "Graviton", "Mythos", "Oathbound", "Judged", "Crownless",
  "Crowned", "Burning", "Smoldering", "Silken", "Stone", "Frozenlight", "Galeheart", "Waveborn", "Windrider", "Stormblade",
  "Soulbound", "Specterlight", "Dream", "Hollow", "Unseen", "Scorched", "Crackling", "Surging", "Wild", "Raging",
  ];
  const suffixes = [
    "Phoenix", "Dragon", "Warrior", "Wizard", "Artifact", "Guardian", "Relic", "Monk", "Scroll", "Knight",
  "Blade", "Flame", "Titan", "Sentinel", "Beast", "Wraith", "Shadow", "Crusader", "Dagger", "Spirit",
  "Oracle", "Warden", "Hunter", "Rider", "Champion", "Fiend", "Golem", "Witch", "Assassin", "Berserker",
  "Shaman", "Seeker", "Mage", "Priest", "Rogue", "Druid", "Archer", "Sorcerer", "Invoker", "Brawler",
  "Mystic", "Shade", "Enforcer", "Nomad", "Sage", "Reaper", "Ghost", "Outlaw", "Revenant", "Scion",
  "Elemental", "Dancer", "Prophet", "Defender", "Witcher", "Invoker", "Titaness", "Paladin", "Nomarch", "Vampire",
  "Necromancer", "Bishop", "Knightling", "Titanborn", "Acolyte", "Stormcaller", "Spellblade", "Firebrand", "Moonlord", "Dreamer",
  "Timewalker", "Starforged", "Riftwalker", "Chronomancer", "Watchman", "Marksman", "Alchemist", "Beholder", "Juggernaut", "Dervish",
  "Runekeeper", "Lightbearer", "Frostfang", "Hellbringer", "Stoneheart", "Netherling", "Curselord", "Ravensoul", "Emissary", "Sellsword",
  "Nullborn", "Fateweaver", "Lorekeeper", "Ashwalker", "Thunderfist", "Voidcaller", "Soulstealer", "Brutalizer", "Flamekin", "Spiritkin",
  "Vindicator", "Wardancer", "Valkyrie", "Soulforger", "Lightweaver", "Harbinger", "Skirmisher", "Seer", "Tamer", "Doomblade",
  "Ravager", "Thorn", "Mender", "Bloodmage", "Frostborn", "Firewalker", "Voidwalker", "Oathkeeper", "Bloodhunter", "Crystalmage",
  "Stormbringer", "Aetherblade", "Celestial", "Hellsinger", "Lightwarden", "Dreamwatcher", "Deathbringer", "Shadowhunter", "Skyrider", "Rockbeast",
  "Moonwatcher", "Spellkin", "Gravemind", "Starcaller", "Darkseer", "Sunblade", "Runelord", "Mistweaver", "Timebender", "Whisperer",
  "Wavesinger", "Planeseer", "Sunwalker", "Flamesoul", "Ghostblade", "Soulflame", "Dreamsinger", "Windblade", "Sandwalker", "Skyseer",
  "Blightwalker", "Fleshshaper", "Thundershade", "Ashfiend", "Sparkmage", "Stonecaller", "Shadelord", "Tidebringer", "Warpseer", "Nullmage",
  "Skullhunter", "Gravewalker", "Flameseer", "Heartpiercer", "Fireseer", "Runehunter", "Bonecaster", "Chillbringer", "Starweaver", "Doomseer",
  "Oathbreaker", "Faithwarden", "Trickster", "Gladiator", "Lightbearer", "Crownlord", "Runemaster", "Starblade", "Emberseer", "Icecaller",
  "Bloodreaver", "Frostwarden", "Gravesinger", "Tidehunter", "Fleshbound", "Ironfist", "Steelshaper", "Dreamblade", "Voidborn", "Hawk",
  "Lurker", "Overseer", "Sniper", "Hellblade", "Stormlord", "Moonkin", "Lightbringer", "Mindsinger", "Chronowalker", "Darkbinder",
  "Rootcaller", "Thundersoul", "Hexcaster", "Echo", "Hollowseer", "Orbwalker", "Fireclaw", "Venomancer", "Bloodknight", "Runeclaw",
  "Skullshaper", "Skysinger", "Timekin", "Etherlord", "Darkweaver", "Lightshaper", "Ashkeeper", "Boneblade", "Starwatcher", "Gorefiend",
  "Sunborn", "Doomkin", "Aetherborn", "Runeweaver", "Stormkin", "Mistcaller", "Planar", "Blazeborn", "Frostcaller", "Loreblade",
  "Suncaller", "Hexsinger", "Venomblade", "Nullweaver", "Nightstalker", "Cloudrider", "Bloodseeker", "Planeshifter", "Lightrunner", "Gravekin",
  "Mooncaller", "Moonseer", "Vortexkin", "Glitterblade", "Ironkin", "Flamesworn", "Wrathblade", "Echohunter", "Skysoul", "Thundercaller",
  ];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const randomNumber = Math.floor(Math.random() * 1000) + 1;
  return `${randomPrefix} ${randomSuffix} #${randomNumber}`;
}

function generateRandomDescription(tokenId) {
  const intros = ["Behold", "Discover", "Uncover", "Experience", "Summon", "Embrace", "Awaken", "Harness", "Unleash", "Explore"];
  const adjectives = ["legendary", "ancient", "mystical", "rare", "powerful", "enigmatic", "celestial", "ethereal", "mythical", "fabled"];
  const nouns = ["warrior", "artifact", "creature", "guardian", "spirit", "champion", "relic", "entity", "legend", "sentinel"];
  const actions = [
    "born from the stars.",
  "lost in the sands of time.",
  "hidden in the depths of the void.",
  "forged in the flames of eternity.",
  "whispered about in ancient tales.",
  "waiting to be discovered.",
  "guarded by timeless forces.",
  "etched in the chronicles of history.",
  "shrouded in mystery and power.",
  "a beacon of hope in dark times.",
  "carved from the heart of a fallen star.",
  "waiting beyond the veil of reality.",
  "echoing through the halls of the forgotten.",
  "bound by an ancient curse.",
  "rising from the ashes of destruction.",
  "lost beneath endless waves.",
  "held by the winds of destiny.",
  "dancing in the shadows of forgotten realms.",
  "sealed within a forgotten tomb.",
  "hidden where no light dares to reach.",
  "singing the songs of the cosmos.",
  "woven into the fabric of time.",
  "embraced by the eternal night.",
  "lost among shattered dreams.",
  "guarded by the spirits of old.",
  "shattered but never broken.",
  "written in the stars above.",
  "protected by the sacred flame.",
  "born in the eye of the storm.",
  "carrying the weight of forgotten worlds.",
  "lurking in the depths of the abyss.",
  "woven from the threads of fate.",
  "calling out from beyond the veil.",
  "whispering secrets of forgotten kings.",
  "held within the grasp of shadow.",
  "bathed in the light of dawn.",
  "etched with the blood of heroes.",
  "a relic of the ancient wars.",
  "carved into the bones of the earth.",
  "awakened by the pulse of the void.",
  "frozen in time’s endless grasp.",
  "calling across the void of ages.",
  "wrapped in the cloak of silence.",
  "lost in the echoes of eternity.",
  "rising with the tides of fate.",
  "sung by the bards of forgotten lands.",
  "hidden beneath the roots of the world tree.",
  "shining brighter than the noon sun.",
  "bound to the cycles of the moon.",
  "carried on the breath of the wind.",
  "hidden in the heart of a dying star.",
  "guarded by beasts of legend.",
  "whispered in the halls of the ancients.",
  "written in the language of the gods.",
  "hidden beneath layers of forgotten dust.",
  "shaped by the hands of fate.",
  "lost in the dreams of immortals.",
  "a shadow in the light of creation.",
  "fated to return in the time of reckoning.",
  "etched in the memories of the earth.",
  "shrouded in the mists of forgotten realms.",
  "carved from the bones of giants.",
  "flickering in the fires of rebellion.",
  "rising from the depths of oblivion.",
  "guarded by the last of the old ones.",
  "lost to the whispers of the wind.",
  "a spark in the endless night.",
  "woven into the song of the stars.",
  "bathed in the tears of the moon.",
  "hidden behind the veil of dreams.",
  "frozen beneath the ice of time.",
  "calling out through the darkness.",
  "bound by chains of forgotten magic.",
  "etched with the tears of the gods.",
  "shining through the cracks of reality.",
  "carved into the heart of the mountain.",
  "lost beneath the sea of stars.",
  "waiting in the silence of the void.",
  "guarded by the flames of the phoenix.",
  "rising with the roar of thunder.",
  "hidden in the labyrinth of souls.",
  "whispered on the winds of change.",
  "written in the blood of the fallen.",
  "etched in the dust of ages.",
  "wrapped in the shadows of the past.",
  "carried on the wings of fate.",
  "lost within the folds of time.",
  "bound to the will of the cosmos.",
  "shrouded in the silence of eternity.",
  "a flicker in the darkness of worlds.",
  "singing the songs of lost civilizations.",
  "hidden in the heart of forgotten dreams.",
  "bathed in the light of a dying sun.",
  "etched in the echoes of the past.",
  "rising from the ashes of the old world.",
  "carved from the stone of the ancients.",
  "whispered among the leaves of the sacred forest.",
  "held by the hands of destiny.",
  "wrapped in the colors of the aurora.",
  "shining beneath the veil of night.",
  "bound by the oath of the eternal watch.",
  "lost in the dance of the fireflies.",
  "calling through the corridors of time.",
  "guarded by the silent sentinels.",
  "etched with the power of the elements.",
  "bathed in the light of forgotten stars.",
  "hidden in the shadows of the world.",
  "woven into the tapestry of the cosmos.",
  "carved into the soul of the earth.",
  "rising beyond the horizon of dreams.",
  "a whisper in the storm of ages.",
  "waiting in the heart of the storm.",
  "shrouded in the secrets of the void.",
  "bound to the pulse of creation.",
  "lost in the spiral of time.",
  "carried by the echoes of eternity.",
  "hidden beneath the sands of the ancient desert.",
  "etched in the fire of the eternal forge.",
  "guarded by the last light of the dying stars.",
  "whispered in the silence of forgotten places.",
  "bathed in the glow of the mystic moon.",
  "woven from the dreams of the ancients.",
  "rising with the fury of the tempest.",
  "carved from the essence of the gods.",
  "lost in the shadows of forgotten empires.",
  "waiting to be reborn from the ashes.",
  "bound by the chains of destiny.",
  "shining like a beacon in the endless night.",
  "etched in the heart of the forgotten realms.",
  "carried by the winds of the eternal plains.",
  "hidden beneath the waves of the endless ocean.",
  "guarded by the spirits of the ancient world.",
  "whispered through the voices of the past.",
  "bathed in the light of the eternal flame.",
  "woven into the fabric of forgotten magic.",
  "rising beyond the limits of the known worlds.",
  "carved into the bones of the earth's crust.",
  "lost among the stars in the endless void."
  ];

  const intro = intros[Math.floor(Math.random() * intros.length)];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  return `${intro} a ${adj} ${noun} ${action}`;
}

function getRandomRarity() {
  const rand = Math.random();
  if (rand > 0.95) return "Mythic";
  if (rand > 0.85) return "Legendary";
  if (rand > 0.65) return "Rare";
  if (rand > 0.30) return "Uncommon";
  return "Common";
}

function getRandomGeneration() {
  return Math.floor(Math.random() * 5) + 1;
}

function getRandomElement() {
  const elements = ["Fire", "Water", "Earth", "Air", "Light", "Darkness"];
  return elements[Math.floor(Math.random() * elements.length)];
}

function getRandomPowerLevel() {
  return Math.floor(Math.random() * 100) + 1;
}

// --- Giphy से GIF डाउनलोड करने के लिए फ़ंक्शन ---
async function downloadGifFromGiphy(tokenId) {
  const searchTerms = ["fantasy", "magic", "adventure", "creature", "hero", "sci-fi", "anime"];
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const giphyApiUrl = `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${searchTerm}&rating=g`;

  try {
    logWithTimestamp(`\nSearching for a random GIF for token #${tokenId} with tag '${searchTerm}' from Giphy...`);
    const response = await axios.get(giphyApiUrl);
    const gifData = response.data.data;

    if (!gifData || !gifData.images || !gifData.images.preview_gif) {
      throw new Error("Invalid GIF data or 'preview_gif' not found from Giphy API.");
    }
    
    const gifUrl = gifData.images.preview_gif.url;

    logWithTimestamp(`Found GIF from Giphy (Tag: '${searchTerm}'): ${gifUrl}`);

    const tempPath = `./temp/nft-gif-${tokenId}.gif`;
    if (!fs.existsSync("./temp")) fs.mkdirSync("./temp");

    const gifResponse = await axios.get(gifUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(tempPath, gifResponse.data);

    const fileSizeInBytes = fs.statSync(tempPath).size;
    const fileSizeInKB = fileSizeInBytes / 1024;
    logWithTimestamp(`Downloaded GIF size: ${fileSizeInKB.toFixed(2)} KB`);

    return tempPath;
  } catch (error) {
    logWithTimestamp(`❌ Error downloading GIF from Giphy: ${error.message}`);
    return null;
  }
}

// --- लोकल इमेज फ़ोल्डर से रैंडम फ़ाइल चुनें ---
async function getRandomLocalImageFile() {
  try {
    if (!fs.existsSync(LOCAL_IMAGES_FOLDER)) {
      logWithTimestamp(`❌ Local images folder not found at: ${LOCAL_IMAGES_FOLDER}`);
      return null;
    }

    const files = fs.readdirSync(LOCAL_IMAGES_FOLDER).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif'].includes(ext);
    });

    if (files.length === 0) {
      logWithTimestamp(`❌ No image files found in local folder: ${LOCAL_IMAGES_FOLDER}`);
      return null;
    }

    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(LOCAL_IMAGES_FOLDER, randomFile);
    logWithTimestamp(`🖼️ Using random local image: ${filePath}`);
    return filePath;
  } catch (error) {
    logWithTimestamp("Error getting random local image:", error);
    return null;
  }
}

// --- Web3.storage पर इमेज अपलोड करें ---
async function uploadImageToWeb3Storage(tokenId) {
  let imagePath = null;
  let fileExtension = '.gif';
  
  // Giphy API से इमेज डाउनलोड करने का प्रयास करें
  if (GIPHY_API_KEY) {
    imagePath = await downloadGifFromGiphy(tokenId);
    if (!imagePath) {
      logWithTimestamp("⚠️ Giphy से GIF डाउनलोड नहीं हो सका. लोकल फ़ोल्डर से इमेज का उपयोग कर रहे हैं.");
      imagePath = await getRandomLocalImageFile();
      if (imagePath) {
        fileExtension = path.extname(imagePath);
      }
    }
  } else {
    logWithTimestamp("⚠️ GIPHY_API_KEY सेट नहीं है. लोकल फ़ोल्डर से इमेज का उपयोग कर रहे हैं.");
    imagePath = await getRandomLocalImageFile();
    if (imagePath) {
      fileExtension = path.extname(imagePath);
    }
  }

  if (!imagePath) {
    throw new Error("कोई इमेज स्रोत उपलब्ध नहीं है (Giphy विफल रहा और कोई लोकल इमेज नहीं मिली).");
  }

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = `image/${fileExtension.slice(1)}`;
    const imageFile = new File([imageBuffer], `nft-image-${tokenId}${fileExtension}`, { type: mimeType });

    logWithTimestamp(`Uploading image for token #${tokenId} to web3.storage (via w3up)...`);
    const cid = await client.uploadFile(imageFile);
    const imageUrl = `${IPFS_GATEWAY}${cid}`;
    logWithTimestamp(`Image uploaded to web3.storage. CID: ${cid}`);
    return imageUrl;

  } catch (error) {
    logWithTimestamp("Image upload to web3.storage failed:", error);
    throw error;
  } finally {
    // अस्थायी फ़ाइल को हटाएँ
    if (imagePath && fs.existsSync(imagePath) && imagePath.startsWith('./temp/')) {
      fs.unlinkSync(imagePath);
      logWithTimestamp(`Temporary file removed: ${imagePath}`);
    }
  }
}

// --- Web3.storage पर मेटाडेटा अपलोड करें ---
async function createNexusMetadata(tokenId, imageUrl) {
  try {
    const metadata = {
      name: generateRandomName(),
      description: generateRandomDescription(tokenId),
      image: imageUrl,
      attributes: [
        { trait_type: "Rarity", value: getRandomRarity() },
        { trait_type: "Generation", value: getRandomGeneration(), display_type: "number" },
        { trait_type: "Element", value: getRandomElement() },
        { trait_type: "Power Level", value: getRandomPowerLevel(), display_type: "number" }
      ]
    };

    const metadataFileName = `nft-metadata-${tokenId}.json`;
    const metadataString = JSON.stringify(metadata, null, 2);
    const metadataFile = new File([metadataString], metadataFileName, { type: 'application/json' });

    logWithTimestamp(`Uploading metadata for token #${tokenId} to web3.storage (via w3up)...`);
    const cid = await client.uploadFile(metadataFile);
    logWithTimestamp(`Metadata uploaded to web3.storage. CID: ${cid}`);

    return `${IPFS_GATEWAY}${cid}`;
  } catch (error) {
    logWithTimestamp("Metadata upload failed:", error);
    throw error;
  }
}

// *** नया: saveState फ़ंक्शन ***
async function saveState(stateData) {
    const hostname = os.hostname();
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2));
        logWithTimestamp(`✅ State saved to ${STATE_FILE}`);
    } catch (e) {
        const errorMessage = `❌ ${STATE_FILE} में स्टेट लिखने में एरर: ${e.message}`;
        logWithTimestamp(errorMessage);
        sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} में स्टेट सेव करने की एरर:\n${errorMessage}`);
    }
}

// *** नया: loadState फ़ंक्शन ***
function loadState() {
  try {
    const fileContent = fs.readFileSync(STATE_FILE, 'utf8');
    if (fileContent.trim() === '') {
        logWithTimestamp(`ℹ️ ${STATE_FILE} खाली है, नया स्टेट शुरू कर रहा हूँ।`);
        return null;
    }
    return JSON.parse(fileContent);
  } catch (e) {
    logWithTimestamp(`⚠️ ${STATE_FILE} को पढ़ने या पार्स करने में एरर: ${e.message}`);
    return null;
  }
}

// *** नया: logDeployment फ़ंक्शन ***
async function logDeployment(details) {
    const hostname = os.hostname();
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

    let history = [];
    try {
        if (fs.existsSync(LOG_FILE)) {
            const fileContent = fs.readFileSync(LOG_FILE, 'utf8');
            if (fileContent.trim() !== '') {
                const parsedContent = JSON.parse(fileContent);
                if (Array.isArray(parsedContent)) {
                    history = parsedContent;
                } else {
                    logWithTimestamp(`⚠️ ${LOG_FILE} में डेटा ऐरे नहीं है। इसे रीसेट किया जा रहा है।`);
                }
            }
        }
    } catch (e) {
        const errorMessage = `❌ ${LOG_FILE} को पढ़ने या पार्स करने में एरर: ${e.message}`;
        logWithTimestamp(errorMessage);
        logWithTimestamp(`⚠️ ${LOG_FILE} को रीसेट किया जा रहा है।`);
        history = [];
        sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} में फ़ाइल पढ़ने की एरर:\n${errorMessage}`);
    }
    history.push({
        timestamp: new Date().toISOString(),
        ...details
    });
    try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(history, null, 2));
    } catch (e) {
        const errorMessage = `❌ ${LOG_FILE} में लिखने में एरर: ${e.message}`;
        logWithTimestamp(errorMessage);
        sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} में फ़ाइल लिखने की एरर:\n${errorMessage}`);
    }
}


async function sendRandomNFTs(nftContract, sender, receiver, tokenIds, quantityMinted) {
  try {
    const maxQuantityToSend = Math.min(quantityMinted, 7777);
    const quantityToSend = Math.floor(Math.random() * maxQuantityToSend) + 1;
    const randomTokenId = tokenIds[Math.floor(Math.random() * tokenIds.length)];
    const sleepTime = Math.floor(Math.random() * (265 - 31 + 1)) + 31;

    logWithTimestamp(`\n🎁 Selected Token ID ${randomTokenId} to send to ${receiver}`);
    logWithTimestamp(`⏳ Will send ${quantityToSend} units after ${sleepTime} seconds`);

    await countdownLive(`⏳ Waiting before transfer`, sleepTime);
    logWithTimestamp('\r');

    await (await nftContract.safeTransferFrom(
      sender.address,
      receiver,
      randomTokenId,
      quantityToSend,
      "0x"
    )).wait();

    logWithTimestamp(`\n✅ Sent ${quantityToSend} units of Token ID ${randomTokenId} to ${receiver}`);
  } catch (error) {
    logWithTimestamp("Error sending NFT:", error);
    throw error;
  }
}

async function runNFTProcess() {
  const hostname = os.hostname();
  const scriptName = path.basename(fileURLToPath(import.meta.url));
  const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

  let contractAddress = null;
  let overallSuccess = false;

  try {
    const [deployer] = await ethers.getSigners();
    const receiverAddress = process.env.RECEIVER_ADDRESS;

    const tokenId = Math.floor(Math.random() * (77777 - 3 + 1)) + 3;
    const quantity = Math.floor(Math.random() * (77777 - 3 + 1)) + 3;

    logWithTimestamp("\n🚀 Starting NFT creation process...");
    logWithTimestamp(`Using account: ${deployer.address}`);
    logWithTimestamp(`Token ID: ${tokenId}, Quantity: ${quantity}`);
    logWithTimestamp(`Receiver Address: ${receiverAddress}`);

    // initializeW3upClient अब मुख्य लूप से कॉल किया जाएगा, यहाँ से हटा दिया गया है।

    logWithTimestamp("\n📤 Uploading image...");
    const imageUrl = await uploadImageToWeb3Storage(tokenId);
    logWithTimestamp(`Image URL: ${imageUrl}`);

    logWithTimestamp("\n📝 Creating metadata...");
    const metadataUrl = await createNexusMetadata(tokenId, imageUrl);
    logWithTimestamp(`Metadata URL: ${metadataUrl}`);

    logWithTimestamp("\n🛠️ Deploying contract...");
    const namePrefixes = [
      "Ancient", "Mystic", "Arcane", "Celestial", "Divine", "Golden", "Silver", "Crimson", "Shadow", "Eternal",
  "Sacred", "Radiant", "Infernal", "Frozen", "Storm", "Dark", "Luminous", "Vengeful", "Blessed", "Cursed",
  "Wicked", "Holy", "Secret", "Runed", "Epic", "Legendary", "Heroic", "Mythical", "Enchanted", "Fabled",
  "Twilight", "Dusk", "Dawn", "Solar", "Lunar", "Spectral", "Phantom", "Void", "Infinite", "Prime",
  "Ancestor", "Fallen", "Glorious", "Savage", "Arcadian", "Obsidian", "Molten", "Glacial", "Whispering", "Silent",
  "Howling", "Screaming", "Burning", "Icy", "Chilled", "Thunderous", "Raging", "Venomous", "Toxic", "Wild",
  "Cavernous", "Jagged", "Soaring", "Fleeting", "Timeless", "Mechanical", "Cyber", "Quantum", "Neon", "Galactic",
  "Astral", "Stellar", "Empyrean", "Wretched", "Ghostly", "Haunted", "Sacrificial", "Eldritch", "Forbidden", "Unknown",
  "Shining", "Broken", "Shattered", "Silent", "Majestic", "Royal", "Crowned", "Echoing", "Bleeding", "Piercing",
  "Torn", "Cracked", "Solid", "Dense", "Floating", "Lost", "Hidden", "Visible", "Sealed", "Glowing",
  "Hollow", "Woven", "Bound", "Ancillary", "Spectral", "Nephilim", "Vast", "Tiny", "Deep", "High",
  "Crescent", "Halcyon", "Seraphic", "Demonic", "Heavenly", "Infernal", "Chromatic", "Prismatic", "Blazing", "Roaring",
  "Thundering", "Rumbling", "Gentle", "Soft", "Burnished", "Polished", "Mirrored", "Reflective", "Translucent", "Opaque",
  "Opaque", "Transparent", "Resplendent", "Velvet", "Satin", "Flaming", "Chilling", "Smoldering", "Cascading", "Glistening",
  "Flickering", "Frosted", "Ashen", "Ebony", "Ivory", "Marbled", "Crystal", "Diamond", "Ruby", "Sapphire",
  "Emerald", "Opal", "Onyx", "Topaz", "Pearl", "Gilded", "Bronzed", "Steel", "Titanium", "Carbon",
  "Graphene", "Magnetic", "Radioactive", "Volcanic", "Cubic", "Tetra", "Spiral", "Wavy", "Straight", "Bent",
  "Rigid", "Liquid", "Plasma", "Etheric", "Arc-like", "Rune-carved", "Glyph-marked", "Tattooed", "Marked", "Runic",
  "Coded", "Encrypted", "Digital", "Analog", "Mystified", "Corrupted", "Purified", "Bright", "Dull", "Feral",
  "Tamed", "Ancillary", "Backup", "Primary", "Ultimate", "Final", "First", "Last", "Prototype", "Beta",
  "Alpha", "Omega", "Zeta", "Sigma", "Delta", "Gamma", "Neural", "Psychedelic", "Dreaming", "Waking",
  "Undead", "Living", "Breathing", "Sleeping", "Risen", "Banished", "Boundless", "Rooted", "Floating", "Hovering",
  "Magical", "Scientific", "Technical", "Mycelial", "Organic", "Synthetic", "Shimmering", "Quaking", "Blazing", "Waning",
  "Waxing", "Full", "Empty", "Hollowed", "Dense", "Pure", "Stained", "Flawed", "Perfect", "Imperfect",
  "Virtual", "Simulated", "Holographic", "Constructed", "Forged", "Molded", "Brittle", "Unbreakable", "Unseen", "Seen",
  "Present", "Past", "Future", "Timeless", "Chrono", "Time-locked", "Dreamlike", "Waking", "Nightmare", "Fantasy",
  "Horrific", "Vibrant", "Muted", "Electric", "Kinetic", "Static", "Still", "Alive", "Dead", "Reborn",
  "Energized", "Exhausted", "Greedy", "Generous", "Silent", "Echoed", "Amplified", "Tuned", "Calibrated", "Harmonized",
    ];
    const nameSuffixes = [
      "Warrior", "Sorcerer", "Mage", "Knight", "Guardian", "Paladin", "Assassin", "Hunter", "Ranger", "Shaman",
  "Seer", "Oracle", "Beast", "Behemoth", "Dragon", "Phoenix", "Unicorn", "Golem", "Titan", "Wraith",
  "Spirit", "Ghost", "Demon", "Angel", "Reaper", "Slayer", "Conjurer", "Invoker", "Wizard", "Monk",
  "Priest", "Witch", "Necromancer", "Summoner", "Champion", "Druid", "Alchemist", "Elemental", "Serpent", "Wolf",
  "Tiger", "Lion", "Panther", "Falcon", "Raven", "Hawk", "Eagle", "Vulture", "Bear", "Bull",
  "Ox", "Deer", "Stag", "Boar", "Hound", "Cobra", "Viper", "Scorpion", "Crab", "Spider",
  "Octopus", "Kraken", "Hydra", "Basilisk", "Chimera", "Cyclops", "Minotaur", "Griffin", "Sphinx", "Harpy",
  "Siren", "Dryad", "Nymph", "Banshee", "Djinn", "Ifrit", "Efreet", "Rakshasa", "Yeti", "Abomination",
  "Mutant", "Zombie", "Ghoul", "Skeleton", "Wight", "Lich", "Shade", "Specter", "Phantom", "Bard",
  "Herald", "Messenger", "Courier", "Wanderer", "Nomad", "Pilgrim", "Voyager", "Explorer", "Outlaw", "Bandit",
  "Rogue", "Mercenary", "Gladiator", "Champion", "Veteran", "Sentinel", "Defender", "Warden", "Protector", "Avenger",
  "Judge", "Inquisitor", "Executioner", "Destroyer", "Harbinger", "Seeker", "Bearer", "Bringer", "Caller", "Crafter",
  "Smith", "Carver", "Tailor", "Weaver", "Builder", "Architect", "Tinker", "Engineer", "Scientist", "Inventor",
  "Scholar", "Sage", "Archivist", "Librarian", "Professor", "Master", "Apprentice", "Adept", "Initiate", "Acolyte",
  "Cultist", "Believer", "Follower", "Disciple", "Prophet", "Saint", "Martyr", "Hero", "Legend", "Icon",
  "Symbol", "Token", "Relic", "Artifact", "Scroll", "Tablet", "Ring", "Amulet", "Charm", "Talisman",
  "Blade", "Sword", "Dagger", "Axe", "Mace", "Hammer", "Bow", "Arrow", "Spear", "Staff",
  "Wand", "Tome", "Grimoire", "Orb", "Crystal", "Stone", "Gem", "Jewel", "Crown", "Helmet",
  "Armor", "Shield", "Cape", "Cloak", "Boots", "Gloves", "Belt", "Pendant", "Horn", "Fang",
  "Claw", "Eye", "Heart", "Soul", "Mind", "Will", "Fury", "Wrath", "Justice", "Hope",
  "Despair", "Dream", "Nightmare", "Vision", "Memory", "Echo", "Whisper", "Scream", "Cry", "Roar",
  "Breath", "Flame", "Frost", "Storm", "Lightning", "Thunder", "Wave", "Tide", "Wind", "Dust",
  "Ash", "Fire", "Ice", "Water", "Earth", "Air", "Void", "Light", "Darkness", "Energy",
  "Power", "Force", "Might", "Glory", "Honor", "Fear", "Truth", "Lies", "Faith", "Greed",
  "Love", "Hate", "Peace", "War", "Order", "Chaos", "Balance", "Fate", "Destiny", "Chance",
  "Luck", "Blessing", "Curse", "Mark", "Seal", "Oath", "Pact", "Bond", "Thread", "String",
  "Chain", "Link", "Loop", "Circle", "Ring", "Cube", "Core", "Engine", "Drive", "Matrix",
  "Script", "Code", "Rune", "Glyph", "Formula", "Equation", "Design", "Pattern", "Mosaic", "Canvas",
    ];

    const collectionName = `${namePrefixes[Math.floor(Math.random() * namePrefixes.length)]}${nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)]}`;
    const collectionSymbol = `${collectionName[0]}${collectionName[1]}`;

    // My1155NFT कॉन्ट्रैक्ट का उपयोग करें
    const NexusNFT = await ethers.getContractFactory("My1155NFT");
    const nft = await NexusNFT.deploy(collectionName, collectionSymbol);
    await nft.waitForDeployment();

    contractAddress = await nft.getAddress();
    logWithTimestamp(`Contract deployed to: ${contractAddress}`);

    logWithTimestamp("\n🖼️ Minting NFT and setting URI in a single transaction...");
    // एक ही ट्रांजेक्शन में mintAndSetURI का उपयोग करें
    await (await nft.mintAndSetURI(
      deployer.address,
      tokenId,
      quantity,
      metadataUrl,
      "0x"
    )).wait();

    logWithTimestamp("\n🎉 NFT Created!");
    logWithTimestamp(`Contract Address: ${contractAddress}`);
    logWithTimestamp(`Token ID: ${tokenId}`);
    logWithTimestamp(`Metadata URL: ${metadataUrl}`);
    logWithTimestamp(`Image URL: ${imageUrl}\n`);

    const tokenIds = [tokenId];
    await sendRandomNFTs(nft, deployer, receiverAddress, tokenIds, quantity);

    overallSuccess = true;

    const summary = {
      contractAddress,
      deployer: deployer.address,
      receiver: receiverAddress,
      tokenId,
      quantityMinted: quantity,
      metadataUrl,
      imageUrl,
      overallProcessSuccess: overallSuccess
    };

    await logDeployment(summary);
    // saveState यहाँ नहीं किया जाएगा, इसे मुख्य लूप में नियंत्रित किया जाएगा
    return summary;
  } catch (err) {
    logWithTimestamp(`❌ Error: ${err.message}`);
    sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} में रनNFTप्रोसेस एरर:\n${err.message}`);
    
    const summary = {
      contractAddress,
      deployer: (await ethers.getSigners())[0].address,
      receiver: process.env.RECEIVER_ADDRESS,
      tokenId: null,
      quantityMinted: 0,
      metadataUrl: null,
      imageUrl: null,
      overallProcessSuccess: false,
      errorMessage: err.message
    };
    await logDeployment(summary);
    // saveState यहाँ नहीं किया जाएगा, इसे मुख्य लूप में नियंत्रित किया जाएगा
    throw err;
  }
}

// temp डायरेक्टरी को साफ और सुनिश्चित करने का फ़ंक्शन
async function cleanTempDirectory() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    logWithTimestamp(`Cleaning existing temp directory: ${tempDir}`);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  logWithTimestamp(`Ensuring temp directory exists: ${tempDir}`);
  fs.mkdirSync(tempDir, { recursive: true });
}

// *** Main loop (अब 48 घंटे के साइकिल लॉजिक के साथ) ***
async function main() {
    process.on('SIGINT', () => {
        logWithTimestamp('\n🔴 Shutdown signal received. Exiting...');
        process.exit(0);
    });

    await initializeW3upClient();
    await cleanTempDirectory();

    let state = loadState();
    // lastCycleStartTimestamp को 'main' फ़ंक्शन में ही हैंडल किया जाएगा
    let lastCycleStartTimestamp = state && state.lastCycleStartTimestamp ? state.lastCycleStartTimestamp : 0;

    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 48 घंटे मिलीसेकंड में

    while (true) {
        const now = Date.now();
        let shouldStartNewCycle = false;
        let delayBeforeFirstDeploymentInCycle = 0; // यह पहला डिप्लॉयमेंट के लिए 1-24 घंटे का रैंडम देरी

        if (lastCycleStartTimestamp === 0) {
            logWithTimestamp("\n🚀 Initial run or no previous cycle state found. Starting first deployment cycle immediately.");
            delayBeforeFirstDeploymentInCycle = getRandomInt(1 * 3600, 24 * 3600); // 1 से 24 घंटे
            lastCycleStartTimestamp = now; // वर्तमान समय को पहले साइकिल के शुरू होने का समय सेट करें
            shouldStartNewCycle = true;
        } else {
            const timeElapsedSinceLastCycleStart = now - lastCycleStartTimestamp;
            if (timeElapsedSinceLastCycleStart >= twoDaysInMs) {
                logWithTimestamp(`\n📅 2 days or more have passed since the last cycle started. Scheduling a new deployment cycle.`);
                delayBeforeFirstDeploymentInCycle = getRandomInt(1 * 3600, 24 * 3600); // 1 से 24 घंटे
                lastCycleStartTimestamp = now; // वर्तमान समय को नए साइकिल के शुरू होने का समय सेट करें
                shouldStartNewCycle = true;
            } else {
                const remainingTimeMsInCycle = twoDaysInMs - timeElapsedSinceLastCycleStart;
                const remainingSecondsInCycle = Math.ceil(remainingTimeMsInCycle / 1000);
                logWithTimestamp(`\nℹ️ Waiting for ${formatSecondsToHMS(remainingSecondsInCycle)} for the next deployment cycle to start.`);
                await countdownLive(`⏳ Waiting for the start of the next 2-day cycle`, remainingSecondsInCycle);
                console.log(); // काउंटडाउन के बाद नई लाइन

                // प्रतीक्षा करने के बाद, lastCycleStartTimestamp को नए साइकिल के वास्तविक शुरू होने का समय दर्शाने के लिए अपडेट करें
                lastCycleStartTimestamp = Date.now();
                shouldStartNewCycle = true; // अब जब हमने प्रतीक्षा कर ली है, तो हमें एक नया साइकिल शुरू करना चाहिए
                delayBeforeFirstDeploymentInCycle = getRandomInt(1 * 3600, 24 * 3600); // और इस नए साइकिल के भीतर एक रैंडम देरी भी
            }
        }

        if (shouldStartNewCycle) {
            await countdownLive(`⏱️ Random delay before the first deployment in this cycle`, delayBeforeFirstDeploymentInCycle);
            console.log(); // काउंटडाउन के बाद नई लाइन

            const timesToRun = getRandomInt(1, 2); // अभी भी 1 या 2 डिप्लॉयमेंट
            
            // पहले डिप्लॉयमेंट का वास्तविक एंड टाइम (साइकिल की शुरुआत से)
            // const firstDeploymentEndTime = lastCycleStartTimestamp + (delayBeforeFirstDeploymentInCycle * 1000); // यह यहाँ उपयोग नहीं हो रहा है, हटा दिया।

            for (let i = 0; i < timesToRun; i++) {
                logWithTimestamp(`\n--- Deployment ${i + 1}/${timesToRun} ---`);
                try {
                    const result = await runNFTProcess();
                    // स्टेट सेव करें, अब lastCycleStartTimestamp भी शामिल है
                    await saveState({ 
                        ...result, 
                        lastCycleStartTimestamp: lastCycleStartTimestamp 
                    });
                } catch (error) {
                    logWithTimestamp(`❌ Deployment ${i + 1}/${timesToRun} failed: ${error.message}`);
                    // एरर होने पर भी, साइकिल के लॉजिक को जारी रखें
                    // विफल डिप्लॉयमेंट के बाद भी state को lastCycleStartTimestamp के साथ अपडेट करें
                    await saveState({ lastCycleStartTimestamp: lastCycleStartTimestamp, lastError: error.message });
                }
                
                if (i < timesToRun - 1) {
                    // दूसरे डिप्लॉयमेंट के लिए शेष समय की गणना करें
                    const nowAfterFirstDeployment = Date.now();
                    const timeElapsedInCycleAfterFirstDeployment = nowAfterFirstDeployment - lastCycleStartTimestamp; // मिलीसेकंड में

                    // 48 घंटे के कुल साइकिल में से बचा हुआ समय
                    const remainingTimeInFullCycleMs = twoDaysInMs - timeElapsedInCycleAfterFirstDeployment;
                    const remainingTimeInFullCycleSeconds = Math.floor(remainingTimeInFullCycleMs / 1000);

                    const minimumInnerDelay = 1 * 3600; // 1 घंटा

                    // दूसरे डिप्लॉयमेंट के लिए अधिकतम देरी, जो बचे हुए साइकिल समय से ज्यादा न हो
                    // साथ ही, यह सुनिश्चित करें कि अधिकतम देरी कम से कम 1 घंटे हो और 24 घंटे से अधिक न हो
                    // क्योंकि पहला डिप्लॉयमेंट 1-24 घंटे के बीच होता है, और दूसरा डिप्लॉयमेंट उसके बाद ही होगा
                    // तो यह सुनिश्चित करें कि कुल समय 48 घंटे से अधिक न हो
                    const maxInnerDelay = Math.min(24 * 3600, Math.max(minimumInnerDelay, remainingTimeInFullCycleSeconds));
                    
                    // दूसरा डिप्लॉयमेंट 1 घंटे से लेकर बचे हुए अधिकतम समय के बीच रैंडमली देरी करेगा
                    const innerDelay = getRandomInt(minimumInnerDelay, maxInnerDelay);

                    logWithTimestamp(`\n⏱️ Scheduling second deployment in this run.`);
                    logWithTimestamp(`   Remaining time in current 48-hour cycle for second deployment: ${formatSecondsToHMS(remainingTimeInFullCycleSeconds)}.`);
                    logWithTimestamp(`   Random delay chosen for second deployment: ${formatSecondsToHMS(innerDelay)} (min 1h, max ${formatSecondsToHMS(maxInnerDelay)}).`);

                    await countdownLive(`⏱️ Waiting before next deployment in this run`, innerDelay);
                    console.log(); // काउंटडाउन के बाद नई लाइन
                }
            }
        }
        
        // टाइट लूप से बचने के लिए न्यूनतम 1 मिनट की देरी.
        await delay(60); 
    }
}


// मुख्य निष्पादन को अब 'main' फ़ंक्शन पर स्विच करें
logWithTimestamp("🚀 Starting NFT Scheduler with 48-hour cycle logic.");
main().catch(async (error) => {
    const hostname = os.hostname();
    logWithTimestamp(`⛔ स्क्रिप्ट का मुख्य निष्पादन क्रैश हुआ: ${error}`);
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    const telegramAlert = `🔥🔥 ${hostname} - क्रिटिकल क्रैश! ${appFolderName}/${scriptName}:\n${error.message}\nनेटवर्क: ${hre.network.name}`;
    await sendTelegramMessage(telegramAlert);
    process.exit(1);
});
