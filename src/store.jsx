import React, { createContext, useContext, useReducer, useEffect } from 'react'

const STORAGE_KEY = 'agency_data'

const initialState = {
  clients: [],
  inquiries: [],
  inspiration: [],
  settings: {
    member1Name: 'Člen 1',
    member2Name: 'Člen 2',
  },
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    return {
      ...initialState,
      ...parsed,
      settings: { ...initialState.settings, ...(parsed.settings || {}) },
    }
  } catch {
    return initialState
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save state:', e)
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function reducer(state, action) {
  switch (action.type) {
    // ── CLIENTS ──────────────────────────────────────────────────────────────
    case 'ADD_CLIENT': {
      const client = {
        id: generateId(),
        name: action.payload.name,
        company: action.payload.company || '',
        email: action.payload.email || '',
        phone: action.payload.phone || '',
        color: action.payload.color || '#6366f1',
        tasks: [],
      }
      return { ...state, clients: [...state.clients, client] }
    }
    case 'UPDATE_CLIENT': {
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      }
    }
    case 'DELETE_CLIENT': {
      return {
        ...state,
        clients: state.clients.filter(c => c.id !== action.payload.id),
      }
    }

    // ── TASKS ─────────────────────────────────────────────────────────────────
    case 'ADD_TASK': {
      const task = {
        id: generateId(),
        title: action.payload.title,
        description: action.payload.description || '',
        type: action.payload.type || 'text',
        audioData: action.payload.audioData || null,
        audioName: action.payload.audioName || null,
        status: 'new',
        contentType: action.payload.contentType || 'other',
        deadline: action.payload.deadline || null,
        note: action.payload.note || '',
        outputs: [],
        createdAt: new Date().toISOString(),
      }
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === action.payload.clientId
            ? { ...c, tasks: [...c.tasks, task] }
            : c
        ),
      }
    }
    case 'UPDATE_TASK': {
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === action.payload.clientId
            ? {
                ...c,
                tasks: c.tasks.map(t =>
                  t.id === action.payload.taskId
                    ? { ...t, ...action.payload.updates }
                    : t
                ),
              }
            : c
        ),
      }
    }
    case 'DELETE_TASK': {
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === action.payload.clientId
            ? { ...c, tasks: c.tasks.filter(t => t.id !== action.payload.taskId) }
            : c
        ),
      }
    }

    // ── OUTPUTS ───────────────────────────────────────────────────────────────
    case 'ADD_OUTPUT': {
      const output = {
        id: generateId(),
        name: action.payload.name,
        note: action.payload.note || '',
        fileData: action.payload.fileData || null,
        fileName: action.payload.fileName || null,
        fileType: action.payload.fileType || null,
        url: action.payload.url || null,
        createdAt: new Date().toISOString(),
      }
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === action.payload.clientId
            ? {
                ...c,
                tasks: c.tasks.map(t =>
                  t.id === action.payload.taskId
                    ? { ...t, outputs: [...t.outputs, output] }
                    : t
                ),
              }
            : c
        ),
      }
    }
    case 'DELETE_OUTPUT': {
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === action.payload.clientId
            ? {
                ...c,
                tasks: c.tasks.map(t =>
                  t.id === action.payload.taskId
                    ? {
                        ...t,
                        outputs: t.outputs.filter(o => o.id !== action.payload.outputId),
                      }
                    : t
                ),
              }
            : c
        ),
      }
    }

    // ── INQUIRIES ─────────────────────────────────────────────────────────────
    case 'ADD_INQUIRY': {
      const inquiry = {
        id: generateId(),
        clientName: action.payload.clientName,
        contact: action.payload.contact || '',
        description: action.payload.description || '',
        budget: action.payload.budget || '',
        contentTypes: action.payload.contentTypes || [],
        deadline: action.payload.deadline || '',
        source: action.payload.source || '',
        votes: { member1: null, member2: null },
        notes: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      return { ...state, inquiries: [...state.inquiries, inquiry] }
    }
    case 'UPDATE_INQUIRY': {
      return {
        ...state,
        inquiries: state.inquiries.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload.updates } : i
        ),
      }
    }
    case 'VOTE_INQUIRY': {
      return {
        ...state,
        inquiries: state.inquiries.map(i => {
          if (i.id !== action.payload.id) return i
          const newVotes = { ...i.votes, [action.payload.member]: action.payload.vote }
          let status = 'pending'
          if (newVotes.member1 !== null && newVotes.member2 !== null) {
            status = newVotes.member1 === true && newVotes.member2 === true ? 'accepted' : 'rejected'
          }
          return { ...i, votes: newVotes, status }
        }),
      }
    }
    case 'DELETE_INQUIRY': {
      return {
        ...state,
        inquiries: state.inquiries.filter(i => i.id !== action.payload.id),
      }
    }

    // ── INSPIRATION ──────────────────────────────────────────────────────────
    case 'ADD_INSPIRATION': {
      const item = {
        id: generateId(),
        title: action.payload.title,
        description: action.payload.description || '',
        type: action.payload.type || 'other',
        tags: action.payload.tags || [],
        fileData: action.payload.fileData || null,
        fileName: action.payload.fileName || null,
        fileType: action.payload.fileType || null,
        url: action.payload.url || null,
        createdAt: new Date().toISOString(),
      }
      return { ...state, inspiration: [...state.inspiration, item] }
    }
    case 'UPDATE_INSPIRATION': {
      return {
        ...state,
        inspiration: state.inspiration.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload.updates } : i
        ),
      }
    }
    case 'DELETE_INSPIRATION': {
      return {
        ...state,
        inspiration: state.inspiration.filter(i => i.id !== action.payload.id),
      }
    }

    // ── SETTINGS ─────────────────────────────────────────────────────────────
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    }

    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export { generateId }
