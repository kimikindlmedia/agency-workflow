import React, { useState, useMemo } from 'react'
import { useApp } from '../store.jsx'
import Modal from './Modal.jsx'
import { ContentTypeBadge, TagBadge } from './Badge.jsx'

function authorName(settings, author) {
  if (author === 'member1') return settings.member1Name
  if (author === 'member2') return settings.member2Name
  if (author === 'member3') return settings.member3Name
  return author || ''
}

const TYPE_OPTIONS = [
  { value: 'carousel', label: 'Carousel' },
  { value: 'reel',     label: 'Reel' },
  { value: 'scenario', label: 'Scénář' },
  { value: 'post',     label: 'Post' },
  { value: 'other',    label: 'Jiné' },
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Add / Edit Inspiration Modal ─────────────────────────────────────────────
function InspirationModal({ isOpen, onClose, item = null, clientId }) {
  const { dispatch, activeMember } = useApp()
  const isEdit = !!item
  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    type: item?.type || 'other',
    tags: item?.tags?.join(', ') || '',
    fileData: item?.fileData || null,
    fileName: item?.fileName || null,
    fileType: item?.fileType || null,
    url: item?.url || '',
  })
  const [errors, setErrors] = useState({})
  const [fileError, setFileError] = useState('')
  const [uploadMode, setUploadMode] = useState(item?.fileData ? 'file' : 'url')

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileError('')
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Soubor je příliš velký (max 5 MB)')
      return
    }
    const base64 = await fileToBase64(file)
    setForm(f => ({ ...f, fileData: base64, fileName: file.name, fileType: file.type }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Název je povinný'
    return errs
  }

  const parseTags = (str) =>
    str.split(',').map(t => t.trim()).filter(Boolean)

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      tags: parseTags(form.tags),
      url: uploadMode === 'url' ? form.url : null,
      fileData: uploadMode === 'file' ? form.fileData : null,
      fileName: uploadMode === 'file' ? form.fileName : null,
      fileType: uploadMode === 'file' ? form.fileType : null,
    }

    if (isEdit) {
      dispatch({ type: 'UPDATE_INSPIRATION', payload: { id: item.id, updates: { ...payload, clientId: item.clientId } } })
    } else {
      dispatch({ type: 'ADD_INSPIRATION', payload: { ...payload, clientId, author: activeMember } })
    }
    handleClose()
  }

  const handleClose = () => {
    if (!isEdit) {
      setForm({ title: '', description: '', type: 'other', tags: '', fileData: null, fileName: null, fileType: null, url: '' })
    }
    setErrors({})
    setFileError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Upravit inspiraci' : 'Přidat inspiraci'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="label">Název <span className="text-red-500">*</span></label>
          <input
            className={`input ${errors.title ? 'border-red-400' : ''}`}
            placeholder="Název inspirace"
            value={form.title}
            onChange={handleChange('title')}
            autoFocus
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div className="form-group">
          <label className="label">Typ obsahu</label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === opt.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="label">Popis</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Popis, poznámky, nápad..."
            value={form.description}
            onChange={handleChange('description')}
          />
        </div>

        <div className="form-group">
          <label className="label">Tagy <span className="text-gray-400 font-normal">(oddělené čárkou)</span></label>
          <input
            className="input"
            placeholder="instagram, trend, carousel, 2025"
            value={form.tags}
            onChange={handleChange('tags')}
          />
        </div>

        <div className="form-group">
          <label className="label">Zdroj / Soubor</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${uploadMode === 'url' ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              🔗 Odkaz (URL)
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${uploadMode === 'file' ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              📎 Soubor
            </button>
          </div>

          {uploadMode === 'url' ? (
            <input
              className="input"
              type="url"
              placeholder="https://www.instagram.com/p/..."
              value={form.url}
              onChange={handleChange('url')}
            />
          ) : (
            form.fileData ? (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                {form.fileType?.startsWith('image/') && (
                  <img src={form.fileData} alt={form.fileName} className="w-full max-h-48 object-contain rounded-lg mb-2" />
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 truncate">{form.fileName}</span>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, fileData: null, fileName: null, fileType: null }))}
                    className="text-xs text-red-500 hover:text-red-700 ml-2"
                  >
                    Odstranit
                  </button>
                </div>
              </div>
            ) : (
              <label className={`flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                <input type="file" accept="image/*,video/*,.pdf" onChange={handleFileUpload} className="sr-only" />
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-500">Klikněte pro nahrání souboru</span>
                <span className="text-xs text-gray-400">Obrázky, videa, PDF — max. 5 MB</span>
              </label>
            )
          )}
          {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">Zrušit</button>
          <button type="submit" className="btn-primary flex-1">
            {isEdit ? 'Uložit změny' : 'Přidat inspiraci'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Inspiration Card ──────────────────────────────────────────────────────────
function InspirationCard({ item }) {
  const { dispatch, state } = useApp()
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleDelete = () => {
    dispatch({ type: 'DELETE_INSPIRATION', payload: { id: item.id } })
  }

  const isImage = item.fileType && item.fileType.startsWith('image/')

  return (
    <div className="card overflow-hidden group">
      {/* Thumbnail */}
      {isImage && item.fileData && (
        <div className="h-40 bg-gray-100 overflow-hidden">
          <img
            src={item.fileData}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      {!isImage && item.url && (
        <div className="h-10 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center px-4">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline truncate flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {item.url.length > 50 ? item.url.slice(0, 50) + '…' : item.url}
          </a>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <ContentTypeBadge type={item.type} />
            </div>
            <h3 className="font-semibold text-gray-900 leading-tight">{item.title}</h3>
            {item.author && (
              <p className="text-xs text-gray-400 mt-0.5">{authorName(state.settings, item.author)}</p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Upravit"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Smazat"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div>
            <p className={`text-sm text-gray-600 ${!expanded ? 'line-clamp-2' : 'whitespace-pre-wrap'}`}>
              {item.description}
            </p>
            {item.description.length > 100 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
              >
                {expanded ? 'Méně' : 'Více'}
              </button>
            )}
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map(tag => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
          <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Otevřít
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          {item.fileData && !item.url && (
            <a
              href={item.fileData}
              download={item.fileName}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Stáhnout
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800 mb-3">Opravdu smazat tuto inspiraci?</p>
            <div className="flex gap-2 justify-center">
              <button onClick={handleDelete} className="btn-danger text-sm py-1.5 px-4">Smazat</button>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-sm py-1.5 px-4">Zrušit</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <InspirationModal isOpen={showEdit} onClose={() => setShowEdit(false)} item={item} />
      )}
    </div>
  )
}

// ── Client Inspiration Section ────────────────────────────────────────────────
export default function ClientInspirationSection({ clientId }) {
  const { state } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const clientItems = useMemo(() => state.inspiration.filter(i => i.clientId === clientId), [state.inspiration, clientId])

  const filtered = useMemo(() => {
    let items = clientItems
    if (typeFilter !== 'all') {
      items = items.filter(i => i.type === typeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
      )
    }
    return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [clientItems, typeFilter, search])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{clientItems.length} položek</p>
        <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Přidat inspiraci
        </button>
      </div>

      {/* Filters */}
      {clientItems.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="input pl-9"
              placeholder="Hledat podle názvu nebo tagů..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${typeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              Vše ({clientItems.length})
            </button>
            {TYPE_OPTIONS.map(opt => {
              const count = clientItems.filter(i => i.type === opt.value).length
              if (count === 0) return null
              return (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${typeFilter === opt.value ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {opt.label} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            {search || typeFilter !== 'all' ? 'Žádná inspirace nenalezena' : 'Zatím žádná inspirace pro tohoto klienta.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="relative">
              <InspirationCard item={item} />
            </div>
          ))}
        </div>
      )}

      <InspirationModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} clientId={clientId} />
    </div>
  )
}
