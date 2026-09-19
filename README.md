# 10·3·2·1

Rutinitas sederhana untuk membantu mengatur aktivitas sebelum waktu tidur.

**Live:** https://10321.rizkirn.my.id

10·3·2·1 membantu menentukan kapan mulai membatasi aktivitas tertentu berdasarkan waktu tidur yang dipilih.

Secara default:

- 10 jam sebelumnya: berhenti minum kafein
- 3 jam sebelumnya: selesaikan makan
- 2 jam sebelumnya: batasi minum
- 1 jam sebelumnya: tinggalkan layar
- Waktu tidur

Angka 10, 3, 2, dan 1 menunjukkan jarak waktu sebelum tidur. Aktivitasnya dapat ditukar agar sesuai dengan rutinitas masing-masing.

> 10·3·2·1 adalah panduan umum untuk membantu menyusun rutinitas sebelum tidur, bukan aturan medis.

## Features

- Pilih waktu tidur dan jadwal dihitung otomatis
- Tukar aktivitas antara slot 10, 3, 2, dan 1 jam
- Rutinitas tersimpan di browser
- Reset ke rutinitas default
- Ekspor jadwal ke kalender
- Bagikan rutinitas sebagai gambar
- Responsive untuk desktop dan mobile
- Tidak memerlukan akun atau backend

## Calendar

Jadwal dapat diekspor sebagai file `.ics` dengan tiga pilihan:

- Sekali
- Hari tertentu
- Setiap hari

Setiap aktivitas dibuat sebagai event 15 menit dengan pengingat 30 menit sebelumnya.

## Share Routine

Rutinitas dapat dibuat menjadi gambar portrait yang menampilkan waktu dan aktivitas sesuai pengaturan pengguna.

Gambar dapat disimpan atau dibagikan melalui perangkat yang mendukung native sharing.

## Tech Stack

- Astro
- TypeScript
- CSS
- Canvas API
- LocalStorage
- iCalendar (`.ics`)
- Cloudflare Pages
- Cloudflare Web Analytics

## Development

Install dependencies:

```bash
npm install