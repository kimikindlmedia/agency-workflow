import React, { useState, useEffect } from 'react'
import { AppProvider, useApp } from './store.jsx'
import ClientsPage from './pages/ClientsPage.jsx'
import ClientDetailPage from './pages/ClientDetailPage.jsx'
import InquiriesPage from './pages/InquiriesPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import TeamPage from './pages/TeamPage.jsx'
import WallPage from './pages/WallPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PortalPage from './pages/PortalPage.jsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard',  icon: DashboardIcon },
  { id: 'clients',   label: 'Klienti',    icon: UsersIcon },
  { id: 'inquiries', label: 'Poptávky',   icon: InboxIcon },
  { id: 'calendar',  label: 'Kalendář',   icon: CalendarIcon },
  { id: 'team',      label: 'Tým',        icon: TeamIcon },
  { id: 'wall',      label: 'Zeď',        icon: WallIcon },
  { id: 'settings',  label: 'Nastavení',  icon: CogIcon },
]

function DashboardIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 7a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function InboxIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function CogIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function TeamIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function WallIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function MemberPicker() {
  const { state, activeMember, setActiveMember } = useApp()
  const { member1Name, member2Name, member3Name } = state.settings
  const members = [
    { key: 'member1', name: member1Name },
    { key: 'member2', name: member2Name },
    { key: 'member3', name: member3Name },
  ]
  if (activeMember) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Kdo jsi?</h2>
        <p className="text-sm text-gray-500 mb-6">Vyber svůj profil — appka si tě zapamatuje.</p>
        <div className="space-y-2">
          {members.map(m => (
            <button
              key={m.key}
              onClick={() => setActiveMember(m.key)}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm border-2 border-gray-100 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-all"
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const { state, activeMember, setActiveMember } = useApp()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showMemberMenu, setShowMemberMenu] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [portalClientId, setPortalClientId] = useState(() => {
    const hash = window.location.hash
    return hash.startsWith('#portal-') ? hash.slice('#portal-'.length) : null
  })

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      setPortalClientId(hash.startsWith('#portal-') ? hash.slice('#portal-'.length) : null)
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Portal mode — full-screen read-only client view
  if (portalClientId) {
    if (state.loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    return <PortalPage clientId={portalClientId} />
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Načítám data…</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Chyba připojení</h2>
          <p className="text-sm text-gray-500 mb-4">{state.error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Zkusit znovu</button>
        </div>
      </div>
    )
  }

  const handleSelectClient = (id) => {
    setSelectedClientId(id)
  }

  const handleBackToClients = () => {
    setSelectedClientId(null)
  }

  const renderContent = () => {
    if (activeTab === 'dashboard') return <DashboardPage />
    if (activeTab === 'clients') {
      if (selectedClientId) {
        return (
          <ClientDetailPage
            clientId={selectedClientId}
            onBack={handleBackToClients}
          />
        )
      }
      return <ClientsPage onSelectClient={handleSelectClient} />
    }
    if (activeTab === 'inquiries') return <InquiriesPage />
    if (activeTab === 'calendar') return <CalendarPage />
    if (activeTab === 'team') return <TeamPage />
    if (activeTab === 'wall') return <WallPage />
    if (activeTab === 'settings') return <SettingsPage />
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MemberPicker />
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14">
            {/* Logo */}
            <div className="flex items-center gap-2 mr-8 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-sm hidden sm:block">Agency</span>
            </div>

            {/* Tabs */}
            <nav className="flex gap-1 overflow-x-auto flex-1 mr-2">
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      if (tab.id !== 'clients') setSelectedClientId(null)
                      window.location.hash = ''
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
            {/* Active member */}
            {activeMember && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowMemberMenu(m => !m)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors border border-indigo-200"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {(state.settings[activeMember + 'Name'] || '?')[0]}
                  </span>
                  <span className="hidden sm:inline">{state.settings[activeMember + 'Name']}</span>
                </button>
                {showMemberMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 min-w-[140px]">
                    <p className="px-3 py-1 text-xs text-gray-400 font-medium">Přepnout na:</p>
                    {['member1', 'member2', 'member3'].map(mk => (
                      <button
                        key={mk}
                        onClick={() => { setActiveMember(mk); setShowMemberMenu(false) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${activeMember === mk ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                      >
                        {state.settings[mk + 'Name']}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {renderContent()}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
