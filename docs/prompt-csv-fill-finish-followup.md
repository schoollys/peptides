# Промпт-доводчик: верификация и дозаполнение FILL_FINISH-строк

Targeted follow-up к `prompt-csv-fill-finish.md`. Не собираем новых участников —
**доводим до боевого качества** уже найденные строки фасовщиков из
`reports/fill_finish_v1.csv` (импортированы в `peptide_trust_registry_v2.csv` как
`p-037…p-046`). Закрываем 3 пробела: (1) `factor_CVF_B` у 4 строк; (2) верификация
юрлиц `L2/PROVISIONAL`; (3) согласование `verified_legal/kyb_level/trust_ceiling`
+ выверка `updated_days_ago`. Вставляй блок ниже целиком.

---

```text
РОЛЬ
Ты — KYB/комплаенс-верификатор реестра доверия RUO-пептидов. Тебе дан НАБОР уже
найденных строк контрактных фасовщиков (FILL_FINISH / CDMO). Новых компаний НЕ
добавляй. Задача — ВЕРИФИЦИРОВАТЬ и дозаполнить перечисленные ниже строки и
вернуть для каждой ОДНУ обновлённую строку в той же 31-колоночной схеме
(заголовок — в конце промпта; порядок колонок НЕ менять).
ГЛАВНЫЙ ПРИНЦИП: НЕ ВЫДУМЫВАЙ. Каждое непустое/повышенное значение опирается на
публичный проверяемый источник, URL которого кладёшь в _source_url/_notes. Нет
подтверждения — НЕ повышай статус; снижай _confidence и поясняй в provisional_reason.

═══════════════════════════════════════════════════════════════════════
ЗАДАЧА 1 — Верификация юрлиц (привести verified_legal в соответствие)
═══════════════════════════════════════════════════════════════════════
Сейчас у части строк verified_legal=true, но в _notes стоит «номер требует
верификации» — это противоречие. Для КАЖДОЙ компании ниже найди юрлицо + рег.номер
в публичном реестре и приведи поля в согласованное состояние:
- НАЙДЕНО в реестре → verified_legal=true; впиши рег.номер и URL реестра в
  _source_url/_notes; подними kyb_level/trust_ceiling/status по факту регуляторики.
- НЕ НАЙДЕНО → verified_legal=false; status=PROVISIONAL; заполни provisional_reason
  (что именно искать и где); снизь _confidence.

Реестры: Handelsregister/Unternehmensregister (DE) · ZEFIX/Moneyhouse (CH) ·
Companies House (GB) · Registro Imprese / AIFA (IT) · INPI/Infogreffe + SIREN (FR) ·
Bolagsverket (SE) · EudraGMDP (EU GMP cert + manufacturing authorisation) ·
FDA Establishment Registration / Inspection Classification.

Строки к верификации (display_name ; domain ; что проверить):
1. Adragos Pharma GmbH ; adragos-pharma.com ; Handelsregister München (HRB-номер); EudraGMDP по площадкам Jura CH / Maisons-Alfort FR / Livron FR.
2. Famar Group SA ; famar.com ; SIREN/юрлицо FR + площадка Homburg DE (бывш. MiP Pharma) в EudraGMDP/BfArM; подтвердить sterile fill-finish + lyo НАПРЯМУЮ на сайте Famar (сейчас источник — сторонний треккер).
3. Recipharm Cramlington Ltd ; recipharm.com ; Companies House (company number) + MHRA Establishment License / EudraGMDP по площадке Cramlington (есть ли lyo на этом сайте).
4. PCI Pharma Services (UK) Ltd ; pciservices.com ; Companies House UK (юрлицо) + MHRA + EudraGMDP по Holmes Chapel (GB) / Millmount (IE); подтвердить sterile fill-finish + lyo. При подтверждении — поднять с PROVISIONAL/L1.
5. Catalent Germany Eberbach GmbH ; catalent.com ; Handelsregister Mannheim (HRB) + EudraGMDP Eberbach. ОТДЕЛЬНО: после сделки Novo Holdings (2024) подтвердить, что Eberbach остаётся доступной CDMO-площадкой (не выведена под кэптив); иначе зафиксировать риск и снизить RF/_confidence.

═══════════════════════════════════════════════════════════════════════
ЗАДАЧА 2 — Дозаполнить factor_CVF_B (вес 15% у роли FILL_FINISH)
═══════════════════════════════════════════════════════════════════════
factor_CVF_B = ВЕРИФИЦИРОВАННЫЕ B2B-подтверждения: публично названный клиент/бренд/
фарма, рамочный договор, пресс-релиз о партнёрстве, tech-transfer. Заполни 0–100
ТОЛЬКО при таком публичном подтверждении (URL обязателен); иначе оставь пусто.
Строки, где CVF_B сейчас пуст: Adragos Pharma, Recipharm Cramlington, Famar Group,
PCI Pharma. (У остальных — Vetter/Corden/Siegfried/Recipharm AB/Lonza/Catalent —
CVF_B уже проставлен; трогай только при наличии нового источника.)

═══════════════════════════════════════════════════════════════════════
ЗАДАЧА 3 — Выверить updated_days_ago (свежесть; сильно влияет на Score)
═══════════════════════════════════════════════════════════════════════
updated_days_ago = дни с ПОСЛЕДНЕЙ верифицируемой даты (GMP-инспекция/сертификат/
пресс-релиз/обновление страницы Quality). Сейчас значения проставлены оценочно и
доминируют над скором (decay по классам A≤7 / B≤30 / C≤90 / D>90 дней). Для каждой
строки подставь дату из РЕАЛЬНОГО источника (дата сертификата EudraGMDP, последней
FDA-инспекции, пресс-релиза) и пересчитай дни от сегодняшней даты; URL — в _notes.
Если свежую дату не найти — оставь как есть и пометь в _notes «дата оценочная».

═══════════════════════════════════════════════════════════════════════
ПРАВИЛА ФОРМАТА (как в основном промпте — иначе ломается парсер)
═══════════════════════════════════════════════════════════════════════
- 31 поле на строку; разделитель — запятая; ВНУТРИ ПОЛЕЙ запятые ЗАПРЕЩЕНЫ (только «;»).
- Кавычки не использовать; UTF-8; одна компания = одна строка.
- role_code = FILL_FINISH для всех.
- score / tier / dominant_factor / is_balanced — ОСТАВЬ ПУСТЫМИ (их считает движок).
- Согласованность: status=ACTIVE только при verified_legal=true; kyb_level↔trust_ceiling
  (L0≈65 / L1≈72–75 / L2≈85–90 / L3≈95–100); L3 требует подтверждённой регуляторики.

═══════════════════════════════════════════════════════════════════════
ВЫВОД
═══════════════════════════════════════════════════════════════════════
1) Готовые ОБНОВЛЁННЫЕ строки (по одной на каждую из 5 компаний выше), строго 31
   поле, без запятых внутри полей, score/tier пустые. Можно с заголовком сверху.
2) Краткий changelog по каждой строке: что подтверждено, каким источником (URL),
   что изменилось (verified_legal/kyb_level/trust_ceiling/CVF_B/updated_days_ago),
   что осталось PROVISIONAL и почему.

ЗАГОЛОВОК ДЛЯ КОПИРОВАНИЯ:
role_code,display_name,domain,jurisdiction,status,verified_legal,kyb_level,trust_ceiling,tests_count,updated_days_ago,dominant_factor,is_balanced,score,tier,contact_website,contact_email,contact_telegram,factor_QEF,factor_PCF,factor_SCIF,factor_TRF,factor_FRF,factor_CCF,factor_CVF,factor_CVF_B,factor_RF,provisional_reason,_source_url,_data_completeness,_confidence,_notes
```
