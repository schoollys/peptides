# PeptideTrust — Go-Live Checklist (MVP)

Статус на конец M5. Отмечайте `[x]` по мере готовности к продакшену.
Легенда: ✅ готово в коде · ⚠️ нужно действие перед запуском · 🔮 после MVP.

## 1. Конфигурация и секреты
- [ ] ⚠️ Сгенерировать прод-секреты: `SESSION_SECRET`, `BADGE_SECRET` (`openssl rand -base64 32`).
- [ ] ⚠️ Задать `DATABASE_URL` на управляемый Postgres (TLS, не localhost).
- [ ] ⚠️ Выставить `DATA_SOURCE=db` в проде.
- [ ] ⚠️ Провайдеры: `KYB_PROVIDER`, `PKI_PROVIDER`, `ANCHOR_PROVIDER` пока `mock` — переключить на реальные перед публичным запуском (см. §5).
- [ ] ⚠️ Все секреты — только в env стораджах (Vercel/Secrets), не в репозитории. `.env*.local` и `.oracle-dev-key.pem` уже в `.gitignore`.

## 2. База данных
- [x] ✅ Схема `db/schema.sql` + миграции `0002…0005` (0005 — `password_reset_tokens`).
- [ ] ⚠️ Применить миграции к прод-БД по порядку.
- [ ] ⚠️ Сидинг прод-данных (не демо): `db:seed` только для стейджинга; в проде — реальные участники.
- [ ] ⚠️ Сменить/удалить демо-аккаунт `demo@peptidetrust.eu` (`db:seed:user`) перед публичным запуском. (Гард: демо-сидеры `db:seed`/`:user`/`:oracle` отказываются работать против прод/удалённой БД без `ALLOW_DEMO_SEED=1` — `lib/demo-seed-guard.ts`.)
- [ ] ⚠️ Бэкапы (PITR) и проверка восстановления.
- [x] ✅ Пул соединений под нагрузку: `lib/db.ts` → `postgres({ max, idle_timeout, connect_timeout })`, тюнится через `DB_POOL_MAX`/`DB_IDLE_TIMEOUT`/`DB_CONNECT_TIMEOUT` с дефолтами.

## 3. Аутентификация и доступ
- [x] ✅ Реальная сессия: scrypt-хэши, подписанные HMAC-cookie (httpOnly, SameSite=Lax, Secure в проде).
- [x] ✅ Серверный гейтинг `/dashboard`, `/submit` (middleware) + криптопроверка в `getSessionUser`/route handlers.
- [x] ✅ Hardening middleware: полная криптопроверка подписи сессии на edge (Web Crypto HMAC-SHA256 + exp), невалидная/просроченная кука чистится и редиректит на /login. Протестировано (valid→200, none/tampered→307).
- [x] ✅ Сброс пароля: одноразовые токены с TTL (хранится только SHA-256, миграция `0005`); `lib/auth/reset.ts` + `/api/auth/forgot-password` (анти-энумерация) + `/api/auth/reset-password` + страница `/reset-password`.
- [x] ✅ Email-доставка: адаптер `lib/email.ts` (Resend через REST без SDK, fail-open в лог) шлёт письмо сброса пароля; без `RESEND_API_KEY` в dev ссылка возвращается/логируется, в проде — warn. ⚠️ Осталось завести Resend и задать `RESEND_API_KEY` + верифицированный `EMAIL_FROM`.
- [ ] 🔮 Верификация email, 2FA для оракулов/стюардов.

## 4. Безопасность
- [x] ✅ Security-заголовки (`next.config.mjs`): nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, HSTS.
- [x] ✅ Rate-limit на `login`/`signup`/`kyb`/`oracle` (in-memory).
- [x] ✅ Адаптер общего стора готов: `rateLimitAsync()` (`lib/rate-limit.ts`) использует Upstash Redis REST при заданных `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, иначе fail-open на in-memory; 4 роута переведены. ⚠️ Осталось завести Upstash и задать env.
- [x] ✅ Анти-reuse COA (`media_hash`) + лимиты размера запроса/полей на приёме COA (`/api/oracle/coa`: тело ≤64 КБ, payload ≤16 КБ, signature ≤4 КБ → 413). ⚠️ Антивирус для реальных файловых загрузок — отдельная будущая поверхность (нужен AV-сервис).
- [x] ✅ CSP через nonce: `proxy.ts` выдаёт per-request nonce, `script-src 'self' 'nonce-…'` (+`'unsafe-eval'` только в dev), `style-src 'unsafe-inline'` (повсеместные inline-стили), `frame-ancestors 'none'`, `object-src 'none'` и т.д. на всех страницах (кроме api/_next/badge/статики). ⚠️ Прогнать smoke на стейджинге на предмет CSP-нарушений (особенно `@vercel/analytics`).
- [x] ✅ CI-гейт (`.github/workflows/ci.yml`): secret-scanning (gitleaks + `.gitleaks.toml`), `npm audit --audit-level=high`, lint, тесты движка. ⚠️ Заработает после инициализации git-репо и пуша в GitHub.

## 5. Доменные вендоры (сейчас mock за абстракциями)
- [x] ✅ KYB: скелет `HttpKybProvider` (`KYB_PROVIDER=http`, `KYB_API_URL`/`KYB_API_KEY`) — async-verify через fetch, call-sites не меняются. ⚠️ Подогнать маппинг запроса/ответа под вендора (Sumsub/Veriff/iDenfy) + ключи.
- [x] ✅ PKI: скелет `ManagedPkiProvider` (`PKI_PROVIDER=managed`) — локальная Ed25519-верификация работает для любых ключей; generate/sign бросают понятную ошибку (в managed это асинхронный KMS/оракул). ⚠️ Подключить async-KMS-клиент в путь подписи COA/custody; ротация ключей оракулов; CRL/отзыв.
- [x] ✅ Anchor: скелет `HttpAnchorProvider` (`ANCHOR_PROVIDER=http`, `ANCHOR_API_URL`/`ANCHOR_API_KEY`/`ANCHOR_CHAIN`) — постит только хеш (ADR-005), call-sites не меняются. ⚠️ Подогнать под реальный L2/нотариус; пайплайн ретраев (`event_outbox`).
- [x] ✅ Пересчёт Trust Score через `packages/core-scoring` после приёма COA (`lib/scoring/recompute.ts` создаёт новый анкеренный score_event).
- [x] ✅ Калибровка скоринга (engine `v2.5.0`): матрица весов привязана к реально собираемым факторам, пороги тиров под реальный диапазон (Platinum 78 / Gold 60 / Silver 42 / Bronze 20). Каталог пересчитан (`npm run recompute:all -- --yes`); UI `scoreToTier` синхронизирован. Инструмент проверки — `npm run score:audit`. ⚠️ Финальный SME sign-off параметров — перед публичным запуском.
- [x] ✅ V1-скоринг (engine `v2.5.0`): Vᵢ-пропагация по `counterparty_links` (no-harm `max(base, propagated)`); условный потолок роли (`upstreamVerified` снимает RETAILER→Gold при верифицированном источнике, CRITICAL-хардкап не обходится); buyer-facing веса VENDOR (FRF-led). Граф контрагентов засеян и визуализирован на профиле («Цепочка поставок»). ⚠️ SME-калибровка FRF-доли/CVF-покрытия и тюнинг демо-данных — открыто.
- [x] ✅ Исправлен hard-cap тира при upheld CRITICAL (`scoring.ts` использует `TIER_CAP_ON_CRITICAL`; 20/20 тестов зелёные).
- [x] ✅ Persisted-tier gap закрыт: read-path (`lib/repository.ts`) применяет CRITICAL-cap до Watch при активном upheld CRITICAL-флаге (зеркалит движковый `TIER_CAP_ON_CRITICAL`). Протестировано (Platinum→Watch→Platinum).

## 6. Публичные поверхности
- [x] ✅ Каталог/профиль/главная на живых данных (M2).
- [x] ✅ Проверка якорного хеша `/verify` → `/api/anchors/verify` (score/coa/flag).
- [x] ✅ Встраиваемый подписанный бейдж `GET /badge/{id}.svg` (кэш 5 мин, `X-PeptideTrust-Sig`), embed-сниппеты на реальный origin.
- [x] ✅ `/compare` на живых данных через `/api/compare` (+ `/api/participants` в диалоге добавления).
- [x] ✅ Крон ре-анкеринга: guarded `GET /api/cron/anchor` (`CRON_SECRET`) + `vercel.json` `crons` (ежедневно 03:00 UTC); общая логика в `lib/anchor/reanchor.ts` (её же зовёт CLI `npm run anchor`). ⚠️ Осталось задать `CRON_SECRET` в env прод.

## 7. Наблюдаемость и эксплуатация
- [x] ✅ Каркас наблюдаемости: `instrumentation.ts` (`onRequestError`) + `lib/observability.ts` шлют ошибки в Sentry через envelope-эндпоинт при заданном `SENTRY_DSN`, иначе graceful no-op (console.error). Зависимостей не добавлено. ⚠️ Осталось: задать `SENTRY_DSN` в env прод.
- [x] ✅ Логи и алерты: `captureMessage()` в `lib/observability.ts` (envelope в Sentry или console-fallback). Подключено: всплеск 429 — централизованный детектор в `lib/rate-limit.ts` (порог 30/мин на scope → 1 алерт/окно); ошибки БД — `lib/data.ts` шлёт `captureException` с тегом `db_error` (раньше тихо падали в мок); thrown 5xx — `instrumentation.onRequestError`. ⚠️ Требует `SENTRY_DSN` для доставки; настроить пороги алертов в Sentry.
- [x] ✅ Health-check эндпоинт `GET /api/health` (liveness + проверка БД, 200/503, `no-store`). Осталось ⚠️ повесить аптайм-мониторинг на него.
- [ ] 🔮 Метрики бизнес-событий (`event_outbox`), дашборды.

## 8. Релиз
- [x] ✅ Прод-сборка зелёная (`npm run build`, все маршруты + middleware/proxy), 20/20 unit-тестов движка. ⚠️ Повторить на стейджинге с прод-env.
- [x] ✅ Lint-гейт настроен по-настоящему: `eslint@9` + flat-config `eslint.config.mjs` (`eslint-config-next/core-web-vitals` + `/typescript`). `npm run lint` → 0 errors. `react-hooks/purity` возвращён в `error` (0 нарушений). `react-hooks/set-state-in-effect` оставлен `warn`: все 15 срабатываний — легитимные эффекты (IntersectionObserver-анимации, чтение браузерного API после гидрации, async-фетч, auth-редирект), их устранение — это рефактор data-layer/SSR (вынос фетчей в Server Components / роут-лоадеры), отдельной задачей.
- [ ] ⚠️ Smoke на стейджинге: auth, KYB, oracle COA, anchor verify, badge SVG+подпись.
- [ ] ⚠️ Юридические страницы (terms/privacy/disclaimer) актуальны и доступны.
- [ ] ⚠️ Резервный план отката (предыдущий деплой), миграции обратимо-совместимы (forward-only).
