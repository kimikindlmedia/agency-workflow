import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../store.jsx'
import Modal from '../components/Modal.jsx'
import { StatusBadge, ContentTypeBadge } from '../components/Badge.jsx'
import { Avatar, getInitials } from './ClientsPage.jsx'
import ClientInspirationSection from '../components/ClientInspiration.jsx'
import ClientScenariosSection from '../components/ClientScenarios.jsx'

const ALL_SERVICES = ['Správa soc. sítí','Reels','Carousely','Natáčení','Edit','Scénáře','Focení']

const TASK_TEMPLATES = [
  { label: 'Správa IG – měsíc',      title: 'Správa Instagram – měsíční správa',    description: 'Tvorba a plánování obsahu pro Instagram na celý měsíc.', contentType: 'post' },
  { label: 'Reels balíček (4×)',      title: 'Reels balíček – 4 videa',              description: '4× krátké video (Reels) včetně střihu a titulků.', contentType: 'reel' },
  { label: 'Carousel posty (4×)',     title: 'Carousel posty – 4 ks',               description: '4× carousel post s grafikou a textem.', contentType: 'carousel' },
  { label: 'Story série',             title: 'Story série',                          description: 'Série Instagram/Facebook Stories.', contentType: 'story' },
  { label: 'Foto den',                title: 'Foto den – product/lifestyle',         description: 'Fotografování produktů nebo lifestylu.', contentType: 'other' },
  { label: 'Scénáře na měsíc',        title: 'Scénáře – měsíční balíček',           description: 'Příprava scénářů pro videa na celý měsíc.', contentType: 'other' },
]

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
  const { dispatch, state } = useApp()
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
    assignee: Array.isArray(task?.assignee) ? task.assignee : (task?.assignee ? [task.assignee] : []),
  })
  const [errors, setErrors] = useState({})
  const [audioError, setAudioError] = useState('')
  const audioRef = useRef(null)
  const [showTemplates, setShowTemplates] = useState(false)

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
      setForm({ title: '', description: '', type: 'text', audioData: null, audioName: null, contentType: 'other', deadline: '', note: '', assignee: [] })
    }
    setErrors({})
    setAudioError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Upravit požadavek' : 'Přidat požadavek'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplates(s => !s)}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Ze šablony
              <svg className={`w-3.5 h-3.5 transition-transform ${showTemplates ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showTemplates && (
              <div className="absolute top-7 left-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[220px]">
                {TASK_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, title: tpl.title, description: tpl.description, contentType: tpl.contentType }))
                      setShowTemplates(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
          <label className="label">Přiřadit</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {[
              { key: 'member1', name: state.settings.member1Name },
              { key: 'member2', name: state.settings.member2Name },
              { key: 'member3', name: state.settings.member3Name },
            ].map(m => {
              const active = (form.assignee || []).includes(m.key)
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    assignee: active
                      ? f.assignee.filter(x => x !== m.key)
                      : [...(f.assignee || []), m.key],
                  }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  {m.name}
                </button>
              )
            })}
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
    photoUrl: client.photoUrl || '',
    services: client.services || [],
    socialLinks: { instagram: '', tiktok: '', facebook: '', youtube: '', web: '', ...(client.socialLinks || {}) },
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleSocialChange = (platform) => (e) => {
    setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [platform]: e.target.value } }))
  }

  const toggleService = (s) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Jméno je povinné' }); return }
    dispatch({ type: 'UPDATE_CLIENT', payload: { id: client.id, ...form } })
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
          <label className="label">Foto klienta</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="URL fotky nebo nahrajte soubor"
              value={form.photoUrl}
              onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))}
            />
            <label className="btn-secondary cursor-pointer flex-shrink-0">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => setForm(f => ({ ...f, photoUrl: reader.result }))
                  reader.readAsDataURL(file)
                }}
              />
              Nahrát
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">Vložte URL z Instagramu nebo nahrajte foto</p>
        </div>
        <div className="form-group">
          <label className="label">Sociální sítě</label>
          <div className="space-y-2 mt-1">
            {[
              { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
              { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/...' },
              { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/...' },
              { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/...' },
              { key: 'web',       label: 'Web',       placeholder: 'https://...' },
            ].map(p => (
              <div key={p.key} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{p.label}</span>
                <input
                  className="input flex-1 text-sm"
                  type="url"
                  placeholder={p.placeholder}
                  value={form.socialLinks[p.key] || ''}
                  onChange={handleSocialChange(p.key)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="label">Služby</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ALL_SERVICES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  form.services.includes(s)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-indigo-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
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

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, clientId }) {
  const { dispatch, state: appState } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [showOutputModal, setShowOutputModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [timerActive, setTimerActive] = useState(false)
  const [timerStart, setTimerStart] = useState(null)
  const [timerElapsed, setTimerElapsed] = useState(0)
  const [timerMember, setTimerMember] = useState('')
  const [showTimerSetup, setShowTimerSetup] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000))
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [timerActive, timerStart])

  const startTimer = (member) => {
    setTimerMember(member)
    setTimerStart(Date.now())
    setTimerElapsed(0)
    setTimerActive(true)
    setShowTimerSetup(false)
  }

  const stopTimer = () => {
    clearInterval(timerRef.current)
    setTimerActive(false)
    const durationMinutes = Math.max(1, Math.round(timerElapsed / 60))
    const now = new Date().toISOString()
    dispatch({
      type: 'ADD_TIME_LOG',
      payload: {
        taskId: task.id,
        member: timerMember,
        startedAt: new Date(timerStart).toISOString(),
        endedAt: now,
        durationMinutes,
      },
    })
    setTimerElapsed(0)
    setTimerStart(null)
  }

  const taskTimeLogs = appState.timeLogs.filter(l => l.taskId === task.id)
  const totalMinutes = taskTimeLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)

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
              {(task.assignee || []).map(mk => (
                <span key={mk} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                  {mk === 'member1' ? appState.settings.member1Name : mk === 'member2' ? appState.settings.member2Name : appState.settings.member3Name}
                </span>
              ))}
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
            {totalMinutes > 0 && !timerActive && (
              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
                ⏱ {formatDuration(totalMinutes)}
              </span>
            )}
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

          {/* Timer */}
          <div className="pt-2 border-t border-gray-100">
            {timerActive ? (
              <div className="flex items-center gap-3 p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-sm font-mono font-bold text-purple-700">
                    {String(Math.floor(timerElapsed / 3600)).padStart(2,'0')}:{String(Math.floor((timerElapsed % 3600) / 60)).padStart(2,'0')}:{String(timerElapsed % 60).padStart(2,'0')}
                  </span>
                  <span className="text-xs text-purple-500">· {appState.settings[timerMember + 'Name'] || timerMember}</span>
                </div>
                <button onClick={stopTimer} className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors">
                  Zastavit
                </button>
              </div>
            ) : showTimerSetup ? (
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-600 flex-shrink-0">Kdo pracuje?</span>
                {[
                  { key: 'member1', name: appState.settings.member1Name },
                  { key: 'member2', name: appState.settings.member2Name },
                  { key: 'member3', name: appState.settings.member3Name },
                ].map(m => (
                  <button key={m.key} onClick={() => startTimer(m.key)} className="text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
                    {m.name}
                  </button>
                ))}
                <button onClick={() => setShowTimerSetup(false)} className="text-xs text-gray-400 hover:text-gray-600 ml-auto">Zrušit</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTimerSetup(true)}
                  className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Spustit stopky
                </button>
                {totalMinutes > 0 && (
                  <span className="text-xs text-gray-400">celkem {formatDuration(totalMinutes)}</span>
                )}
              </div>
            )}
          </div>

          {/* Time log history */}
          {taskTimeLogs.length > 0 && !timerActive && (
            <details className="text-xs">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Historie stopek ({taskTimeLogs.length})</summary>
              <div className="mt-2 space-y-1">
                {taskTimeLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-2 text-gray-500">
                    <span>{appState.settings[log.member + 'Name'] || log.member}</span>
                    <span>·</span>
                    <span>{formatDuration(log.durationMinutes)}</span>
                    <span className="text-gray-300">·</span>
                    <span>{new Date(log.startedAt).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' })}</span>
                    <button onClick={() => dispatch({ type: 'DELETE_TIME_LOG', payload: { id: log.id } })} className="ml-auto text-gray-300 hover:text-red-400">×</button>
                  </div>
                ))}
              </div>
            </details>
          )}

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
  const [portalCopied, setPortalCopied] = useState(false)

  const copyPortalLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#portal-${clientId}`
    navigator.clipboard.writeText(url).then(() => {
      setPortalCopied(true)
      setTimeout(() => setPortalCopied(false), 2500)
    })
  }

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
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: client.photoUrl ? 'transparent' : client.color }}
          >
            {client.photoUrl
              ? <img src={client.photoUrl} alt={client.name} className="w-full h-full object-cover" />
              : getInitials(client.name)
            }
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
            {/* Services (read-only — upravit v Editaci) */}
            {(client.services || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(client.services || []).map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-600 text-white border-indigo-600">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {/* Social links */}
            {client.socialLinks && Object.values(client.socialLinks).some(Boolean) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {client.socialLinks.instagram && (
                  <a href={client.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 transition-colors px-2 py-1 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    Instagram
                  </a>
                )}
                {client.socialLinks.tiktok && (
                  <a href={client.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/></svg>
                    TikTok
                  </a>
                )}
                {client.socialLinks.facebook && (
                  <a href={client.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                )}
                {client.socialLinks.youtube && (
                  <a href={client.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                    YouTube
                  </a>
                )}
                {client.socialLinks.web && (
                  <a href={client.socialLinks.web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    Web
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <button
              onClick={copyPortalLink}
              className="btn-secondary text-sm flex items-center gap-1.5"
              title="Sdílet portál klienta"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {portalCopied ? 'Zkopírováno!' : 'Portál'}
            </button>
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
            { key: 'scenarios', label: 'Scénáře' },
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

        {activeSection === 'scenarios' && <ClientScenariosSection clientId={clientId} />}
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
