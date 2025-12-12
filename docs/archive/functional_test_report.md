# Laporan Pengujian Fungsional - JasaWeb

Laporan ini berisi hasil pengujian fungsional yang dilakukan pada situs web JasaWeb (https://jasaweb-dhd.pages.dev/) pada tanggal 23 November 2025.

## Ringkasan

Secara keseluruhan, fungsionalitas inti situs web berjalan dengan baik. Navigasi antar halaman, pemuatan konten, dan pengiriman formulir kontak berhasil diuji. Namun, ditemukan beberapa masalah minor dan peluang untuk perbaikan yang dirinci di bawah ini.

## Temuan

### Berfungsi Baik

- **Navigasi Umum:** Semua tautan di menu navigasi utama berfungsi dengan benar.
- **Pemuatan Halaman:** Halaman Utama, Portofolio, Blog, Kontak, dan Login berhasil dimuat.
- **Formulir Kontak:** Pengiriman formulir kontak berhasil dengan pesan konfirmasi yang sesuai.
- **Tampilan Konten:** Konten di halaman Portofolio dan Blog (termasuk detail artikel) ditampilkan dengan benar.

### Error

- **Sumber Daya Tidak Ditemukan di Halaman Layanan (Prioritas: Tinggi)**
  - **Deskripsi:** Saat mengakses halaman `/services`, terdapat error `404 Not Found` di konsol browser. Ini menunjukkan bahwa satu atau lebih sumber daya (seperti gambar, skrip, atau stylesheet) gagal dimuat.
  - **Dampak:** Meskipun halaman tampak berfungsi, error ini dapat menyebabkan tampilan yang rusak atau fungsionalitas yang tidak lengkap di beberapa browser atau kondisi jaringan.
  - **Rekomendasi:** Periksa semua path sumber daya yang direferensikan di halaman `services.astro` dan pastikan semuanya benar.

### Butuh Peningkatan

- **Atribut `autocomplete` pada Form Login (Prioritas: Sedang)**
  - **Deskripsi:** Kolom input email dan password pada halaman `/login` tidak memiliki atribut `autocomplete`.
  - **Dampak:** Pengguna tidak dapat memanfaatkan fitur pengisian otomatis browser, yang sedikit mengurangi kenyamanan.
  - **Rekomendasi:** Tambahkan `autocomplete="email"` pada input email dan `autocomplete="current-password"` pada input password.

### Peluang Koherensi

- **Tautan Non-Fungsional (Prioritas: Rendah)**
  - **Deskripsi:** Beberapa tautan pada situs tidak mengarah ke tujuan yang fungsional:
    1. Tautan "Lupa password?" di halaman `/login` mengarah ke `/#`.
    2. Tombol berbagi media sosial (Facebook, Twitter, LinkedIn) di halaman detail artikel blog mengarah ke `/#`.
  - **Dampak:** Mengurangi pengalaman pengguna dan memberikan kesan bahwa fitur tersebut belum selesai.
  - **Rekomendasi:**
    - Jika fungsionalitas reset password belum ada, nonaktifkan sementara tautan "Lupa password?".
    - Implementasikan fungsionalitas berbagi sosial atau hapus tombol-tombol tersebut untuk sementara waktu.

## Langkah Selanjutnya

- Membuat isu di repositori GitHub untuk setiap temuan di atas.
- Memberi label pada setiap isu berdasarkan kategori (bug, enhancement) dan prioritas.
- Mengimplementasikan perbaikan yang direkomendasikan.