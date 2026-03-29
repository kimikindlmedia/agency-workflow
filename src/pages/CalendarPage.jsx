import React, { useState, useMemo } from 'react'
import { useApp } from '../store.jsx'
import Modal from '../components/Modal.jsx'

const EVENT_TYPES = [
  { value: 'shoot',    label: 'Natáčení',  color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  { value: 'deadline', label: 'Deadline',  color: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-500' },
  { value: 'meeting',  label: 'Schůzka',   color: 'bg-blue-100 text-blue-800 border-blue-200',        dot: 'bg-blue-500' },
  { value: 'other',    label: 'Jiné',      color: 'bg-gray-100 text-gray-700 border-gray-200',        dot: 'bg-gray-400' },
]

const DAYS_CS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
const MONTHS_CS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec']

function EventTypeBadge({ type }) {
  const t = EVENT_TYPES.find(e => e.value === type) || EVENT_TYPES[3]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${t.color}`}>{t.label}</span>
}

function AddEventModal({ isOpen, onClose, prefillDate = '' }) {
  const { state, dispatch, activeMember } = useApp()
  const [form, setForm] = useState({ title: '', date: prefillDate, type: 'other', clientId: '', description: '' })
  const [errors, setErrors] = useState({})

  // Reset when prefillDate changes (when clicking a day)
  React.useEffect(() => {
    setForm(f => ({ ...f, date: prefillDate }))
  }, [prefillDate])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.title.trim()) errs.title = 'Název je povinný'
    if (!form.date) errs.date = 'Datum je povinné'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    dispatch({ type: 'ADD_EVENT', payload: { ...form, author: activeMember || '' } })
    setForm({ title: '', date: '', type: 'other', clientId: '', description: '' })
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setForm({ title: '', date: '', type: 'other', clientId: '', description: '' })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Přidat událost">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="label">Název <span className="text-red-500">*</span></label>
          <input className={`input ${errors.title ? 'border-red-400' : ''}`} placeholder="Název události" value={form.title} onChange={e => { setForm(f => ({...f, title: e.target.value})); setErrors(er => ({...er, title:''})) }} autoFocus />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Datum <span className="text-red-500">*</span></label>
            <input type="date" className={`input ${errors.date ? 'border-red-400' : ''}`} value={form.date} onChange={e => { setForm(f => ({...f, date: e.target.value})); setErrors(er => ({...er, date:''})) }} />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>
          <div className="form-group">
            <label className="label">Typ</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="label">Klient (volitelné)</label>
          <select className="input" value={form.clientId} onChange={e => setForm(f => ({...f, clientId: e.target.value}))}>
            <option value="">— bez klienta —</option>
            {state.clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Poznámka</label>
          <textarea className="input resize-none" rows={2} placeholder="Popis události..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">Zrušit</button>
          <button type="submit" className="btn-primary flex-1">Přidat událost</button>
        </div>
      </form>
    </Modal>
  )
}

export default function CalendarPage() {
  const { state, dispatch, activeMember } = useApp()
  const getMemberName = (key) => {
    if (key === 'member1') return state.settings.member1Name
    if (key === 'member2') return state.settings.member2Name
    if (key === 'member3') return state.settings.member3Name
    return key
  }
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [showAddModal, setShowAddModal] = useState(false)
  const [prefillDate, setPrefillDate] = useState('')
  const [expandedEvent, setExpandedEvent] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Day of week for first day (Mon=0...Sun=6)
  const firstDayRaw = new Date(year, month, 1).getDay()
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1

  // Group events by date string YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = {}
    for (const ev of state.events) {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [state.events])

  const pad = n => String(n).padStart(2, '0')
  const dateStr = (d) => `${year}-${pad(month+1)}-${pad(d)}`

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleDayClick = (day) => {
    setPrefillDate(dateStr(day))
    setShowAddModal(true)
  }

  const handleDeleteEvent = (id) => {
    dispatch({ type: 'DELETE_EVENT', payload: { id } })
    setConfirmDelete(null)
    setExpandedEvent(null)
  }

  const getClientName = (clientId) => {
    if (!clientId) return null
    const c = state.clients.find(cl => cl.id === clientId)
    return c ? (c.company || c.name) : null
  }

  // Upcoming events (today and future), sorted
  const upcomingEvents = useMemo(() => {
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
    return state.events.filter(e => e.date >= todayStr).slice(0, 10)
  }, [state.events])

  const formatEventDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-')
    return `${d}. ${m}. ${y}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalendář</h1>
          <p className="text-sm text-gray-500 mt-0.5">{state.events.length} událostí celkem</p>
        </div>
        <button onClick={() => { setPrefillDate(''); setShowAddModal(true) }} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Přidat událost
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-900">{MONTHS_CS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_CS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white min-h-[64px]" />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const ds = dateStr(day)
              const dayEvents = eventsByDate[ds] || []
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className="bg-white min-h-[64px] p-1 cursor-pointer hover:bg-indigo-50 transition-colors group"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700 group-hover:text-indigo-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(ev => {
                      const t = EVENT_TYPES.find(e => e.value === ev.type) || EVENT_TYPES[3]
                      return (
                        <div
                          key={ev.id}
                          onClick={e => { e.stopPropagation(); setExpandedEvent(expandedEvent === ev.id ? null : ev.id) }}
                          className={`text-xs px-1 py-0.5 rounded truncate border ${t.color}`}
                        >
                          {ev.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Event type legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
            {EVENT_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                <span className="text-xs text-gray-500">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Nadcházející události</h3>
          {upcomingEvents.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-400">Žádné nadcházející události</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(ev => {
                const clientName = getClientName(ev.clientId)
                const isExpanded = expandedEvent === ev.id
                return (
                  <div key={ev.id} className="card overflow-hidden">
                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                      className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatEventDate(ev.date)}{clientName ? ` · ${clientName}` : ''}{ev.author ? ` · ${getMemberName(ev.author)}` : ''}</p>
                        </div>
                        <EventTypeBadge type={ev.type} />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-3 space-y-2 fade-in">
                        {ev.description && <p className="text-sm text-gray-600">{ev.description}</p>}
                        <div className="flex justify-end">
                          {confirmDelete === ev.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Smazat?</span>
                              <button onClick={() => handleDeleteEvent(ev.id)} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Ano</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded">Ne</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(ev.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Smazat</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <AddEventModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} prefillDate={prefillDate} />
    </div>
  )
}
