document.addEventListener('DOMContentLoaded', () => {
    const connectWalletBtn = document.getElementById('connectWallet');
    const adminAccess = document.getElementById('adminAccess');
    const noAccess = document.getElementById('noAccess');
    const eventManagement = document.getElementById('eventManagement');
    const voterManagement = document.getElementById('voterManagement');
    const addCandidateForm = document.getElementById('addCandidateForm');
    const eventSelect = document.getElementById('eventSelect');
    const eventSelectVoters = document.getElementById('eventSelectVoters');
    const voterRequestsList = document.getElementById('voterRequestsList');

    let adminEvents = [];

    // Connect wallet button
    connectWalletBtn.addEventListener('click', async () => {
        try {
            const address = await contractManager.connect();
            connectWalletBtn.textContent = `${address.substring(0, 6)}...${address.substring(38)}`;
            await loadEvents();
        } catch (error) {
            alert('Failed to connect wallet: ' + error.message);
        }
    });

    // Load all events and check admin access
    async function loadEvents() {
        try {
            const events = await contractManager.getAllEvents();
            // Filter events where current user is admin
            adminEvents = events.filter(event => 
                event.admin.toLowerCase() === contractManager.userAddress.toLowerCase()
            );

            if (adminEvents.length > 0) {
                adminAccess.style.display = 'block';
                noAccess.style.display = 'none';
                displayEventManagement(adminEvents); // Only show admin's events
                updateEventSelect(adminEvents); // Only show admin's events in select
                updateVoterEventSelect(adminEvents); // Only show admin's events in voter management
            } else {
                adminAccess.style.display = 'none';
                noAccess.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading events:', error);
            alert('Failed to load events');
        }
    }

    // Update voter management event select
    function updateVoterEventSelect(events) {
        eventSelectVoters.innerHTML = `
            <option value="">Select Event</option>
            ${events.filter(e => e.isActive).map(event => `
                <option value="${event.eventId}">${event.eventName}</option>
            `).join('')}
        `;

        // Add change event listener
        eventSelectVoters.addEventListener('change', () => {
            const selectedEventId = eventSelectVoters.value;
            if (selectedEventId) {
                loadVoterRequests(selectedEventId);
            }
        });
    }

    // Load and display voter requests for selected event
    function loadVoterRequests(eventId) {
        // Verify if user is admin for this event
        const event = adminEvents.find(e => e.eventId === eventId);
        if (!event) {
            alert('You are not authorized to manage this event');
            return;
        }

        const requests = JSON.parse(localStorage.getItem('voterRequests') || '[]');
        const eventRequests = requests.filter(req => req.eventId === eventId);

        voterRequestsList.innerHTML = eventRequests.map(request => `
            <tr>
                <td>${request.username}</td>
                <td>${request.walletAddress}</td>
                <td>
                    <span class="badge ${request.status === 'pending' ? 'bg-warning' : 
                                       request.status === 'approved' ? 'bg-success' : 'bg-danger'}">
                        ${request.status}
                    </span>
                </td>
                <td>
                    ${request.status === 'pending' ? `
                        <button class="btn btn-sm btn-success approve-voter" 
                                data-address="${request.walletAddress}"
                                data-username="${request.username}">
                            Approve
                        </button>
                        <button class="btn btn-sm btn-danger reject-voter"
                                data-address="${request.walletAddress}">
                            Reject
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');

        // Add event listeners to approve/reject buttons
        document.querySelectorAll('.approve-voter').forEach(button => {
            button.addEventListener('click', async () => {
                const address = button.dataset.address;
                const username = button.dataset.username;
                try {
                    await contractManager.addVoter(eventId, address, username);
                    updateRequestStatus(eventId, address, 'approved');
                    alert('Voter approved successfully!');
                    loadVoterRequests(eventId);
                } catch (error) {
                    alert('Failed to approve voter: ' + error.message);
                }
            });
        });

        document.querySelectorAll('.reject-voter').forEach(button => {
            button.addEventListener('click', () => {
                const address = button.dataset.address;
                updateRequestStatus(eventId, address, 'rejected');
                loadVoterRequests(eventId);
            });
        });
    }

    // Update request status in localStorage
    function updateRequestStatus(eventId, address, status) {
        const requests = JSON.parse(localStorage.getItem('voterRequests') || '[]');
        const updatedRequests = requests.map(req => {
            if (req.eventId === eventId && req.walletAddress === address) {
                return { ...req, status };
            }
            return req;
        });
        localStorage.setItem('voterRequests', JSON.stringify(updatedRequests));
    }

    // Display event management section
    function displayEventManagement(events) {
        eventManagement.innerHTML = `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Event Name</th>
                            <th>Status</th>
                            <th>End Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${events.map(event => `
                            <tr>
                                <td>${event.eventName}</td>
                                <td>
                                    <span class="badge ${event.isActive ? 'bg-success' : 'bg-secondary'}">
                                        ${event.isActive ? 'Active' : 'Closed'}
                                    </span>
                                </td>
                                <td>${event.endTime.toLocaleDateString()}</td>
                                <td>
                                    ${event.isActive ? `
                                        <button class="btn btn-sm btn-danger close-event" 
                                                data-event-id="${event.eventId}">
                                            Close Event
                                        </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Add event listeners
        document.querySelectorAll('.close-event').forEach(button => {
            button.addEventListener('click', async (e) => {
                const eventId = e.target.dataset.eventId;
                // Verify if user is admin for this event
                const event = adminEvents.find(e => e.eventId === eventId);
                if (!event) {
                    alert('You are not authorized to manage this event');
                    return;
                }

                if (confirm('Are you sure you want to close this event?')) {
                    try {
                        await contractManager.closeEvent(eventId);
                        alert('Event closed successfully!');
                        loadEvents();
                    } catch (error) {
                        alert('Failed to close event: ' + error.message);
                    }
                }
            });
        });
    }

    // Update event select dropdown
    function updateEventSelect(events) {
        eventSelect.innerHTML = `
            <option value="">Select Event</option>
            ${events.filter(e => e.isActive).map(event => `
                <option value="${event.eventId}">${event.eventName}</option>
            `).join('')}
        `;
    }

    // Add candidate form handler
    addCandidateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventId = eventSelect.value;
        const candidateName = document.getElementById('candidateName').value;

        if (!eventId) {
            alert('Please select an event');
            return;
        }

        // Verify if user is admin for this event
        const event = adminEvents.find(e => e.eventId === eventId);
        if (!event) {
            alert('You are not authorized to manage this event');
            return;
        }

        try {
            await contractManager.addCandidate(eventId, candidateName);
            alert('Candidate added successfully!');
            addCandidateForm.reset();
        } catch (error) {
            alert('Failed to add candidate: ' + error.message);
        }
    });

    // Try to connect wallet on page load if already authorized
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWalletBtn.click();
    }
});
