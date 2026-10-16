# Possensior Official Store & Interactive Brand Experience

Pembangunan ulang website resmi Possensior dengan desain streetwear modern, minimalis, dan responsif. Menghadirkan landing page imersif dengan logo ikonik "P" yang berputar di tengah layar, header dengan wordmark Possensior asli, katalog lengkap apparel boxy (t-shirt, longsleeve, hoodie), keranjang belanja (cart drawer), sistem checkout dengan QRIS dan Transfer Bank Manual, serta fitur pelacakan pesanan (Cek Resi).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan penting yang telah dikonfirmasi bersama pengguna:

- **Confirmed Decision 1 (Sistem Pembayaran)**: Menggunakan metode **QRIS** (dengan QR dinamis, batas waktu pembayaran, dan simulasi konfirmasi) serta **Transfer Bank Manual** (Bank Central Asia / BCA, Mandiri, BRI, BNI dengan nomor rekening, tombol salin instan, dan upload bukti bayar).
- **Confirmed Decision 2 (Logo Berputar Landing Page)**: Menggunakan logo "P" (gambar 1) yang berputar halus di tengah layar dengan ukuran besar yang proporsional (~200px–220px), dilengkapi efek bayangan lembut, partikel ambient halus, dan tombol "Masuk ke Toko" / "Explore Collection" untuk transisi mulus ke halaman utama.
- **Confirmed Decision 3 (Header Navigation)**: Menggunakan logo wordmark "Possensior" (gambar 2) pada bar navigasi halaman Home yang bersih dan konsisten sesuai kaidah Top Bar Contract.
- **Confirmed Decision 4 (Fitur Utama)**: Katalog apparel boxy streetwear dengan filter kategori, detail produk modal dengan pilihan ukuran (S, M, L, XL), drawer keranjang belanja, proses checkout multi-langkah dengan estimasi ongkir kurir (JNE, SiCepat, J&T), dan sistem Cek Resi real-time berdasarkan nomor pesanan.
- **Confirmed Decision 5 (Transisi Halaman)**: Menggunakan animasi transisi halaman yang halus dan responsif menggunakan Motion (`motion/react`) tanpa lag.

---

### 1. Overview & Core Concept

- **What It Does**: Website e-commerce dan landing page interaktif untuk brand apparel streetwear Indonesia **Possensior**. Pengguna disambut dengan landing page visual bertema "Unchangeable Reality" & "Dopamine Boxy Series" yang memutar emblem "P", kemudian dapat menjelajahi katalog pakaian berpotongan boxy, menambahkan barang ke keranjang, menyelesaikan checkout melalui QRIS atau transfer bank, dan memantau status pesanan melalui nomor resi.
- **Target Audience**: Penggemar streetwear, fashion enthusiast, dan pembeli online yang menyukai siluet boxy oversized t-shirt dan longsleeve modern.
- **Key Value**: Pengalaman berbelanja yang autentik, cepat, berestetika streetwear urban premium (warna khas sage green / forest teal `#2E5649` dipadukan dengan neutral dark slate dan clean white), serta alur transaksi lokal Indonesia yang familier dan tanpa hambatan.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Landing Page Entry**:
   - Pengunjung disambut layar pembuka bertema streetwear editorial.
   - Di tengah layar, logo "P" Possensior berputar 3D secara kontinu dengan pencahayaan halus dan kecepatan yang elegan.
   - Terdapat teks pengantar koleksi terbaru, status rilis (e.g., "Vol. 03 — Reality & Dopamine"), tombol "Jelajahi Koleksi", dan tombol quick access ke "Cek Resi".
2. **Catalog & Exploration (Home)**:
   - Header sticky dengan logo Possensior asli di kiri, menu navigasi (`Semua Produk`, `Boxy T-Shirt`, `Longsleeve`, `Outerwear`, `Cek Resi`) di tengah, dan tombol Keranjang (dengan badge counter) serta Search di kanan.
   - Filter segmented controls (T-Shirt, Longsleeve, Hoodie, Best Seller, New Arrival).
   - Grid produk streetwear dengan foto berkualitas tinggi, badge status stok, harga dalam format Rupiah (`Rp 169.000`), dan tombol Quick View / Add to Cart.
3. **Product Detail View**:
   - Modal detail interaktif menampilkan galeri foto produk, panduan ukuran boxy (Size Chart: Lebar Dada vs Panjang Baju), pemilihan ukuran (S/M/L/XL), kuantitas, dan detail material (Heavyweight Cotton 24s/20s Combed).
4. **Cart Drawer**:
   - Slide-over drawer dari sisi kanan dengan rekap barang, penyesuaian kuantitas (+/-), input voucher promo toko, kalkulasi subtotal, dan tombol "Lanjut ke Pembayaran".
5. **Checkout & Payment**:
   - Formulir pengiriman: Nama, WhatsApp/Telepon, Alamat Lengkap, Kota, dan Pilihan Kurir Pengiriman (JNE Reguler, SiCepat BEST, J&T Express).
   - Pilihan metode bayar:
     - **QRIS**: Menampilkan kode QRIS dinamis, nominal pembayaran unik, instruksi scan (GoPay, OVO, Dana, BCA Mobile), dan hitung mundur pembayaran.
     - **Transfer Bank Manual**: Pilihan rekening BCA, Bank Mandiri, BRI, BNI; nomor rekening dengan fitur copy sekali klik, petunjuk transfer, dan form konfirmasi / upload bukti transfer.
   - Konfirmasi pesanan dengan nomor invoice resmi (contoh: `POSS-829104`).
6. **Order Tracking (Cek Resi)**:
   - Halaman pelacakan pesanan di mana pelanggan dapat memasukkan nomor invoice/resi untuk melihat linimasa pengiriman (Order Dibuat $\to$ Menunggu Pembayaran $\to$ Diproses Gudang $\to$ Dikirim Kurir $\to$ Terkirim).

#### Visual Identity & Theme
- **Dominant Color**: Forest Sage Green `#2E5649` & Deep Teal `#24453A` (sesuai warna resmi logo Possensior pada gambar).
- **Neutral Palette**: Crisp White `#FFFFFF`, Clean Paper Canvas `#F8FAF9`, Charcoal/Muted Slate `#1E2927` untuk teks utama, dan Subtle Hairlines `#E2E8F0`.
- **Typography**: Clean, robust sans-serif modern (`Plus Jakarta Sans` / modern geometric grotesque) yang mencerminkan karakter streetwear kontemporer.
- **Anti-Slop Discipline**: Tidak ada pill badge berantakan, tidak ada efek neon cyberpunk murahan, tidak ada teks watermark pudar, dan menggunakan separator tipis (`·`) untuk metadata produk.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Logo Visual Representation**:
  - *Chosen Approach*: Mengonversi kedua logo (Emblem "P" dan Wordmark "Possensior") ke dalam format vektor SVG presisi tinggi yang identik dengan file gambar yang diunggah pengguna. Hal ini memastikan logo dapat berputar tajam pada semua resolusi layar (Retina/4K), dapat diwarnai secara dinamis, dan tidak mengalami penurunan kualitas gambar saat diskalakan.
  - *Why*: Menghindari kompresi gambar buram saat animasi rotasi aktif dan memastikan ukuran file ringan serta waktu loading instan.
- **Decision 2: Navigasi dan State Management**:
  - *Chosen Approach*: Arsitektur Single Page Application (SPA) modular berbasis state dan tab view dengan animasi transisi `AnimatePresence` dari `motion/react`.
  - *Why*: Transisi antar halaman menjadi sangat instan dan mulus (fade & slide halus), menjaga keranjang belanja tidak hilang saat berpindah antar tampilan, serta mendukung navigasi browser.
- **Decision 3: Persistensi Data**:
  - *Chosen Approach*: State persisten menggunakan `localStorage` untuk keranjang belanja dan riwayat pesanan (orders/resi) sehingga pesanan yang dibuat saat simulasi checkout langsung dapat dilacak di halaman "Cek Resi".
  - *Why*: Memberikan pengalaman pengguna yang konsisten dan fungsional penuh tanpa ketergantungan backend eksternal yang rumit.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          App Container (App.tsx)                       │
│  State: CurrentView, CartItems, OrdersHistory, SelectedProduct, Search │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
         ┌──────────┴──────────┐          ┌──────────┴──────────┐
         │ Navigation & Header │          │ Cart Drawer Overlay │
         │ (Wordmark Logo SVG) │          │  (Slide-over + Qty) │
         └─────────────────────┘          └─────────────────────┘
                    │
   ┌────────────────┴─────────────────────────────────────────────┐
   │ AnimatePresence View Router (Smooth Page Transitions)        │
   │                                                              │
   │  [landing]  ──► LandingView (Rotating Center "P" Emblem)     │
   │  [home]     ──► StoreCatalogView (Category Filter & Grid)    │
   │  [checkout] ──► CheckoutView (Address + QRIS / Bank Transfer)│
   │  [tracking] ──► OrderTrackingView (Cek Resi & Timeline)      │
   │  [about]    ──► BrandStoryView (Possensior Streetwear Ethos) │
   └──────────────────────────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │ ProductDetailModal  │
         │ (Size Chart & Buy)  │
         └─────────────────────┘
```

#### Komponen Utama:
1. `src/types/store.ts`: Definisi tipe data produk, item keranjang, alamat pengiriman, metode pembayaran, invoice, dan timeline pelacakan.
2. `src/data/products.ts`: Data produk autentik Possensior (Boxy Dopamine Black, Boxy Unchangeable Reality Blue, Words Middle Logo Tee, Heavyweight Hoodie, Longsleeve Oversized).
3. `src/components/Logos.tsx`: Komponen SVG vektor presisi untuk Emblem "P" (Landing page) dan Wordmark "Possensior" (Header).
4. `src/components/LandingView.tsx`: Layar pembuka dengan animasi putar halus logo "P", tombol aksi masuk toko, dan teaser visual.
5. `src/components/Navbar.tsx`: Header dengan standar Top Bar Contract, logo wordmark, link navigasi, dan drawer trigger keranjang.
6. `src/components/ProductCard.tsx` & `src/components/ProductDetailModal.tsx`: Tampilan katalog dan modal pemesanan lengkap dengan size guide boxy fit.
7. `src/components/CartDrawer.tsx`: Keranjang belanja geser dengan penyesuaian jumlah item dan voucher.
8. `src/components/CheckoutView.tsx`: Form checkout pengiriman, opsi QRIS dengan timer countdown, dan Transfer Bank Manual dengan nomor rekening resmi dan copy button.
9. `src/components/OrderTrackingView.tsx`: Halaman cek resi dengan lookup nomor pesanan dan visual timeline status pengiriman.
10. `src/components/Footer.tsx`: Footer streetwear minimalis dengan informasi garansi produk, panduan ukuran, dan kontak layanan pelanggan.

---

### Verification Plan

- **Automated Compilation**: Menjalankan `compile_applet` untuk memastikan seluruh tipe TypeScript, impor pustaka, dan sintaks JSX valid tanpa error.
- **Functional Checks**:
  1. *Landing Page Animation*: Menguji rotasi logo "P" di tengah layar dan perpindahan mulus saat tombol "Masuk ke Toko" diklik.
  2. *Header Wordmark*: Memastikan logo kedua "Possensior" tampil tajam dan responsif di navigation bar pada tampilan desktop dan mobile.
  3. *Katalog & Filter*: Menguji fungsionalitas filter kategori produk dan modal detail ukuran.
  4. *Keranjang Belanja*: Memastikan penambahan produk, perubahan ukuran, dan kuantitas tersinkronisasi dengan subtotal.
  5. *Sistem Pembayaran*: Menguji alur QRIS (tampilan kode QR) dan Transfer Bank Manual (salin nomor rekening & konfirmasi).
  6. *Cek Resi*: Membuat pesanan dan langsung melacak nomor invoice tersebut di menu Cek Resi untuk memastikan linimasa status muncul dengan tepat.
