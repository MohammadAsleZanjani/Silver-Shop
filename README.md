# Silver Shop

MVP خرید و فروش نقره با یک کاربر فرضی، بدون Authentication. داشبورد موجودی نقد و نقره را نشان می‌دهد، ادمین قیمت و موجودی بازار را تنظیم می‌کند، و هر معامله با قیمت همان لحظه به‌صورت اتمیک ثبت می‌شود.

این نسخه نمونه اولیه است و برای Production آماده نیست.

## اجرا بدون Docker

فقط Node.js 20+ لازم است. Postgres داخل خود پروژه با PGlite بالا می‌آید؛ نه Docker لازم است، نه نصب PostgreSQL.

```bash
npm install
npm run dev
```

اپ روی [http://localhost:43123](http://localhost:43123) اجرا می‌شود.

- داشبورد کاربر: `/dashboard`
- پنل ادمین: `/admin`

`npm run dev` خودش این‌ها را انجام می‌دهد:

1. Postgres جاسازی‌شده را روی پورت `54329` بالا می‌آورد
2. migration را اجرا می‌کند
3. داده اولیه را seed می‌کند
4. سرور Next.js را راه می‌اندازد

داده محلی در پوشه `.pglite-data` می‌ماند.

## اتصال به Postgres خودتان

اگر از قبل PostgreSQL دارید، Docker لازم نیست. در `.env` آدرس مستقیم دیتابیس را بگذارید:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/silver_mvp"
SKIP_EMBEDDED_DB=1
```

بعد:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev:external
```

## تست‌ها

```bash
npm test
```

تست‌ها هم از Postgres جاسازی‌شده استفاده می‌کنند و Docker نمی‌خواهند.

## Build

```bash
npm run build
SKIP_EMBEDDED_DB=1 DATABASE_URL="postgresql://..." npm start
```

برای production باید `DATABASE_URL` یک PostgreSQL واقعی باشد.

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
