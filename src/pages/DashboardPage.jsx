import React, { useMemo } from 'react';
import { useApp } from '../store.jsx';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  d.setHours(0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

const MONTH_SHORT = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];

function getMemberInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const MEMBER_COLORS = {
  member1: 'bg-indigo-500',
  member2: 'bg-violet-500',
  member3: 'bg-sky-500',
};

const STAGE_BADGE = {
  lead: { label: 'Poptávka', className: 'bg-gray-100 text-gray-600' },
  confirmed: { label: 'Potvrzený zájem', className: 'bg-blue-100 text-blue-700' },
  deal: { label: 'Dohodnutá spolupráce', className: 'bg-green-100 text-green-700' },
};

export default function DashboardPage() {
  const { state } = useApp();
  const { clients, inquiries, events, weeklyGoals, settings } = state;

  const allTasks = useMemo(() => {
    return clients.flatMap((client) =>
      (client.tasks || []).map((task) => ({ ...task, clientName: client.name }))
    );
  }, [clients]);

  const activeTasks = useMemo(() => allTasks.filter((t) => t.status !== 'done'), [allTasks]);

  const in14Days = addDays(TODAY, 14);

  const upcomingDeadlineCount = useMemo(() => {
    const taskCount = allTasks.filter((t) => {
      if (t.status === 'done') return false;
      const d = parseDate(t.deadline);
      return d && d >= TODAY && d <= in14Days;
    }).length;

    const eventCount = (events || []).filter((e) => {
      const d = parseDate(e.date);
      return d && d >= TODAY && d <= in14Days;
    }).length;

    return taskCount + eventCount;
  }, [allTasks, events]);

  const pendingInquiries = useMemo(
    () => (inquiries || []).filter((i) => i.status === 'pending').length,
    [inquiries]
  );

  const members = useMemo(() => {
    const keys = ['member1', 'member2', 'member3'];
    return keys.map((key) => {
      const name = settings?.[`${key}Name`] || key;
      const memberTasks = allTasks.filter(
        (t) => t.assignee === key || t.assignee === 'both'
      );
      const doneTasks = memberTasks.filter((t) => t.status === 'done');
      const total = memberTasks.length;
      const done = doneTasks.length;
      const active = total - done;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { key, name, active, done, total, percent };
    });
  }, [allTasks, settings]);

  const upcomingItems = useMemo(() => {
    const taskItems = allTasks
      .filter((t) => {
        if (t.status === 'done') return false;
        const d = parseDate(t.deadline);
        return d && d >= TODAY && d <= in14Days;
      })
      .map((t) => ({
        date: parseDate(t.deadline),
        title: t.title,
        subtitle: t.clientName || '',
        type: 'task',
      }));

    const eventItems = (events || [])
      .filter((e) => {
        const d = parseDate(e.date);
        return d && d >= TODAY && d <= in14Days;
      })
      .map((e) => ({
        date: parseDate(e.date),
        title: e.title,
        subtitle: e.type || '',
        type: 'event',
      }));

    return [...taskItems, ...eventItems]
      .sort((a, b) => a.date - b.date)
      .slice(0, 8);
  }, [allTasks, events]);

  const recentInquiries = useMemo(() => {
    if (!inquiries || inquiries.length === 0) return [];
    return [...inquiries].slice(-5).reverse();
  }, [inquiries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Přehled agentury</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Aktivní klienti */}
        <div className="card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aktivní klienti</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{clients.length}</p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6 5.87v-2a4 4 0 00-3-3.87M9 14a4 4 0 110-8 4 4 0 010 8zm6 6v-2a4 4 0 00-3-3.87" />
              </svg>
            </div>
          </div>
        </div>

        {/* Aktivní úkoly */}
        <div className="card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aktivní úkoly</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeTasks.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Deadliny (14 dní) */}
        <div className="card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deadliny (14 dní)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{upcomingDeadlineCount}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Čeká na rozhodnutí */}
        <div className="card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Čeká na rozhodnutí</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pendingInquiries}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4m8-5v5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vytíženost týmu */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Vytíženost týmu</h2>
          <div className="space-y-5">
            {members.map((member) => (
              <div key={member.key}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${MEMBER_COLORS[member.key]}`}>
                    {getMemberInitials(member.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-gray-900 truncate">{member.name}</span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {member.active} aktivních
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${MEMBER_COLORS[member.key]}`}
                      style={{ width: `${member.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">{member.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nadcházející (14 dní) */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Nadcházející (14 dní)</h2>
          {upcomingItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Žádné nadcházející deadliny</p>
          ) : (
            <ul className="space-y-3">
              {upcomingItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 text-center w-10">
                    <span className="block text-xl font-bold text-gray-900 leading-none">
                      {item.date.getDate()}
                    </span>
                    <span className="block text-xs text-gray-400 uppercase">
                      {MONTH_SHORT[item.date.getMonth()]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.type === 'task'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {item.type === 'task' ? 'Úkol' : 'Událost'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Poslední poptávky */}
      {recentInquiries.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Poslední poptávky</h2>
          <ul className="divide-y divide-gray-100">
            {recentInquiries.map((inq, idx) => {
              const badge = STAGE_BADGE[inq.stage] || { label: inq.stage, className: 'bg-gray-100 text-gray-600' };
              return (
                <li key={idx} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{inq.clientName}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{inq.description}</p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
