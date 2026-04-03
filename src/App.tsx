import { useMemo, useState } from 'react';
import AiVideoPanel from './components/AiVideoPanel';
import ErrorBoundary from './components/ErrorBoundary';
import ProductPlatformPanel from './components/ProductPlatformPanel';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

type TeamMember = {
  id: number;
  name: string;
  role: string;
  team: string;
  location: string;
  status: 'Available' | 'Busy' | 'Out';
};

type TeamEvent = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  owner: string;
};

type TeamMessage = {
  id: number;
  channel: string;
  author: string;
  content: string;
  pinned: boolean;
};

type ManagerTask = {
  id: number;
  title: string;
  owner: string;
  due: string;
  done: boolean;
};

const initialMessages: TeamMessage[] = [
  {
    id: 1,
    channel: 'Announcements',
    author: 'Jada',
    content: 'Welcome to the new team hub. Use this space for project updates and important notices.',
    pinned: true,
  },
  {
    id: 2,
    channel: 'Operations',
    author: 'Marco',
    content: 'Client launch checklist is in review. Please confirm your blockers before stand-up tomorrow.',
    pinned: false,
  },
  {
    id: 3,
    channel: 'Design',
    author: 'Nina',
    content: 'Uploaded the revised onboarding flow. Feedback window closes at 3 PM.',
    pinned: false,
  },
];

const initialEvents: TeamEvent[] = [
  {
    id: 1,
    title: 'Weekly Stand-up',
    date: '2026-04-01',
    time: '09:30',
    location: 'Zoom',
    owner: 'Operations',
  },
  {
    id: 2,
    title: 'Launch Readiness Review',
    date: '2026-04-02',
    time: '14:00',
    location: 'War Room',
    owner: 'Leadership',
  },
  {
    id: 3,
    title: 'Roster Planning',
    date: '2026-04-03',
    time: '11:00',
    location: 'Studio B',
    owner: 'People Ops',
  },
];

const initialMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Jada Thompson',
    role: 'Team Lead',
    team: 'Leadership',
    location: 'Remote',
    status: 'Available',
  },
  {
    id: 2,
    name: 'Marco Diaz',
    role: 'Operations Manager',
    team: 'Operations',
    location: 'Austin',
    status: 'Busy',
  },
  {
    id: 3,
    name: 'Nina Chen',
    role: 'Product Designer',
    team: 'Design',
    location: 'New York',
    status: 'Available',
  },
  {
    id: 4,
    name: 'Harper Lee',
    role: 'Support Specialist',
    team: 'Customer Success',
    location: 'Chicago',
    status: 'Out',
  },
];

const initialTasks: ManagerTask[] = [
  {
    id: 1,
    title: 'Approve April shift coverage',
    owner: 'Jada',
    due: 'Today',
    done: false,
  },
  {
    id: 2,
    title: 'Confirm release communications',
    owner: 'Marco',
    due: 'Tomorrow',
    done: false,
  },
  {
    id: 3,
    title: 'Publish onboarding roster update',
    owner: 'People Ops',
    due: 'Friday',
    done: true,
  },
];

const statusStyles: Record<TeamMember['status'], string> = {
  Available: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40',
  Busy: 'bg-amber-500/15 text-amber-100 ring-amber-300/40',
  Out: 'bg-rose-500/15 text-rose-100 ring-rose-300/40',
};

export default function App() {
  const { isAuthenticated, logout, user } = useAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [events, setEvents] = useState(initialEvents);
  const [members, setMembers] = useState(initialMembers);
  const [tasks, setTasks] = useState(initialTasks);

  const [messageDraft, setMessageDraft] = useState({
    channel: 'Announcements',
    author: 'Team Lead',
    content: '',
  });
  const [eventDraft, setEventDraft] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    owner: 'Operations',
  });
  const [memberDraft, setMemberDraft] = useState({
    name: '',
    role: '',
    team: '',
    location: '',
    status: 'Available' as TeamMember['status'],
  });

  const stats = useMemo(() => {
    const pinnedCount = messages.filter((message) => message.pinned).length;
    const availableCount = members.filter((member) => member.status === 'Available').length;
    const openTasks = tasks.filter((task) => !task.done).length;

    return {
      pinnedCount,
      availableCount,
      openTasks,
    };
  }, [members, messages, tasks]);

  const addMessage = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!messageDraft.content.trim()) return;

    setMessages((current) => [
      {
        id: Date.now(),
        channel: messageDraft.channel,
        author: messageDraft.author.trim() || 'Team Lead',
        content: messageDraft.content.trim(),
        pinned: messageDraft.channel === 'Announcements',
      },
      ...current,
    ]);
    setMessageDraft((current) => ({ ...current, content: '' }));
  };

  const addEvent = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!eventDraft.title || !eventDraft.date || !eventDraft.time) return;

    setEvents((current) => [
      ...current,
      {
        id: Date.now(),
        title: eventDraft.title.trim(),
        date: eventDraft.date,
        time: eventDraft.time,
        location: eventDraft.location.trim() || 'TBD',
        owner: eventDraft.owner,
      },
    ]);
    setEventDraft({ title: '', date: '', time: '', location: '', owner: eventDraft.owner });
  };

  const addMember = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!memberDraft.name || !memberDraft.role || !memberDraft.team) return;

    setMembers((current) => [
      ...current,
      {
        id: Date.now(),
        name: memberDraft.name.trim(),
        role: memberDraft.role.trim(),
        team: memberDraft.team.trim(),
        location: memberDraft.location.trim() || 'Remote',
        status: memberDraft.status,
      },
    ]);
    setMemberDraft({
      name: '',
      role: '',
      team: '',
      location: '',
      status: 'Available',
    });
  };

  const toggleTask = (taskId: number) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    );
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/20 via-slate-900 to-indigo-500/20 p-6 shadow-2xl shadow-slate-950/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-sky-200">Team Communications App</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Coordinate conversations, schedules, and staffing from one simple workspace.
              </h1>
              <p className="max-w-xl text-sm text-slate-200 sm:text-base">
                Built for team communication, shared calendar planning, roster visibility, and lightweight management workflows.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <StatCard label="Pinned updates" value={stats.pinnedCount} detail="Shared with the full team" />
              <StatCard label="Available today" value={stats.availableCount} detail="Ready to take work" />
              <StatCard label="Open manager tasks" value={stats.openTasks} detail={`Signed in as ${user?.name ?? 'Team user'}`} />
            </div>
          </div>
        </header>

        <ProductPlatformPanel />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>

        <ErrorBoundary title="AI scouting unavailable" message="The AI scouting workspace failed to load safely.">
          <AiVideoPanel />
        </ErrorBoundary>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Panel title="Team communications" subtitle="Post announcements, project notes, and channel updates.">
            <div className="space-y-4">
              <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4" onSubmit={addMessage}>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
                  <label className="space-y-2 text-sm text-slate-300">
                    Channel
                    <select
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none ring-0"
                      value={messageDraft.channel}
                      onChange={(e) => setMessageDraft((current) => ({ ...current, channel: e.target.value }))}
                    >
                      <option>Announcements</option>
                      <option>Operations</option>
                      <option>Design</option>
                      <option>Support</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    Author
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      value={messageDraft.author}
                      onChange={(e) => setMessageDraft((current) => ({ ...current, author: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    Message
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      placeholder="Share an update with your team"
                      value={messageDraft.content}
                      onChange={(e) => setMessageDraft((current) => ({ ...current, content: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-300"
                  >
                    Post update
                  </button>
                </div>
              </form>

              <div className="grid gap-3">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium text-sky-200">
                        {message.channel}
                      </span>
                      <span className="text-sm font-medium text-white">{message.author}</span>
                      {message.pinned ? (
                        <span className="rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-medium text-fuchsia-200">
                          Pinned
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-6 text-slate-200">{message.content}</p>
                  </article>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Management board" subtitle="Track work ownership and complete follow-up tasks.">
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className="flex w-full items-start justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-sky-300/40 hover:bg-white/10"
                >
                  <div>
                    <p className={`font-medium ${task.done ? 'text-slate-400 line-through' : 'text-white'}`}>{task.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Owner: {task.owner} · Due {task.due}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      task.done
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : 'bg-amber-500/15 text-amber-100'
                    }`}
                  >
                    {task.done ? 'Done' : 'Open'}
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title="Team calendar" subtitle="Keep everyone aligned on upcoming meetings and milestones.">
            <div className="space-y-4">
              <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4" onSubmit={addEvent}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Event title">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      placeholder="Sprint planning"
                      value={eventDraft.title}
                      onChange={(e) => setEventDraft((current) => ({ ...current, title: e.target.value }))}
                    />
                  </Field>
                  <Field label="Owner">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      value={eventDraft.owner}
                      onChange={(e) => setEventDraft((current) => ({ ...current, owner: e.target.value }))}
                    />
                  </Field>
                  <Field label="Date">
                    <input
                      type="date"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      value={eventDraft.date}
                      onChange={(e) => setEventDraft((current) => ({ ...current, date: e.target.value }))}
                    />
                  </Field>
                  <Field label="Time">
                    <input
                      type="time"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      value={eventDraft.time}
                      onChange={(e) => setEventDraft((current) => ({ ...current, time: e.target.value }))}
                    />
                  </Field>
                  <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                    Location
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      placeholder="Main conference room"
                      value={eventDraft.location}
                      onChange={(e) => setEventDraft((current) => ({ ...current, location: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-indigo-300"
                  >
                    Add event
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {events.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-white">{event.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">Hosted by {event.owner}</p>
                      </div>
                      <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-100">
                        {event.date} · {event.time}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">Location: {event.location}</p>
                  </article>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Roster board" subtitle="See who is on the team and their current availability.">
            <div className="space-y-4">
              <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4" onSubmit={addMember}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Name">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      placeholder="Add a teammate"
                      value={memberDraft.name}
                      onChange={(e) => setMemberDraft((current) => ({ ...current, name: e.target.value }))}
                    />
                  </Field>
                  <Field label="Role">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      placeholder="Customer Success Manager"
                      value={memberDraft.role}
                      onChange={(e) => setMemberDraft((current) => ({ ...current, role: e.target.value }))}
                    />
                  </Field>
                  <Field label="Team">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      placeholder="Support"
                      value={memberDraft.team}
                      onChange={(e) => setMemberDraft((current) => ({ ...current, team: e.target.value }))}
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      placeholder="Remote"
                      value={memberDraft.location}
                      onChange={(e) => setMemberDraft((current) => ({ ...current, location: e.target.value }))}
                    />
                  </Field>
                  <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                    Availability
                    <select
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-50 outline-none"
                      value={memberDraft.status}
                      onChange={(e) =>
                        setMemberDraft((current) => ({
                          ...current,
                          status: e.target.value as TeamMember['status'],
                        }))
                      }
                    >
                      <option>Available</option>
                      <option>Busy</option>
                      <option>Out</option>
                    </select>
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300"
                  >
                    Add teammate
                  </button>
                </div>
              </form>

              <div className="grid gap-3 md:grid-cols-2">
                {members.map((member) => (
                  <article
                    key={member.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-white">{member.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{member.role}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusStyles[member.status]}`}>
                        {member.status}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-2 text-sm text-slate-300">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Team</dt>
                        <dd>{member.team}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Location</dt>
                        <dd>{member.location}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      {label}
      {children}
    </label>
  );
}
