#!/bin/bash

sudo apt install -y expect
sudo  apt-get install unzip


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

# expect à¤¸à¥^mà¤•à¥^mà¤°à¤¿à¤ªà¥^mà¤Ÿ à¤•à¤¾ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤°à¤•à¥‡ npx hardhat init à¤šà¤²à¤¾à¤^oà¤‚
expect <<EOF
    # npx hardhat init à¤•à¤®à¤¾à¤‚à¤¡ à¤šà¤²à¤¾à¤^oà¤‚
    spawn npx hardhat init

    # 1. "What do you want to do?" à¤ªà¥^mà¤°à¥‰à¤®à¥^mà¤ªà¥^mà¤Ÿ à¤•à¤¾ à¤‡à¤‚à¤¤à¤œà¤¾à¤° à¤•à¤°à¥‡à¤‚
    expect "What do you want to do?"
    # "Create a JavaScript project" à¤•à¥‡ à¤²à¤¿à¤^o Enter à¤¦à¤¬à¤¾à¤^oà¤‚ (à¤œà¥‹ à¤¡à¤¿à¤«à¤¼à¥‰à¤²à¥^mà¤Ÿ à¤¹à¥ˆ)
    send "\r"

    # 2. "Hardhat project root:" à¤ªà¥^mà¤°à¥‰à¤®à¥^mà¤ªà¥^mà¤Ÿ à¤•à¤¾ à¤‡à¤‚à¤¤à¤œà¤¾à¤° à¤•à¤°à¥‡à¤‚
    expect "Hardhat project root:"
    # à¤¡à¤¿à¤«à¤¼à¥‰à¤²à¥^mà¤Ÿ à¤ªà¤¾à¤¥ à¤•à¥‡ à¤²à¤¿à¤^o Enter à¤¦à¤¬à¤¾à¤^oà¤‚ (à¤œà¥‹ à¤µà¤°à¥^mà¤¤à¤®à¤¾à¤¨ à¤¡à¤¾à¤¯à¤°à¥‡à¤•à¥^mà¤Ÿà¤°à¥€ à¤¹à¥ˆ)
    send "\r"

    # 3. "Do you want to add a .gitignore?" à¤ªà¥^mà¤°à¥‰à¤®à¥^mà¤ªà¥^mà¤Ÿ à¤•à¤¾ à¤‡à¤‚à¤¤à¤œà¤¾à¤° à¤•à¤°à¥‡à¤‚
    expect "Do you want to add a .gitignore? (Y/n)"
    # 'y' à¤”à¤° Enter à¤¦à¤¬à¤¾à¤^oà¤‚
    send "y\r"

    # expect à¤•à¥‹ à¤¬à¤¾à¤¹à¤° à¤¨à¤¿à¤•à¤²à¤¨à¥‡ à¤¦à¥‡à¤‚
    expect eof
EOF

echo "Hardhat project setup complete inside '$DIRECTORY_NAME'!"
echo "All default Hardhat files (including .gitignore, README.md, contracts, etc.) have been created."
echo "You can now start working on your project within this directory."

# 20.sh à¤«à¤¼à¤¾à¤‡à¤² à¤¬à¤¨à¤¾à¤^oà¤^a à¤”à¤° à¤‰à¤¸à¤®à¥‡à¤‚ à¤•à¤‚à¤Ÿà¥‡à¤‚à¤Ÿ à¤²à¤¿à¤–à¥‡à¤‚
echo '#!/bin/bash' > 20.sh
echo 'npx hardhat run scripts/20.js --network nexus' >> 20.sh
chmod +x 20.sh # à¤‡à¤¸à¥‡ à¤^oà¤•à¥^mà¤¸à¥‡à¤•à¥^mà¤¯à¥‚à¤Ÿ à¤•à¤°à¤¨à¥‡ à¤¯à¥‹à¤—à¥^mà¤¯ à¤¬à¤¨à¤¾à¤^oà¤^a

# 721.sh à¤«à¤¼à¤¾à¤‡à¤² à¤¬à¤¨à¤¾à¤^oà¤^a à¤”à¤° à¤‰à¤¸à¤®à¥‡à¤‚ à¤•à¤‚à¤Ÿà¥‡à¤‚à¤Ÿ à¤²à¤¿à¤–à¥‡à¤‚
echo '#!/bin/bash' > 721.sh
echo 'npx hardhat run scripts/721.js --network nexus' >> 721.sh
chmod +x 721.sh # à¤‡à¤¸à¥‡ à¤^oà¤•à¥^mà¤¸à¥‡à¤•à¥^mà¤¯à¥‚à¤Ÿ à¤•à¤°à¤¨à¥‡ à¤¯à¥‹à¤—à¥^mà¤¯ à¤¬à¤¨à¤¾à¤^oà¤^a

# 1155.sh à¤«à¤¼à¤¾à¤‡à¤² à¤¬à¤¨à¤¾à¤^oà¤^a à¤”à¤° à¤‰à¤¸à¤®à¥‡à¤‚ à¤•à¤‚à¤Ÿà¥‡à¤‚à¤Ÿ à¤²à¤¿à¤–à¥‡à¤‚
echo '#!/bin/bash' > 1155.sh
echo 'npx hardhat run scripts/1155.js --network nexus' >> 1155.sh
chmod +x 1155.sh # à¤‡à¤¸à¥‡ à¤^oà¤•à¥^mà¤¸à¥‡à¤•à¥^mà¤¯à¥‚à¤Ÿ à¤•à¤°à¤¨à¥‡ à¤¯à¥‹à¤—à¥^mà¤¯ à¤¬à¤¨à¤¾à¤^oà¤^a

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

#=============================================================================================#

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
