import React, { useState } from 'react'
import { useApp } from '../store.jsx'

export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState({
    member1Name: state.settings.member1Name,
    member2Name: state.settings.member2Name,
    member3Name: state.settings.member3Name,
  })
  const [saved, setSaved] = useState(false)

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setSaved(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch({ type: 'UPDATE_SETTINGS', payload: form })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
        <p className="text-sm text-gray-500 mt-0.5">Konfigurace aplikace</p>
      </div>

      {/* Team members */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Členové týmu</h2>
        <p className="text-sm text-gray-500 mb-4">
          Jména členů týmu se zobrazují v hlasování u poptávek.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Člen týmu 1</label>
            <input
              className="input"
              placeholder="Jméno prvního člena"
              value={form.member1Name}
              onChange={handleChange('member1Name')}
            />
          </div>

          <div className="form-group">
            <label className="label">Člen týmu 2</label>
            <input
              className="input"
              placeholder="Jméno druhého člena"
              value={form.member2Name}
              onChange={handleChange('member2Name')}
            />
          </div>

          <div className="form-group">
            <label className="label">Člen týmu 3</label>
            <input
              className="input"
              placeholder="Jméno třetího člena"
              value={form.member3Name}
              onChange={handleChange('member3Name')}
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Náhled hlasování:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200 text-center">
                <p className="text-sm font-medium text-gray-700 truncate">{form.member1Name || 'Člen 1'}</p>
                <div className="flex gap-1 mt-1.5">
                  <div className="flex-1 py-1 rounded text-xs bg-green-50 text-green-700 border border-green-200 text-center">Přijmout</div>
                  <div className="flex-1 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200 text-center">Zamítnout</div>
                </div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200 text-center">
                <p className="text-sm font-medium text-gray-700 truncate">{form.member2Name || 'Člen 2'}</p>
                <div className="flex gap-1 mt-1.5">
                  <div className="flex-1 py-1 rounded text-xs bg-green-50 text-green-700 border border-green-200 text-center">Přijmout</div>
                  <div className="flex-1 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200 text-center">Zamítnout</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary">
              Uložit nastavení
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium fade-in">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Uloženo!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Data info */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Data a úložiště</h2>
        <p className="text-sm text-gray-500 mb-3">
          Všechna data jsou uložena lokálně ve vašem prohlížeči (localStorage). Data se neposílají na žádný server.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Klientů', value: state.clients.length },
            { label: 'Poptávek', value: state.inquiries.length },
            { label: 'Inspirací', value: state.inspiration.length },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-indigo-600">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-100">
        <h2 className="text-base font-semibold text-red-700 mb-1">Nebezpečná zóna</h2>
        <p className="text-sm text-gray-500 mb-3">
          Tato akce smaže všechna data aplikace. Tuto akci nelze vrátit zpět.
        </p>
        <DangerZone />
      </div>
    </div>
  )
}

function DangerZone() {
  const { dispatch } = useApp()
  const [confirm, setConfirm] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const CONFIRM_WORD = 'SMAZAT'

  const handleClear = () => {
    if (inputValue !== CONFIRM_WORD) return
    // Reset all data
    localStorage.removeItem('agency_data')
    window.location.reload()
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="btn text-sm text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300"
      >
        Smazat všechna data
      </button>
    )
  }

  return (
    <div className="bg-red-50 rounded-lg p-4 border border-red-200 space-y-3">
      <p className="text-sm text-red-700 font-medium">
        Tato akce je nevratná. Pro potvrzení napište <strong>{CONFIRM_WORD}</strong>:
      </p>
      <input
        className="input border-red-300 focus:ring-red-400"
        placeholder={CONFIRM_WORD}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={handleClear}
          disabled={inputValue !== CONFIRM_WORD}
          className="btn-danger text-sm"
        >
          Potvrdit smazání
        </button>
        <button
          onClick={() => { setConfirm(false); setInputValue('') }}
          className="btn-secondary text-sm"
        >
          Zrušit
        </button>
      </div>
    </div>
  )
}
