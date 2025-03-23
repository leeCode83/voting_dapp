# Voting System berbasis Smart Contract

## Deskripsi Proyek
Proyek ini adalah sistem voting berbasis smart contract yang menggunakan teknologi blockchain.
Aplikasi ini terdiri dari:
- **Frontend**: Dibangun menggunakan HTML, CSS, dan JavaScript.
- **Smart Contract**: Ditulis dalam Solidity untuk memastikan keamanan dan transparansi proses voting.
- **Penyimpanan Data**: Saat ini, data yang tidak disimpan dalam blockchain akan menggunakan Local Storage. Jika diperlukan, pengembangan lebih lanjut dapat mencakup backend dengan database.

## Fitur Utama
- Pengguna dapat melihat semua event pemungutan suara yang tersedia.
- Pengguna dapat mengajukan diri untuk menjadi voter pada event tertentu.
- Jika pengajuan disetujui oleh admin event, pengguna dapat melakukan voting (satu kali per event).
- Pengguna dapat mengajukan pembuatan event voting baru dan menjadi admin dari event tersebut.
- Setiap event memiliki admin tersendiri yang bertanggung jawab atas pengelolaan event.

## Teknologi yang Digunakan
- **Frontend**: HTML, CSS, JavaScript
- **Smart Contract**: Solidity
- **Penyimpanan Data**: Local Storage (untuk sementara)
- **Blockchain**: Ethereum Virtual Machine (EVM) kompatibel

## Cara Menjalankan Proyek
### 1. Menjalankan Smart Contract
1. Pastikan Anda memiliki **Node.js** dan **npm/yarn** terinstal.
2. Instal **Hardhat**:
   ```sh
   npm install --save-dev hardhat
   ```
3. Clone repository ini dan masuk ke dalam direktori proyek:
   ```sh
   git clone https://github.com/username/voting-system.git
   cd voting-system
   ```
4. Compile smart contract:
   ```sh
   npx hardhat compile
   ```
5. Deploy ke jaringan lokal:
   ```sh
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

### 2. Menjalankan Frontend
1. Buka file `index.html` di browser atau gunakan ekstensi Live Server jika menggunakan VS Code.

## Struktur Direktori
```
📂 voting-system
 ┣ 📂 VotingSystem.sol         # Smart contract Solidity
 ┣ 📂 frontend                 # Kode frontend (HTML, CSS, JS)
 ┣ 📜 README.md                # Dokumentasi proyek
```

## Roadmap Pengembangan
- [ ] Implementasi backend dengan database untuk penyimpanan permanen.
- [ ] Integrasi Metamask untuk autentikasi pengguna.
- [ ] UI/UX yang lebih interaktif untuk pengalaman pengguna yang lebih baik.
- [ ] Deployment smart contract ke testnet Ethereum.

## Kontribusi
Saya sangat terbuka untuk kritik dan saran agar proyek ini semakin baik. Jika Anda memiliki ide atau ingin berkontribusi, silakan fork repository ini dan buat pull request.

