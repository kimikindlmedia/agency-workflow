import React, { useState, useMemo } from 'react'
import { useApp } from '../store.jsx'
import Modal from './Modal.jsx'

// ── AI Scenario Generator ────────────────────────────────────────────────────
function AIScenarioModal({ isOpen, onClose, clientId }) {
  const { dispatch } = useApp()
  const [brief, setBrief] = useState('')
  const [category, setCategory] = useState('other')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState([])
  const [error, setError] = useState('')

  const generate = async () => {
    const apiKey = localStorage.getItem('claude_api_key')
    if (!apiKey) {
      setError('Nastav Claude API klíč v Nastavení.')
      return
    }
    if (!brief.trim()) {
      setError('Zadej brief pro generování.')
      return
    }
    setLoading(true)
    setError('')
    setIdeas([])
    try {
      const catLabel = CATEGORIES.find(c => c.value === category)?.label || 'Ostatní'
      const prompt = `Jsi kreativní režisér a scénárista pro social media (Instagram Reels, TikTok). Vygeneruj 4 konkrétní nápady na videa (scénáře) pro klienta.

Brief: ${brief}
Lokace/Kategorie: ${catLabel}

Vrať odpověď jako JSON pole objektů s klíči "title" (krátký název) a "content" (popis scénáře, max 3-4 věty, konkrétní akce/záběry). Pouze JSON, žádný jiný text.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error(`API chyba: ${res.status}`)
      const data = await res.json()
      const text = data.content[0].text
      const parsed = JSON.parse(text)
      setIdeas(parsed)
    } catch (e) {
      setError(`Chyba: ${e.message}`)
    }
    setLoading(false)
  }

  const addScenario = (idea) => {
    dispatch({ type: 'ADD_SCENARIO', payload: { clientId, title: idea.title, content: idea.content, category, status: 'idea' } })
  }

  const handleClose = () => {
    setBrief('')
    setIdeas([])
    setError('')
    setLoading(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI generátor scénářů" size="lg">
      <div className="space-y-4">
        <div className="form-group">
          <label className="label">Brief klienta</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Např: Instagram pro kavárnu, cílová skupina 20-35 let, zaměření na latte art a útulnou atmosféru..."
            value={brief}
            onChange={e => setBrief(e.target.value)}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="label">Kategorie</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  category === cat.value
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generuji nápady...
            </span>
          ) : '✨ Vygenerovat nápady'}
        </button>

        {ideas.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Vygenerované nápady — klikni pro přidání:</p>
            {ideas.map((idea, i) => (
              <div key={i} className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{idea.title}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{idea.content}</p>
                  </div>
                  <button
                    onClick={() => addScenario(idea)}
                    className="flex-shrink-0 text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Přidat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

const CATEGORIES = [
  { value: 'studio',    label: 'Studio' },
  { value: 'outdoor',   label: 'Venku' },
  { value: 'apartment', label: 'Byt' },
  { value: 'mall',      label: 'Obchodák' },
  { value: 'office',    label: 'Kancelář' },
  { value: 'company',   label: 'Firma' },
  { value: 'shop',      label: 'Obchod' },
  { value: 'realestate',label: 'Nemovitost' },
  { value: 'car',       label: 'Auto' },
  { value: 'other',     label: 'Ostatní' },
]

const STATUSES = [
  { value: 'idea',     label: 'Nápad',      color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'ready',    label: 'Připraveno', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'filmed',   label: 'Natočeno',   color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'done',     label: 'Dokončeno',  color: 'bg-green-100 text-green-700 border-green-200' },
]

function CategoryBadge({ category }) {
  const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
      {cat.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const s = STATUSES.find(x => x.value === status) || STATUSES[0]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
      {s.label}
    </span>
  )
}

function ScenarioModal({ isOpen, onClose, clientId, scenario = null }) {
  const { dispatch } = useApp()
  const isEdit = !!scenario
  const empty = { title: '', content: '', category: 'other', status: 'idea', tags: '', inspirationUrl: '' }
  const [form, setForm] = useState(scenario ? {
    title: scenario.title,
    content: scenario.content,
    category: scenario.category,
    status: scenario.status,
    tags: (scenario.tags || []).join(', '),
    inspirationUrl: scenario.inspirationUrl || '',
  } : empty)
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setErrors({ title: 'Název je povinný' }); return }
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    if (isEdit) {
      dispatch({ type: 'UPDATE_SCENARIO', payload: { id: scenario.id, updates: payload } })
    } else {
      dispatch({ type: 'ADD_SCENARIO', payload: { clientId, ...payload } })
    }
    handleClose()
  }

  const handleClose = () => {
    if (!isEdit) setForm(empty)
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Upravit scénář' : 'Přidat scénář'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="label">Název <span className="text-red-500">*</span></label>
          <input
            className={`input ${errors.title ? 'border-red-400' : ''}`}
            placeholder="Název scénáře"
            value={form.title}
            onChange={handleChange('title')}
            autoFocus
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Lokace / Kategorie</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    form.category === cat.value
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="label">Status</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, status: s.value }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    form.status === s.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Scénář</label>
          <textarea
            className="input resize-none"
            rows={6}
            placeholder="Popište průběh natáčení, akce, dialogy, nápady na záběry..."
            value={form.content}
            onChange={handleChange('content')}
          />
        </div>

        <div className="form-group">
          <label className="label">Inspirační odkaz <span className="text-gray-400 font-normal">(Reel, TikTok, YouTube...)</span></label>
          <input
            className="input"
            type="url"
            placeholder="https://www.instagram.com/reel/..."
            value={form.inspirationUrl}
            onChange={handleChange('inspirationUrl')}
          />
        </div>

        <div className="form-group">
          <label className="label">Tagy <span className="text-gray-400 font-normal">(oddělené čárkou)</span></label>
          <input
            className="input"
            placeholder="humor, trend, produkty, lifestyle"
            value={form.tags}
            onChange={handleChange('tags')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">Zrušit</button>
          <button type="submit" className="btn-primary flex-1">
            {isEdit ? 'Uložit změny' : 'Přidat scénář'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ScenarioCard({ scenario }) {
  const { dispatch } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleStatusChange = (newStatus) => {
    dispatch({ type: 'UPDATE_SCENARIO', payload: { id: scenario.id, updates: { status: newStatus } } })
  }

  return (
    <div className="card overflow-hidden group">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <CategoryBadge category={scenario.category} />
              <StatusBadge status={scenario.status} />
            </div>
            <h4 className="font-semibold text-gray-900">{scenario.title}</h4>
            {scenario.content && !expanded && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{scenario.content}</p>
            )}
            {scenario.tags && scenario.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {scenario.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); setShowEdit(true) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 fade-in">
          {scenario.content && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Scénář</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                {scenario.content}
              </p>
            </div>
          )}

          {scenario.inspirationUrl && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Inspirace</p>
              <a
                href={scenario.inspirationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Otevřít inspiraci
              </a>
            </div>
          )}

          {/* Status changer */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-medium text-gray-500">Status:</p>
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  scenario.status === s.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : `${s.color} hover:opacity-80`
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {confirmDelete && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-600">Opravdu smazat?</span>
              <button
                onClick={() => dispatch({ type: 'DELETE_SCENARIO', payload: { id: scenario.id } })}
                className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
              >Ano</button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded"
              >Ne</button>
            </div>
          )}
        </div>
      )}

      {showEdit && (
        <ScenarioModal isOpen={showEdit} onClose={() => setShowEdit(false)} clientId={scenario.clientId} scenario={scenario} />
      )}
    </div>
  )
}

export default function ClientScenariosSection({ clientId }) {
  const { state } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const clientScenarios = useMemo(() =>
    (state.scenarios || [])
      .filter(s => s.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [state.scenarios, clientId]
  )

  const filtered = useMemo(() => {
    let items = clientScenarios
    if (categoryFilter !== 'all') items = items.filter(s => s.category === categoryFilter)
    if (statusFilter !== 'all') items = items.filter(s => s.status === statusFilter)
    return items
  }, [clientScenarios, categoryFilter, statusFilter])

  // Only show categories that have scenarios
  const usedCategories = [...new Set(clientScenarios.map(s => s.category))]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{clientScenarios.length} scénářů</p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            ✨ AI nápady
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Přidat scénář
          </button>
        </div>
      </div>

      {/* Filters */}
      {clientScenarios.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${categoryFilter === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              Vše
            </button>
            {CATEGORIES.filter(c => usedCategories.includes(c.value)).map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${categoryFilter === cat.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {['all', ...STATUSES.map(s => s.value)].map(sv => {
              const s = STATUSES.find(x => x.value === sv)
              return (
                <button
                  key={sv}
                  onClick={() => setStatusFilter(sv)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${statusFilter === sv ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  {sv === 'all' ? 'Všechny statusy' : s?.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {categoryFilter !== 'all' || statusFilter !== 'all' ? 'Žádné scénáře pro tento filtr' : 'Zatím žádné scénáře'}
          </h3>
          <p className="text-sm text-gray-400">
            {categoryFilter !== 'all' || statusFilter !== 'all' ? 'Zkuste jiný filtr.' : 'Přidejte první scénář kliknutím výše.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => <ScenarioCard key={s.id} scenario={s} />)}
        </div>
      )}

      <ScenarioModal isOpen={showAdd} onClose={() => setShowAdd(false)} clientId={clientId} />
      <AIScenarioModal isOpen={showAI} onClose={() => setShowAI(false)} clientId={clientId} />
    </div>
  )
}
