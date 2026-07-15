# Dry Leaf — цифрове меню

> 🎨 **Об'єднану версію** зібрано на основі робочого backend/бекенд-проєкту з
> повністю оновленим клієнтським інтерфейсом із нового дизайну. Повний перелік
> змін, вирішених конфліктів і покрокову інструкцію див. у **[`CHANGES.md`](./CHANGES.md)**.

Преміальне digital-меню для двох закладів (**Dry Leaf** — Проспект Героїв Харкова 74, **Citadel** — вул. Короленко 4): меню, кошик, оплата (Stripe / Google Pay / Apple Pay), бронювання столиків, QR-замовлення за столиком та захищена адмін-панель з realtime-сповіщеннями.

## Стек

Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · PostgreSQL + Prisma · Auth.js · Stripe · Supabase Realtime.

## Запуск локально

### 1. Залежності
```bash
npm install
```

### 2. Змінні оточення
```bash
cp .env.example .env
```
Заповни `DATABASE_URL`, `NEXTAUTH_SECRET` (`openssl rand -base64 32`), ключі Stripe.

### 3. База даних
Потрібен PostgreSQL. Локально через Docker:
```bash
docker run --name dryleaf-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dryleaf -p 5432:5432 -d postgres:16
```
Або візьми готову базу в Supabase / Neon і встав connection string у `DATABASE_URL`.

### 4. Схема + демо-дані
```bash
npm run db:push      # створити таблиці
npm run db:seed      # 2 заклади, 20+ страв, столики, тест-замовлення, адмін
```

### 5. Старт
```bash
npm run dev
```
→ http://localhost:3000

### Адмін
http://localhost:3000/admin/login
Логін/пароль — зі `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (за замовчуванням `admin@dryleaf.local` / `dryleaf123`).

## Stripe (оплата)

Для тестування вебхуків локально:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Скопіюй `whsec_...` у `STRIPE_WEBHOOK_SECRET`.

Google Pay / Apple Pay працюють через Stripe Payment Request API автоматично на підтримуваних пристроях. Для Apple Pay у проді потрібна верифікація домену в Stripe Dashboard.

## QR замовлення за столиком

Кожен столик має унікальний `code`. QR веде на `/{appUrl}/t/{code}` → клієнт одразу в меню з прив'язаним столиком. Згенерувати QR-коди можна в адмін-панелі (розділ «Заклади → Столики»).

## Структура

```
prisma/        schema.prisma + seed.ts
src/app/       (client) маршрути меню/кошика/оплати + /admin
src/components/ client | admin | ui
src/server/    server actions (orders, reservations, menu)
src/lib/       prisma, auth, stripe, money, utils
src/stores/    cart (zustand)
```

## Маршрути

| URL | Опис |
|-----|------|
| `/` | Hero + вибір закладу |
| `/v/dry-leaf` | Меню Dry Leaf |
| `/v/citadel` | Меню Citadel |
| `/v/[slug]/reserve` | Бронювання столика |
| `/v/[slug]/checkout` | Оформлення + оплата |
| `/v/[slug]/order/[id]` | Підтвердження замовлення |
| `/t/[code]` | QR-вхід за столиком |
| `/admin/login` | Вхід в адмін-панель |
| `/admin` | Дашборд |
| `/admin/orders` | Замовлення |
| `/admin/reservations` | Бронювання |
| `/admin/menu` | Управління меню |
| `/admin/venues` | Заклади та столики |

## Структура проекту (53 файли)

```
src/
├── app/
│   ├── admin/               # Захищена адмін-панель
│   ├── api/                 # Route Handlers (auth, checkout, webhook)
│   ├── t/[tableCode]/       # QR-вхід за столиком
│   ├── v/[venueSlug]/       # Меню, кошик, оформлення, бронь
│   ├── error.tsx            # Global error boundary
│   ├── not-found.tsx        # 404
│   ├── layout.tsx           # Root layout + fonts + SessionProvider
│   ├── page.tsx             # Hero
│   └── providers.tsx        # NextAuth SessionProvider
├── components/
│   ├── admin/               # Sidebar, MenuEditor, MetricCard, StatusBadge
│   └── client/              # HeroSection, DishCard, DishModal, Cart*
├── lib/                     # prisma, auth, stripe, money, utils
├── server/                  # Server Actions: menu, orders, reservations, admin
├── stores/                  # Zustand cart store
├── styles/                  # globals.css
└── types/                   # next-auth.d.ts (role augmentation)
```
"# rezervmenu" 
