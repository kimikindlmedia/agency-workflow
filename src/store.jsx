import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, uploadFileFromBase64 } from './supabase.js'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ── Normalize DB rows → frontend format ──────────────────────────────────────

function normalizeClient(c) {
  return { ...c, createdAt: c.created_at, driveUrl: c.drive_url || '', tasks: [] }
}

function normalizeTask(t) {
  return {
    ...t,
    clientId: t.client_id,
    audioData: t.audio_url,
    audioName: t.audio_name,
    contentType: t.content_type,
    createdAt: t.created_at,
    outputs: [],
  }
}

function normalizeOutput(o) {
  return {
    ...o,
    fileData: o.file_url,
    fileName: o.file_name,
    fileType: o.file_type,
    createdAt: o.created_at,
  }
}

function normalizeInquiry(i) {
  return {
    ...i,
    clientName: i.client_name,
    contentTypes: i.content_types || [],
    profileLinks: i.profile_links || {},
    createdAt: i.created_at,
    stage: i.stage || 'lead',
  }
}

function normalizeInspiration(item) {
  return {
    ...item,
    fileData: item.file_url,
    fileName: item.file_name,
    fileType: item.file_type,
    createdAt: item.created_at,
    clientId: item.client_id || null,
  }
}

function normalizeEvent(e) {
  return { ...e, clientId: e.client_id, createdAt: e.created_at }
}

// ── Context & Provider ────────────────────────────────────────────────────────

const initialState = {
  clients: [],
  inquiries: [],
  inspiration: [],
  events: [],
  settings: { member1Name: 'Člen 1', member2Name: 'Člen 2' },
  loading: true,
  error: null,
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState(initialState)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [clientsRes, tasksRes, outputsRes, inquiriesRes, inspirationRes, settingsRes, eventsRes] =
        await Promise.all([
          supabase.from('clients').select('*').order('created_at'),
          supabase.from('tasks').select('*').order('created_at'),
          supabase.from('outputs').select('*').order('created_at'),
          supabase.from('inquiries').select('*').order('created_at', { ascending: false }),
          supabase.from('inspiration').select('*').order('created_at', { ascending: false }),
          supabase.from('settings').select('*').eq('id', 1).single(),
          supabase.from('events').select('*').order('date'),
        ])

      // Group outputs by task_id
      const outputsByTask = {}
      for (const o of (outputsRes.data || [])) {
        if (!outputsByTask[o.task_id]) outputsByTask[o.task_id] = []
        outputsByTask[o.task_id].push(normalizeOutput(o))
      }

      // Group tasks by client_id
      const tasksByClient = {}
      for (const t of (tasksRes.data || [])) {
        if (!tasksByClient[t.client_id]) tasksByClient[t.client_id] = []
        tasksByClient[t.client_id].push({ ...normalizeTask(t), outputs: outputsByTask[t.id] || [] })
      }

      const clients = (clientsRes.data || []).map(c => ({
        ...normalizeClient(c),
        tasks: tasksByClient[c.id] || [],
      }))

      const settings = settingsRes.data
        ? { member1Name: settingsRes.data.member1_name, member2Name: settingsRes.data.member2_name }
        : initialState.settings

      setState({
        clients,
        inquiries: (inquiriesRes.data || []).map(normalizeInquiry),
        inspiration: (inspirationRes.data || []).map(normalizeInspiration),
        events: (eventsRes.data || []).map(normalizeEvent),
        settings,
        loading: false,
        error: null,
      })
    } catch (err) {
      console.error('Nepodařilo se načíst data:', err)
      setState(s => ({ ...s, loading: false, error: err.message }))
    }
  }

  const dispatch = useCallback(async (action) => {
    switch (action.type) {

      // ── CLIENTS ────────────────────────────────────────────────────────────

      case 'ADD_CLIENT': {
        const id = generateId()
        const row = {
          id,
          name: action.payload.name,
          company: action.payload.company || '',
          email: action.payload.email || '',
          phone: action.payload.phone || '',
          color: action.payload.color || '#6366f1',
          drive_url: action.payload.driveUrl || '',
          created_at: new Date().toISOString(),
        }
        setState(s => ({
          ...s,
          clients: [...s.clients, { ...row, createdAt: row.created_at, driveUrl: row.drive_url, tasks: [] }],
        }))
        await supabase.from('clients').insert(row)
        break
      }

      case 'UPDATE_CLIENT': {
        const { id, ...rest } = action.payload
        setState(s => ({
          ...s,
          clients: s.clients.map(c => c.id === id ? { ...c, ...rest } : c),
        }))
        const dbUpdate = {}
        if (rest.name      !== undefined) dbUpdate.name      = rest.name
        if (rest.company   !== undefined) dbUpdate.company   = rest.company
        if (rest.email     !== undefined) dbUpdate.email     = rest.email
        if (rest.phone     !== undefined) dbUpdate.phone     = rest.phone
        if (rest.color     !== undefined) dbUpdate.color     = rest.color
        if (rest.driveUrl  !== undefined) dbUpdate.drive_url = rest.driveUrl
        await supabase.from('clients').update(dbUpdate).eq('id', id)
        break
      }

      case 'DELETE_CLIENT': {
        setState(s => ({ ...s, clients: s.clients.filter(c => c.id !== action.payload.id) }))
        await supabase.from('clients').delete().eq('id', action.payload.id)
        break
      }

      // ── TASKS ──────────────────────────────────────────────────────────────

      case 'ADD_TASK': {
        const { clientId, audioData, audioName, contentType, deadline, ...rest } = action.payload

        // Upload audio if base64
        let audioUrl = audioData || null
        if (audioUrl && audioUrl.startsWith('data:')) {
          try { audioUrl = await uploadFileFromBase64(audioUrl, 'audio', audioName) }
          catch (e) { console.error('Audio upload failed:', e) }
        }

        const id = generateId()
        const row = {
          id,
          client_id: clientId,
          title: rest.title,
          description: rest.description || '',
          type: rest.type || 'text',
          audio_url: audioUrl,
          audio_name: audioName || null,
          status: 'new',
          content_type: contentType || 'other',
          deadline: deadline || null,
          note: rest.note || '',
          created_at: new Date().toISOString(),
        }
        const frontendTask = {
          ...row,
          clientId,
          audioData: audioUrl,
          audioName: row.audio_name,
          contentType: row.content_type,
          createdAt: row.created_at,
          outputs: [],
        }
        setState(s => ({
          ...s,
          clients: s.clients.map(c =>
            c.id === clientId ? { ...c, tasks: [...c.tasks, frontendTask] } : c
          ),
        }))
        await supabase.from('tasks').insert(row)
        break
      }

      case 'UPDATE_TASK': {
        const { clientId, taskId, updates } = action.payload
        setState(s => ({
          ...s,
          clients: s.clients.map(c =>
            c.id === clientId
              ? { ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) }
              : c
          ),
        }))
        const dbUpdate = {}
        if (updates.status      !== undefined) dbUpdate.status       = updates.status
        if (updates.title       !== undefined) dbUpdate.title        = updates.title
        if (updates.description !== undefined) dbUpdate.description  = updates.description
        if (updates.note        !== undefined) dbUpdate.note         = updates.note
        if (updates.deadline    !== undefined) dbUpdate.deadline     = updates.deadline
        if (updates.contentType !== undefined) dbUpdate.content_type = updates.contentType
        await supabase.from('tasks').update(dbUpdate).eq('id', taskId)
        break
      }

      case 'DELETE_TASK': {
        const { clientId, taskId } = action.payload
        setState(s => ({
          ...s,
          clients: s.clients.map(c =>
            c.id === clientId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c
          ),
        }))
        await supabase.from('tasks').delete().eq('id', taskId)
        break
      }

      // ── OUTPUTS ────────────────────────────────────────────────────────────

      case 'ADD_OUTPUT': {
        const { clientId, taskId, fileData, fileName, fileType, ...rest } = action.payload

        let fileUrl = fileData || null
        if (fileUrl && fileUrl.startsWith('data:')) {
          try { fileUrl = await uploadFileFromBase64(fileUrl, 'outputs', fileName) }
          catch (e) { console.error('Output upload failed:', e) }
        }

        const id = generateId()
        const row = {
          id,
          task_id: taskId,
          name: rest.name,
          note: rest.note || '',
          file_url: fileUrl,
          file_name: fileName || null,
          file_type: fileType || null,
          url: rest.url || null,
          created_at: new Date().toISOString(),
        }
        const frontendOutput = {
          ...row,
          fileData: fileUrl,
          fileName: row.file_name,
          fileType: row.file_type,
          createdAt: row.created_at,
        }
        setState(s => ({
          ...s,
          clients: s.clients.map(c =>
            c.id === clientId
              ? {
                  ...c,
                  tasks: c.tasks.map(t =>
                    t.id === taskId ? { ...t, outputs: [...t.outputs, frontendOutput] } : t
                  ),
                }
              : c
          ),
        }))
        await supabase.from('outputs').insert(row)
        break
      }

      case 'DELETE_OUTPUT': {
        const { clientId, taskId, outputId } = action.payload
        setState(s => ({
          ...s,
          clients: s.clients.map(c =>
            c.id === clientId
              ? {
                  ...c,
                  tasks: c.tasks.map(t =>
                    t.id === taskId
                      ? { ...t, outputs: t.outputs.filter(o => o.id !== outputId) }
                      : t
                  ),
                }
              : c
          ),
        }))
        await supabase.from('outputs').delete().eq('id', outputId)
        break
      }

      // ── INQUIRIES ──────────────────────────────────────────────────────────

      case 'ADD_INQUIRY': {
        const id = generateId()
        const row = {
          id,
          client_name: action.payload.clientName,
          contact: action.payload.contact || '',
          description: action.payload.description || '',
          budget: action.payload.budget || '',
          content_types: action.payload.contentTypes || [],
          deadline: action.payload.deadline || '',
          source: action.payload.source || '',
          profile_links: action.payload.profileLinks || {},
          stage: action.payload.stage || 'lead',
          votes: { member1: null, member2: null },
          notes: '',
          status: 'pending',
          created_at: new Date().toISOString(),
        }
        const frontend = {
          ...row,
          clientName: row.client_name,
          contentTypes: row.content_types,
          profileLinks: row.profile_links,
          createdAt: row.created_at,
          stage: row.stage,
        }
        setState(s => ({ ...s, inquiries: [frontend, ...s.inquiries] }))
        await supabase.from('inquiries').insert(row)
        break
      }

      case 'UPDATE_INQUIRY': {
        const { id, updates } = action.payload
        setState(s => ({
          ...s,
          inquiries: s.inquiries.map(i => i.id === id ? { ...i, ...updates } : i),
        }))
        const dbUpdate = {}
        if (updates.status !== undefined) dbUpdate.status = updates.status
        if (updates.votes  !== undefined) dbUpdate.votes  = updates.votes
        if (updates.notes  !== undefined) dbUpdate.notes  = updates.notes
        if (updates.stage  !== undefined) dbUpdate.stage  = updates.stage
        if (updates.clientName   !== undefined) dbUpdate.client_name   = updates.clientName
        if (updates.contact      !== undefined) dbUpdate.contact       = updates.contact
        if (updates.description  !== undefined) dbUpdate.description   = updates.description
        if (updates.budget       !== undefined) dbUpdate.budget        = updates.budget
        if (updates.contentTypes !== undefined) dbUpdate.content_types = updates.contentTypes
        if (updates.deadline     !== undefined) dbUpdate.deadline      = updates.deadline
        if (updates.source       !== undefined) dbUpdate.source        = updates.source
        if (updates.profileLinks !== undefined) dbUpdate.profile_links = updates.profileLinks
        await supabase.from('inquiries').update(dbUpdate).eq('id', id)
        break
      }

      case 'VOTE_INQUIRY': {
        const { id, member, vote } = action.payload
        setState(s => ({
          ...s,
          inquiries: s.inquiries.map(i => {
            if (i.id !== id) return i
            const newVotes = { ...i.votes, [member]: vote }
            const bothVoted = newVotes.member1 !== null && newVotes.member2 !== null
            const status = !bothVoted
              ? 'pending'
              : newVotes.member1 === true && newVotes.member2 === true
                ? 'accepted'
                : 'rejected'
            supabase.from('inquiries').update({ votes: newVotes, status }).eq('id', id)
            return { ...i, votes: newVotes, status }
          }),
        }))
        break
      }

      case 'DELETE_INQUIRY': {
        setState(s => ({ ...s, inquiries: s.inquiries.filter(i => i.id !== action.payload.id) }))
        await supabase.from('inquiries').delete().eq('id', action.payload.id)
        break
      }

      // ── INSPIRATION ────────────────────────────────────────────────────────

      case 'ADD_INSPIRATION': {
        const { fileData, fileName, fileType, ...rest } = action.payload

        let fileUrl = fileData || null
        if (fileUrl && fileUrl.startsWith('data:')) {
          try { fileUrl = await uploadFileFromBase64(fileUrl, 'inspiration', fileName) }
          catch (e) { console.error('Inspiration upload failed:', e) }
        }

        const id = generateId()
        const row = {
          id,
          title: rest.title,
          description: rest.description || '',
          type: rest.type || 'other',
          tags: rest.tags || [],
          file_url: fileUrl,
          file_name: fileName || null,
          file_type: fileType || null,
          url: rest.url || null,
          client_id: rest.clientId || null,
          created_at: new Date().toISOString(),
        }
        const frontend = {
          ...row,
          fileData: fileUrl,
          fileName: row.file_name,
          fileType: row.file_type,
          createdAt: row.created_at,
          clientId: row.client_id,
        }
        setState(s => ({ ...s, inspiration: [frontend, ...s.inspiration] }))
        await supabase.from('inspiration').insert(row)
        break
      }

      case 'UPDATE_INSPIRATION': {
        const { id, updates } = action.payload

        let fileUrl = updates.fileData || null
        if (fileUrl && fileUrl.startsWith('data:')) {
          try { fileUrl = await uploadFileFromBase64(fileUrl, 'inspiration', updates.fileName) }
          catch (e) { console.error('Inspiration update upload failed:', e) }
        }

        const normalizedUpdates = { ...updates, fileData: fileUrl !== undefined ? fileUrl : updates.fileData }
        setState(s => ({
          ...s,
          inspiration: s.inspiration.map(i => i.id === id ? { ...i, ...normalizedUpdates } : i),
        }))
        await supabase.from('inspiration').update({
          title:       updates.title,
          description: updates.description,
          type:        updates.type,
          tags:        updates.tags,
          file_url:    fileUrl,
          file_name:   updates.fileName || null,
          file_type:   updates.fileType || null,
          url:         updates.url || null,
          client_id:   updates.clientId || null,
        }).eq('id', id)
        break
      }

      case 'DELETE_INSPIRATION': {
        setState(s => ({
          ...s,
          inspiration: s.inspiration.filter(i => i.id !== action.payload.id),
        }))
        await supabase.from('inspiration').delete().eq('id', action.payload.id)
        break
      }

      // ── EVENTS ─────────────────────────────────────────────────────────────

      case 'ADD_EVENT': {
        const id = generateId()
        const row = {
          id,
          title: action.payload.title,
          date: action.payload.date,
          type: action.payload.type || 'other',
          client_id: action.payload.clientId || null,
          description: action.payload.description || '',
          created_at: new Date().toISOString(),
        }
        const frontend = { ...row, clientId: row.client_id, createdAt: row.created_at }
        setState(s => ({ ...s, events: [...s.events, frontend].sort((a,b) => a.date.localeCompare(b.date)) }))
        await supabase.from('events').insert(row)
        break
      }

      case 'UPDATE_EVENT': {
        const { id, updates } = action.payload
        setState(s => ({ ...s, events: s.events.map(e => e.id === id ? { ...e, ...updates } : e) }))
        const dbUpdate = {}
        if (updates.title       !== undefined) dbUpdate.title       = updates.title
        if (updates.date        !== undefined) dbUpdate.date        = updates.date
        if (updates.type        !== undefined) dbUpdate.type        = updates.type
        if (updates.clientId    !== undefined) dbUpdate.client_id   = updates.clientId
        if (updates.description !== undefined) dbUpdate.description = updates.description
        await supabase.from('events').update(dbUpdate).eq('id', id)
        break
      }

      case 'DELETE_EVENT': {
        setState(s => ({ ...s, events: s.events.filter(e => e.id !== action.payload.id) }))
        await supabase.from('events').delete().eq('id', action.payload.id)
        break
      }

      // ── SETTINGS ───────────────────────────────────────────────────────────

      case 'UPDATE_SETTINGS': {
        setState(s => ({ ...s, settings: { ...s.settings, ...action.payload } }))
        await supabase.from('settings').update({
          member1_name: action.payload.member1Name,
          member2_name: action.payload.member2Name,
        }).eq('id', 1)
        break
      }

      default:
        break
    }
  }, [])

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
