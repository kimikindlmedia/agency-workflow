import React, { useState, useMemo } from 'react'
import { useApp } from '../store.jsx'

const STATUS_LABELS = {
  new: 'Nové',
  in_progress: 'Probíhá',
  review: 'Ke kontrole',
  done: 'Hotovo',
}

const STATUS_COLORS = {
  new: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-700',
}

function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

function formatWeek(weekStart) {
  const d = new Date(weekStart)
  const end = new Date(d)
  end.setDate(d.getDate() + 6)
  const fmt = (dt) => dt.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' })
  return `${fmt(d)} – ${fmt(end)}`
}

export default function TeamPage() {
  const { state, dispatch } = useApp()
  const { member1Name, member2Name, member3Name } = state.settings
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [newGoal, setNewGoal] = useState({ title: '', assignee: 'team' })
  const [showGoalForm, setShowGoalForm] = useState(false)

  // Get all tasks from all clients
  const allTasks = useMemo(() => {
    return state.clients.flatMap(client =>
      client.tasks.map(task => ({ ...task, clientName: client.company || client.name, clientColor: client.color }))
    )
  }, [state.clients])

  // Time logs this week
  const weekTimeLogs = useMemo(() => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return (state.timeLogs || []).filter(l => {
      const d = l.startedAt?.slice(0, 10)
      return d >= weekStart && d < weekEnd.toISOString().slice(0, 10)
    })
  }, [state.timeLogs, weekStart])

  const getMemberHours = (memberKey) => {
    const mins = weekTimeLogs.filter(l => l.member === memberKey).reduce((s, l) => s + (l.durationMinutes || 0), 0)
    return mins > 0 ? (mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? (mins % 60) + 'm' : ''}`.trim()) : null
  }

  // Group tasks by assignee
  const tasksByMember = (memberKey) =>
    allTasks.filter(t => t.assignee === memberKey || t.assignee === 'both')

  const getMemberStats = (memberKey) => {
    const tasks = tasksByMember(memberKey)
    return {
      total: tasks.length,
      done: tasks.filter(t => t.status === 'done').length,
      active: tasks.filter(t => t.status !== 'done').length,
    }
  }

  // Weekly goals
  const weekGoals = useMemo(() =>
    (state.weeklyGoals || []).filter(g => g.weekStart === weekStart),
    [state.weeklyGoals, weekStart]
  )

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d.toISOString().slice(0, 10))
  }
  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d.toISOString().slice(0, 10))
  }

  const addGoal = () => {
    if (!newGoal.title.trim()) return
    dispatch({ type: 'ADD_WEEKLY_GOAL', payload: { ...newGoal, weekStart } })
    setNewGoal({ title: '', assignee: 'team' })
    setShowGoalForm(false)
  }

  const toggleGoal = (id, done) => {
    dispatch({ type: 'UPDATE_WEEKLY_GOAL', payload: { id, updates: { done: !done } } })
  }

  const deleteGoal = (id) => {
    dispatch({ type: 'DELETE_WEEKLY_GOAL', payload: { id } })
  }

  const renderMemberTasks = (memberKey, memberName) => {
    const tasks = tasksByMember(memberKey)
    const stats = getMemberStats(memberKey)
    const activeTasks = tasks.filter(t => t.status !== 'done')
    const doneTasks = tasks.filter(t => t.status === 'done')
    const weekHours = getMemberHours(memberKey)

    return (
      <div className="card p-4 space-y-3">
        {/* Member header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {memberName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{memberName}</p>
              <p className="text-xs text-gray-500">
                {stats.active} aktivních · {stats.done} hotových
                {weekHours && <span className="text-purple-500"> · ⏱ {weekHours} tento týden</span>}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">{stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0}%</p>
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.done / stats.total * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active tasks */}
        {activeTasks.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Aktivní úkoly</p>
            <div className="space-y-1.5">
              {activeTasks.map(task => (
                <div key={task.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 truncate">{task.clientName}</p>
                  </div>
                  {task.deadline && (
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(task.deadline).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done tasks (collapsed) */}
        {doneTasks.length > 0 && (
          <details className="group">
            <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 flex items-center gap-1">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Hotové ({doneTasks.length})
            </summary>
            <div className="mt-2 space-y-1">
              {doneTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-1.5 opacity-60">
                  <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-gray-600 truncate line-through">{task.title}</p>
                  <p className="text-xs text-gray-400 ml-auto flex-shrink-0">{task.clientName}</p>
                </div>
              ))}
            </div>
          </details>
        )}

        {tasks.length === 0 && (
          <p className="text-sm text-gray-400 italic text-center py-4">Žádné přiřazené úkoly</p>
        )}
      </div>
    )
  }

  const goalAssigneeLabel = (a) => {
    if (a === 'member1') return member1Name
    if (a === 'member2') return member2Name
    if (a === 'member3') return member3Name
    return 'Celý tým'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tým</h1>
        <p className="text-sm text-gray-500 mt-0.5">Přehled úkolů a týdenní cíle</p>
      </div>

      {/* Member task boards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderMemberTasks('member1', member1Name)}
        {renderMemberTasks('member2', member2Name)}
        {renderMemberTasks('member3', member3Name)}
      </div>

      {/* Weekly goals */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Týdenní cíle</h2>
            <div className="flex items-center gap-1">
              <button onClick={prevWeek} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-600 font-medium px-1">{formatWeek(weekStart)}</span>
              <button onClick={nextWeek} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <button onClick={() => setShowGoalForm(s => !s)} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Přidat cíl
          </button>
        </div>

        {showGoalForm && (
          <div className="flex gap-2 mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <input
              className="input flex-1 text-sm"
              placeholder="Název cíle..."
              value={newGoal.title}
              onChange={e => setNewGoal(g => ({ ...g, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              autoFocus
            />
            <select
              className="input text-sm w-36 flex-shrink-0"
              value={newGoal.assignee}
              onChange={e => setNewGoal(g => ({ ...g, assignee: e.target.value }))}
            >
              <option value="team">Celý tým</option>
              <option value="member1">{member1Name}</option>
              <option value="member2">{member2Name}</option>
              <option value="member3">{member3Name}</option>
            </select>
            <button onClick={addGoal} className="btn-primary text-sm flex-shrink-0">Přidat</button>
            <button onClick={() => setShowGoalForm(false)} className="btn-secondary text-sm flex-shrink-0">Zrušit</button>
          </div>
        )}

        {weekGoals.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-6">Žádné cíle pro tento týden</p>
        ) : (
          <div className="space-y-2">
            {weekGoals.map(goal => (
              <div key={goal.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${goal.done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
                <button
                  onClick={() => toggleGoal(goal.id, goal.done)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${goal.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-400'}`}
                >
                  {goal.done && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <p className={`flex-1 text-sm font-medium ${goal.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{goal.title}</p>
                <span className="text-xs text-gray-400 flex-shrink-0">{goalAssigneeLabel(goal.assignee)}</span>
                <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
