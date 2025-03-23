// Import instance dari contract manager
import contractManager from './contract.js';

document.addEventListener('DOMContentLoaded', () => {
    const connectWalletBtn = document.getElementById('connectWallet');
    const eventsList = document.getElementById('eventsList');
    let selectedEventId = null;
    
    // Instance modal dari Bootstrap
    const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));

    // Handler untuk tombol connect wallet
    // Ini akan menginisialisasi koneksi ke blockchain melalui MetaMask
    connectWalletBtn.addEventListener('click', async () => {
        try {
            // Hubungkan ke blockchain dan dapatkan alamat wallet pengguna
            const address = await contractManager.connect();
            connectWalletBtn.textContent = `${address.substring(0, 6)}...${address.substring(38)}`;
            // Muat daftar event dari blockchain setelah terhubung
            await loadEvents();
        } catch (error) {
            alert('Gagal terhubung ke wallet: ' + error.message);
        }
    });

    // Muat dan tampilkan semua event dari smart contract
    async function loadEvents() {
        try {
            // Ambil semua event dari blockchain
            const events = await contractManager.getAllEvents();
            
            // Tampilkan event di UI
            eventsList.innerHTML = events.map(event => `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${event.eventName}</h5>
                            <p class="card-text">
                                Status: 
                                <span class="badge ${event.isActive ? 'bg-success' : 'bg-secondary'}">
                                    ${event.isActive ? 'Aktif' : 'Ditutup'}
                                </span>
                            </p>
                            <p class="card-text">Berakhir: ${event.endTime.toLocaleDateString()}</p>
                            <button class="btn btn-primary view-event" data-event-id="${event.eventId}">
                                Lihat Detail
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Tambahkan handler klik untuk tombol lihat detail
            document.querySelectorAll('.view-event').forEach(button => {
                button.addEventListener('click', () => openEventDetails(button.dataset.eventId));
            });
        } catch (error) {
            console.error('Error saat memuat event:', error);
            alert('Gagal memuat daftar event');
        }
    }

    // Buka modal detail event dan muat data dari blockchain
    async function openEventDetails(eventId) {
        selectedEventId = eventId;
        try {
            // Ambil detail event dari blockchain
            const events = await contractManager.getAllEvents();
            const currentEvent = events.find(e => e.eventId === eventId);
            
            if (!currentEvent) {
                throw new Error('Event tidak ditemukan');
            }

            // Ambil data kandidat dan voter dari blockchain
            const [candidates, voters] = await Promise.all([
                contractManager.getCandidates(eventId),
                contractManager.getVoters(eventId)
            ]);

            const eventDetails = document.getElementById('eventDetails');
            const votingSection = document.getElementById('votingSection');
            const voterRegistration = document.getElementById('voterRegistration');
            const registrationStatus = document.getElementById('registrationStatus');

            // Jika event sudah ditutup, tampilkan hasil akhir
            if (!currentEvent.isActive) {
                if (!candidates || candidates.length === 0) {
                    eventDetails.innerHTML = `
                        <div class="alert alert-info">
                            Event ini telah berakhir. Tidak ada kandidat yang terdaftar.
                        </div>
                    `;
                } else {
                    // Dapatkan pemenang dari data blockchain
                    const winner = await contractManager.getWinner(eventId);
                    const maxVotes = Math.max(...candidates.map(c => parseInt(c.voteCount) || 0));
                    
                    // Tampilkan pemenang dan hasil akhir
                    eventDetails.innerHTML = `
                        <div class="winner-announcement mb-4">
                            <h4>🏆 Pemenang</h4>
                            <h5>${winner.name}</h5>
                            <p>Total suara: ${winner.voteCount}</p>
                        </div>
                        <h4>Hasil Akhir</h4>
                        <div class="list-group">
                            ${candidates.map((candidate) => {
                                const voteCount = parseInt(candidate.voteCount) || 0;
                                const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;
                                return `
                                    <div class="list-group-item">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span>${candidate.name}</span>
                                            <span class="badge bg-primary">${voteCount} suara</span>
                                        </div>
                                        <div class="progress mt-2">
                                            <div class="progress-bar" role="progressbar" 
                                                style="width: ${percentage}%" 
                                                aria-valuenow="${voteCount}" 
                                                aria-valuemin="0" 
                                                aria-valuemax="${maxVotes}">
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }
                votingSection.innerHTML = '';
                voterRegistration.style.display = 'none';
                registrationStatus.innerHTML = '<div class="alert alert-info">Event ini telah berakhir.</div>';
            } else {
                // Untuk event yang masih aktif, tampilkan perolehan suara saat ini dan opsi voting
                eventDetails.innerHTML = `
                    <h4>Kandidat</h4>
                    <div class="list-group">
                        ${candidates.map((candidate, index) => `
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>${candidate.name}</span>
                                    <span class="badge bg-primary">${candidate.voteCount || 0} suara</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;

                // Cek status registrasi di localStorage
                const pendingRequests = JSON.parse(localStorage.getItem('voterRequests') || '[]');
                const hasRequestPending = pendingRequests.some(req => 
                    req.eventId === eventId && 
                    req.walletAddress.toLowerCase() === contractManager.userAddress.toLowerCase()
                );

                // Cek apakah user terdaftar sebagai voter di blockchain
                const isVoter = voters.some(v => 
                    v.address.toLowerCase() === contractManager.userAddress.toLowerCase()
                );
                
                if (isVoter) {
                    // Tampilkan form voting untuk voter yang terdaftar
                    registrationStatus.innerHTML = '<div class="alert alert-success">Anda terdaftar sebagai voter untuk event ini.</div>';
                    votingSection.innerHTML = `
                        <h5>Berikan Suara Anda</h5>
                        <form id="votingForm">
                            <select class="form-select mb-3" required>
                                <option value="">Pilih kandidat</option>
                                ${candidates.map((c, i) => `
                                    <option value="${i}">${c.name}</option>
                                `).join('')}
                            </select>
                            <button type="submit" class="btn btn-primary">Vote</button>
                        </form>
                    `;

                    // Handler untuk pengiriman vote ke blockchain
                    document.getElementById('votingForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const candidateIndex = e.target.querySelector('select').value;
                        try {
                            // Kirim transaksi vote ke blockchain
                            await contractManager.vote(eventId, candidateIndex);
                            alert('Vote berhasil dikirim!');
                            eventModal.hide();
                            loadEvents();
                        } catch (error) {
                            alert('Gagal mengirim vote: ' + error.message);
                        }
                    });
                } else if (hasRequestPending) {
                    // Tampilkan status pending untuk yang sudah mengajukan registrasi
                    registrationStatus.innerHTML = '<div class="alert alert-info">Permintaan registrasi Anda sedang menunggu persetujuan admin.</div>';
                    votingSection.innerHTML = '';
                    voterRegistration.style.display = 'none';
                } else {
                    // Tampilkan form registrasi untuk user yang belum terdaftar
                    registrationStatus.innerHTML = '';
                    votingSection.innerHTML = '<p>Daftar sebagai voter untuk berpartisipasi dalam event ini.</p>';
                    voterRegistration.style.display = 'block';
                }
            }

            eventModal.show();
        } catch (error) {
            console.error('Error saat memuat detail event:', error);
            alert('Gagal memuat detail event: ' + error.message);
        }
    }

    // Handler untuk form registrasi voter
    document.getElementById('voterRegistrationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const walletAddress = contractManager.userAddress;

        if (!selectedEventId || !username || !walletAddress) {
            alert('Mohon isi semua field yang diperlukan');
            return;
        }

        // Simpan permintaan registrasi ke localStorage untuk persetujuan admin
        const requests = JSON.parse(localStorage.getItem('voterRequests') || '[]');
        requests.push({
            eventId: selectedEventId,
            username,
            walletAddress,
            status: 'pending'
        });
        localStorage.setItem('voterRequests', JSON.stringify(requests));

        alert('Permintaan registrasi terkirim. Mohon tunggu persetujuan admin.');
        eventModal.hide();
        loadEvents();
    });

    // Coba hubungkan wallet saat halaman dimuat jika sudah diotorisasi
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWalletBtn.click();
    }
});

// Pastikan untuk menambahkan type="module" pada tag script di file HTML
// Contoh: <script type="module" src="app.js"></script>
