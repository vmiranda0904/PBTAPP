import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths, isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import type { CalendarEvent } from '../context/AppContext';

const TYPE_COLORS: Record<string, string> = {
  practice: 'bg-blue-500',
  tournament: 'bg-yellow-500',
};

export default function Calendar() {
  const { events, addEvent, players } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'practice' as 'practice' | 'tournament',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '18:00',
    location: '',
    description: '',
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start
  const startPad = monthStart.getDay();
  const paddedDays: (Date | null)[] = [...Array(startPad).fill(null), ...days];

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(parseISO(e.date), day));

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({
      ...form,
      attendees: players.map(p => p.id),
    });
    setShowModal(false);
    setForm({ title: '', type: 'practice', date: format(new Date(), 'yyyy-MM-dd'), time: '18:00', location: '', description: '' });
  };

  const upcomingEvents = [...events]
    .filter(e => parseISO(e.date) >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Practice & Competition Calendar"
        subtitle="Manage practices, tournaments, and team events"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-500 transition-colors"
          >
            <Plus size={16} /> Add Event
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
          {/* Month header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentMonth(new Date())}
                className="px-2 py-1 rounded-lg text-xs hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                Today
              </button>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-slate-500 text-xs font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-start pt-1.5 pb-1 transition-colors text-xs ${
                    isSelected ? 'bg-blue-600 text-white' :
                    today ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500' :
                    isSameMonth(day, currentMonth) ? 'text-slate-300 hover:bg-slate-700' :
                    'text-slate-600'
                  }`}
                >
                  <span className="font-medium">{format(day, 'd')}</span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map(ev => (
                      <span
                        key={ev.id}
                        className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[ev.type]} ${isSelected ? 'opacity-80' : ''}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected day events */}
          {selectedDay && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <h3 className="text-white font-medium text-sm mb-3">
                {format(selectedDay, 'EEEE, MMMM d')}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-slate-500 text-sm">No events this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(ev => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-white font-semibold text-sm mb-4">Upcoming Events</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-slate-500 text-sm">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(ev => (
                  <EventCard key={ev.id} event={ev} compact />
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-white font-semibold text-sm mb-3">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-400 text-sm">Practice</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-slate-400 text-sm">Tournament</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold">Add Event</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Event title" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as never }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                    <option value="practice">Practice</option>
                    <option value="tournament">Tournament</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Date *</label>
                <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Main Gym" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Optional notes" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm hover:bg-slate-600 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-500 transition-colors">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  return (
    <div className={`rounded-lg ${compact ? 'p-3' : 'p-4'} ${
      event.type === 'tournament' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-blue-500/10 border border-blue-500/20'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{event.title}</p>
          {!compact && event.description && (
            <p className="text-slate-400 text-xs mt-0.5">{event.description}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${
          event.type === 'tournament' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
        }`}>
          {event.type === 'tournament' ? 'TOURN' : 'PRAC'}
        </span>
      </div>
      <p className="text-slate-400 text-xs mt-1.5">
        {format(parseISO(event.date), 'MMM d')} · {event.time}
        {event.location && ` · ${event.location}`}
      </p>
    </div>
  );
}
