import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, ArrowLeft, Paperclip, Smile, Shield, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

interface ChatProps {
  orderId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
}

const EnhancedChatInterface: React.FC<ChatProps> = ({ 
  orderId, 
  currentUserId, 
  otherUserId, 
  otherUserName, 
  onClose 
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // WebSocket ref for fast message delivery (⚡ primary path)
  const wsRef = useRef<WebSocket | null>(null);
  // Track message IDs we've already added to avoid duplicates from WS + Realtime
  const seenMsgIds = useRef<Set<string>>(new Set());

  // CRASH-PROOF SAFETY: Ensure we always have a string for the name
  const safeName = otherUserName || 'User';

  // --- 1. FETCH LIVE MESSAGES + SETUP CONNECTIONS ---
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await api.getMessages(orderId);
        const msgs = data || [];
        // Seed the dedup tracker with existing message IDs
        msgs.forEach((m: any) => seenMsgIds.current.add(m.id));
        setMessages(msgs);
      } catch (error) {
        console.error("Failed to load messages", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // ⚡ WebSocket connection for near-instant delivery
    const token = localStorage.getItem('supabase_token');
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:10000/ws';
    const ws = new WebSocket(wsUrl); // No token in URL for security
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'AUTH',
        token,
        order_id: orderId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle AUTH success or chat messages
        if (data.type === 'AUTH_SUCCESS') {
          console.log('[CHAT_WS] Connected to room:', orderId);
          return;
        }

        const msg = data; // assuming it's the message object
        // Dedup: skip if we've already added this message from any source
        if (msg.id && seenMsgIds.current.has(msg.id)) return;
        if (msg.id) seenMsgIds.current.add(msg.id);
        setMessages(prev => [...prev, msg]);
      } catch { /* ignore malformed messages */ }
    };

    ws.onerror = () => {
      console.warn('Chat WebSocket unavailable — Supabase Realtime fallback active');
    };

    // 📡 Supabase Realtime — fallback if WebSocket drops
    const channel = supabase.channel(`chat_${orderId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` }, (payload) => {
        const msg = payload.new;
        if (seenMsgIds.current.has(msg.id)) return; // skip if WS already delivered it
        seenMsgIds.current.add(msg.id);
        setMessages(prev => [...prev, msg]);
      }).subscribe();

    return () => {
      ws.close();
      wsRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- 2. SEND MESSAGE (with optimistic UI) ---
  const sendOptimistic = async (content: string) => {
    setSendError(null);
    setIsSending(true);

    // Build a temp message — shown immediately at 50% opacity
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const saved = await api.sendMessage(orderId, otherUserId, content);
      if (saved?.id) seenMsgIds.current.add(saved.id);

      // Swap temp message for the confirmed server message
      setMessages(prev => prev.map(m => m.id === tempId ? { ...saved, _optimistic: false } : m));

      // Broadcast via WS for instant delivery to the other user
      if (wsRef.current?.readyState === WebSocket.OPEN && saved) {
        wsRef.current.send(JSON.stringify(saved));
      }
    } catch (err: any) {
      // Remove the optimistic message and restore the text
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setSendError(err?.message || 'Failed to send message. Tap to retry.');
      setNewMessage(content); // restore so user can retry
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setShowQuickReplies(false);
    await sendOptimistic(content);
  };

  const handleQuickReply = async (reply: string) => {
    setShowQuickReplies(false);
    await sendOptimistic(reply);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const quickReplies = [
    'हाँ, मुझे रुचि है / Yes, I am interested',
    'कीमत क्या है? / What is the price?',
    'कब मिल सकते हैं? / When can we meet?',
    'धन्यवाद / Thank you',
    'ठीक है / Okay',
    'कल बात करते हैं / Let\'s talk tomorrow'
  ];

  return (
    // Floating Window Wrapper
    <div className="fixed bottom-4 right-4 w-[350px] md:w-[400px] h-[550px] bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[100] overflow-hidden">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-lg">
              {safeName.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-800 truncate">{safeName}</h3>
              <div className="flex items-center space-x-1 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                <Shield size={10} className="text-green-600" />
                <span className="text-[10px] text-green-700 font-medium">Verified</span>
              </div>
            </div>
            <p className="text-xs text-green-600">ऑनलाइन / Online</p>
          </div>
          
          <div className="flex items-center space-x-1 shrink-0">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Phone size={18} className="text-gray-600" /></button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {sendError && (
        <div className="flex items-center gap-2 bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 shrink-0">
          <span className="flex-1">⚠️ {sendError}</span>
          <button onClick={() => setSendError(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-green-600" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-gray-500 font-medium text-sm">बातचीत शुरू करें / Start Conversation</p>
            <button
              onClick={() => setShowQuickReplies(true)}
              className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              त्वरित संदेश / Quick Message
            </button>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} transition-opacity ${message._optimistic ? 'opacity-50' : 'opacity-100'}`}>
                <div className="max-w-[85%]">
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${isOwn ? 'bg-green-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'}`}>
                    <p className="break-words">{message.content}</p>
                  </div>
                  <div className={`flex items-center mt-1 space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-[10px] text-gray-500">
                      {message._optimistic ? 'Sending…' : formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {showQuickReplies && (
        <div className="bg-white border-t border-gray-200 p-3 shrink-0 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-700">त्वरित उत्तर / Quick Replies</p>
            <button onClick={() => setShowQuickReplies(false)} className="text-gray-500 hover:text-gray-700 p-1">✕</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <button key={index} onClick={() => handleQuickReply(reply)} className="text-left px-3 py-1.5 bg-gray-50 hover:bg-green-50 hover:text-green-700 border border-gray-200 hover:border-green-200 rounded-full text-xs transition-colors">
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-3 shrink-0">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <button type="button" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Paperclip size={18} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="संदेश लिखें... / Type message..."
              className="w-full pl-4 pr-10 py-2.5 bg-gray-100 text-sm rounded-full focus:ring-2 focus:ring-green-500 focus:bg-white focus:outline-none transition-all"
            />
            <button type="button" onClick={() => setShowQuickReplies(!showQuickReplies)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
              <Smile size={18} />
            </button>
          </div>
          
          <button type="submit" disabled={!newMessage.trim() || isSending} className={`p-2.5 rounded-full transition-colors ${newMessage.trim() && !isSending ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
          </button>
        </form>
      </div>
      
    </div>
  );
};

export default EnhancedChatInterface;