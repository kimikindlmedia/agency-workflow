import React, { useState } from 'react'
import { useApp } from '../store.jsx'
import Modal from '../components/Modal.jsx'
import { StatusBadge } from '../components/Badge.jsx'

const CONTENT_TYPE_OPTIONS = ['Carousel', 'Reel', 'Story', 'Post', 'Jiné']

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Add Inquiry Modal ────────────────────────────────────────────────────────
function AddInquiryModal({ isOpen, onClose }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({
    clientName: '',
    contact: '',
    description: '',
    budget: '',
    contentTypes: [],
    deadline: '',
    source: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleContentTypeToggle = (ct) => {
    setForm(f => ({
      ...f,
      contentTypes: f.contentTypes.includes(ct)
        ? f.contentTypes.filter(c => c !== ct)
        : [...f.contentTypes, ct],
    }))
  }

  const validate = () => {
    const errs = {}
    if (!form.clientName.trim()) errs.clientName = 'Jméno klienta je povinné'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    dispatch({ type: 'ADD_INQUIRY', payload: form })
    setForm({ clientName: '', contact: '', description: '', budget: '', contentTypes: [], deadline: '', source: '' })
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setForm({ clientName: '', contact: '', description: '', budget: '', contentTypes: [], deadline: '', source: '' })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Přidat poptávku" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Jméno klienta <span className="text-red-500">*</span></label>
            <input
              className={`input ${errors.clientName ? 'border-red-400' : ''}`}
              placeholder="Jan Novák"
              value={form.clientName}
              onChange={handleChange('clientName')}
              autoFocus
            />
            {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
          </div>
          <div className="form-group">
            <label className="label">Kontakt (email / telefon)</label>
            <input
              className="input"
              placeholder="jan@firma.cz"
              value={form.contact}
              onChange={handleChange('contact')}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Popis poptávky</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Co klient potřebuje..."
            value={form.description}
            onChange={handleChange('description')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Rozpočet</label>
            <input
              className="input"
              placeholder="např. 20 000 Kč / měsíc"
              value={form.budget}
              onChange={handleChange('budget')}
            />
          </div>
          <div className="form-group">
            <label className="label">Deadline / Začátek spolupráce</label>
            <input
              type="date"
              className="input"
              value={form.deadline}
              onChange={handleChange('deadline')}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Typy obsahu</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CONTENT_TYPE_OPTIONS.map(ct => (
              <button
                key={ct}
                type="button"
                onClick={() => handleContentTypeToggle(ct)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.contentTypes.includes(ct)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                }`}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="label">Odkud nás znají</label>
          <input
            className="input"
            placeholder="Instagram, doporučení, Google..."
            value={form.source}
            onChange={handleChange('source')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">Zrušit</button>
          <button type="submit" className="btn-primary flex-1">Přidat poptávku</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Inquiry Card / Row ───────────────────────────────────────────────────────
function InquiryCard({ inquiry }) {
  const { state, dispatch } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notes, setNotes] = useState(inquiry.notes || '')
  const [editingNotes, setEditingNotes] = useState(false)

  const { member1Name, member2Name } = state.settings

  const handleVote = (member, vote) => {
    dispatch({ type: 'VOTE_INQUIRY', payload: { id: inquiry.id, member, vote } })
  }

  const handleSaveNotes = () => {
    dispatch({
      type: 'UPDATE_INQUIRY',
      payload: { id: inquiry.id, updates: { notes } },
    })
    setEditingNotes(false)
  }

  const handleDelete = () => {
    dispatch({ type: 'DELETE_INQUIRY', payload: { id: inquiry.id } })
  }

  const getVoteIcon = (vote) => {
    if (vote === true) return (
      <span className="flex items-center gap-1 text-green-700 font-medium text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Přijmout
      </span>
    )
    if (vote === false) return (
      <span className="flex items-center gap-1 text-red-700 font-medium text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Zamítnout
      </span>
    )
    return null
  }

  const getBothVotedResult = () => {
    if (inquiry.votes.member1 !== null && inquiry.votes.member2 !== null) {
      if (inquiry.status === 'accepted') {
        return <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm font-semibold">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Poptávka přijata — oba členové souhlasí
        </div>
      }
      return <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm font-semibold">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Poptávka zamítnuta
      </div>
    }
    return null
  }

  return (
    <div className="card overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {inquiry.clientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{inquiry.clientName}</span>
              <StatusBadge status={inquiry.status} />
            </div>
            {inquiry.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{inquiry.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{formatDate(inquiry.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Voting progress */}
            <div className="hidden sm:flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${inquiry.votes.member1 === true ? 'bg-green-500' : inquiry.votes.member1 === false ? 'bg-red-500' : 'bg-gray-300'}`} />
              <div className={`w-2 h-2 rounded-full ${inquiry.votes.member2 === true ? 'bg-green-500' : inquiry.votes.member2 === false ? 'bg-red-500' : 'bg-gray-300'}`} />
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 fade-in">
          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inquiry.contact && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Kontakt</p>
                <p className="text-sm text-gray-700 mt-0.5">{inquiry.contact}</p>
              </div>
            )}
            {inquiry.budget && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Rozpočet</p>
                <p className="text-sm text-gray-700 mt-0.5">{inquiry.budget}</p>
              </div>
            )}
            {inquiry.deadline && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Deadline</p>
                <p className="text-sm text-gray-700 mt-0.5">{inquiry.deadline}</p>
              </div>
            )}
            {inquiry.source && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Odkud nás znají</p>
                <p className="text-sm text-gray-700 mt-0.5">{inquiry.source}</p>
              </div>
            )}
          </div>

          {inquiry.description && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Popis</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.description}</p>
            </div>
          )}

          {inquiry.contentTypes && inquiry.contentTypes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Typy obsahu</p>
              <div className="flex flex-wrap gap-1.5">
                {inquiry.contentTypes.map(ct => (
                  <span key={ct} className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {ct}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Voting section */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Hlasování</h4>

            {getBothVotedResult() && (
              <div className="mb-3">{getBothVotedResult()}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Member 1 */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">{member1Name}</p>
                {inquiry.votes.member1 !== null ? (
                  <div className={`flex items-center justify-between`}>
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      inquiry.votes.member1 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {getVoteIcon(inquiry.votes.member1)}
                    </div>
                    <button
                      onClick={() => handleVote('member1', null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Změnit
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVote('member1', true)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Přijmout
                    </button>
                    <button
                      onClick={() => handleVote('member1', false)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Zamítnout
                    </button>
                  </div>
                )}
              </div>

              {/* Member 2 */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">{member2Name}</p>
                {inquiry.votes.member2 !== null ? (
                  <div className="flex items-center justify-between">
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      inquiry.votes.member2 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {getVoteIcon(inquiry.votes.member2)}
                    </div>
                    <button
                      onClick={() => handleVote('member2', null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Změnit
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVote('member2', true)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Přijmout
                    </button>
                    <button
                      onClick={() => handleVote('member2', false)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Zamítnout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Poznámky</p>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  {notes ? 'Upravit' : 'Přidat'}
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Interní poznámky..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveNotes} className="btn-primary text-xs py-1.5 px-3">Uložit</button>
                  <button onClick={() => { setNotes(inquiry.notes || ''); setEditingNotes(false) }} className="btn-secondary text-xs py-1.5 px-3">Zrušit</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">{notes || <span className="italic text-gray-400">Žádné poznámky</span>}</p>
            )}
          </div>

          {/* Delete */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Smazat poptávku
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Opravdu smazat?</span>
                <button onClick={handleDelete} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Ano</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded">Ne</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InquiriesPage() {
  const { state } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = statusFilter === 'all'
    ? state.inquiries
    : state.inquiries.filter(i => i.status === statusFilter)

  const counts = {
    all: state.inquiries.length,
    pending: state.inquiries.filter(i => i.status === 'pending').length,
    accepted: state.inquiries.filter(i => i.status === 'accepted').length,
    rejected: state.inquiries.filter(i => i.status === 'rejected').length,
  }

  // Sort newest first
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Poptávky</h1>
          <p className="text-sm text-gray-500 mt-0.5">{state.inquiries.length} poptávek celkem</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Přidat poptávku
        </button>
      </div>

      {/* Stat cards */}
      {state.inquiries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'all', label: 'Celkem', color: 'text-gray-700 bg-gray-50 border-gray-200' },
            { key: 'pending', label: 'Čeká', color: 'text-orange-700 bg-orange-50 border-orange-200' },
            { key: 'accepted', label: 'Přijato', color: 'text-green-700 bg-green-50 border-green-200' },
            { key: 'rejected', label: 'Zamítnuto', color: 'text-red-700 bg-red-50 border-red-200' },
          ].map(stat => (
            <button
              key={stat.key}
              onClick={() => setStatusFilter(stat.key)}
              className={`p-3 rounded-xl border text-left transition-all ${stat.color} ${statusFilter === stat.key ? 'ring-2 ring-indigo-400' : 'hover:opacity-80'}`}
            >
              <p className="text-2xl font-bold">{counts[stat.key]}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {statusFilter !== 'all' ? 'Žádné poptávky v tomto stavu' : 'Zatím žádné poptávky'}
          </h3>
          <p className="text-gray-500 text-sm">
            {statusFilter !== 'all' ? 'Vyberte jiný filtr.' : 'Přidejte první poptávku kliknutím na tlačítko výše.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(inquiry => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      )}

      <AddInquiryModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  )
}
