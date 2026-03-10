import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Users, User } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../components/PageHeader';

export default function Communication() {
  const { players, messages, sendMessage, currentUserId } = useApp();
  const [activeChannel, setActiveChannel] = useState('team');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const channelMessages = messages.filter(m => m.channel === activeChannel);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim(), activeChannel);
    setInput('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  const getChannelName = () => {
    if (activeChannel === 'team') return '# team-chat';
    const p = players.find(p => p.id === activeChannel);
    return p ? `@ ${p.name}` : 'Unknown';
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] -m-6">
      {/* Channels sidebar */}
      <div className="w-56 bg-slate-900 border-r border-slate-700 flex flex-col py-4">
        <p className="text-slate-500 text-xs font-semibold px-4 mb-2 uppercase tracking-wider">Channels</p>
        <button
          onClick={() => setActiveChannel('team')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeChannel === 'team' ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users size={15} />
          Team Chat
        </button>

        <p className="text-slate-500 text-xs font-semibold px-4 mt-4 mb-2 uppercase tracking-wider">Direct Messages</p>
        {players.filter(p => p.id !== currentUserId).map(p => (
          <button
            key={p.id}
            onClick={() => setActiveChannel(p.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              activeChannel === p.id ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User size={15} />
            {p.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-800">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700">
          <PageHeader title={getChannelName()} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {channelMessages.length === 0 && (
            <div className="text-center text-slate-500 mt-12">
              <p className="text-4xl mb-2">💬</p>
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          {channelMessages.map(msg => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isMe ? 'bg-blue-500' : 'bg-slate-600'
                } text-white`}>
                  {msg.senderName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-slate-300 text-xs font-medium">{isMe ? 'You' : msg.senderName}</span>
                    <span className="text-slate-500 text-xs">
                      {format(new Date(msg.timestamp), 'h:mm a')}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-slate-700 text-slate-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-slate-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${getChannelName()}...`}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-blue-500 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
