import { fileURLToPath } from 'url';
import { dirname } from 'path';
import hre from "hardhat";
import fs from "fs";
import axios from "axios";
import { create } from "@web3-storage/w3up-client";
import { File } from 'formdata-node';
import path from 'path';
import readline from 'readline';
import os from 'os';

// Import Hardhat's ethers object directly
const { ethers } = hre;

// *** New: Helper function for logging with timestamp (DD-MM-YY HH:MM UTC) ***
function logWithTimestamp(message) {
    const now = new Date();
    const day = String(now.getUTCDate()).padStart(2, '0');
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const year = String(now.getUTCFullYear()).slice(-2);
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');

    console.log(`[${day}-${month}-${year} ${hours}:${minutes} UTC] ${message}`);
}

// *** New: Path to the local images folder ***
const LOCAL_IMAGES_FOLDER = './images';

// Load data from new files
import { prefixes, suffixes } from './nftNames.js';
import {
    elements,
    generateRandomDescription,
    getRandomRarity,
    getRandomGeneration,
    getRandomElement,
    getRandomPowerLevel
} from './nftAttributes.js';

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs/";
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

// *** Updated: Files in the 'data' directory ***
const DATA_DIR = './data';
const STATE_FILE = path.join(DATA_DIR, 'deploy-state-721.json');
const LOG_FILE = path.join(DATA_DIR, 'deployment-history-721.json');

// *** New: Logic to create the 'data' directory added here ***
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
    // sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} Error creating 'data' directory:\n${e.message}`); // Removed as per previous instructions
    process.exit(1);
}
// *** End of new logic ***


// Validate environment variables
if (!process.env.RECEIVER_ADDRESS) {
    logWithTimestamp("❌ Critical Error: Missing required .env variables (RECEIVER_ADDRESS)");
    process.exit(1);
}

// Also validate Giphy API Key, but now it's optional if local images are available
if (!GIPHY_API_KEY) {
    logWithTimestamp("⚠️ Warning: GIPHY_API_KEY is missing in .env file. Will fallback to local images if Giphy API is needed.");
}

// w3up client instance
let client;

// Target space DID (your desired tester space)
const TARGET_SPACE_DID = "did:key:z6MkiSTiF3f7HC8LCQ1pubP97VRhV4jf8FKGYzJV3hr6fB1i";

// 👇 Start Telegram Crash Notifier - this is now a one-time setup
process.on('uncaughtException', async (err) => {
    logWithTimestamp("🔥 CRITICAL UNCAUGHT EXCEPTION (GLOBAL):", err);

    const fileUrl = import.meta.url;
    const scriptFullPath = fileURLToPath(fileUrl);

    const scriptDirectory = path.dirname(scriptFullPath);
    const grandParentDirectory = path.dirname(scriptDirectory);
    const appFolderName = path.basename(grandParentDirectory);
    const scriptName = path.basename(scriptFullPath);
    const hostname = os.hostname();

    const formattedAppName = `${hostname}-/${appFolderName}-${scriptName}`;

    try {
        await axios.post(`https://api.telegram.org/bot7620164559:AAHq5ftIl5kUIjehdvyyrXyD0hd9QAGTY3s/sendMessage`, {
            chat_id: "1239205720",
            text: `🚨 Crash on ${formattedAppName}:\n${err.message}`
        });
    } catch (e) {
        logWithTimestamp("❌ Failed to send Telegram alert:", e.message);
    }

    process.exit(1);
});
// 👆 End of Telegram Crash Notifier

// Function to initialize and authenticate w3up client
async function initializeW3upClient() {
    logWithTimestamp("Setting up w3up client...");

    client = await create();

    logWithTimestamp("Attempting to log in w3up client...");
    try {
        const agent = await client.login(process.env.W3UP_EMAIL);
        logWithTimestamp(`w3up client logged in as: ${agent.did()}`);
    } catch (loginError) {
        logWithTimestamp(`❌ Error logging in w3up client: ${loginError.message}`);
        logWithTimestamp("Please ensure your w3up login is active via 'w3up login <email>' command.");
        process.exit(1);
    }

    try {
        await client.setCurrentSpace(TARGET_SPACE_DID);
        logWithTimestamp(`Using explicitly set w3up space: ${TARGET_SPACE_DID}`);
    } catch (error) {
        logWithTimestamp(`❌ Error setting desired w3up space (${TARGET_SPACE_DID}): ${error.message}`);
        logWithTimestamp("Attempting to use the first available space or create a new one as a fallback.");

        const spaces = await client.spaces();

        if (spaces.length === 0) {
            logWithTimestamp("No w3up space found. Creating a new one named 'my-nft-deployments'...");
            const newSpace = await client.createSpace('my-nft-deployments');
            await newSpace.save();
            await client.setCurrentSpace(newSpace.did());
            logWithTimestamp(`New w3up space created and set: ${newSpace.did()}`);
        } else {
            const firstSpace = spaces[0];
            await client.setCurrentSpace(firstSpace.did());
            logWithTimestamp(`Using existing w3up space: ${firstSpace.did()} (as desired space could not be explicitly set)`);
        }
    }

    logWithTimestamp("w3up client initialized and space set.");
}

// Random name and symbol generator
function getRandomName() {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix}${suffix}`;
}
function getRandomSymbol() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const length = Math.floor(Math.random() * 3) + 3;
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to format seconds into HHh MMm SSs
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

// This function will display a live countdown for the given totalSeconds
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

async function delay(seconds) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// *** New: saveState function (improved version from 20.js) ***
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
        // sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} Error saving state:\n${errorMessage}`); // Removed as per previous instructions
    }
}

function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE));
    } catch {
        return null;
    }
}

// *** Improved logDeployment function (improved version from 20.js) ***
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
        // sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} File read error:\n${errorMessage}`); // Removed as per previous instructions
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
        // sendTelegramMessage(`🚨 ${hostname} - ${appFolderName}/${scriptName} File write error:\n${errorMessage}`); // Removed as per previous instructions
    }
}

// --- New function: Select a random file from the local images folder ---
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

        const imageBuffer = fs.readFileSync(filePath);
        const mimeType = `image/${path.extname(randomFile).substring(1)}`;
        return new File([imageBuffer], randomFile, { type: mimeType });

    } catch (error) {
        logWithTimestamp(`❌ Error getting random local image: ${error}`);
        return null;
    }
}

async function uploadImageToWeb3Storage(tokenId) {
    let imageUrl = null;
    let imageFile = null;

    if (GIPHY_API_KEY) {
        try {
            logWithTimestamp(`\nSearching for a random GIF for token #${tokenId} with tags 'happy pixel smolverse' from Giphy...`);
            const giphySearchTag = "happy pixel smolverse";
            const giphyApiUrl = `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${giphySearchTag}`;

            const giphyResponse = await axios.get(giphyApiUrl);
            const gifUrl = giphyResponse.data.data.images.preview_gif.url;

            if (!gifUrl) {
                throw new Error(`Could not get random GIF with tag '${giphySearchTag}' from Giphy API response.`);
            }

            logWithTimestamp(`Found GIF from Giphy (Tags: '${giphySearchTag}'): ${gifUrl}`);

            const tempDir = "./temp";
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
            const tempPath = `${tempDir}/nft-image-${tokenId}.gif`;

            logWithTimestamp(`Attempting to download GIF from: ${gifUrl}`);
            const response = await axios.get(gifUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(tempPath, response.data);
            logWithTimestamp(`GIF downloaded and saved to: ${tempPath}`);

            const imageBuffer = fs.readFileSync(tempPath);
            imageFile = new File([imageBuffer], `nft-image-${tokenId}.gif`, { type: 'image/gif' });

            fs.unlinkSync(tempPath);
            logWithTimestamp(`Temporary GIF file removed: ${tempPath}`);

        } catch (giphyError) {
            logWithTimestamp(`⚠️ Error fetching/downloading GIF from Giphy: ${giphyError.message}. Attempting to use a local image.`);
            imageFile = await getRandomLocalImageFile();
            if (!imageFile) {
                throw new Error("GIPHY_API_KEY is set but Giphy failed, and no local images found.");
            }
        }
    } else {
        logWithTimestamp("⚠️ GIPHY_API_KEY is not set. Attempting to use a local image directly.");
        imageFile = await getRandomLocalImageFile();
        if (!imageFile) {
            throw new Error("GIPHY_API_KEY is not set and no local images found.");
        }
    }

    if (imageFile) {
        logWithTimestamp(`Uploading image for token #${tokenId} to web3.storage (via w3up)...`);
        try {
            const cid = await client.uploadFile(imageFile);
            imageUrl = `${IPFS_GATEWAY}${cid}`;
            logWithTimestamp(`Image uploaded to web3.storage. CID: ${cid}`);
            return imageUrl;
        } catch (uploadError) {
            logWithTimestamp("❌ Image upload to web3.storage failed:", uploadError);
            throw uploadError;
        }
    } else {
        throw new Error("No image file prepared for upload.");
    }
}

async function createNexusMetadata(tokenId, imageUrl, nftName) {
    try {
        const metadata = {
            name: nftName,
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
        // Changed JSON.stringify to remove pretty printing
        const metadataString = JSON.stringify(metadata);

        logWithTimestamp(`Uploading metadata for token #${tokenId} to web3.storage (via w3up):`);
        logWithTimestamp(metadataString); // This will now log the compact JSON.

        const metadataFile = new File([metadataString], metadataFileName, { type: 'application/json' });

        const cid = await client.uploadFile(metadataFile);
        logWithTimestamp(`Metadata uploaded to web3.storage. CID: ${cid}`);

        return `${IPFS_GATEWAY}${cid}`;
    } catch (error) {
        logWithTimestamp("❌ Metadata upload failed:", error);
        throw error;
    }
}

// Deploy function
async function deployOnce() {
    try {
        const [deployer] = await ethers.getSigners();
        const nftName = getRandomName();
        const nftSymbol = getRandomSymbol();
        const receiver = process.env.RECEIVER_ADDRESS;

        logWithTimestamp(`\n🚀 Deploying NFT: ${nftName} (${nftSymbol})`);
        const NFT = await ethers.getContractFactory("MyNFT");
        const nft = await NFT.deploy(nftName, nftSymbol, deployer.address);
        await nft.waitForDeployment();
        const contractAddress = await nft.getAddress();
        logWithTimestamp(`✅ Deployed at: ${contractAddress}`);

        // Mint count is limited to 2 to 3
        const mintCount = getRandomInt(2, 3);
        let transferredTokenIdForSummary = null;
        const tokenIds = [];

        for (let i = 0; i < mintCount; i++) {
            try {
                const tokenIdSeed = Math.floor(Math.random() * (77777 - 3 + 1)) + 3;
                logWithTimestamp(`\n📤 Uploading image for token #${tokenIdSeed}...`);
                const imageUrl = await uploadImageToWeb3Storage(tokenIdSeed);
                logWithTimestamp(`Image URL: ${imageUrl}`);

                logWithTimestamp(`\n📝 Creating metadata for token #${tokenIdSeed}...`);
                const metadataUrl = await createNexusMetadata(tokenIdSeed, imageUrl, nftName);
                logWithTimestamp(`Metadata URL: ${metadataUrl}`);

                logWithTimestamp(`Attempting to mint token and set URI for ${deployer.address} with URI: ${metadataUrl}...`);

                const tx = await nft.mintAndSetURI(deployer.address, metadataUrl);
                const receipt = await tx.wait();

                const event = receipt.logs
                    .map(log => { try { return nft.interface.parseLog(log); } catch { return null; } })
                    .find(e => e && e.name === "Transfer");

                if (!event) throw new Error("No Transfer event found in mint transaction receipt.");
                const mintedTokenId = event.args.tokenId.toString();
                tokenIds.push(mintedTokenId);

                logWithTimestamp(`🖼️ Token #${mintedTokenId} successfully minted and URI set in **a single transaction**! | Tx: ${tx.hash}`);

                const currentTokenURI = await nft.tokenURI(mintedTokenId);
                logWithTimestamp(`*** Verification: Token URI for #${mintedTokenId} after mintAndSetURI is: ${currentTokenURI} ***`);

                if (i < mintCount - 1) {
                    const waitTime = getRandomInt(5, 26);
                    await countdownLive(`⏳ Waiting before next mint`, waitTime);
                    console.log();
                }

            } catch (e) {
                logWithTimestamp(`⚠️ Mint or metadata upload failed for token ${i + 1}: ${e.message}`);
                if (e.reason) logWithTimestamp(`Reason: ${e.reason}`);
            }
        }

        // Updated the random delay for transfer
        const mainWaitTime = getRandomInt(67, 292);
        await countdownLive(`⏳ Waiting before transfer`, mainWaitTime);
        console.log();

        if (tokenIds.length > 0) {
            const randomTokenId = tokenIds[Math.floor(Math.random() * tokenIds.length)];
            let transferSuccess = false;

            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    logWithTimestamp(`Attempting to transfer token #${randomTokenId} to ${receiver} (attempt ${attempt})...`);
                    const tx = await nft.transferFrom(deployer.address, receiver, randomTokenId);
                    await tx.wait();
                    logWithTimestamp(`📤 Token #${randomTokenId} successfully transferred to ${receiver}`);
                    transferredTokenIdForSummary = randomTokenId;
                    transferSuccess = true;
                    break;
                } catch (e) {
                    logWithTimestamp(`⚠️ Transfer attempt ${attempt} failed: ${e.message}`);
                    if (attempt < 2) await delay(10);
                }
            }

            if (!transferSuccess) {
                logWithTimestamp(`❌ Transfer failed after 2 attempts`);
            }
        } else {
            logWithTimestamp("ℹ️ No tokens minted, skipping transfer");
        }

        const summary = {
            contractAddress,
            nftName,
            nftSymbol,
            deployer: deployer.address,
            receiver,
            mintedTokens: tokenIds.length,
            tokenIds,
            transferredToken: transferredTokenIdForSummary
        };

        logWithTimestamp("\n💎 Summary:");
        logWithTimestamp(JSON.stringify(summary, null, 2));
        await logDeployment(summary);
        return summary;

    } catch (e) {
        logWithTimestamp(`🚨 Deployment Error: ${e.message}`);
        throw e;
    }
}

// Function to clean and ensure temp directory
async function cleanTempDirectory() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const tempDir = path.join(__dirname, '..', 'temp');
    if (fs.existsSync(tempDir)) {
        logWithTimestamp(`Cleaning existing temp directory: ${tempDir}`);
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    logWithTimestamp(`Ensuring temp directory exists: ${tempDir}`);
    fs.mkdirSync(tempDir, { recursive: true });
}

// Main loop
async function main() {
    process.on('SIGINT', () => {
        logWithTimestamp('\n🔴 Shutdown signal received. Exiting...');
        process.exit(0);
    });

    await initializeW3upClient();
    await cleanTempDirectory();

    let state = loadState();
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
            const firstDeploymentEndTime = lastCycleStartTimestamp + (delayBeforeFirstDeploymentInCycle * 1000); // मिलीसेकंड में

            for (let i = 0; i < timesToRun; i++) {
                logWithTimestamp(`\n--- Deployment ${i + 1}/${timesToRun} ---`);
                const result = await deployOnce();
                
                // स्टेट सेव करें, अब lastCycleStartTimestamp भी शामिल है
                await saveState({ 
                    ...result, 
                    lastCycleStartTimestamp: lastCycleStartTimestamp 
                });
                
                if (i < timesToRun - 1) {
                    // दूसरे डिप्लॉयमेंट के लिए शेष समय की गणना करें
                    const nowAfterFirstDeployment = Date.now();
                    const timeElapsedInCycleAfterFirstDeployment = nowAfterFirstDeployment - lastCycleStartTimestamp; // मिलीसेकंड में

                    // 48 घंटे के कुल साइकिल में से बचा हुआ समय
                    const remainingTimeInFullCycleMs = twoDaysInMs - timeElapsedInCycleAfterFirstDeployment;
                    const remainingTimeInFullCycleSeconds = Math.floor(remainingTimeInFullCycleMs / 1000);

                    const minimumInnerDelay = 1 * 3600; // 1 घंटा

                    // दूसरे डिप्लॉयमेंट के लिए अधिकतम देरी, जो बचे हुए साइकिल समय से ज्यादा न हो
                    // साथ ही, यह सुनिश्चित करें कि अधिकतम देरी कम से कम 1 घंटे हो
                    const maxInnerDelay = Math.max(minimumInnerDelay, remainingTimeInFullCycleSeconds);
                    
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

main().catch(async (error) => {
    const hostname = os.hostname();
    logWithTimestamp(`⛔ Main script execution crashed: ${error}`);
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    // const telegramAlert = `🔥🔥 ${hostname} - CRITICAL CRASH! ${appFolderName}/${scriptName}:\n${error.message}\nNetwork: ${hre.network.name}`; // Removed as per previous instructions
    // await sendTelegramMessage(telegramAlert); // Removed as per previous instructions
    process.exit(1);
});

process.on('uncaughtException', async (err) => {
    logWithTimestamp(`🔥🔥🔥 CRITICAL UNCAUGHT EXCEPTION (GLOBAL): ${err}`);
    const scriptName = path.basename(fileURLToPath(import.meta.url));
    const appFolderName = path.basename(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    const hostname = os.hostname();
    // const errorMessage = `🚨 [GLOBAL UNCAUGHT] ${hostname} - Crashed on ${appFolderName}/${scriptName}:\n${err.message}`; // Removed as per previous instructions
    // await sendTelegramMessage(errorMessage); // Removed as per previous instructions
    process.exit(1);
});
