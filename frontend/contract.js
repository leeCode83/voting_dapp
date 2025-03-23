/**
 * Contract configuration
 * This object holds the address and ABI of the smart contract
 */
const contractConfig = {
    address: '0x4151c7cb50f42de2f297cc687f3ded579f05b2f5', // Contract address to be filled
    abi: [
        // Event functions
        "function getAllEvents() public view returns (tuple(uint256 eventId, string eventName, address admin, bool isActive, uint256 endTime)[])",
        "function proposeEvent(string memory _eventName, uint _durationInDays) public",
        "function addVoter(uint eventId, address _voterAddress, string memory _username) public",
        "function addCandidate(uint eventId, string memory _candidateName) public",
        "function vote(uint eventId, uint candidateIndex) public",
        "function closeEvent(uint eventId) public",
        "function getCandidates(uint eventId) public view returns (string[] memory names, uint[] memory voteCounts)",
        "function getVoters(uint eventId) public view returns (address[] memory, string[] memory)",
        
        // Events
        "event VoterAdded(uint eventId, address voterAddress, string username)",
        "event EventProposed(uint eventId, string eventName, address proposer)",
        "event EventClosed(uint eventId, string winner, uint voteCount)",
        "event CandidateAdded(uint eventId, string candidateName)",
        "event Voted(uint eventId, address voter, uint candidateIndex)"
    ]
};

/**
 * ContractManager class handles all interactions with the VotingSystem smart contract.
 * This class serves as a bridge between our frontend and the blockchain.
 */
class ContractManager {
    /**
     * Constructor initializes the contract address, ABI, and other properties
     */
    constructor() {
        this.contractAddress = contractConfig.address;
        this.contractABI = contractConfig.abi;
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
    }

    /**
     * Connects to MetaMask wallet and initializes the contract instance
     * This is required before any interaction with the smart contract
     * @returns {Promise<string>} Connected wallet address
     */
    async connect() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed!');
            }

            // Check if we're on Sepolia network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0xaa36a7') { // Sepolia chainId
                try {
                    // Switch to Sepolia
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0xaa36a7' }],
                    });
                } catch (switchError) {
                    // If Sepolia is not added to MetaMask, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0xaa36a7',
                                chainName: 'Sepolia',
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18
                                },
                                rpcUrls: ['https://sepolia.infura.io/v3/'],
                                blockExplorerUrls: ['https://sepolia.etherscan.io']
                            }]
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            // Request account access from MetaMask
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create Web3Provider using MetaMask's provider
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            // Get the signer (wallet) to sign transactions
            this.signer = this.provider.getSigner();
            // Create contract instance with signer to allow write operations
            this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
            // Store user's address for future reference
            this.userAddress = await this.signer.getAddress();
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', () => {
                window.location.reload();
            });

            // Listen for chain changes
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            return this.userAddress;
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }

    /**
     * Gets all events from the smart contract
     * Calls the getAllEvents() view function in the contract
     * @returns {Promise<Array>} Array of event objects
     */
    async getAllEvents() {
        try {
            const events = await this.contract.getAllEvents();
            return events.map(event => ({
                eventId: event.eventId.toString(),
                eventName: event.eventName,
                admin: event.admin,
                isActive: event.isActive,
                endTime: new Date(event.endTime.toNumber() * 1000)
            }));
        } catch (error) {
            console.error('Error getting events:', error);
            throw error;
        }
    }

    /**
     * Proposes a new event
     * Calls the proposeEvent() function which requires a transaction
     * @param {string} eventName - Name of the event
     * @param {number} durationInDays - Duration of the event in days
     * @returns {Promise<string>} Transaction hash
     */
    async proposeEvent(eventName, durationInDays) {
        try {
            const tx = await this.contract.proposeEvent(eventName, durationInDays);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error proposing event:', error);
            throw error;
        }
    }

    /**
     * Adds a new voter to an event
     * Calls the addVoter() function which requires a transaction
     * @param {string} eventId - ID of the event
     * @param {string} voterAddress - Ethereum address of the voter
     * @param {string} username - Name of the voter
     * @returns {Promise<string>} Transaction hash
     */
    async addVoter(eventId, voterAddress, username) {
        try {
            const tx = await this.contract.addVoter(eventId, voterAddress, username);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error adding voter:', error);
            throw error;
        }
    }

    /**
     * Adds a new candidate to an event
     * Calls the addCandidate() function which requires a transaction
     * @param {string} eventId - ID of the event
     * @param {string} candidateName - Name of the candidate
     * @returns {Promise<string>} Transaction hash
     */
    async addCandidate(eventId, candidateName) {
        try {
            const tx = await this.contract.addCandidate(eventId, candidateName);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error adding candidate:', error);
            throw error;
        }
    }

    /**
     * Casts a vote for a candidate in an event
     * Calls the vote() function which requires a transaction
     * @param {string} eventId - ID of the event
     * @param {number} candidateIndex - Index of the candidate in the candidates array
     * @returns {Promise<string>} Transaction hash
     */
    async vote(eventId, candidateIndex) {
        try {
            const tx = await this.contract.vote(eventId, candidateIndex);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error voting:', error);
            throw error;
        }
    }

    /**
     * Closes an event, preventing further votes
     * Calls the closeEvent() function which requires a transaction
     * @param {string} eventId - ID of the event
     * @returns {Promise<string>} Transaction hash
     */
    async closeEvent(eventId) {
        try {
            const tx = await this.contract.closeEvent(eventId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error closing event:', error);
            throw error;
        }
    }

    /**
     * Gets all candidates for a specific event
     * Calls the getCandidates() view function in the contract
     * @param {string} eventId - ID of the event
     * @returns {Promise<Array>} Array of candidate objects
     */
    async getCandidates(eventId) {
        try {
            const [names, voteCounts] = await this.contract.getCandidates(eventId);
            return names.map((name, index) => ({
                name,
                voteCount: voteCounts[index].toString()
            }));
        } catch (error) {
            console.error('Error getting candidates:', error);
            throw error;
        }
    }

    /**
     * Gets all registered voters for a specific event
     * Calls the getVoters() view function in the contract
     * @param {string} eventId - ID of the event
     * @returns {Promise<Array>} Array of voter objects
     */
    async getVoters(eventId) {
        try {
            const [addresses, usernames] = await this.contract.getVoters(eventId);
            return addresses.map((address, index) => ({
                address,
                username: usernames[index]
            }));
        } catch (error) {
            console.error('Error getting voters:', error);
            throw error;
        }
    }

    /**
     * Gets the winner of a closed event
     * This is a helper function that processes candidate data locally
     * @param {string} eventId - ID of the event
     * @returns {Promise<Object>} Winner object with name and vote count
     */
    async getWinner(eventId) {
        try {
            const candidates = await this.getCandidates(eventId);
            let winner = { name: '', voteCount: 0 };
            
            candidates.forEach(candidate => {
                if (parseInt(candidate.voteCount) > parseInt(winner.voteCount)) {
                    winner = candidate;
                }
            });
            
            return winner;
        } catch (error) {
            console.error('Error getting winner:', error);
            throw error;
        }
    }
}

// Export instance ContractManager sebagai default export
const contractManager = new ContractManager();
export { contractManager as default };
