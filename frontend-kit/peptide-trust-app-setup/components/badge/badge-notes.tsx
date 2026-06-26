import { ShieldCheck, Clock, Link2, AlertTriangle } from 'lucide-react'

interface Note {
  icon: React.ReactNode
  title: string
  body: string
  accent?: 'info' | 'warning'
}

const NOTES: Note[] = [
  {
    icon: <ShieldCheck size={15} strokeWidth={2} />,
    title: 'Серверная подпись (X-Sig)',
    body:  'Каждый SVG подписывается приватным ключом PeptideTrust на сервере. Подделка числа Score без ключа делает подпись недействительной — браузер не кэширует изменённый файл.',
    accent: 'info',
  },
  {
    icon: <Clock size={15} strokeWidth={2} />,
    title: 'Кэш · ETag',
    body:  'Ответ содержит заголовки Cache-Control: public, max-age=300 и ETag. Браузер запрашивает обновление каждые 5 минут; если Score не изменился — получает 304 Not Modified.',
    accent: 'info',
  },
  {
    icon: <Link2 size={15} strokeWidth={2} />,
    title: 'CORS и CDN',
    body:  'Эндпоинт /badge/{id}.svg доступен со всех источников (CORS: *). Подключение через CDN разрешено при условии сохранения заголовка X-PeptideTrust-Sig.',
    accent: 'info',
  },
  {
    icon: <AlertTriangle size={15} strokeWidth={2} />,
    title: 'Попытка подделки → невалидно',
    body:  'Если изменить значение Score в SVG-тексте и снова разместить файл, цифровая подпись не пройдёт верификацию. Верификаторы проверяют HMAC-SHA256 от содержимого.',
    accent: 'warning',
  },
]

const ACCENT_STYLES = {
  info: {
    iconBg:    'bg-[#e8e9ff]',
    iconColor: 'text-[#533afd]',
    border:    'border-[#d6d9fc]',
    bg:        'bg-white',
  },
  warning: {
    iconBg:    'bg-[#fff4e0]',
    iconColor: 'text-[#a06000]',
    border:    'border-[#f5d88a]',
    bg:        'bg-[#fffdf5]',
  },
}

export function BadgeNotes() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {NOTES.map((note) => {
        const style = ACCENT_STYLES[note.accent ?? 'info']
        return (
          <div
            key={note.title}
            className={`flex gap-3 rounded-[10px] border p-4 ${style.border} ${style.bg}`}
          >
            <div
              className={`mt-0.5 shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${style.iconBg} ${style.iconColor}`}
            >
              {note.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#061b31] mb-0.5">{note.title}</p>
              <p className="text-[12.5px] text-[#50617a] leading-5">{note.body}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
