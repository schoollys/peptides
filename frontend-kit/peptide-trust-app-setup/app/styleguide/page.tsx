'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Search,
  ShieldCheck,
  Star,
  TriangleAlert,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StyleguideRow, StyleguideSection } from '@/components/styleguide/section'

const colorSwatches: { name: string; hex: string; desc: string }[] = [
  { name: 'brand-50',      hex: '#e8e9ff', desc: 'Accent bg' },
  { name: 'brand-100',     hex: '#d6d9fc', desc: 'Light indigo' },
  { name: 'brand-400',     hex: '#7f7dfc', desc: 'Mid indigo' },
  { name: 'brand-600',     hex: '#533afd', desc: 'Primary / CTA' },
  { name: 'brand-700',     hex: '#4032c8', desc: 'Hover' },
  { name: 'brand-900',     hex: '#1c1e54', desc: 'Dark ink' },
  { name: 'brand-blurple', hex: '#635bff', desc: 'Focus ring' },
  { name: 'neutral-990',   hex: '#061b31', desc: 'Headings' },
  { name: 'neutral-600',   hex: '#50617a', desc: 'Body text' },
  { name: 'neutral-500',   hex: '#64748d', desc: 'Subdued' },
  { name: 'neutral-400',   hex: '#7d8ba4', desc: 'Caption' },
  { name: 'neutral-25',    hex: '#f8fafd', desc: 'Page bg' },
  { name: 'neutral-50',    hex: '#e5edf5', desc: 'Borders' },
  { name: 'error',         hex: '#d8351e', desc: 'Error / Watch' },
  { name: 'success',       hex: '#00b261', desc: 'Success' },
]

const accentSwatches: { name: string; hex: string; desc: string }[] = [
  { name: 'lemon',   hex: '#f9b900', desc: 'Gradient accent' },
  { name: 'orange',  hex: '#ff6118', desc: 'Gradient accent' },
  { name: 'magenta', hex: '#f44bcc', desc: 'Gradient accent' },
  { name: 'ruby',    hex: '#ea2261', desc: 'Gradient accent' },
]

const tierColors: { tier: string; hex: string; desc: string }[] = [
  { tier: 'Platinum', hex: '#8ca0b8', desc: 'Высший тир' },
  { tier: 'Gold', hex: '#c9a227', desc: 'Золотой' },
  { tier: 'Silver', hex: '#9aa0a6', desc: 'Серебряный' },
  { tier: 'Bronze', hex: '#b07a45', desc: 'Бронзовый' },
  { tier: 'Watch', hex: '#d8351e', desc: 'Наблюдение' },
]

const tableData = [
  { company: 'AlphaPep Lab', score: 94.7, tier: 'Platinum', status: 'Верифицирован', date: '2025-03-12' },
  { company: 'BioSynth RU', score: 81.0, tier: 'Gold', status: 'Верифицирован', date: '2025-01-08' },
  { company: 'PrimePeptides', score: 67.0, tier: 'Silver', status: 'Верифицирован', date: '2024-12-01' },
  { company: 'ChemLab LLC', score: 42.3, tier: 'Bronze', status: 'Частично', date: '2024-09-17' },
  { company: 'QuickPep OOO', score: 18.0, tier: 'Watch', status: 'Инцидент', date: '2024-06-30' },
]

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Platinum: { bg: '#e8eef5', text: '#4d6580' },
    Gold:     { bg: '#fdf3d7', text: '#8a6a10' },
    Silver:   { bg: '#f0f1f2', text: '#5a6268' },
    Bronze:   { bg: '#f7ede0', text: '#7a4f22' },
    Watch:    { bg: '#fdecea', text: '#a02414' },
  }
  const c = colors[tier] ?? { bg: '#e5edf5', text: '#50617a' }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums"
      style={{ background: c.bg, color: c.text }}
    >
      {tier}
    </span>
  )
}

export default function StyleguidePage() {
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [loading, setLoading] = useState(false)

  const simulateLoad = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1800)
  }

  return (
    <>
    <title>Styleguide — PeptideTrust</title>
    <div className="min-h-screen bg-neutral-25">
      {/* Page header */}
      <div className="border-b border-border bg-card shadow-stripe-xs">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded text-white text-xs bg-brand-600">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              PeptideTrust Design System
            </span>
          </div>
          <h1 className="text-3xl font-light tracking-display text-neutral-990">
            Styleguide
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Все компоненты и состояния на основе токенов Stripe Helios DS. Inter + Source Code Pro.
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-14">

        {/* ── Colors ── */}
        <StyleguideSection
          id="colors"
          title="Цветовая палитра"
          description="Точные значения токенов из Stripe Helios CSS (--hds-color-core-*)."
        >
          <StyleguideRow label="Brand + Neutrals">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 w-full">
              {colorSwatches.map((s) => (
                <div key={s.name} className="flex flex-col gap-1.5">
                  <div
                    className="h-10 w-full rounded-md border border-black/5"
                    style={{ background: s.hex }}
                  />
                  <div>
                    <p className="text-xs font-medium font-mono text-neutral-990">
                      {s.name}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-neutral-300">
                      {s.hex}
                    </p>
                    <p className="text-xs text-neutral-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </StyleguideRow>
          <StyleguideRow label="Trust Score Тиры">
            <div className="flex flex-wrap gap-3">
              {tierColors.map((t) => (
                <div key={t.tier} className="flex flex-col gap-1.5">
                  <div
                    className="h-8 w-20 rounded-full border border-black/5"
                    style={{ background: t.hex }}
                  />
                  <div>
                    <p className="text-xs font-medium text-neutral-990">{t.tier}</p>
                    <p className="text-xs font-mono tabular-nums text-neutral-300">{t.hex}</p>
                    <p className="text-xs text-neutral-400">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </StyleguideRow>
          <StyleguideRow label="Gradient Accents">
            <div className="flex flex-wrap gap-3">
              {accentSwatches.map((s) => (
                <div key={s.name} className="flex flex-col gap-1.5">
                  <div
                    className="h-8 w-20 rounded-md border border-black/5"
                    style={{ background: s.hex }}
                  />
                  <div>
                    <p className="text-xs font-medium font-mono text-neutral-990">{s.name}</p>
                    <p className="text-xs font-mono tabular-nums text-neutral-300">{s.hex}</p>
                    <p className="text-xs text-neutral-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </StyleguideRow>
        </StyleguideSection>

        {/* ── Typography ── */}
        <StyleguideSection
          id="typography"
          title="Типографика"
          description="Inter (sans) — заголовки 300–400 с отрицательным tracking. Source Code Pro (mono) — хеши, скор."
        >
          <div className="flex flex-col gap-5 rounded-xl bg-card p-6 border border-border shadow-stripe-sm">
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 text-neutral-400">Display — 62px, weight 300, ls −0.03</p>
              <p className="text-[3.875rem] font-light leading-tight tracking-display text-neutral-990">
                PeptideTrust
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 text-neutral-400">H1 — 34px, weight 400, ls −0.01</p>
              <h1 className="text-[2.125rem] font-normal text-neutral-990 tracking-heading">
                Реестр доверия участников рынка
              </h1>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 text-neutral-400">H2 — 26px, weight 400</p>
              <h2 className="text-[1.625rem] font-normal text-neutral-990 tracking-heading">
                Верификация и Trust Score
              </h2>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 text-neutral-400">H3 — 21px</p>
              <h3 className="text-[1.3125rem] font-normal text-neutral-990 tracking-heading">
                Методология оценки
              </h3>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 text-neutral-400">Body — 16px, weight 400, lh 1.5</p>
              <p className="text-base leading-relaxed text-neutral-600">
                PeptideTrust — нейтральный публичный реестр, который собирает и публикует верифицированные данные об участниках рынка пептидных препаратов. Мы не продаём, не рекомендуем и не рекламируем. Только факты.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 text-neutral-400">Mono / Hash — Source Code Pro</p>
              <p className="font-mono text-sm tabular-nums text-neutral-600">
                sha256: 3b4f6a1c9e2d8b5f7a0c4e1d6b3f9a2e8c5d7b0f4a1e6c3b9d2f8a5e7c0d4b
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 text-neutral-400">Caption — 12px</p>
              <p className="text-xs text-neutral-400">
                Последнее обновление: 12 марта 2025 · Реестровый ID: PT-00847
              </p>
            </div>
          </div>
        </StyleguideSection>

        {/* ── Buttons ── */}
        <StyleguideSection
          id="buttons"
          title="Кнопки"
          description="Все варианты и размеры. Stripe-кнопка: borderRadius 4px, weight 500."
        >
          <StyleguideRow label="Варианты">
            <Button variant="default">Первичная</Button>
            <Button variant="secondary">Вторичная</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Деструктивная</Button>
            <Button variant="link">Ссылка</Button>
          </StyleguideRow>
          <StyleguideRow label="Размеры">
            <Button size="lg">Large</Button>
            <Button size="default">Default</Button>
            <Button size="sm">Small</Button>
            <Button size="xs">XS</Button>
            <Button size="icon" aria-label="поиск"><Search className="h-4 w-4" /></Button>
          </StyleguideRow>
          <StyleguideRow label="Состояния">
            <Button variant="default" disabled>Disabled</Button>
            <Button variant="default" onClick={simulateLoad} disabled={loading}>
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {loading ? 'Загрузка...' : 'Loading (клик)'}
            </Button>
            <Button variant="default">
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              С иконкой
            </Button>
            <button
              className="inline-flex items-center justify-center rounded border border-error bg-error-50 text-error px-3 py-1.5 text-sm font-medium transition-colors"
              aria-invalid="true"
            >
              Error
            </button>
          </StyleguideRow>
        </StyleguideSection>

        {/* ── Inputs ── */}
        <StyleguideSection
          id="inputs"
          title="Поля ввода и Select"
          description="Border-radius 6px (Stripe input). Focus — blurple #635bff."
        >
          <StyleguideRow label="Input — состояния" vertical>
            <div className="w-full max-w-sm">
              <label className="text-xs mb-1 block text-neutral-600">Default</label>
              <Input
                placeholder="Поиск по реестру..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <div className="w-full max-w-sm">
              <label className="text-xs mb-1 block text-neutral-600">С иконкой поиска</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <Input className="pl-8" placeholder="AlphaPep Lab..." />
              </div>
            </div>
            <div className="w-full max-w-sm">
              <label className="text-xs mb-1 block text-neutral-600">Error</label>
              <Input aria-invalid placeholder="Некорректный ИНН..." />
            </div>
            <div className="w-full max-w-sm">
              <label className="text-xs mb-1 block text-neutral-600">Disabled</label>
              <Input disabled placeholder="Недоступно" />
            </div>
          </StyleguideRow>
          <StyleguideRow label="Select" vertical>
            <div className="w-full max-w-sm">
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тир..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="watch">Watch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </StyleguideRow>
        </StyleguideSection>

        {/* ── Badges ── */}
        <StyleguideSection
          id="badges"
          title="Бейджи и Пиллы"
          description="Pill — borderRadius 9999px. Тиры Trust Score с кастомными цветами."
        >
          <StyleguideRow label="Shadcn Badge — варианты">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </StyleguideRow>
          <StyleguideRow label="Trust Score пиллы">
            <TierBadge tier="Platinum" />
            <TierBadge tier="Gold" />
            <TierBadge tier="Silver" />
            <TierBadge tier="Bronze" />
            <TierBadge tier="Watch" />
          </StyleguideRow>
          <StyleguideRow label="Статус-пиллы">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: '#d7f4e5', color: '#00773e' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Верифицирован
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-error-50" style={{ color: '#a02414' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Инцидент
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: '#fff8e6', color: '#8a6a10' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              На проверке
            </span>
          </StyleguideRow>
        </StyleguideSection>

        {/* ── Cards ── */}
        <StyleguideSection
          id="cards"
          title="Карточки"
          description="borderRadius 16px, shadow-stripe-sm, белый фон на #f8fafd странице."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Company card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>AlphaPep Lab</CardTitle>
                    <CardDescription>AlphaPep Lab · p-001</CardDescription>
                  </div>
                  <TierBadge tier="Platinum" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-light tabular-nums text-brand-600 tracking-heading">94</span>
                  <span className="text-sm mb-1 text-neutral-400">/100 Trust Score</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  Верифицированный производитель. Все лабораторные сертификаты актуальны. Инцидентов нет с 2021.
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs tabular-nums text-neutral-300">Обновлено 12 марта 2025</span>
                <Button size="sm" variant="ghost" className="text-brand-600" asChild>
                  <Link href="/p/p-001">Подробнее</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Watch card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>QuickPep OOO</CardTitle>
                    <CardDescription>QuickPep OOO · p-005</CardDescription>
                  </div>
                  <TierBadge tier="Watch" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-light tabular-nums text-error tracking-heading">18</span>
                  <span className="text-sm mb-1 text-neutral-400">/100 Trust Score</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  Зафиксирован инцидент 30.06.2024. Сертификаты просрочены. Рекомендован особый контроль.
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs tabular-nums text-neutral-300">Обновлено 30 июня 2024</span>
                <Button size="sm" variant="ghost" className="text-brand-600" asChild>
                  <Link href="/p/p-005">Подробнее</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </StyleguideSection>

        {/* ── Table ── */}
        <StyleguideSection
          id="table"
          title="Таблица"
          description="tabular-nums для чисел. Tier-пиллы в ячейках."
        >
          <div className="rounded-xl bg-card border border-border overflow-hidden shadow-stripe-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Trust Score</TableHead>
                  <TableHead>Тир</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="tabular-nums">Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.company}>
                    <TableCell className="font-medium text-neutral-990">{row.company}</TableCell>
                    <TableCell
                      className="tabular-nums font-mono font-medium"
                      style={{ color: row.score >= 80 ? '#533afd' : row.score >= 50 ? '#50617a' : '#d8351e' }}
                    >
                      {row.score.toFixed(1)}
                    </TableCell>
                    <TableCell><TierBadge tier={row.tier} /></TableCell>
                    <TableCell className="text-neutral-600">{row.status}</TableCell>
                    <TableCell className="tabular-nums text-xs text-neutral-300">{row.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </StyleguideSection>

        {/* ── Alerts ── */}
        <StyleguideSection
          id="alerts"
          title="Алерты"
          description="Используются для системных уведомлений, предупреждений и статусов."
        >
          <Alert>
            <Info className="h-4 w-4 text-brand-600" />
            <AlertTitle>Информация</AlertTitle>
            <AlertDescription>
              Данные реестра обновляются автоматически каждые 24 часа. Актуальность гарантируется командой верификаторов.
            </AlertDescription>
          </Alert>
          <Alert className="border-success" style={{ background: '#f0fbf5' }}>
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertTitle style={{ color: '#00773e' }}>Верификация успешна</AlertTitle>
            <AlertDescription>
              Компания AlphaPep Lab прошла полную проверку. Все документы актуальны.
            </AlertDescription>
          </Alert>
          <Alert style={{ borderColor: '#f9b900', background: '#fffbeb' }}>
            <TriangleAlert className="h-4 w-4" style={{ color: '#b07a00' }} />
            <AlertTitle style={{ color: '#7a5500' }}>Внимание</AlertTitle>
            <AlertDescription>
              Часть сертификатов истекает в течение 30 дней. Рекомендуем обновить документы.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Инцидент зафиксирован</AlertTitle>
            <AlertDescription>
              QuickPep OOO помещён в список наблюдения 30.06.2024. Подробности в Логе инцидентов.
            </AlertDescription>
          </Alert>
        </StyleguideSection>

        {/* ── Tabs ── */}
        <StyleguideSection
          id="tabs"
          title="Вкладки"
          description="Default (pill-tabs) и Line-variant."
        >
          <StyleguideRow label="Variant: default">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="documents">Документы</TabsTrigger>
                <TabsTrigger value="incidents">Инциденты</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="rounded-lg border border-border bg-card p-4 mt-3">
                  <p className="text-sm text-neutral-600">
                    Основные данные организации: наименование, ИНН, Trust Score, тир и история изменений.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="documents">
                <div className="rounded-lg border border-border bg-card p-4 mt-3">
                  <p className="text-sm text-neutral-600">
                    Список загруженных и верифицированных документов: сертификаты GMP, COA, лицензии.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="incidents">
                <div className="rounded-lg border border-border bg-card p-4 mt-3">
                  <p className="text-sm text-neutral-600">
                    История инцидентов отсутствует. Последняя проверка: 12 марта 2025.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </StyleguideRow>
          <StyleguideRow label="Variant: line">
            <Tabs defaultValue="score" className="w-full">
              <TabsList variant="line">
                <TabsTrigger value="score">Trust Score</TabsTrigger>
                <TabsTrigger value="history">История</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
              </TabsList>
              <TabsContent value="score">
                <div className="rounded-lg border border-border bg-card p-4 mt-3">
                  <p className="text-sm tabular-nums font-mono text-brand-600">
                    score: 94 / 100 · tier: Platinum
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="history">
                <div className="rounded-lg border border-border bg-card p-4 mt-3">
                  <p className="text-sm text-neutral-600">История изменений Trust Score за 24 месяца.</p>
                </div>
              </TabsContent>
              <TabsContent value="api">
                <div className="rounded-lg border border-border bg-card p-4 mt-3">
                  <p className="font-mono text-xs text-neutral-600">
                    GET /api/v1/trust/PT-00847
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </StyleguideRow>
        </StyleguideSection>

        {/* ── Skeleton ── */}
        <StyleguideSection
          id="skeleton"
          title="Skeleton / Loading"
          description="Placeholder для асинхронных данных."
        >
          <div className="rounded-xl bg-card border border-border p-6 flex flex-col gap-4 shadow-stripe-sm">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
        </StyleguideSection>

        {/* ── Shadows ── */}
        <StyleguideSection
          id="shadows"
          title="Тени Stripe"
          description="Двухслойные тени (top rgba(0,55,112) + bottom rgba(0,59,137))."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => {
              const shadows: Record<string, string> = {
                xs: '0 2px 10px 0 rgba(0,55,112,.06), 0 1px 4px 0 rgba(0,59,137,.04)',
                sm: '0 5px 14px 0 rgba(0,55,112,.08), 0 2px 8px 0 rgba(0,59,137,.05)',
                md: '0 6px 22px 0 rgba(0,55,112,.10), 0 4px 8px 0 rgba(0,59,137,.02)',
                lg: '0 15px 40px -2px rgba(0,55,112,.10), 0 5px 20px -2px rgba(0,59,137,.04)',
                xl: '0 20px 80px -16px rgba(0,55,112,.14), 0 10px 60px -16px rgba(0,59,137,.06)',
              }
              return (
                <div
                  key={size}
                  className="flex h-20 items-center justify-center rounded-xl bg-card"
                  style={{ boxShadow: shadows[size] }}
                >
                  <span className="text-xs font-mono text-neutral-400">
                    stripe-{size}
                  </span>
                </div>
              )
            })}
          </div>
        </StyleguideSection>

        {/* ── Gradient Mesh ── */}
        <StyleguideSection
          id="mesh"
          title="Gradient Mesh"
          description="Сигнатурный hero-меш Stripe: cream → orange → magenta → ruby → lavender."
        >
          <div className="overflow-hidden rounded-xl h-40 w-full stripe-mesh" />
        </StyleguideSection>

      </main>
    </div>
    </>
  )
}
