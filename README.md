# 10·3·2·1

Rutinitas sederhana untuk membantu mengatur aktivitas sebelum waktu tidur.

10·3·2·1 menghitung jadwal berdasarkan waktu tidur yang dipilih:

- 10 jam sebelumnya: berhenti minum kafein
- 3 jam sebelumnya: selesaikan makan
- 2 jam sebelumnya: batasi minum
- 1 jam sebelumnya: tinggalkan layar
- Waktu tidur

Aktivitas dapat ditukar sesuai rutinitas masing-masing.

## Calendar

Jadwal dapat diekspor ke kalender sebagai file `.ics`.

Tersedia tiga pilihan jadwal:

- Sekali
- Hari tertentu
- Setiap hari

Setiap aktivitas dibuat sebagai event 15 menit dengan pengingat 30 menit sebelumnya.

## Tech

- Astro
- TypeScript
- CSS
- LocalStorage
- iCalendar (`.ics`)

Tidak memerlukan akun atau backend.

## Development

```bash
npm install
npm run dev