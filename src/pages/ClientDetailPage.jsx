import React, { useState, useRef } from 'react'
import { useApp } from '../store.jsx'
import Modal from '../components/Modal.jsx'
import { StatusBadge, ContentTypeBadge } from '../components/Badge.jsx'
import { Avatar, getInitials } from './ClientsPage.jsx'
import ClientInspirationSection from '../components/ClientInspiration.jsx'

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

const STATUS_OPTIONS = [
  { value: 'new',         label: 'Nové' },
  { value: 'in_progress', label: 'Probíhá' },
  { value: 'review',      label: 'Ke kontrole' },
  { value: 'done',        label: 'Hotovo' },
]

const CONTENT_TYPES = [
  { value: 'carousel', label: 'Carousel' },
  { value: 'reel',     label: 'Reel' },
  { value: 'story',    label: 'Story' },
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

function formatDeadline(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Add / Edit Task Modal ───────────────────────────────────────────────────
function TaskModal({ isOpen, onClose, clientId, task = null }) {
  const { dispatch } = useApp()
  const isEdit = !!task
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'text',
    audioData: task?.audioData || null,
    audioName: task?.audioName || null,
    contentType: task?.contentType || 'other',
    deadline: task?.deadline || '',
    note: task?.note || '',
  })
  const [errors, setErrors] = useState({})
  const [audioError, setAudioError] = useState('')
  const audioRef = useRef(null)

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAudioError('')
    if (file.size > 5 * 1024 * 1024) {
      setAudioError('Soubor je příliš velký (max 5 MB)')
      return
    }
    const base64 = await fileToBase64(file)
    setForm(f => ({ ...f, audioData: base64, audioName: file.name }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Název je povinný'
    if (form.type === 'voice' && !form.audioData) errs.audio = 'Nahrajte audio soubor'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    if (isEdit) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { clientId, taskId: task.id, updates: form },
      })
    } else {
      dispatch({ type: 'ADD_TASK', payload: { clientId, ...form } })
    }
    handleClose()
  }

  const handleClose = () => {
    if (!isEdit) {
      setForm({ title: '', description: '', type: 'text', audioData: null, audioName: null, contentType: 'other', deadline: '', note: '' })
    }
    setErrors({})
    setAudioError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Upravit požadavek' : 'Přidat požadavek'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="label">Název <span className="text-red-500">*</span></label>
          <input
            className={`input ${errors.title ? 'border-red-400' : ''}`}
            placeholder="Název požadavku"
            value={form.title}
            onChange={handleChange('title')}
            autoFocus
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div className="form-group">
          <label className="label">Popis</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Popis požadavku..."
            value={form.description}
            onChange={handleChange('description')}
          />
        </div>

        <div className="form-group">
          <label className="label">Typ požadavku</label>
          <div className="flex gap-4">
            {[
              { value: 'text',  label: 'Textový požadavek', icon: '📝' },
              { value: 'voice', label: 'Hlasová zpráva',    icon: '🎙️' },
            ].map(opt => (
              <label
                key={opt.value}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  form.type === opt.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={form.type === opt.value}
                  onChange={handleChange('type')}
                  className="sr-only"
                />
                <span className="text-lg">{opt.icon}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {form.type === 'voice' && (
          <div className="form-group">
            <label className="label">Audio soubor (.ogg, .opus, .mp3, .m4a)</label>
            {form.audioData ? (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">{form.audioName}</span>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, audioData: null, audioName: null }))}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Odstranit
                  </button>
                </div>
                <audio controls src={form.audioData} className="w-full" />
              </div>
            ) : (
              <label className={`flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                errors.audio ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
              }`}>
                <input
                  ref={audioRef}
                  type="file"
                  accept=".ogg,.opus,.mp3,.m4a,audio/*"
                  onChange={handleAudioUpload}
                  className="sr-only"
                />
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-sm text-gray-500">Klikněte pro nahrání audio souboru</span>
                <span className="text-xs text-gray-400">max. 5 MB</span>
              </label>
            )}
            {audioError && <p className="text-xs text-red-500 mt-1">{audioError}</p>}
            {errors.audio && <p className="text-xs text-red-500 mt-1">{errors.audio}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Typ obsahu</label>
            <select className="input" value={form.contentType} onChange={handleChange('contentType')}>
              {CONTENT_TYPES.map(ct => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Deadline</label>
            <input
              type="date"
              className="input"
              value={form.deadline}
              onChange={handleChange('deadline')}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Poznámka</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Interní poznámka..."
            value={form.note}
            onChange={handleChange('note')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">Zrušit</button>
          <button type="submit" className="btn-primary flex-1">
            {isEdit ? 'Uložit změny' : 'Přidat požadavek'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Add Output Modal ─────────────────────────────────────────────────────────
function OutputModal({ isOpen, onClose, clientId, taskId }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({
    name: '', note: '', url: '', fileData: null, fileName: null, fileType: null,
  })
  const [errors, setErrors] = useState({})
  const [fileError, setFileError] = useState('')
  const [uploadMode, setUploadMode] = useState('url') // 'url' | 'file'

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
    if (!form.name.trim()) errs.name = 'Název je povinný'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    dispatch({
      type: 'ADD_OUTPUT',
      payload: {
        clientId, taskId,
        name: form.name,
        note: form.note,
        url: uploadMode === 'url' ? form.url : null,
        fileData: uploadMode === 'file' ? form.fileData : null,
        fileName: uploadMode === 'file' ? form.fileName : null,
        fileType: uploadMode === 'file' ? form.fileType : null,
      },
    })
    setForm({ name: '', note: '', url: '', fileData: null, fileName: null, fileType: null })
    setErrors({})
    setFileError('')
    onClose()
  }

  const handleClose = () => {
    setForm({ name: '', note: '', url: '', fileData: null, fileName: null, fileType: null })
    setErrors({})
    setFileError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Přidat výstup">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="label">Název <span className="text-red-500">*</span></label>
          <input
            className={`input ${errors.name ? 'border-red-400' : ''}`}
            placeholder="Název výstupu"
            value={form.name}
            onChange={handleChange('name')}
            autoFocus
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label className="label">Typ výstupu</label>
          <div className="flex gap-2">
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
        </div>

        {uploadMode === 'url' ? (
          <div className="form-group">
            <label className="label">URL odkaz</label>
            <input
              className="input"
              type="url"
              placeholder="https://drive.google.com/..."
              value={form.url}
              onChange={handleChange('url')}
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="label">Soubor</label>
            {form.fileData ? (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
                <span className="text-sm font-medium text-green-800 truncate">{form.fileName}</span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, fileData: null, fileName: null, fileType: null }))}
                  className="text-xs text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                >
                  Odstranit
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                <input type="file" onChange={handleFileUpload} className="sr-only" />
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-500">Klikněte pro nahrání souboru</span>
                <span className="text-xs text-gray-400">max. 5 MB</span>
              </label>
            )}
            {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
          </div>
        )}

        <div className="form-group">
          <label className="label">Poznámka</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Poznámka k výstupu..."
            value={form.note}
            onChange={handleChange('note')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">Zrušit</button>
          <button type="submit" className="btn-primary flex-1">Přidat výstup</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Edit Client Modal ────────────────────────────────────────────────────────
function EditClientModal({ isOpen, onClose, client }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    color: client.color,
    driveUrl: client.driveUrl || '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Jméno je povinné' }); return }
    dispatch({ type: 'UPDATE_CLIENT', payload: { id: client.id, ...form, driveUrl: form.driveUrl } })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upravit klienta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="label">Jméno <span className="text-red-500">*</span></label>
          <input
            className={`input ${errors.name ? 'border-red-400' : ''}`}
            value={form.name}
            onChange={handleChange('name')}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div className="form-group">
          <label className="label">Firma</label>
          <input className="input" value={form.company} onChange={handleChange('company')} />
        </div>
        <div className="form-group">
          <label className="label">E-mail</label>
          <input className="input" type="email" value={form.email} onChange={handleChange('email')} />
        </div>
        <div className="form-group">
          <label className="label">Telefon</label>
          <input className="input" value={form.phone} onChange={handleChange('phone')} />
        </div>
        <div className="form-group">
          <label className="label">Google Drive</label>
          <input className="input" type="url" placeholder="https://drive.google.com/..." value={form.driveUrl} onChange={handleChange('driveUrl')} />
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
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Zrušit</button>
          <button type="submit" className="btn-primary flex-1">Uložit změny</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, clientId }) {
  const { dispatch } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [showOutputModal, setShowOutputModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleStatusChange = (e) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: { clientId, taskId: task.id, updates: { status: e.target.value } },
    })
  }

  const handleDeleteOutput = (outputId) => {
    dispatch({ type: 'DELETE_OUTPUT', payload: { clientId, taskId: task.id, outputId } })
  }

  const handleDeleteTask = () => {
    dispatch({ type: 'DELETE_TASK', payload: { clientId, taskId: task.id } })
  }

  const isImage = (fileType) => fileType && fileType.startsWith('image/')

  return (
    <div className="card overflow-hidden">
      {/* Task header - always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={task.status} />
              <ContentTypeBadge type={task.contentType} />
              {task.type === 'voice' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                  🎙️ Hlasová
                </span>
              )}
            </div>
            <h4 className="font-semibold text-gray-900 mt-1">{task.title}</h4>
            {task.description && !expanded && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
            )}
            {task.deadline && (
              <p className="text-xs text-gray-400 mt-1">
                Deadline: {formatDeadline(task.deadline)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.outputs.length > 0 && (
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                {task.outputs.length} výstupů
              </span>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 fade-in">
          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Popis</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Audio player */}
          {task.type === 'voice' && task.audioData && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Hlasová zpráva</p>
              <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                {task.audioName && (
                  <p className="text-xs text-violet-600 mb-2 font-medium">{task.audioName}</p>
                )}
                <audio controls src={task.audioData} className="w-full" />
              </div>
            </div>
          )}

          {/* Note */}
          {task.note && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Poznámka</p>
              <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded-lg border border-yellow-100">{task.note}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span>Vytvořeno: {formatDate(task.createdAt)}</span>
            {task.deadline && <span>Deadline: {formatDeadline(task.deadline)}</span>}
          </div>

          {/* Status change */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 flex-shrink-0">Stav:</label>
            <select
              value={task.status}
              onChange={handleStatusChange}
              className="input text-sm py-1.5 flex-1 max-w-[200px]"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Outputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Výstupy ({task.outputs.length})
              </p>
              <button
                onClick={() => setShowOutputModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Přidat výstup
              </button>
            </div>

            {task.outputs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Zatím žádné výstupy</p>
            ) : (
              <div className="space-y-2">
                {task.outputs.map(output => (
                  <div key={output.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{output.name}</p>
                        {output.note && (
                          <p className="text-xs text-gray-500 mt-0.5">{output.note}</p>
                        )}
                        {output.url && (
                          <a
                            href={output.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline mt-1 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {output.url.length > 50 ? output.url.slice(0, 50) + '…' : output.url}
                          </a>
                        )}
                        {output.fileData && (
                          <div className="mt-2">
                            {isImage(output.fileType) && (
                              <img
                                src={output.fileData}
                                alt={output.fileName}
                                className="max-h-32 rounded-lg border border-gray-200 object-contain"
                              />
                            )}
                            <a
                              href={output.fileData}
                              download={output.fileName}
                              className="text-xs text-indigo-600 hover:underline mt-1 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                              {output.fileName}
                            </a>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatDate(output.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteOutput(output.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                        title="Smazat výstup"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Upravit
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Smazat
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Opravdu smazat?</span>
                <button onClick={handleDeleteTask} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Ano</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded">Ne</button>
              </div>
            )}
          </div>
        </div>
      )}

      <OutputModal
        isOpen={showOutputModal}
        onClose={() => setShowOutputModal(false)}
        clientId={clientId}
        taskId={task.id}
      />
      <TaskModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        clientId={clientId}
        task={task}
      />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClientDetailPage({ clientId, onBack }) {
  const { state, dispatch } = useApp()
  const client = state.clients.find(c => c.id === clientId)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditClient, setShowEditClient] = useState(false)
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeSection, setActiveSection] = useState('tasks')

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Klient nenalezen.</p>
        <button onClick={onBack} className="btn-secondary mt-4">← Zpět</button>
      </div>
    )
  }

  const handleDeleteClient = () => {
    dispatch({ type: 'DELETE_CLIENT', payload: { id: clientId } })
    onBack()
  }

  const filteredTasks = statusFilter === 'all'
    ? client.tasks
    : client.tasks.filter(t => t.status === statusFilter)

  const taskCounts = {
    all: client.tasks.length,
    new: client.tasks.filter(t => t.status === 'new').length,
    in_progress: client.tasks.filter(t => t.status === 'in_progress').length,
    review: client.tasks.filter(t => t.status === 'review').length,
    done: client.tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Klienti
      </button>

      {/* Client header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl flex-shrink-0"
            style={{ backgroundColor: client.color }}
          >
            {getInitials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            {client.company && (
              <p className="text-gray-500 mt-0.5">{client.company}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {client.phone}
                </a>
              )}
              {client.driveUrl && (
                <a href={client.driveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Google Drive
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEditClient(true)}
              className="btn-secondary text-sm"
            >
              Upravit
            </button>
            {!confirmDeleteClient ? (
              <button
                onClick={() => setConfirmDeleteClient(true)}
                className="btn text-sm text-red-600 border border-red-200 hover:bg-red-50"
              >
                Smazat
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Smazat klienta?</span>
                <button onClick={handleDeleteClient} className="btn-danger text-sm">Ano</button>
                <button onClick={() => setConfirmDeleteClient(false)} className="btn-secondary text-sm">Ne</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div>
        <div className="flex gap-1 border-b border-gray-200 mb-4">
          {[
            { key: 'tasks', label: 'Požadavky / Úkoly' },
            { key: 'inspiration', label: 'Inspirace & Reference' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === tab.key
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSection === 'tasks' && (
          <>
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="text-lg font-bold text-gray-900">Požadavky / Úkoly</h2>
              <button onClick={() => setShowAddTask(true)} className="btn-primary text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Přidat požadavek
              </button>
            </div>

            {/* Status filter tabs */}
            {client.tasks.length > 0 && (
              <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
                {[
                  { key: 'all', label: 'Vše' },
                  { key: 'new', label: 'Nové' },
                  { key: 'in_progress', label: 'Probíhá' },
                  { key: 'review', label: 'Ke kontrole' },
                  { key: 'done', label: 'Hotovo' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      statusFilter === tab.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      statusFilter === tab.key ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {taskCounts[tab.key]}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Tasks list */}
            {filteredTasks.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  {statusFilter === 'all' ? 'Zatím žádné požadavky.' : 'Žádné požadavky v tomto stavu.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} clientId={clientId} />
                ))}
              </div>
            )}
          </>
        )}

        {activeSection === 'inspiration' && (
          <ClientInspirationSection clientId={clientId} />
        )}
      </div>

      <TaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        clientId={clientId}
      />
      {showEditClient && (
        <EditClientModal
          isOpen={showEditClient}
          onClose={() => setShowEditClient(false)}
          client={client}
        />
      )}
    </div>
  )
}
