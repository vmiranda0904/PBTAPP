import { useState } from 'react';
import { Radio, Play, Users, Eye, Wifi } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const STREAMS = [
  {
    id: 's1',
    title: 'Regional Tournament - Live',
    streamer: 'Coach Williams',
    viewers: 142,
    status: 'live',
    thumbnail: 'bg-gradient-to-br from-blue-600 to-cyan-500',
    description: 'Regional qualifier semi-finals. Watch the action live!',
  },
  {
    id: 's2',
    title: 'Practice Session Replay',
    streamer: 'Jordan Blake',
    viewers: 38,
    status: 'replay',
    thumbnail: 'bg-gradient-to-br from-purple-600 to-pink-500',
    description: 'Full team practice from Tuesday. Great serves and blocks.',
  },
  {
    id: 's3',
    title: 'Film Study: Attack Patterns',
    streamer: 'Coach Williams',
    viewers: 27,
    status: 'replay',
    thumbnail: 'bg-gradient-to-br from-green-600 to-teal-500',
    description: 'Breakdown of top attack patterns from last season.',
  },
];

export default function LiveStream() {
  const [activeStream, setActiveStream] = useState(STREAMS[0]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'Alex R.', text: 'Great spike! 🔥', time: '2:34 PM' },
    { id: 2, user: 'Morgan C.', text: 'That serve was incredible!', time: '2:35 PM' },
    { id: 3, user: 'Taylor D.', text: 'Go team!! 💪', time: '2:36 PM' },
  ]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      user: 'You',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setChatInput('');
  };

  return (
    <div>
      <PageHeader
        title="Live Streaming"
        subtitle="Watch live games, practices, and film sessions"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
            {/* Video area */}
            <div className={`relative ${activeStream.thumbnail} aspect-video flex items-center justify-center`}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <Play size={28} className="text-white ml-1" />
                </div>
                <p className="text-white font-semibold text-lg">{activeStream.title}</p>
                <p className="text-white/70 text-sm">{activeStream.description}</p>
              </div>
              {activeStream.status === 'live' && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2 py-1 rounded text-white text-xs font-bold">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded text-white text-xs backdrop-blur-sm">
                <Eye size={12} />
                {activeStream.viewers.toLocaleString()} watching
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{activeStream.title}</h3>
                  <p className="text-slate-400 text-sm">{activeStream.streamer}</p>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Wifi size={14} />
                  HD Quality
                </div>
              </div>
            </div>
          </div>

          {/* Stream list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STREAMS.map(stream => (
              <button
                key={stream.id}
                onClick={() => setActiveStream(stream)}
                className={`text-left rounded-xl overflow-hidden border transition-colors ${
                  activeStream.id === stream.id ? 'border-blue-500' : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className={`${stream.thumbnail} h-20 flex items-center justify-center relative`}>
                  <Play size={20} className="text-white" />
                  {stream.status === 'live' && (
                    <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="bg-slate-800 p-2">
                  <p className="text-white text-xs font-medium line-clamp-1">{stream.title}</p>
                  <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                    <Eye size={10} /> {stream.viewers}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Chat */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-[500px]">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Radio size={16} className="text-blue-400" />
            <h3 className="text-white font-semibold text-sm">Live Chat</h3>
            <div className="ml-auto flex items-center gap-1 text-slate-400 text-xs">
              <Users size={12} />
              {activeStream.viewers}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {chatMessages.map(msg => (
              <div key={msg.id}>
                <span className="text-blue-400 text-xs font-semibold">{msg.user} </span>
                <span className="text-slate-300 text-xs">{msg.text}</span>
              </div>
            ))}
          </div>

          <div className="px-3 py-3 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Say something..."
              className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={sendChat}
              className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
