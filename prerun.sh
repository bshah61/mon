#!/bin/bash

sudo  apt-get install unzip
# Color and style settings
GREEN_BOLD='\033[1;32m'
NC='\033[0m' # Reset

header() {
  echo -e "${GREEN_BOLD}"
  echo "============================================================"
  echo "      $1"
  echo "============================================================"
  echo -e "${NC}"
  sleep 2
}

# Start of script
header "Starting installation of required tools and packages..."
header "This script will install Node.js v22, npm, yarn, git, and build-essential python3."

# 1. Update and upgrade the system
header "Updating and upgrading system packages..."
sudo apt update && sudo apt upgrade -y
if [ $? -ne 0 ]; then
    header "Error occurred during system update/upgrade. Please check."
    exit 1
fi
header "System update and upgrade completed successfully."

# 2. Install Node.js v22 and npm
header "Installing Node.js v22 and npm..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
if [ $? -ne 0 ]; then
    header "Error running Node.js setup script. Please check."
    exit 1
fi
sudo apt install -y nodejs
if [ $? -ne 0 ]; then
    header "Error installing Node.js. Please check."
    exit 1
fi
header "Node.js and npm installed successfully."
node -v
npm -v

# 3. Install Git and build-essential python3
header "Installing Git and build-essential python3..."
sudo apt install -y git build-essential python3
if [ $? -ne 0 ]; then
    header "Error installing Git or build-essential python3. Please check."
    exit 1
fi
header "Git and build-essential python3 installed successfully."
git --version

# 4. Install Yarn globally
header "Installing Yarn globally..."
sudo npm install -g yarn
if [ $? -ne 0 ]; then
    header "Error installing Yarn. Please check."
    exit 1
fi
header "Yarn installed successfully."
yarn --version

header "Installation of all required tools completed successfully!"




sudo apt install -y expect



# Prompt user for directory name
echo "Please enter the name of the directory you want to create for your project:"
read DIRECTORY_NAME

# Check if user provided a name
if [ -z "$DIRECTORY_NAME" ]; then
    echo "No directory name entered. Exiting."
    exit 1
fi

# Create the directory
mkdir "$DIRECTORY_NAME"

# Check if the directory was created successfully
if [ $? -eq 0 ]; then
    echo "Directory '$DIRECTORY_NAME' created successfully."
    echo "Changing into directory '$DIRECTORY_NAME'..."
    cd "$DIRECTORY_NAME"
    echo "You are now in: $(pwd)"
else
    echo "There was a problem creating directory '$DIRECTORY_NAME'."
    exit 1
fi

echo "Initializing npm project..."
npm init -y

echo "Installing Hardhat and related dependencies (this might take a few minutes)..."
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv faker

echo "Initializing Hardhat project with all default files (using expect for automation)..."

# expect स्क्रिप्ट का उपयोग करके npx hardhat init चलाएं
expect <<EOF
    # npx hardhat init कमांड चलाएं
    spawn npx hardhat init

    # 1. "What do you want to do?" प्रॉम्प्ट का इंतजार करें
    expect "What do you want to do?"
    # "Create a JavaScript project" के लिए Enter दबाएं (जो डिफ़ॉल्ट है)
    send "\r"

    # 2. "Hardhat project root:" प्रॉम्प्ट का इंतजार करें
    expect "Hardhat project root:"
    # डिफ़ॉल्ट पाथ के लिए Enter दबाएं (जो वर्तमान डायरेक्टरी है)
    send "\r"

    # 3. "Do you want to add a .gitignore?" प्रॉम्प्ट का इंतजार करें
    expect "Do you want to add a .gitignore? (Y/n)"
    # 'y' और Enter दबाएं
    send "y\r"

    # expect को बाहर निकलने दें
    expect eof
EOF

echo "Hardhat project setup complete inside '$DIRECTORY_NAME'!"
echo "All default Hardhat files (including .gitignore, README.md, contracts, etc.) have been created."
echo "You can now start working on your project within this directory."

# 20.sh फ़ाइल बनाएँ और उसमें कंटेंट लिखें
echo '#!/bin/bash' > 20.sh
echo 'npx hardhat run scripts/20.js --network nexus' >> 20.sh
chmod +x 20.sh # इसे एक्सेक्यूट करने योग्य बनाएँ

# 721.sh फ़ाइल बनाएँ और उसमें कंटेंट लिखें
echo '#!/bin/bash' > 721.sh
echo 'npx hardhat run scripts/721.js --network nexus' >> 721.sh
chmod +x 721.sh # इसे एक्सेक्यूट करने योग्य बनाएँ

# 1155.sh फ़ाइल बनाएँ और उसमें कंटेंट लिखें
echo '#!/bin/bash' > 1155.sh
echo 'npx hardhat run scripts/1155.js --network nexus' >> 1155.sh
chmod +x 1155.sh # इसे एक्सेक्यूट करने योग्य बनाएँ

# 2. Create screen.sh file with session creation logic

echo "Creating screen.sh..."

# Add shebang and comments
echo '#!/bin/bash' > screen.sh
echo '# Get the name of the current working directory' >> screen.sh
echo 'current_dir_name=$(basename "$(pwd)")' >> screen.sh
echo '' >> screen.sh
echo 'echo "Creating three separate screen sessions..."' >> screen.sh
echo 'echo "Current directory name: $current_dir_name"' >> screen.sh
echo '' >> screen.sh
echo '# ---------------------------------------------------' >> screen.sh
echo '# First Session: For 20.sh' >> screen.sh
echo 'session_name_1="${current_dir_name}-20"' >> screen.sh
echo 'script_to_run_1="./20.sh"' >> screen.sh
echo '' >> screen.sh
echo 'echo ""' >> screen.sh
echo 'echo "--- Session 1 ---"' >> screen.sh
echo 'echo "Name: $session_name_1"' >> screen.sh
echo 'echo "Running: $script_to_run_1"' >> screen.sh
echo 'screen -d -m -S "$session_name_1" bash -c "$script_to_run_1; exec bash"' >> screen.sh
echo '' >> screen.sh
echo '# ---------------------------------------------------' >> screen.sh
echo '# Second Session: For 721.sh' >> screen.sh
echo 'session_name_2="${current_dir_name}-721"' >> screen.sh
echo 'script_to_run_2="./721.sh"' >> screen.sh
echo '' >> screen.sh
echo 'echo ""' >> screen.sh
echo 'echo "--- Session 2 ---"' >> screen.sh
echo 'echo "Name: $session_name_2"' >> screen.sh
echo 'echo "Running: $script_to_run_2"' >> screen.sh
echo 'screen -d -m -S "$session_name_2" bash -c "$script_to_run_2; exec bash"' >> screen.sh
echo '' >> screen.sh
echo '# ---------------------------------------------------' >> screen.sh
echo '# Third Session: For 1155.sh' >> screen.sh
echo 'session_name_3="${current_dir_name}-1155"' >> screen.sh
echo 'script_to_run_3="./1155.sh"' >> screen.sh
echo '' >> screen.sh
echo 'echo ""' >> screen.sh
echo 'echo "--- Session 3 ---"' >> screen.sh
echo 'echo "Name: $session_name_3"' >> screen.sh
echo 'echo "Running: $script_to_run_3"' >> screen.sh
echo 'screen -d -m -S "$session_name_3" bash -c "$script_to_run_3; exec bash"' >> screen.sh
echo '' >> screen.sh
echo 'echo ""' >> screen.sh
echo 'echo "All screen sessions have been started in the background."' >> screen.sh
echo 'echo "To view them, run: screen -ls"' >> screen.sh
echo 'echo "To attach to a session, for example: screen -r $session_name_1"' >> screen.sh
echo 'echo "(or $session_name_2, $session_name_3)"' >> screen.sh

chmod +x screen.sh # Make screen.sh executable
echo "screen.sh successfully created and made executable."

echo "Creating kill.sh..."

# Add shebang and content for kill.sh with corrected quoting
echo '#!/bin/bash' > kill.sh
echo '' >> kill.sh
echo 'echo "Stopping all related screen sessions..."' >> kill.sh
echo '' >> kill.sh
echo '# Get the name of the current working directory' >> kill.sh
echo 'current_dir_name=$(basename "$(pwd)")' >> kill.sh
echo '' >> kill.sh
echo '# Define session names' >> kill.sh
echo 'session_name_1="${current_dir_name}-20"' >> kill.sh
echo 'session_name_2="${current_dir_name}-721"' >> kill.sh
echo 'session_name_3="${current_dir_name}-1155"' >> kill.sh
echo '' >> kill.sh
echo '# Function to kill a screen session if it exists' >> kill.sh
echo 'kill_session_if_exists() {' >> kill.sh
echo '    local session_name=$1' >> kill.sh
echo '    echo "Checking for session: $session_name"' >> kill.sh
echo '    if screen -ls | grep -q "$session_name"; then' >> kill.sh
echo '        echo "Found session '\''$session_name'\''. Attempting to kill..."' >> kill.sh
echo '        screen -X -S "$session_name" quit' >> kill.sh
echo '        sleep 1 # Give a moment for the session to terminate' >> kill.sh
echo '        if ! screen -ls | grep -q "$session_name"; then' >> kill.sh
echo '            echo "Session '\''$session_name'\'' successfully terminated."' >> kill.sh
echo '        else' >> kill.sh
echo '            echo "Failed to terminate session '\''$session_name'\''. Verification failed."' >> kill.sh
echo '        fi' >> kill.sh
echo '    else' >> kill.sh
echo '        echo "Session '\''$session_name'\'' not found or already terminated."' >> kill.sh
echo '    fi' >> kill.sh
echo '}' >> kill.sh
echo '' >> kill.sh
echo '# Call the function for each session' >> kill.sh
echo 'kill_session_if_exists "$session_name_1"' >> kill.sh
echo 'kill_session_if_exists "$session_name_2"' >> kill.sh
echo 'kill_session_if_exists "$session_name_3"' >> kill.sh
echo '' >> kill.sh
echo 'echo "Attempted to stop all specified screen sessions."' >> kill.sh
echo 'echo "You can run '\''screen -ls'\'' to confirm."' >> kill.sh

chmod +x kill.sh # Make kill.sh executable
echo "kill.sh successfully created and made executable."

echo "You can now run ./kill.sh to stop your screen sessions."

echo ".sh files has been created"

rm -rf contracts

rm -rf package-lock.json  package.json

rm -rf hardhat.config.js

wget https://github.com/bshah61/mon/raw/main/files.zip

unzip files.zip

mkdir data

npm install

npm install -g @web3-storage/w3cli

#==================================================================================#

#!/bin/bash

echo "Creating humc.sh, which will create hum.sh."

# Content for humc.sh
cat << 'EOF_HUMC_SCRIPT' > humc.sh
#!/bin/bash

echo "Creating hum.sh file..."

# Use here-document to write the content of hum.sh directly to the file
cat << 'EOF_HUM_SH' > hum.sh
#!/bin/bash

# Deleting existing hardhat.config.cjs...
echo "Deleting existing hardhat.config.cjs..."
rm -rf hardhat.config.cjs

# Creating hardhat.config.cjs file...
echo "Creating hardhat.config.cjs file..."
cat << 'EOF_CJS' > hardhat.config.cjs
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    nexus: {
      url: "https://humanity-testnet.g.alchemy.com/public",
      chainId: 7080969,
      accounts: [process.env.PRIVATE_KEY],
      gas: "auto",
      gasPrice: "auto",
      timeout: 40000
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 100000
  }
};
EOF_CJS

echo "hardhat.config.cjs created successfully."
EOF_HUM_SH

# Make hum.sh executable
chmod +x hum.sh

echo "hum.sh script created and made executable successfully."
echo "Now you can run it to create/update hardhat.config.cjs: ./hum.sh"

EOF_HUMC_SCRIPT

# Make humc.sh executable
chmod +x humc.sh

echo "humc.sh script created and made executable successfully."
echo "First, run it: ./humc.sh"
echo "Then, you can run ./hum.sh to create hardhat.config.cjs."

#===========================================================================#
#!/bin/bash

echo "Creating genc.sh, which will create gen.sh."

# Content for genc.sh itself
cat << 'EOF_GEN_CREATOR_SCRIPT' > genc.sh
#!/bin/bash

echo "Creating gen.sh file..."

# Use here-document to write the content of gen.sh directly to the file
cat << 'EOF_GEN_SH' > gen.sh
#!/bin/bash

# Deleting existing hardhat.config.cjs...
echo "Deleting existing hardhat.config.cjs..."
rm -rf hardhat.config.cjs

# Creating hardhat.config.cjs file...
echo "Creating hardhat.config.cjs file..."
cat << 'EOF_CJS' > hardhat.config.cjs
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    'nexus': {
      url: 'https://gensyn-testnet.g.alchemy.com/public',
      chainId: 685685,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      // Blockscout doesn't require a real API key
      'gensyn': "any-non-empty-string"
    },
    customChains: [
      {
        network: "nexus",
        chainId: 685685,
        urls: {
          apiURL: "https://gensyn-testnet.explorer.alchemy.com/api",
          browserURL: "https://gensyn-testnet.explorer.alchemy.com"
        }
      }
    ]
  },
  sourcify: {
    enabled: false // Disable if using Blockscout
  }
};
EOF_CJS

echo "hardhat.config.cjs created successfully."
EOF_GEN_SH

# Make gen.sh executable
chmod +x gen.sh

echo "gen.sh script created and made executable successfully."
echo "Now you can run it to create/update hardhat.config.cjs: ./gen.sh"

EOF_GEN_CREATOR_SCRIPT

# Make genc.sh executable
chmod +x genc.sh

echo "genc.sh script created and made executable successfully."
echo "First, run it: ./genc.sh"
echo "Then, you can run ./gen.sh to create hardhat.config.cjs."
