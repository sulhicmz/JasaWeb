# Repository Optimization Plan

## Goals
- Kurangi konfigurasi berulang antar workspace agar workflow lebih konsisten.
- Pastikan tooling linting dan type checking berjalan mulus di lokal dan CI.
- Minimalkan waktu build/lint dengan cache serta pengecualian direktori yang tidak relevan.

## Identified Opportunities
1. **Script Root Menggunakan `cd` Manual**  
   Menyulitkan orkestrasi multi-workspace dan tidak memanfaatkan fitur `pnpm --filter`.
2. **Dependensi ESLint Tidak Lengkap**  
   Konfigurasi lint mengandalkan plugin TypeScript tetapi paketnya belum dipasang, menyebabkan lint gagal.
3. **Lint Menyasar Direktori Hasil Build**  
   Tanpa ignore khusus dan cache, linting memerlukan waktu lebih lama.
4. **Belum Ada Skrip Type Checking Terpusat**  
   Type checking dijalankan manual melalui `npx`, sehingga kurang konsisten antara lokal dan CI.

## Action Items
- Perbarui skrip root agar memanfaatkan `pnpm --filter` dan tambah utilitas lint/typecheck.
- Tambahkan `@typescript-eslint/eslint-plugin` dan `@typescript-eslint/parser` sebagai dev dependency.
- Tambahkan `.eslintignore` dan gunakan cache lint untuk mempercepat pipeline.
- Tambahkan skrip `typecheck` untuk menjalankan `tsc --noEmit` dari root.

## Status
- ✅ Skrip root telah diperbarui (`dev`, `build`, `start`, `build:all`, `dev:api`).
- ✅ Dependensi ESLint lengkap serta lint caching diaktifkan.
- ✅ `.eslintignore` dan pengabaian `.cache` pada `.gitignore` telah ditambahkan.
- ✅ Skrip `typecheck` tersedia (menggunakan `tsconfig.node.json` sebagai baseline hingga modul lain siap).
