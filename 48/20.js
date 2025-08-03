import hre from "hardhat";
import fs from "fs";
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const { ethers } = hre;

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = "7620164559:AAHq5ftIl5kUIjehdvyyrXyD0hd9QAGTY3s";
const TELEGRAM_CHAT_ID = "1239205720";

// --- Helper Functions ---
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to send Telegram messages
async function sendTelegramMessage(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        });
        logWithTimestamp("Telegram message sent successfully!");
    } catch (e) {
        logWithTimestamp(`❌ Failed to send Telegram message: ${e.message}`);
        if (e.response) {
            console.error("Telegram API Error Details:", e.response.data);
        }
    }
}

// Helper function for logging with timestamp (DD-MM-YY HH:MM UTC)
function logWithTimestamp(message) {
    const now = new Date();
    const day = String(now.getUTCDate()).padStart(2, '0');
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const year = String(now.getUTCFullYear()).slice(-2);
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');

    console.log(`[${day}-${month}-${year} ${hours}:${minutes} UTC] ${message}`);
}


// Unique Prefixes and Suffixes
const prefixes = Array.from(new Set([
  "Sol", "Cryp", "Quant", "Neur", "Omni", "Axi", "Bit", "Chain", "Volt", "Meta",
  "Terra", "Nano", "Astro", "Zen", "Xeno", "Eco", "Neo", "Nova", "Ether", "Tron",
  "Strata", "Vort", "Flux", "Glac", "Aur", "Ign", "Therm", "Vortex", "Hyper", "Pulse",
  "Spark", "Grid", "Lumi", "Edge", "Proof", "Trust", "Safe", "Block", "Node", "Data",
  "Mint", "Link", "Hash", "Peer", "Quantum", "Stellar", "Galaxy", "Solar",
  "Wave", "Nexus", "Sigma", "Lambda", "Chrono", "Fractal", "Helix", "Orbit",
  "Byte", "Peak", "Tera", "Sky", "Radiant", "Swift", "Vertex", "Luna", "Crescent",
  "Orion", "Nebula", "Dark", "Light", "Phantom", "Fract", "Helio", "Crypt",
  "Signal", "Core", "Prism", "Pixel", "Fission", "Fusion", "Radix", "Xir",
  "Tranz", "Glimmer", "Blox", "Alpha", "Gamma", "Beta", "Epsilon", "Theta",
  "Omega", "Delta", "Horizon", "Frost", "Ember", "Ignite", "Sparc", "Solis",
  "Nimbus", "Eclipse", "Zenith", "Apex", "Arctic", "Infini", "Solstice", "Aura",
  "Solarix", "Infinix", "MetaCore", "Astral", "Astroverse", "Vulcan", "Reactor",
  "Forge", "Fluxon", "Aero", "Strato", "Enigma", "Fluxion", "Cryptic", "Viper",
  "Voltis", "Circuit", "Clarity", "Lightwave", "Solace", "Zeta", "Titan",
  "Gladius", "Spherix", "Element", "Tornado", "Thunder", "Apollo", "ApolloX",
  "Ion", "Cyclone", "Meteor", "Orbital", "Matrix", "Solara", "Neutron", "Kyron",
  "Xyrus", "Kyros", "Dyna", "Raptor", "Chronos", "Ignis", "Vega", "Nexis",
  "Zephyr", "Fluxis", "Virtus", "Orbitron", "PulseX", "Kilo", "Colossus",
  "Antaris", "Ryze", "NebulaX", "Radon", "Photon", "Krypton", "Glactic",
  "Borealis", "Clyra", "Apexium", "Terraflux", "Starforge", "Nebulon", "Nexusum",
  "Ionix", "Andromeda", "Xerion", "Lucid", "Vectra", "Lithos", "Exodus", "Orionix",
  "Galvan", "Titanium", "Thrya", "Arcadia", "Cryption", "Bitcore", "Chainverse",
  "Nodeflow", "Metanix", "Neurobyte", "Voltix", "Fluxgen", "Pulsex", "Coredex",
  "Quantos", "Xenolock", "Xylobase", "Omninet", "Nanotron", "Synthium", "Algolytics",
  "Techscape", "Gridlink", "Hashdata", "Mintlabs", "Sigmax", "Kryptonix", "Stellarix",
  "Orbloc", "Cybercore", "Hyperdex", "Frostbyte", "Radonix", "Neurogen", "Cyberlink",
  "Bitshift", "Cryptix", "Chronotix", "Stellaris", "Vortexion", "Fluxor", "Soltech",
  "Metaphase", "Lunatrix", "Voltrex", "Cryptonix", "Algovate", "Radionix", "Blixel",
  "Bitlith", "Solara", "Helixic", "Ionium", "Xeltron", "Hexalux", "Omnilux", "Quantify",
  "Solosys", "Optima", "Clytra", "Tritonix", "Neurobit", "Quantumly", "Metaglow",
  "Netra", "Solora", "Frax", "Lightcore", "Fluxter", "Orbitron", "Zenithon", "Spheron",
  "Nexbyte", "Stronix", "Stratex", "Neurify", "Flexion", "Solitus", "Glacium", "Voltrix",
  "Klyra", "Crybot", "Maxtra", "Zenomic", "Optra", "Xerith", "Vantix", "Zyonix"
]));

const suffixes = Array.from(new Set([
  "dex", "um", "ix", "ora", "is", "io", "ex", "on", "iq", "us", "byte", "link", "net",
  "coin", "pay", "flow", "cash", "swap", "chain", "vault", "base", "hub", "pad", "zone",
  "pool", "dao", "core", "labs", "world", "token", "market", "trade", "fund", "bank",
  "unit", "stake", "mint", "drop", "port", "bits", "tube", "store", "mine", "gas",
  "id", "up", "scan", "cap", "plug", "node", "edge", "ops", "block", "chip", "book",
  "shift", "ride", "layer", "mat", "line", "cart", "bid", "shot", "press", "cast",
  "call", "tribe", "squad", "circle", "union", "spark", "pulse", "glow", "nest",
  "loop", "field", "club", "gate", "fit", "guard", "room", "place", "group", "cloud",
  "mesh", "sphere", "box", "safe", "air", "camp", "trail", "bin", "step", "boost",
  "storm", "path", "hold", "mark", "light", "clip", "play", "file", "warp", "secure",
  "grid", "beam", "track", "page", "system"
]));

// Random token name generator
function getRandomTokenName() {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return prefix + suffix;
}

// Generate symbol (3-5 letter, only uppercase letters)
function generateTokenSymbol(prefix, suffix) {
    const combined = (prefix + suffix).replace(/[^a-zA-Z]/g, "").toUpperCase();
    const length = Math.floor(Math.random() * 3) + 3; // 3,4,5

    let symbol = "";
    const usedIndices = new Set();

    while (symbol.length < length && usedIndices.size < combined.length) {
        const i = Math.floor(Math.random() * combined.length);
        if (!usedIndices.has(i)) {
            symbol += combined[i];
            usedIndices.add(i);
        }
    }
    return symbol;
}

// State management files will now be in the 'data' directory
const DATA_DIR = './data';
const STATE_FILE = path.join(DATA_DIR, 'deploy-state-20.json');
const LOG_FILE = path.join(DATA_DIR, 'deployment-history-20.json');

// *** NEW: Logic to create 'data' directory added here ***
try {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        logWithTimestamp(`✅ 'data' directory created: ${DATA_DIR}`);
    } else {
        logWithTimestamp(`ℹ️ 'data' directory already exists: ${DATA_DIR}`);
    }
} catch (e) {
    logWithTimestamp(`❌ Error creating 'data' directory: ${e.message}`);
    const hostname = os.hostname();
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    sendTelegramMessage(`🚨 ${hostname} - Error creating 'data' directory in ${appFolderName}/${scriptName}:\n${e.message}`);
    process.exit(1);
}
// *** End of New Logic ***


// Live countdown function
async function countdownLive(message, totalSeconds) {
    let remainingSeconds = totalSeconds;

    return new Promise(resolve => {
        if (remainingSeconds < 0) remainingSeconds = 0;

        process.stdout.write(`\r${message} ${formatSecondsToHMS(remainingSeconds)}    `);

        if (remainingSeconds <= 0) {
            process.stdout.write('\n');
            return resolve();
        }

        remainingSeconds--;

        const interval = setInterval(() => {
            process.stdout.write(`\r${message} ${formatSecondsToHMS(remainingSeconds)}    `);

            if (remainingSeconds <= 0) {
                clearInterval(interval);
                process.stdout.write('\n');
                resolve();
            }
            remainingSeconds--;
        }, 1000);
    });
}

// Helper function to convert seconds to HHh MMm SSs format
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


// Main deployment function
async function deployRandomToken() {
    const [deployer] = await ethers.getSigners();

    const tokenName = getRandomTokenName();
    const tokenSymbol = generateTokenSymbol(tokenName.slice(0, 4), tokenName.slice(4));
    const totalSupply = Math.floor(Math.random() * 100000000) + 1000000;

    let contractAddress = null;
    let transferSuccess = false;
    let errorMessage = null;

    try {
        const Token = await ethers.getContractFactory("MyToken");
        const token = await Token.deploy(
            tokenName,
            tokenSymbol,
            ethers.parseUnits(totalSupply.toString(), 18),
            deployer.address
        );

        await token.waitForDeployment();
        contractAddress = await token.getAddress();

        logWithTimestamp(`✅ ${tokenName} (${tokenSymbol}) deployed at ${contractAddress}`);
        logWithTimestamp(`    Total Supply: ${totalSupply.toLocaleString()} ${tokenSymbol}`);

        // *** यहाँ बदलाव है: 60, 300 को 67, 292 से बदला गया ***
        const delaySeconds = getRandomDelay(67, 292);
        await countdownLive("⏳ Waiting before transfer:", delaySeconds);

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const transferPercent = (Math.random() * 0.1) + 0.01;
                const transferAmount = Math.floor(totalSupply * transferPercent);

                const tx = await token.transfer(
                    process.env.RECEIVER_ADDRESS,
                    ethers.parseUnits(transferAmount.toString(), 18)
                );
                await tx.wait();

                logWithTimestamp(`📤 Transferred ${transferAmount.toLocaleString()} ${tokenSymbol} (${(transferPercent * 100).toFixed(2)}%)`);
                transferSuccess = true;
                break;
            } catch (err) {
                logWithTimestamp(`⚠️ Transfer attempt ${attempt} failed: ${err.message}`);
                if (attempt < 2) await delay(10);
                errorMessage = `Transfer failed: ${err.message}`;
            }
        }
    } catch (err) {
        logWithTimestamp(`❌ Deployment failed: ${err.message}`);
        errorMessage = `Deployment failed: ${err.message}`;
    }

    if (errorMessage) {
        const scriptName = path.basename(fileURLToPath(import.meta.url));
        const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
        const hostname = os.hostname();
        const telegramAlert = `🚨 ${hostname} - Error in ${appFolderName}/${scriptName}:\n${errorMessage}\nNetwork: ${hre.network.name}`;
        await sendTelegramMessage(telegramAlert);
    }

    return {
        contractAddress,
        tokenName,
        tokenSymbol,
        totalSupply,
        transferSuccess,
        errorMessage
    };
}

// Corrected logDeployment function
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
                    logWithTimestamp(`⚠️ Data in ${LOG_FILE} is not an array. Resetting it.`);
                }
            }
        }
    } catch (e) {
        const errorMessage = `❌ Error reading or parsing ${LOG_FILE}: ${e.message}`;
        logWithTimestamp(errorMessage);
        logWithTimestamp(`⚠️ Resetting ${LOG_FILE}.`);
        history = [];
        await sendTelegramMessage(`🚨 ${hostname} - File read error in ${appFolderName}/${scriptName}:\n${errorMessage}`);
    }
    history.push({
        timestamp: new Date().toISOString(),
        ...details
    });
    try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(history, null, 2));
    } catch (e) {
        const errorMessage = `❌ Error writing to ${LOG_FILE}: ${e.message}`;
        logWithTimestamp(errorMessage);
        await sendTelegramMessage(`🚨 ${hostname} - File write error in ${appFolderName}/${scriptName}:\n${errorMessage}`);
    }
}

// saveState function
async function saveState(stateData) {
    const hostname = os.hostname();
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2));
        logWithTimestamp(`✅ State saved to ${STATE_FILE}`);
    } catch (e) {
        const errorMessage = `❌ Error writing state to ${STATE_FILE}: ${e.message}`;
        logWithTimestamp(errorMessage);
        await sendTelegramMessage(`🚨 ${hostname} - Error saving state in ${appFolderName}/${scriptName}:\n${errorMessage}`);
    }
}

// loadState function
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE));
  } catch {
    return null;
  }
}

// Main execution loop
async function main() {
    const hostname = os.hostname();

    if (!process.env.RECEIVER_ADDRESS) {
        const missingEnvMessage = "❌ RECEIVER_ADDRESS not found in .env!";
        logWithTimestamp(missingEnvMessage);
        await sendTelegramMessage(`🚨 ${hostname} - Critical Error: ${missingEnvMessage}`);
        process.exit(1);
    }

    process.on('SIGINT', () => {
        logWithTimestamp('\n🔴 Graceful shutdown initiated. Exiting...');
        process.exit(0);
    });

    let state = loadState();
    let lastCycleStartTimestamp = state && state.lastCycleStartTimestamp ? state.lastCycleStartTimestamp : 0;

    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 48 hours in milliseconds

    while (true) {
        const now = Date.now();
        let shouldStartNewCycle = false;
        let delayBeforeFirstDeploymentInCycle = 0;

        if (lastCycleStartTimestamp === 0) {
            logWithTimestamp("\n🚀 Initial run or no previous cycle state found. Starting first deployment cycle immediately.");
            delayBeforeFirstDeploymentInCycle = getRandomDelay(1 * 3600, 24 * 3600); // 1 to 24 hours
            lastCycleStartTimestamp = now;
            shouldStartNewCycle = true;
        } else {
            const timeElapsedSinceLastCycleStart = now - lastCycleStartTimestamp;
            if (timeElapsedSinceLastCycleStart >= twoDaysInMs) {
                logWithTimestamp(`\n📅 2 days or more have passed since the last cycle started. Scheduling a new deployment cycle.`);
                delayBeforeFirstDeploymentInCycle = getRandomDelay(1 * 3600, 24 * 3600); // 1 to 24 hours
                lastCycleStartTimestamp = now;
                shouldStartNewCycle = true;
            } else {
                const remainingTimeMsInCycle = twoDaysInMs - timeElapsedSinceLastCycleStart;
                const remainingSecondsInCycle = Math.ceil(remainingTimeMsInCycle / 1000);
                logWithTimestamp(`\nℹ️ Waiting for ${formatSecondsToHMS(remainingSecondsInCycle)} for the next deployment cycle to start.`);
                await countdownLive(`⏳ Waiting for the start of the next 2-day cycle`, remainingSecondsInCycle);
                logWithTimestamp(""); // Newline after countdown

                lastCycleStartTimestamp = Date.now(); // Update after waiting, for the *actual* start of the new cycle
                shouldStartNewCycle = true;
                delayBeforeFirstDeploymentInCycle = getRandomDelay(1 * 3600, 24 * 3600);
            }
        }

        if (shouldStartNewCycle) {
            await countdownLive(`⏱️ Random delay before the first deployment in this cycle`, delayBeforeFirstDeploymentInCycle);
            logWithTimestamp(""); // Newline after countdown

            const timesToRun = getRandomDelay(1, 2); // 1 or 2 deployments in this cycle
            for (let i = 0; i < timesToRun; i++) {
                logWithTimestamp(`\n--- Deployment ${i + 1}/${timesToRun} ---`);
                try {
                    const result = await deployRandomToken();
                    await saveState({
                        ...result,
                        lastCycleStartTimestamp: lastCycleStartTimestamp
                    });
                } catch (error) {
                    logWithTimestamp(`❌ Deployment ${i + 1}/${timesToRun} failed: ${error.message}`);
                    await saveState({ lastCycleStartTimestamp: lastCycleStartTimestamp, lastError: error.message });
                }

                if (i < timesToRun - 1) { // If there's a second deployment in this cycle
                    const nowAfterFirstDeployment = Date.now();
                    const timeElapsedInCycleAfterFirstDeployment = nowAfterFirstDeployment - lastCycleStartTimestamp; // Milliseconds

                    // Remaining time in the full 48-hour cycle for the second deployment to fit into
                    const remainingTimeInFullCycleMs = twoDaysInMs - timeElapsedInCycleAfterFirstDeployment;
                    const remainingTimeInFullCycleSeconds = Math.floor(remainingTimeInFullCycleMs / 1000);

                    const minimumInnerDelay = 1 * 3600; // 1 hour
                    
                    // Max delay for the second deployment: remaining time in cycle, but not more than 24 hours (from the original concept)
                    // And ensure it's at least the minimumInnerDelay
                    const maxInnerDelay = Math.min(24 * 3600, Math.max(minimumInnerDelay, remainingTimeInFullCycleSeconds));

                    // The actual random delay for the second deployment
                    const innerDelay = getRandomDelay(minimumInnerDelay, maxInnerDelay);

                    logWithTimestamp(`\n⏱️ Scheduling second deployment in this run.`);
                    logWithTimestamp(`   Remaining time in current 48-hour cycle for second deployment: ${formatSecondsToHMS(remainingTimeInFullCycleSeconds)}.`);
                    logWithTimestamp(`   Random delay chosen for second deployment: ${formatSecondsToHMS(innerDelay)} (min 1h, max ${formatSecondsToHMS(maxInnerDelay)}).`);

                    await countdownLive(`⏱️ Waiting before next deployment in this run`, innerDelay);
                    logWithTimestamp(""); // Newline after countdown
                }
            }
        }
        
        // This minimum delay is always good to prevent tight loops, even if the above logic is flawed or too fast
        await delay(60); // Minimum 1 minute delay
    }
}

// Helper functions (defined outside main for scope, or they can be moved inside if preferred)
function delay(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Main execution
logWithTimestamp("🚀 Starting Token Scheduler with 48-hour cycle logic.");
main().catch(async (error) => {
    const hostname = os.hostname();
    logWithTimestamp(`⛔ Main script execution crashed: ${error}`);
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    const telegramAlert = `🔥🔥 ${hostname} - Critical Crash! ${appFolderName}/${scriptName}:\n${error.message}\nNetwork: ${hre.network.name}`;
    await sendTelegramMessage(telegramAlert);
    process.exit(1);
});

process.on('uncaughtException', async (err) => {
    logWithTimestamp(`🔥🔥🔥 CRITICAL UNCAUGHT EXCEPTION (GLOBAL): ${err}`);
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    const hostname = os.hostname();
    const errorMessage = `🚨 [GLOBAL UNCAUGHT] ${hostname} - Crashed on ${appFolderName}/${scriptName}:\n${err.message}`;
    await sendTelegramMessage(errorMessage);
    process.exit(1);
});
