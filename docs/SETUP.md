# CARA SETUP PROJECT INI

1. Download nodejs dan bun di https://nodejs.org/en/download dan https://bun.sh (Nodejs disarankan versi 22.22.3 yg LTS dan bun pilih yg windows)
2. Kalau sudah di download ntar setup sampai selesai, kalo sudah selesai buka cmd atau terminal ketik "bun -v" dan "node --version" (untuk mastiin udh keinstall apa belum, kalo pas dicoba ga muncul coba buka ulang cmd atau terminalnya)
3. Buat folder (namanya dan lokasinya bebas) abis tuh extract laundry-flow.zip didalem folder itu
4. Buka cmd atau terminal di folder tadi, terus ketik "bun i"
5. Kalo sudah buka vscode, caranya ketik aja "code ." di cmd atau terminal itu
6. Copy .env.example ubah namanya jadi .env
7. Atur database url nya, kalo gaada password berarti formatnya "mysql://root@localhost:3306/laundry_app"
8. Kalo udah buka phpmyadmin terus bikin database sesuai yg di database url, contoh "laundry_app"
9. Balik ke cmd atau terminal tadi ketik "bunx drizzle-kit push", abis tuh cek ke databasenya udh muncul semua apa belum tabelnya
10. Untuk nambahin data dummy (untuk user aja) ketik "bun run db:seed:users", nanti otomatis data user bakal ditambah
11. Kalo sudah selesai, ketik "bun dev" nanti bakal muncul url "http://localhost:3000"

# DUMMY USERS
- admin@gmail.com | password123
- staff@gmail.com | password123

# TECH STACK
- Next.js
- Typescript
- DrizzleORM (MySQL)