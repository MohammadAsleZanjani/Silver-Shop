# Silver Shop

MVP خرید و فروش نقره با یک کاربر فرضی، بدون Authentication. داشبورد موجودی نقد و نقره را نشان می‌دهد، ادمین قیمت و موجودی بازار را تنظیم می‌کند، و هر معامله با قیمت همان لحظه به‌صورت اتمیک در PostgreSQL ثبت می‌شود.

این نسخه نمونه اولیه است و برای Production آماده نیست.

## 1. Requirements

- Node.js 20+
- PostgreSQL 16
- npm

## 2. Install

```bash
npm install
```

## 3. Environment variables

```bash
cp .env.example .env
```

`.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/silver_mvp"
DEFAULT_USER_ID="default-user"
DEFAULT_MARKET_ID="default-market"
```

برای اجرای محلی می‌توانید Postgres را با Docker بالا بیاورید:

```bash
docker compose up -d
```

## 4. Prisma migration

```bash
npx prisma migrate deploy
```

برای محیط توسعه:

```bash
npx prisma migrate dev
```

## 5. Seed database

```bash
npx prisma db seed
```

مقادیر اولیه:

- کاربر `default-user` با `100,000,000` تومان نقد و `100` گرم نقره
- قیمت خرید `250,000` تومان، قیمت فروش `230,000` تومان
- موجودی نقره بازار `10,000` گرم

## 6. Run development server

```bash
npm run dev
```

اپ روی [http://localhost:43123](http://localhost:43123) اجرا می‌شود.

- داشبورد کاربر: `/dashboard`
- پنل ادمین: `/admin`

## 7. Run tests

برای تست‌ها دیتابیس جدا لازم است:

```bash
createdb silver_mvp_test
# یا
psql -c "CREATE DATABASE silver_mvp_test;"
```

سپس migration را روی دیتابیس تست اجرا کنید:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/silver_mvp_test" npx prisma migrate deploy
npm test
```

تست‌ها شامل خرید/فروش، pagination، idempotency و درخواست‌های همزمان هستند.

## 8. Build production

```bash
npm run build
npm start
```

برای استقرار به یک `DATABASE_URL` معتبر PostgreSQL نیاز دارید. بعد از دپلوی، migration و seed را یک‌بار اجرا کنید.

## API

```text
GET  /api/market
GET  /api/me
POST /api/orders/buy
POST /api/orders/sell
GET  /api/transactions
GET  /api/transactions/:id
GET  /api/admin/market
PUT  /api/admin/market
GET  /api/admin/transactions
```

خرید و فروش باید هدر `Idempotency-Key` از نوع UUID داشته باشند. قیمت نهایی همیشه از دیتابیس خوانده می‌شود و موجودی‌ها داخل یک تراکنش با `SELECT ... FOR UPDATE` به‌روز می‌شوند.
