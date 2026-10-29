# ☕ BrewLab — Single-Origin Coffee Inventory & Recipe Sharing Hub

> **Final Project Pemrograman Framework (PBKK)**  
> **Departemen Teknik Informatika — Institut Teknologi Sepuluh Nopember (ITS)**  
> **Dosen Pengampu:** Moch. Nafkhan Alzamzami, S.T., M.T.

---

## 🌟 Tentang Proyek (Custom Project: High Complexity)

**BrewLab** adalah platform terintegrasi untuk komunitas *specialty coffee* yang menghubungkan **Roastery / Cafe Admin** dengan para **Home Barista / Brewer**. Platform ini menyediakan:
1. **Manajemen Inventaris Stok Biji Kopi (Single-Origin Roastery Inventory)** dengan fitur penomoran urut (`No. #1, #2, ...`), *interactive bag counter* (+1 / -1 bag), dan deteksi stok menipis (*low-stock automated email alert*).
2. **Repositori Resep Seduh (Manual Brew & Cafe Classics)** bertingkat (*hierarchical nested steps*) untuk V60, AeroPress, Kalita Wave, French Press, Cold Brew, serta menu klasik kafe: **Caffè Latte, Cappuccino, Flat White, Americano, dan Espresso**.
3. **Kalkulator Rasio Seduh Dinamis (Core Business Logic)** yang secara otomatis menghitung volume air/susu, rasio ekstraksi, suhu ideal, dan memecah tahapan tuang & steaming per detik.
4. **Sistem Ulasan & Rating Komunitas** dengan agregasi skor otomatis.

---

## 🏗️ Tech Stack

- **Backend**:
  - Framework: **NestJS 12** (TypeScript, NodeNext ESM, Modular Clean Architecture)
  - ORM: **Prisma ORM** (Type-safe cascade relations & transactions)
  - Database: **SQLite / PostgreSQL** (Zero-configuration file database `dev.db`, siap ganti ke PostgreSQL)
  - Autentikasi: **JWT** (Access Token + Refresh Token), Passport, **bcryptjs**
  - Validasi: **class-validator** + **class-transformer** (DTO Validation)
  - Notifikasi: **Nodemailer** (Automated Email Service)
  - File Upload: **Multer** (Local Server Storage with MIME & size validation)
  - Testing: **Vitest + Jest + Supertest** (**81.9% backend coverage**, melampaui target minimum 70%)

- **Frontend**:
  - Framework: **Next.js 16 (App Router)** + **React 19**
  - Styling: **Tailwind CSS v4**
  - Icons: **Lucide React**

---

## 🎯 Pemenuhan Spesifikasi & Persyaratan Tugas

| Persyaratan Tugas (Section 2 & 4) | Implementasi di BrewLab | File / Endpoint Terkait |
|---|---|---|
| **1. User Registration & Password Hashing** | Validasi DTO ketat (email, min password 6 karakter), hashing dengan `bcryptjs` 10 salt rounds. | `src/auth/auth.service.ts` <br> `POST /api/auth/register` |
| **2. JWT Login & Refresh Token** | Dual token (Access Token 15 menit, Refresh Token 7 hari disimpan terenkripsi di DB) dengan token rotation. | `src/auth/auth.service.ts` <br> `POST /api/auth/login`, `POST /api/auth/refresh` |
| **3. RBAC & Access Control** | Peran `BREWER`, `ROASTER`, dan `ADMIN`. Role-based route guard mengembalikan 401 Unauthorized atau 403 Forbidden bila akses tidak berwenang. | `src/common/guards/roles.guard.ts` <br> `@Roles(Role.ROASTER)` |
| **4. File Upload (Local Storage)** | Upload foto kemasan beans / bag image menggunakan Multer, validasi MIME (`image/png`, `image/jpeg`, `image/webp`), batas ukuran 5MB. Disajikan melalui Static Serve. | `src/uploads/uploads.controller.ts` <br> `POST /api/uploads/image` |
| **5. Search, Filtering & Pagination** | Pencarian teks (origin, varietal, nama, notes), filter multi-kriteria (process, roast level, method), serta paginasi `page` & `limit`. | `src/beans/beans.service.ts` <br> `src/recipes/recipes.service.ts` |
| **6. Email Service** | Pengiriman email otomatis saat stok biji kopi $\le$ threshold (`sendLowStockAlert`) dan email sambutan selamat datang (`sendWelcomeEmail`). | `src/mail/mail.service.ts` |
| **7. Nested Cascade CRUD & Transaction** | Relasi bertingkat `BrewRecipe` $\rightarrow$ `PourStep`. Pembuatan dan update resep dikelola dalam 1 transaksi DB (`$transaction`) dan cascade delete. | `src/recipes/recipes.service.ts` |
| **8. E2E Testing Backend $\ge$ 70%** | Pengujian menyeluruh menggunakan Supertest & Vitest mencakup 28 skenario E2E + 15 unit test dengan hasil **81.9% Line Coverage**! | `test/app.e2e-spec.ts` <br> `pnpm test:cov` |

---

## 👥 Demo Accounts (Preset Credentials)

| Role | Email | Password | Hak Akses |
|---|---|---|---|
| **Roaster / Shop Admin** | `roaster@morningglory.com` | `password123` | Mengelola stok, katalog beans, edit inventaris, terima alert email low-stock. |
| **Brewer (Enthusiast)** | `barista.alex@brewlab.com` | `password123` | Menjelajah beans, membuat resep seduh, kalkulator rasio, review/rating. |
| **System Admin** | `admin@brewlab.com` | `password123` | Hak akses penuh (bypass seluruh guard). |

*(Tersedia tombol **Quick Role Switcher** di bagian atas UI untuk memudahkan perpindahan akun saat demo video).*

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Menjalankan Backend (NestJS)

```bash
cd backend

# Install dependencies (jika belum)
pnpm install

# Seed database dengan data awal specialty coffee
pnpm run db:seed

# Jalankan backend dalam mode watch
pnpm run start:dev
```
Backend akan aktif di: `http://localhost:3001/api`

### 2. Menjalankan Frontend (Next.js)

Buka terminal baru:
```bash
cd frontend

# Jalankan server frontend Next.js
pnpm run dev
```
Buka browser di: `http://localhost:3000`

---

## 🧪 Menjalankan Pengujian & Coverage Report

Untuk menjalankan pengujian unit dan E2E serta menghasilkan tabel laporan code coverage:

```bash
cd backend

# Jalankan pengujian code coverage
pnpm run test:cov
```

**Hasil Coverage Terbaru:**
- **Lines Coverage**: **82.46%** (Melampaui target minimum > 70%)
- **Statements Coverage**: **82.33%**
- **Functions Coverage**: **80.23%**
- **Total Tests Passed**: **47 / 47 tests passing** (28 E2E + 19 Unit tests)

Untuk menjalankan khusus skenario E2E:
```bash
pnpm run test:e2e
```

---

## 📂 Struktur Repositori

```text
Final Project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Skema database relasional (User, Bean, Recipe, PourStep, Review)
│   │   ├── seed.ts              # Seeder data realistis specialty coffee
│   │   └── dev.db               # SQLite database file
│   ├── src/
│   │   ├── auth/                # JWT Auth, Refresh Token, Strategies, Guards
│   │   ├── beans/               # CRUD Beans & Roastery Stock Management
│   │   ├── recipes/             # Resep seduh, Pour Steps cascade, Ratio Calculator
│   │   ├── reviews/             # Ulasan & Rating komunitas
│   │   ├── uploads/             # Multer local image storage & validation
│   │   ├── mail/                # Nodemailer automated email service
│   │   ├── common/              # Enums, Roles Decorator, Global Guards
│   │   └── prisma/              # PrismaService global module
│   ├── test/
│   │   └── app.e2e-spec.ts      # 28 skenario E2E integration test
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router (page.tsx, layout.tsx, globals.css)
│   │   ├── lib/api.ts           # REST API client
│   │   └── types/index.ts       # TypeScript interfaces
│   └── package.json
├── youtube.link                 # Link video unlisted YouTube
└── README.md                    # Dokumentasi lengkap proyek
```

---

## 🎥 Video Presentasi

Link video YouTube (Unlisted): Lihat file `youtube.link`.
