// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingSystem {
    // Struct untuk menyimpan data voter
    struct Voter {
        address walletAddress;
        string username;
        bool hasVoted;
    }

    // Struct untuk menyimpan data kandidat
    struct Candidate {
        string name;
        uint voteCount;
    }

    // Struct untuk menyimpan data event voting
    struct VotingEvent {
        string eventName;
        address admin;
        mapping(address => Voter) voters;
        address[] voterAddresses; // Array untuk melacak semua voter
        Candidate[] candidates;
        bool isActive;
        uint endTime;
    }

    // Struktur untuk mengembalikan detail event
    struct EventInfo {
        uint eventId;
        string eventName;
        address admin;
        bool isActive;
        uint endTime;
    }

    // Fungsi untuk melihat semua event yang tersedia
    function getAllEvents() public view returns (EventInfo[] memory) {
        EventInfo[] memory events = new EventInfo[](eventCount);
        
        for (uint i = 0; i < eventCount; i++) {
            VotingEvent storage votingEvent = votingEvents[i];
            events[i] = EventInfo({
                eventId: i,
                eventName: votingEvent.eventName,
                admin: votingEvent.admin,
                isActive: votingEvent.isActive,
                endTime: votingEvent.endTime
            });
        }
        
        return events;
    }

    // Mapping untuk menyimpan semua event voting
    mapping(uint => VotingEvent) public votingEvents;
    uint public eventCount;

    // Event logging untuk audit trail
    event VoterAdded(uint eventId, address voterAddress, string username);
    event EventProposed(uint eventId, string eventName, address proposer);
    event EventClosed(uint eventId, string winner, uint voteCount);
    event CandidateAdded(uint eventId, string candidateName);
    event Voted(uint eventId, address voter, uint candidateIndex);

    // Modifier untuk memastikan hanya admin yang bisa akses
    modifier onlyAdmin(uint eventId) {
        require(msg.sender == votingEvents[eventId].admin, "Only admin can perform this action");
        _;
    }

    // Modifier untuk memastikan event aktif
    modifier eventActive(uint eventId) {
        require(votingEvents[eventId].isActive, "Event is not active");
        require(block.timestamp <= votingEvents[eventId].endTime, "Event has expired");
        _;
    }

    // 3. Mengajukan event voting baru
    function proposeEvent(string memory _eventName, uint _durationInDays) public {
        uint eventId = eventCount++;
        
        VotingEvent storage newEvent = votingEvents[eventId];
        newEvent.eventName = _eventName;
        newEvent.admin = msg.sender;
        newEvent.isActive = true;
        newEvent.endTime = block.timestamp + (_durationInDays * 1 days);

        emit EventProposed(eventId, _eventName, msg.sender);
    }

    // 2. Menambahkan voter baru (hanya admin)
    function addVoter(uint eventId, address _voterAddress, string memory _username) 
        public 
        onlyAdmin(eventId) 
        eventActive(eventId) 
    {
        VotingEvent storage votingEvent = votingEvents[eventId];
        
        // Cek apakah voter sudah terdaftar
        require(votingEvent.voters[_voterAddress].walletAddress == address(0), "Voter already registered");
        
        votingEvent.voters[_voterAddress] = Voter({
            walletAddress: _voterAddress,
            username: _username,
            hasVoted: false
        });
        votingEvent.voterAddresses.push(_voterAddress);

        emit VoterAdded(eventId, _voterAddress, _username);
    }

    // 4. Menambahkan kandidat (hanya admin)
    function addCandidate(uint eventId, string memory _candidateName) 
        public 
        onlyAdmin(eventId) 
        eventActive(eventId) 
    {
        VotingEvent storage votingEvent = votingEvents[eventId];
        votingEvent.candidates.push(Candidate({
            name: _candidateName,
            voteCount: 0
        }));

        emit CandidateAdded(eventId, _candidateName);
    }

    // 1. Menampilkan semua voter terdaftar
    function getVoters(uint eventId) 
        public 
        view 
        returns (address[] memory, string[] memory) 
    {
        VotingEvent storage votingEvent = votingEvents[eventId];
        string[] memory usernames = new string[](votingEvent.voterAddresses.length);
        
        for (uint i = 0; i < votingEvent.voterAddresses.length; i++) {
            usernames[i] = votingEvent.voters[votingEvent.voterAddresses[i]].username;
        }
        
        return (votingEvent.voterAddresses, usernames);
    }

    // 5. Melakukan voting
    function vote(uint eventId, uint candidateIndex) 
        public 
        eventActive(eventId) 
    {
        VotingEvent storage votingEvent = votingEvents[eventId];
        
        // Verifikasi voter terdaftar dan belum voting
        Voter storage voter = votingEvent.voters[msg.sender];
        require(voter.walletAddress != address(0), "Not registered as voter");
        require(!voter.hasVoted, "Already voted");
        require(candidateIndex < votingEvent.candidates.length, "Invalid candidate index");

        // Update status voting
        voter.hasVoted = true;
        votingEvent.candidates[candidateIndex].voteCount++;

        emit Voted(eventId, msg.sender, candidateIndex);
    }

    // 6. Menutup event dan menampilkan pemenang
    function closeEvent(uint eventId) 
        public 
        onlyAdmin(eventId) 
    {
        VotingEvent storage votingEvent = votingEvents[eventId];
        require(votingEvent.isActive, "Event already closed");

        votingEvent.isActive = false;
        
        // Mencari pemenang
        uint winningVoteCount = 0;
        string memory winnerName;
        
        for (uint i = 0; i < votingEvent.candidates.length; i++) {
            if (votingEvent.candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = votingEvent.candidates[i].voteCount;
                winnerName = votingEvent.candidates[i].name;
            }
        }

        emit EventClosed(eventId, winnerName, winningVoteCount);
    }

    // Fungsi helper untuk mendapatkan detail kandidat
    function getCandidates(uint eventId) 
        public 
        view 
        returns (string[] memory names, uint[] memory voteCounts) 
    {
        VotingEvent storage votingEvent = votingEvents[eventId];
        names = new string[](votingEvent.candidates.length);
        voteCounts = new uint[](votingEvent.candidates.length);
        
        for (uint i = 0; i < votingEvent.candidates.length; i++) {
            names[i] = votingEvent.candidates[i].name;
            voteCounts[i] = votingEvent.candidates[i].voteCount;
        }
        
        return (names, voteCounts);
    }
}