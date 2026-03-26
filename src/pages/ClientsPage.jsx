import React, { useState } from 'react'
import { useApp } from '../store.jsx'
import Modal from '../components/Modal.jsx'

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function Avatar({ name, color, size = 'md', photoUrl = '' }) {
  const sizes = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden`}
      style={{ backgroundColor: photoUrl ? 'transparent' : color }}
    >
      {photoUrl
        ? <img src={photoUrl} alt={name} className="w-full h-full object-cover rounded-full" />
        : getInitials(name)
      }
    </div>
  )
}

export { Avatar, getInitials }

function AddClientModal({ isOpen, onClose }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', color: AVATAR_COLORS[0],
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Jméno je povinné'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    dispatch({ type: 'ADD_CLIENT', payload: form })
    setForm({ name: '', company: '', email: '', phone: '', color: AVATAR_COLORS[0] })
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setForm({ name: '', company: '', email: '', phone: '', color: AVATAR_COLORS[0] })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Přidat klienta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="label">Jméno <span className="text-red-500">*</span></label>
          <input
            className={`input ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="Jan Novák"
            value={form.name}
            onChange={handleChange('name')}
            autoFocus
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label className="label">Firma</label>
          <input
            className="input"
            placeholder="Název firmy"
            value={form.company}
            onChange={handleChange('company')}
          />
        </div>

        <div className="form-group">
          <label className="label">E-mail</label>
          <input
            className="input"
            type="email"
            placeholder="jan@firma.cz"
            value={form.email}
            onChange={handleChange('email')}
          />
        </div>

        <div className="form-group">
          <label className="label">Telefon</label>
          <input
            className="input"
            placeholder="+420 123 456 789"
            value={form.phone}
            onChange={handleChange('phone')}
          />
        </div>

        <div className="form-group">
          <label className="label">Barva avatara</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {AVATAR_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setForm(f => ({ ...f, color }))}
                className={`w-8 h-8 rounded-full transition-transform ${form.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">
            Zrušit
          </button>
          <button type="submit" className="btn-primary flex-1">
            Přidat klienta
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function ClientsPage({ onSelectClient }) {
  const { state } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = state.clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Klienti</h1>
          <p className="text-sm text-gray-500 mt-0.5">{state.clients.length} klientů celkem</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Přidat klienta
        </button>
      </div>

      {/* Search */}
      {state.clients.length > 0 && (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Hledat klienta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Clients Grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {search ? 'Žádný klient nenalezen' : 'Zatím žádní klienti'}
          </h3>
          <p className="text-gray-500 text-sm">
            {search ? 'Zkuste jiný hledaný výraz.' : 'Přidejte prvního klienta kliknutím na tlačítko výše.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => {
            const doneTasks = client.tasks.filter(t => t.status === 'done').length
            const totalTasks = client.tasks.length
            const activeTasks = client.tasks.filter(t => t.status !== 'done').length

            return (
              <button
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="card p-5 text-left hover:shadow-md hover:border-indigo-100 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="transition-transform group-hover:scale-105 flex-shrink-0">
                    <Avatar name={client.name} color={client.color} size="md" photoUrl={client.photoUrl} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                      {client.name}
                    </h3>
                    {client.company && (
                      <p className="text-sm text-gray-500 truncate">{client.company}</p>
                    )}
                    {client.email && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{client.email}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {totalTasks} {totalTasks === 1 ? 'úkol' : totalTasks < 5 ? 'úkoly' : 'úkolů'}
                    </span>
                  </div>
                  {activeTasks > 0 && (
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                      {activeTasks} aktivních
                    </span>
                  )}
                  {totalTasks > 0 && activeTasks === 0 && (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                      Vše hotovo
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  )
}
