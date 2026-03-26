import React from 'react';
import { useApp } from '../store.jsx';

const STATUS_CONFIG = {
  new: { label: 'Nový', classes: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'Probíhá', classes: 'bg-blue-100 text-blue-700' },
  review: { label: 'Ke kontrole', classes: 'bg-yellow-100 text-yellow-700' },
  done: { label: 'Hotovo', classes: 'bg-green-100 text-green-700' },
};

function AgencyLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
      <span className="text-base font-semibold text-gray-800">Agency — Portál klienta</span>
    </div>
  );
}

function ClientAvatar({ client }) {
  const initials = (client.name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (client.photoUrl) {
    return (
      <img
        src={client.photoUrl}
        alt={client.name}
        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
      style={{ backgroundColor: client.color || '#6366f1' }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}

function OutputItem({ output }) {
  const hasUrl = output.url && output.url.trim() !== '';
  const hasFile = output.fileData && output.fileData.trim() !== '';

  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className="mt-0.5 flex-shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700">{output.name}</span>
        {output.note && (
          <p className="text-xs text-gray-500 mt-0.5">{output.note}</p>
        )}
      </div>
      {hasUrl && (
        <a
          href={output.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0"
        >
          Otevřít
        </a>
      )}
      {!hasUrl && hasFile && (
        <a
          href={output.fileData}
          download={output.fileName || output.name}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0"
        >
          Stáhnout
        </a>
      )}
    </div>
  );
}

function TaskCard({ task }) {
  const hasOutputs = Array.isArray(task.outputs) && task.outputs.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={task.status} />
          </div>
          <p className="font-semibold text-gray-800 text-sm">{task.title}</p>
          {task.description && (
            <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
          )}
        </div>
      </div>
      {task.deadline && (
        <p className="text-xs text-gray-400">
          Termín:{' '}
          {new Date(task.deadline).toLocaleDateString('cs-CZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
      {hasOutputs && (
        <div className="border-t border-gray-100 pt-2 mt-2 space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Výstupy
          </p>
          {task.outputs.map((output) => (
            <OutputItem key={output.id} output={output} />
          ))}
        </div>
      )}
    </div>
  );
}

function DoneTaskRow({ task }) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4 text-green-500 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="text-sm text-gray-400 line-through">{task.title}</span>
    </div>
  );
}

export default function PortalPage({ clientId }) {
  const { state } = useApp();

  const client = (state.clients || []).find((c) => String(c.id) === String(clientId));

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Klient nenalezen</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tento portál není k dispozici nebo odkaz není platný.
        </p>
      </div>
    );
  }

  const allTasks = Array.isArray(client.tasks) ? client.tasks : [];
  const activeTasks = allTasks.filter((t) => t.status !== 'done');
  const doneTasks = allTasks.filter((t) => t.status === 'done');
  const services = Array.isArray(client.services) ? client.services : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <AgencyLogo />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Client info card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <ClientAvatar client={client} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
              {client.company && (
                <p className="text-sm text-gray-500 mt-0.5">{client.company}</p>
              )}
              {services.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {services.map((service, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active tasks */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Probíhající práce ({activeTasks.length})
          </h3>
          {activeTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-400">Žádné aktivní úkoly.</p>
            </div>
          ) : (
            activeTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </section>

        {/* Completed tasks */}
        {doneTasks.length > 0 && (
          <details className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none list-none">
              <span className="text-sm font-semibold text-gray-600">
                Dokončené úkoly ({doneTasks.length})
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="px-4 pb-3 border-t border-gray-100">
              {doneTasks.map((task) => (
                <DoneTaskRow key={task.id} task={task} />
              ))}
            </div>
          </details>
        )}

        {/* Footer */}
        <footer className="text-center pt-2 pb-4">
          <p className="text-xs text-gray-400">Vytvořeno v Agency Workflow</p>
        </footer>
      </main>
    </div>
  );
}
