# Деплой dryleaf на Render (бесплатно)

Оплата картой (Stripe) выключена — заказы принимаются с оплатой на месте.
Когда подключишь LiqPay/mono — допишем платёжный модуль.

## Шаг 1. База данных — Neon (neon.tech)

1. Зарегистрируйся на https://neon.tech (можно через GitHub).
2. Create Project → имя любое, регион Europe (Frankfurt).
3. На дашборде скопируй **Connection string** (кнопка Connect), вида:
   `postgresql://user:пароль@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

⚠️ Не бери Postgres на самом Render — бесплатная база там удаляется через 30 дней.

## Шаг 2. Код — GitHub

1. Зарегистрируйся/зайди на https://github.com → New repository → `dryleaf` (private можно).
2. Залей содержимое этой папки (без `node_modules` — он в .gitignore).
   Через сайт: "uploading an existing file" → перетащить файлы.
   Или через git:
   ```
   git init && git add . && git commit -m "init"
   git remote add origin https://github.com/ТВОЙ_НИК/dryleaf.git
   git push -u origin main
   ```

## Шаг 3. Render

1. https://render.com → New → Web Service → подключи GitHub-репозиторий.
2. Настройки:
   - Runtime: **Node**
   - Build Command: `npm install && npx prisma db push && npm run build`
   - Start Command: `npm start`
   - Plan: **Free**
3. Environment Variables:

   | Ключ | Значение |
   |---|---|
   | `DATABASE_URL` | строка из Neon (шаг 1) |
   | `NEXTAUTH_SECRET` | длинная случайная строка |
   | `NEXTAUTH_URL` | `https://<имя-сервиса>.onrender.com` |
   | `NEXT_PUBLIC_APP_URL` | тот же URL |
   | `SEED_ADMIN_EMAIL` | email для входа в админку |
   | `SEED_ADMIN_PASSWORD` | пароль админки (не дефолтный!) |

   Stripe-переменные НЕ добавляй — без них включается режим "оплата на месте".

## Шаг 4. Наполнить базу (один раз!)

Для первого деплоя временно поменяй Build Command на:

```
npm install && npx prisma db push && npm run db:seed && npm run build
```

Дождись успешного деплоя (появятся 2 заведения, меню, столики, админ),
затем **обязательно верни** Build Command без `npm run db:seed`:

```
npm install && npx prisma db push && npm run build
```

⚠️ Сид полностью очищает базу — если оставить, каждый деплой будет стирать заказы.

## Шаг 5. Проверка

- Меню: `https://<имя>.onrender.com`
- Админка: `https://<имя>.onrender.com/admin/login` (email/пароль из переменных)
- QR столиков генерируются в админке → Venues (нужен NEXT_PUBLIC_APP_URL).

## Известное ограничение Free-плана

Сервис засыпает после 15 минут простоя; первое открытие — до ~50 сек.
Лечится бесплатным пингером: https://cron-job.org → задача GET на URL сайта каждые 10 минут.
Либо платный план Render ($7/мес) — без засыпания.
