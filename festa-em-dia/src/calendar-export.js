import { agendaEntries, dateKey, parseDate, shiftDate } from './data.js'

const encoder = new TextEncoder()
const compactDate = (value) => value.replaceAll('-', '')
const escapeText = (value) => value.replaceAll('\\', '\\\\').replace(/\r\n|\r|\n/g, '\\n').replaceAll(';', '\\;').replaceAll(',', '\\,')

function foldLine(line) {
  const parts = []
  let part = ''
  let length = 0
  for (const character of line) {
    const bytes = encoder.encode(character).length
    if (length + bytes > 75) {
      parts.push(part)
      part = ' '
      length = 1
    }
    part += character
    length += bytes
  }
  return [...parts, part].join('\r\n')
}

export function calendarFile(rentals, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const events = agendaEntries(rentals).flatMap(({ date, type, rental }) => [
    'BEGIN:VEVENT',
    'UID:' + rental.id + (type === 'Saída' ? '-saida' : '-devolucao') + '@festa-em-dia.local',
    'DTSTAMP:' + stamp,
    'DTSTART;VALUE=DATE:' + compactDate(date),
    'DTEND;VALUE=DATE:' + compactDate(dateKey(shiftDate(parseDate(date), 1))),
    'SUMMARY:' + escapeText(type + ' · #' + rental.code + ' · ' + rental.name),
    'END:VEVENT',
  ])
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Festa em Dia//Agenda de Locacoes//PT-BR', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].map(foldLine).join('\r\n')
}

export function downloadCalendar(rentals) {
  const url = URL.createObjectURL(new Blob([calendarFile(rentals)], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'festa-em-dia-agenda.ics'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
