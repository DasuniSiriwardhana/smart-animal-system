"use client";

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/Button';
import { 
  MessageCircle, X, Send, Loader2, Trash2, 
  Copy, Check, ThumbsUp, ThumbsDown,
  Plus, Menu, ChevronLeft, Edit2, AlertCircle
} from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'like' | 'dislike';
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
};

type MessageUsage = {
  date: string;
  count: number;
};

export function Chatbot() {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [messageUsage, setMessageUsage] = useState<MessageUsage>({ date: new Date().toDateString(), count: 0 });
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const userPlan = user?.plan || 'basic';
  const isPremium = userPlan === 'premium';
  const isStandard = userPlan === 'standard';
  const isBasic = userPlan === 'basic';

  // Basic: 10 limit, Standard: Unlimited, Premium: Unlimited
  const dailyLimit = 10; // Only basic has limit
  const isUnlimited = isStandard || isPremium;

  const canSendMessage = () => {
    if (isUnlimited) return true;
    return messageUsage.count < dailyLimit;
  };

  const getRemainingMessages = () => {
    if (isUnlimited) return 'Unlimited';
    const remaining = dailyLimit - messageUsage.count;
    return remaining > 0 ? remaining : 0;
  };

  const getPlanDisplay = () => {
    if (isPremium) return 'Premium ✨';
    if (isStandard) return 'Standard ♾️';
    return 'Basic';
  };

  // Load message usage from localStorage
  useEffect(() => {
    if (!user) return;
    
    const savedUsage = localStorage.getItem(`chat_usage_${user.id}`);
    if (savedUsage) {
      const parsed = JSON.parse(savedUsage);
      const today = new Date().toDateString();
      if (parsed.date === today) {
        setMessageUsage(parsed);
      } else {
        const newUsage = { date: today, count: 0 };
        setMessageUsage(newUsage);
        localStorage.setItem(`chat_usage_${user.id}`, JSON.stringify(newUsage));
      }
    } else {
      const today = new Date().toDateString();
      const newUsage = { date: today, count: 0 };
      setMessageUsage(newUsage);
      localStorage.setItem(`chat_usage_${user.id}`, JSON.stringify(newUsage));
    }
  }, [user]);

  // Load sessions from localStorage
  useEffect(() => {
    if (!user) return;
    
    const savedSessions = localStorage.getItem(`chat_sessions_${user.id}`);
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    } else {
      createNewSession();
    }
  }, [user]);

  // Save sessions to localStorage
  useEffect(() => {
    if (!user || sessions.length === 0) return;
    localStorage.setItem(`chat_sessions_${user.id}`, JSON.stringify(sessions));
  }, [sessions, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingSessionId]);

  useEffect(() => {
    if (showLimitWarning) {
      const timer = setTimeout(() => setShowLimitWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showLimitWarning]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const incrementMessageCount = () => {
    const newCount = messageUsage.count + 1;
    const newUsage = { date: messageUsage.date, count: newCount };
    setMessageUsage(newUsage);
    localStorage.setItem(`chat_usage_${user?.id}`, JSON.stringify(newUsage));
  };

  const createNewSession = () => {
    const limitInfo = !isUnlimited ? `\n\n *Daily Message Limit: ${getRemainingMessages()} remaining today*` : '';
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Chat ${sessions.length + 1}`,
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: `🐾 Hi! I'm PawHealth, your pet care assistant. Ask me about pet health, food safety, feeding schedules, or symptoms! What can I help you with today?${limitInfo}`,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    setShowSidebar(false);
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setShowSidebar(false);
      setEditingSessionId(null);
    }
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    
    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
        setMessages(updatedSessions[0].messages);
      } else {
        createNewSession();
      }
    }
  };

  const startRename = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditTitle(currentTitle);
  };

  const saveRename = (sessionId: string) => {
    if (editTitle.trim()) {
      setSessions(prev => prev.map(session =>
        session.id === sessionId
          ? { ...session, title: editTitle.trim(), updatedAt: new Date() }
          : session
      ));
    }
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleRenameKeyPress = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      saveRename(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
      setEditTitle('');
    }
  };

  const updateCurrentSession = (newMessages: Message[]) => {
    setMessages(newMessages);
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, messages: newMessages, updatedAt: new Date() }
        : session
    ));
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const giveFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, feedback } : msg
    );
    updateCurrentSession(updatedMessages);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!canSendMessage()) {
      setShowLimitWarning(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, userMessage];
    updateCurrentSession(updatedMessages);
    setInput('');
    setIsLoading(true);
    
    // Only increment count for Basic users
    if (isBasic) {
      incrementMessageCount();
    }

    try {
      const history = updatedMessages.slice(-10).map(m => ({ 
        role: m.role, 
        content: m.content 
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: history,
          userPlan: userPlan,
        }),
      });

      const data = await response.json();
      
      let botContent = data.reply || "🐾 I'm not sure how to answer that. Could you rephrase?";
      
      if (isBasic) {
        const remaining = getRemainingMessages();
        botContent += `\n\n---\n *You have ${remaining} messages remaining today*`;
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botContent,
        timestamp: new Date(),
      };
      
      updateCurrentSession([...updatedMessages, botMessage]);
      
      if (updatedMessages.filter(m => m.role === 'user').length === 1 && currentSessionId) {
        const newTitle = input.length > 30 ? input.substring(0, 30) + '...' : input;
        setSessions(prev => prev.map(session =>
          session.id === currentSessionId
            ? { ...session, title: newTitle }
            : session
        ));
      }
      
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "🐾 Oops! I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      };
      updateCurrentSession([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const shouldHide = isAuthPage || !user;

  if (authLoading || shouldHide) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[500px] h-[600px] bg-white rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200">
          {/* Sidebar */}
          <div className={`${showSidebar ? 'w-56' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-50 border-r border-gray-200 flex flex-col`}>
            <div className="p-3 border-b">
              <Button onClick={createNewSession} size="sm" className="w-full gap-1">
                <Plus className="h-3 w-3" />
                New Chat
              </Button>
            </div>
            
            <div className="p-3 border-b bg-gray-100">
              <div className="text-xs">
                <p className="font-medium text-gray-700">Plan: {getPlanDisplay()}</p>
                <p className="text-gray-500">
                  {isUnlimited ? '♾️ Unlimited messages' : `${getRemainingMessages()} / ${dailyLimit} remaining`}
                </p>
                {isBasic && messageUsage.count >= dailyLimit && (
                  <p className="text-red-500 text-[10px] mt-1">Daily limit reached. Upgrade for unlimited.</p>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => switchSession(session.id)}
                  className={`p-2 cursor-pointer hover:bg-gray-100 transition-colors group ${
                    currentSessionId === session.id ? 'bg-primary/10' : ''
                  }`}
                >
                  {editingSessionId === session.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleRenameKeyPress(e, session.id)}
                        onBlur={() => saveRename(session.id)}
                        className="flex-1 text-xs px-1 py-0.5 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{session.title}</p>
                        <p className="text-[10px] text-gray-400">{formatDate(session.updatedAt)}</p>
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100">
                        <button onClick={(e) => startRename(session.id, session.title, e)} className="p-1 hover:bg-gray-200 rounded">
                          <Edit2 className="h-3 w-3 text-gray-400" />
                        </button>
                        <button onClick={(e) => deleteSession(session.id, e)} className="p-1 hover:bg-gray-200 rounded">
                          <Trash2 className="h-3 w-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="bg-gradient-to-r from-primary to-accent p-3 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSidebar(!showSidebar)} className="p-1 rounded-lg hover:bg-white/20">
                  {showSidebar ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
                <div>
                  <h3 className="font-semibold text-sm">🐾 PawHealth AI</h3>
                  <p className="text-[10px] opacity-90">
                    {isUnlimited ? 'Unlimited' : `${getRemainingMessages()} / ${dailyLimit} left today`}
                  </p>
                </div>
              </div>
              <button onClick={createNewSession} className="p-1.5 rounded-lg hover:bg-white/20">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showLimitWarning && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 m-3 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-700">
                    Daily limit reached (10 messages). Upgrade to Standard or Premium for unlimited access.
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-accent text-white rounded-br-none'
                      : 'bg-white text-gray-700 rounded-bl-none shadow-sm border border-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] opacity-70">{formatTime(msg.timestamp)}</p>
                      {msg.role === 'assistant' && (
                        <div className="flex gap-1">
                          <button onClick={() => copyToClipboard(msg.content, msg.id)} className="opacity-50 hover:opacity-100">
                            {copiedId === msg.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                          <button onClick={() => giveFeedback(msg.id, 'like')} className={`opacity-50 hover:opacity-100 ${msg.feedback === 'like' ? 'text-green-500' : ''}`}>
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button onClick={() => giveFeedback(msg.id, 'dislike')} className={`opacity-50 hover:opacity-100 ${msg.feedback === 'dislike' ? 'text-red-500' : ''}`}>
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      <span className="text-xs text-gray-400 ml-1">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-3 bg-white">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={canSendMessage() ? "Ask me about pet care..." : "Daily limit reached. Upgrade to continue."}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                  disabled={isLoading || !canSendMessage()}
                />
                <Button onClick={sendMessage} disabled={isLoading || !input.trim() || !canSendMessage()} size="icon">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[9px] text-gray-400 text-center mt-2">
                AI assistant. For emergencies, consult a veterinarian.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}