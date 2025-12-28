import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Moon, Sun, Menu, Plus, Clock, Trash2, X, Brain, Lock, Mail, Eye, EyeOff, Sparkles, Settings, LogOut, ExternalLink, Copy, Check, Star, User } from 'lucide-react';

const VayuAI = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [aiMode, setAiMode] = useState('general');
  const [userMemory, setUserMemory] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [settings, setSettings] = useState({
    aiModel: 'vayu-pro',
    responseLength: 'balanced',
    memoryEnabled: true,
    theme: 'dark'
  });
  
  const canvasRef = useRef(null);
  const matrixCanvasRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoadingAnimation(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showLoadingAnimation) return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    let animationId;
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0F0';
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [showLoadingAnimation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particleArray = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.4 + 0.2
    }));

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particleArray.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = darkMode ? `rgba(99, 179, 237, ${particle.opacity})` : `rgba(96, 165, 250, ${particle.opacity})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [darkMode]);

  const handleAuth = (e, email, password, name = '') => {
    e.preventDefault();
    const user = {
      id: Date.now(),
      name: name || email.split('@')[0],
      email: email,
      avatar: (name || email).charAt(0).toUpperCase(),
      joined: new Date().toISOString()
    };
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setConversations([]);
    setActiveChat(null);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || !isAuthenticated) return;

    const userInput = input.trim().toLowerCase();
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings'];
    const isGreeting = greetings.some(greeting => 
      userInput === greeting || userInput.startsWith(greeting + ' ') || userInput.startsWith(greeting + ',') || userInput.startsWith(greeting + '!')
    );

    const newMessage = {
      id: Date.now(),
      question: input,
      answer: null,
      sources: [],
      timestamp: new Date().toISOString(),
      mode: aiMode,
      isImage: aiMode === 'image'
    };

    setIsThinking(true);
    setConversations(prev => [...prev, newMessage]);
    setTotalQuestions(prev => prev + 1);

    if (settings.memoryEnabled && !isGreeting) {
      const memoryItems = extractMemory(input);
      if (memoryItems.length > 0) {
        setUserMemory(prev => [...prev, ...memoryItems]);
      }
    }

    setTimeout(() => {
      let answer = '';
      let sources = [];
      
      if (isGreeting) {
        const responses = [
          `Hello ${currentUser?.name || 'there'}! How can I help you today?`,
          `Hi! What would you like to explore?`,
          `Hey! I'm ready to assist you. What's on your mind?`,
          `Hello! What can I do for you today?`
        ];
        answer = responses[Math.floor(Math.random() * responses.length)];
      } else {
        const relevantMemory = userMemory.slice(-3).map(m => m.content).join(', ');
        const contextual = relevantMemory ? `Based on our previous conversations, ` : '';

        switch (aiMode) {
          case 'creative':
            answer = `${contextual}✨ Creative Response for "${input}":\n\nIn a realm where imagination meets reality, ${input.toLowerCase()} emerges as a tapestry of endless possibilities. The essence captures the delicate balance between what is and what could be—a symphony of ideas harmonizing with innovation.\n\nThrough this lens, we explore narratives that challenge conventional wisdom and celebrate the extraordinary within the ordinary.`;
            sources = [
              { title: 'Creative Thinking Guide', url: '#', domain: 'creative.org' },
              { title: 'Innovation Masterclass', url: '#', domain: 'masterclass.com' }
            ];
            break;
            
          case 'code':
            answer = `${contextual}💻 Technical Implementation:\n\n\`\`\`javascript\nclass Handler {\n  constructor(config) {\n    this.config = config;\n    this.cache = new Map();\n  }\n\n  async process(data) {\n    const result = await this.execute(data);\n    return this.optimize(result);\n  }\n\n  execute(data) {\n    return transformData(data);\n  }\n}\n\nconst handler = new Handler({\n  mode: 'production'\n});\n\`\`\`\n\n**Features:** Error handling, caching, async support, modular design.`;
            sources = [
              { title: 'MDN JavaScript Docs', url: '#', domain: 'developer.mozilla.org' },
              { title: 'Design Patterns', url: '#', domain: 'patterns.dev' }
            ];
            break;
            
          case 'image':
            answer = `${contextual}🎨 Image Generation for "${input}":\n\n**Visual Concept:** A stunning representation with vibrant colors and dynamic composition.\n\n**Elements:**\n- Composition: Asymmetrical balance\n- Colors: Deep blues to warm golds\n- Lighting: Dramatic three-point\n- Style: Photorealism meets art\n\n**Technical:** Resolution 4K, PNG format, maximum detail`;
            sources = [
              { title: 'AI Art Guide', url: '#', domain: 'midjourney.com' },
              { title: 'Digital Art Fundamentals', url: '#', domain: 'behance.net' }
            ];
            break;
            
          default:
            answer = `${contextual}🔍 Comprehensive Analysis:\n\n${input} represents a multifaceted concept with several key dimensions:\n\n**Core Aspects:**\n- Fundamental principles and mechanisms\n- Practical applications across sectors\n- Current trends and developments\n- Challenges and opportunities\n\n**Research Insights:** Studies show ${input.toLowerCase()} demonstrates measurable benefits when approached systematically.\n\n**Future Outlook:** Experts predict continued evolution with transformative potential.`;
            sources = [
              { title: 'Nature Journal', url: '#', domain: 'nature.com' },
              { title: 'MIT Tech Review', url: '#', domain: 'technologyreview.com' },
              { title: 'Stanford Research', url: '#', domain: 'stanford.edu' }
            ];
        }
      }

      newMessage.answer = answer;
      newMessage.sources = sources;
      
      setConversations(prev => prev.map(c => c.id === newMessage.id ? newMessage : c));
      setIsThinking(false);
      setInput('');

      if (!activeChat) {
        const newChat = {
          id: Date.now(),
          title: input.slice(0, 60),
          messages: [newMessage],
          timestamp: new Date().toISOString(),
          mode: aiMode,
          favorite: false
        };
        setChatHistory(prev => [newChat, ...prev]);
        setActiveChat(newChat.id);
      } else {
        setChatHistory(prev => prev.map(chat => 
          chat.id === activeChat ? { ...chat, messages: [...chat.messages, newMessage] } : chat
        ));
      }
    }, 2000);
  };

  const extractMemory = (text) => {
    const memories = [];
    const keywords = ['i like', 'i love', 'my favorite', 'i prefer', 'i am', 'i work'];
    keywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        memories.push({ id: Date.now() + Math.random(), content: text, timestamp: new Date().toISOString() });
      }
    });
    return memories;
  };

  const startNewChat = () => {
    setConversations([]);
    setActiveChat(null);
  };

  const loadChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setConversations(chat.messages);
      setActiveChat(chatId);
    }
  };

  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
    if (activeChat === chatId) {
      setConversations([]);
      setActiveChat(null);
    }
  };

  const toggleFavorite = (chatId, e) => {
    e.stopPropagation();
    setChatHistory(prev => prev.map(chat => chat.id === chatId ? { ...chat, favorite: !chat.favorite } : chat));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteMemory = (memoryId) => {
    setUserMemory(prev => prev.filter(m => m.id !== memoryId));
  };

  const AuthModal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-md rounded-3xl ${darkMode ? 'bg-slate-900/95 border-blue-800/40' : 'bg-white border-blue-200'} border p-8 shadow-2xl`}>
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-3xl ${darkMode ? 'bg-gradient-to-br from-blue-600/40 to-purple-600/40' : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'} flex items-center justify-center mx-auto mb-4`}>
              <div className={`text-4xl font-light ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>V</div>
            </div>
            <h2 className={`text-3xl font-light mb-2 ${darkMode ? 'text-blue-100' : 'text-slate-800'}`}>
              {authMode === 'login' ? 'Welcome Back' : 'Join Vayu.ai'}
            </h2>
            <p className={`text-sm ${darkMode ? 'text-blue-200/60' : 'text-slate-500'}`}>
              {authMode === 'login' ? 'Sign in to continue' : 'Start exploring'}
            </p>
          </div>

          <div className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-blue-200/80' : 'text-slate-700'}`}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-3 rounded-xl ${darkMode ? 'bg-slate-800/50 text-blue-100 border-blue-800/40' : 'bg-slate-50 text-slate-800 border-slate-200'} border focus:border-blue-500 outline-none`}
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className={`block text-sm mb-2 ${darkMode ? 'text-blue-200/80' : 'text-slate-700'}`}>Email</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-blue-400/50' : 'text-slate-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-3 pl-11 rounded-xl ${darkMode ? 'bg-slate-800/50 text-blue-100 border-blue-800/40' : 'bg-slate-50 text-slate-800 border-slate-200'} border focus:border-blue-500 outline-none`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${darkMode ? 'text-blue-200/80' : 'text-slate-700'}`}>Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-blue-400/50' : 'text-slate-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-3 pl-11 pr-11 rounded-xl ${darkMode ? 'bg-slate-800/50 text-blue-100 border-blue-800/40' : 'bg-slate-50 text-slate-800 border-slate-200'} border focus:border-blue-500 outline-none`}
                  placeholder="••••••••"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className={`w-5 h-5 ${darkMode ? 'text-blue-400/50' : 'text-slate-400'}`} /> : <Eye className={`w-5 h-5 ${darkMode ? 'text-blue-400/50' : 'text-slate-400'}`} />}
                </button>
              </div>
            </div>

            <button
              onClick={(e) => handleAuth(e, email, password, name)}
              className={`w-full py-3 rounded-xl ${darkMode ? 'bg-blue-600/40 hover:bg-blue-600/50 text-blue-100' : 'bg-blue-600 hover:bg-blue-700 text-white'} transition-colors font-light`}
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="text-center">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>

          <button onClick={() => setShowAuthModal(false)} className={`absolute top-4 right-4 p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <X className={`w-5 h-5 ${darkMode ? 'text-blue-200' : 'text-slate-600'}`} />
          </button>
        </div>
      </div>
    );
  };

  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl ${darkMode ? 'bg-slate-900/95 border-blue-800/40' : 'bg-white border-blue-200'} border p-8 shadow-2xl max-h-[80vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-light ${darkMode ? 'text-blue-100' : 'text-slate-800'}`}>Settings</h2>
          <button onClick={() => setShowSettings(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <X className={`w-5 h-5 ${darkMode ? 'text-blue-200' : 'text-slate-600'}`} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-blue-300/80' : 'text-slate-700'}`}>AI Model</h3>
            <select
              value={settings.aiModel}
              onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
              className={`w-full p-3 rounded-xl ${darkMode ? 'bg-slate-800/50 text-blue-100 border-blue-800/40' : 'bg-slate-50 text-slate-800 border-slate-200'} border outline-none`}
            >
              <option value="vayu-pro">Vayu Pro</option>
              <option value="vayu-fast">Vayu Fast</option>
              <option value="vayu-balanced">Vayu Balanced</option>
            </select>
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-blue-300/80' : 'text-slate-700'}`}>Response Length</h3>
            <div className="flex gap-2">
              {['concise', 'balanced', 'detailed'].map(length => (
                <button
                  key={length}
                  onClick={() => setSettings({...settings, responseLength: length})}
                  className={`flex-1 py-2 px-4 rounded-lg capitalize ${
                    settings.responseLength === length
                      ? darkMode ? 'bg-blue-600/40 text-blue-100' : 'bg-blue-600 text-white'
                      : darkMode ? 'bg-slate-800/30 text-blue-200/60 hover:bg-slate-800/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {length}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-blue-200/80' : 'text-slate-700'}`}>Memory & Context</span>
            <input
              type="checkbox"
              checked={settings.memoryEnabled}
              onChange={(e) => setSettings({...settings, memoryEnabled: e.target.checked})}
              className="w-5 h-5 rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const ProfileModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl ${darkMode ? 'bg-slate-900/95 border-blue-800/40' : 'bg-white border-blue-200'} border p-8 shadow-2xl max-h-[80vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-light ${darkMode ? 'text-blue-100' : 'text-slate-800'}`}>Profile & Memory</h2>
          <button onClick={() => setShowProfile(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <X className={`w-5 h-5 ${darkMode ? 'text-blue-200' : 'text-slate-600'}`} />
          </button>
        </div>

        {currentUser && (
          <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'} mb-6`}>
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-blue-600/40' : 'bg-blue-500/20'} flex items-center justify-center text-2xl font-light ${darkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                {currentUser.avatar}
              </div>
              <div>
                <h3 className={`text-xl font-light ${darkMode ? 'text-blue-100' : 'text-slate-800'}`}>{currentUser.name}</h3>
                <p className={`text-sm ${darkMode ? 'text-blue-200/60' : 'text-slate-500'}`}>{currentUser.email}</p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-blue-300/50' : 'text-slate-400'}`}>Total Questions: {totalQuestions}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-light ${darkMode ? 'text-blue-100' : 'text-slate-800'}`}>
              <Brain className="inline w-5 h-5 mr-2" />
              Your Memory
            </h3>
            <span className={`text-sm ${darkMode ? 'text-blue-200/60' : 'text-slate-500'}`}>{userMemory.length} items</span>
          </div>

          {userMemory.length === 0 ? (
            <p className={`text-sm ${darkMode ? 'text-blue-200/60' : 'text-slate-500'} text-center py-8`}>
              No memories yet. Start chatting to build your profile!
            </p>
          ) : (
            <div className="space-y-2">
              {userMemory.map(memory => (
                <div key={memory.id} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800/30' : 'bg-slate-50'} flex items-start justify-between group`}>
                  <p className={`text-sm flex-1 ${darkMode ? 'text-blue-100/80' : 'text-slate-700'}`}>{memory.content}</p>
                  <button
                    onClick={() => deleteMemory(memory.id)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={`w-full py-3 rounded-xl ${darkMode ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300' : 'bg-red-50 hover:bg-red-100 text-red-700'} transition-colors flex items-center justify-center space-x-2`}
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const ThinkingAnimation = () => (
    <div className="flex items-center justify-center py-8">
      <div className="relative w-16 h-16">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`absolute inset-0 border-2 rounded-full ${darkMode ? 'border-blue-400/30' : 'border-blue-500/30'}`} style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: `${i * 0.4}s` }} />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className={`w-6 h-6 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
        </div>
      </div>
    </div>
  );

  const LoadingAnimation = () => (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <style>{`
        @keyframes zoomIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(99, 179, 237, 0.8); }
          50% { text-shadow: 0 0 30px rgba(99, 179, 237, 1); }
        }
      `}</style>
      <canvas ref={matrixCanvasRef} className="absolute inset-0" />
      <div className="relative z-10 text-center" style={{ animation: 'zoomIn 1.5s ease forwards' }}>
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-600/30 to-cyan-600/30 mb-6">
          <div className="text-7xl font-light text-blue-400" style={{ animation: 'glow 2s ease-in-out infinite' }}>V</div>
        </div>
        <h1 className="text-6xl font-light text-blue-400" style={{ animation: 'glow 2s ease-in-out infinite' }}>Vayu.ai</h1>
      </div>
    </div>
  );

  if (showLoadingAnimation) return <LoadingAnimation />;

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950' : 'bg-gradient-to-b from-sky-50 to-white'} flex items-center justify-center p-4`}>
        <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
        <div className="relative z-10 text-center">
          <div className={`w-24 h-24 rounded-2xl ${darkMode ? 'bg-blue-600/30' : 'bg-blue-500/10'} flex items-center justify-center mx-auto mb-8`}>
            <div className={`text-5xl font-light ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>V</div>
          </div>
          <h1 className={`text-5xl font-light mb-4 ${darkMode ? 'text-blue-50' : 'text-slate-800'}`}>Vayu.ai</h1>
          <p className={`text-xl font-light mb-8 ${darkMode ? 'text-blue-200/60' : 'text-slate-500'}`}>Knowledge flows naturally</p>
          <button onClick={() => setShowAuthModal(true)} className={`px-8 py-4 rounded-xl ${darkMode ? 'bg-blue-600/40 hover:bg-blue-600/50 text-blue-100' : 'bg-blue-600 hover:bg-blue-700 text-white'} text-lg font-light`}>
            Get Started
          </button>
        </div>
        {showAuthModal && <AuthModal />}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950' : 'bg-gradient-to-b from-sky-50 to-white'}`}>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      <div className="relative z-10 flex h-screen">
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all ${darkMode ? 'bg-slate-950/60 border-blue-900/40' : 'bg-white/40 border-blue-200/30'} backdrop-blur-xl border-r overflow-hidden flex flex-col`}>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-blue-600/30' : 'bg-blue-500/10'} flex items-center justify-center`}>
                <div className={`text-2xl font-light ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>V</div>
              </div>
              <span className={`text-xl font-light ${darkMode ? 'text-blue-100' : 'text-slate-800'}`}>Vayu.ai</span>
            </div>

            {currentUser && (
              <button onClick={() => setShowProfile(true)} className={`w-full p-3 rounded-xl ${darkMode ? 'bg-slate-900/50 hover:bg-slate-900/70' : 'bg-white/50 hover:bg-white/70'} flex items-center space-x-3`}>
                <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-blue-600/40' : 'bg-blue-500/20'} flex items-center justify-center text-lg ${darkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                  {currentUser.avatar}
                </div>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-light ${darkMode ? 'text-blue-100' : 'text-slate-800'}`}>{currentUser.name}</div>
                  <div className={`text-xs ${darkMode ? 'text-blue-300/50' : 'text-slate-500'}`}>View profile</div>
                </div>
              </button>
            )}

            <button onClick={startNewChat} className={`w-full py-3 px-4 rounded-xl ${darkMode ? 'bg-blue-600/30 hover:bg-blue-600/40 text-blue-100' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700'} flex items-center justify-center space-x-2`}>
              <Plus className="w-5 h-5" />
              <span className="font-light">New Chat</span>
            </button>

            <div className="space-y-2">
              <h3 className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-blue-300/60' : 'text-slate-500'} px-2`}>Recent Chats ({chatHistory.length})</h3>
              
              {chatHistory.map(chat => (
                <div key={chat.id} className={`group relative p-3 rounded-lg ${activeChat === chat.id ? darkMode ? 'bg-blue-600/20' : 'bg-blue-500/10' : darkMode ? 'hover:bg-blue-500/10' : 'hover:bg-blue-500/5'} ${darkMode ? 'text-blue-100/80' : 'text-slate-700'}`}>
                  <button onClick={() => loadChat(chat.id)} className="w-full text-left">
                    <div className="font-light text-sm mb-1 line-clamp-2 pr-16">{chat.title}</div>
                    <div className={`text-xs flex items-center space-x-2 ${darkMode ? 'text-blue-300/50' : 'text-slate-500'}`}>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(chat.timestamp).toLocaleDateString()}</span>
                    </div>
                  </button>
                  <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100">
                    <button onClick={(e) => toggleFavorite(chat.id, e)} className={`p-1 rounded ${chat.favorite ? 'text-yellow-400' : darkMode ? 'text-blue-400/50 hover:text-yellow-400' : 'text-slate-400 hover:text-yellow-500'}`}>
                      <Star className="w-4 h-4" fill={chat.favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={(e) => deleteChat(chat.id, e)} className={`p-1 rounded ${darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {chatHistory.length === 0 && (
                <p className={`text-sm ${darkMode ? 'text-blue-300/30' : 'text-slate-400'} px-2 py-4 text-center`}>No chats yet</p>
              )}
            </div>
          </div>

          <div className={`p-4 border-t ${darkMode ? 'border-blue-900/40' : 'border-blue-200/30'}`}>
            <button onClick={() => setShowSettings(true)} className={`w-full p-3 rounded-lg ${darkMode ? 'hover:bg-slate-900/50 text-blue-200' : 'hover:bg-white/50 text-slate-600'} flex items-center space-x-2`}>
              <Settings className="w-5 h-5" />
              <span className="font-light">Settings</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <header className={`${darkMode ? 'bg-slate-950/40 border-blue-900/40' : 'bg-white/20 border-blue-200/30'} backdrop-blur-xl border-b px-6 py-4`}>
            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-blue-500/10' : 'hover:bg-blue-500/5'}`}>
                <Menu className={`w-5 h-5 ${darkMode ? 'text-blue-200' : 'text-slate-600'}`} />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-blue-500/10' : 'hover:bg-blue-500/5'}`}>
                {darkMode ? <Sun className="w-5 h-5 text-blue-200" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-3xl mx-auto space-y-8">
              {conversations.length === 0 && !isThinking && (
                <div className="text-center py-20">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}>
                    <Search className={`w-10 h-10 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  </div>
                  <h1 className={`text-4xl font-light mb-4 ${darkMode ? 'text-blue-50' : 'text-slate-800'}`}>Explore Knowledge</h1>
                  <p className={`text-lg font-light ${darkMode ? 'text-blue-200/60' : 'text-slate-500'}`}>Ask anything. Research flows naturally.</p>
                </div>
              )}

              {conversations.map((conv) => (
                <div key={conv.id} className="space-y-6">
                  <div className={`p-6 rounded-2xl ${darkMode ? 'bg-blue-950/40 border-blue-800/40' : 'bg-white/50 border-blue-200/30'} backdrop-blur-sm border`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-blue-600/40' : 'bg-blue-500/10'} flex items-center justify-center flex-shrink-0`}>
                          <Search className={`w-4 h-4 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                        </div>
                        <p className={`text-lg font-light ${darkMode ? 'text-blue-50' : 'text-slate-800'}`}>{conv.question}</p>
                      </div>
                      <div className={`ml-3 px-2 py-1 rounded text-xs font-light ${
                        conv.mode === 'creative' ? darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-500/10 text-purple-700'
                        : conv.mode === 'code' ? darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-500/10 text-green-700'
                        : conv.mode === 'image' ? darkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-500/10 text-pink-700'
                        : darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/10 text-blue-700'
                      }`}>
                        {conv.mode}
                      </div>
                    </div>
                  </div>

                  {conv.answer && (
                    <div className={`p-8 rounded-2xl ${darkMode ? 'bg-slate-900/60 border-blue-900/50' : 'bg-white/70 border-blue-200/20'} backdrop-blur-sm border`}>
                      {conv.mode === 'image' && (
                        <div className={`mb-6 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-100'} p-8`}>
                          <div className={`w-full h-64 rounded-lg ${darkMode ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40' : 'bg-gradient-to-br from-blue-100 to-purple-100'} flex items-center justify-center`}>
                            <div className="text-center">
                              <svg className={`w-24 h-24 mx-auto mb-4 ${darkMode ? 'text-blue-400/50' : 'text-blue-500/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className={`text-sm ${darkMode ? 'text-blue-300/60' : 'text-slate-500'}`}>Generated Image</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-4">
                        <p className={`text-base leading-relaxed font-light whitespace-pre-wrap flex-1 ${darkMode ? 'text-blue-100/90' : 'text-slate-700'}`}>
                          {conv.answer}
                        </p>
                        <button onClick={() => copyToClipboard(conv.answer, conv.id)} className={`ml-4 p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                          {copiedId === conv.id ? <Check className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} /> : <Copy className={`w-4 h-4 ${darkMode ? 'text-blue-300/50' : 'text-slate-400'}`} />}
                        </button>
                      </div>

                      {conv.sources.length > 0 && (
                        <div className="space-y-3 mt-6">
                          <h4 className={`text-sm font-medium uppercase tracking-wider ${darkMode ? 'text-blue-300/60' : 'text-slate-500'}`}>Sources</h4>
                          <div className="grid gap-2">
                            {conv.sources.map((source, i) => (
                              <a key={i} href={source.url} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'bg-blue-500/5 hover:bg-blue-500/10'} group`}>
                                <div>
                                  <div className={`text-sm font-light ${darkMode ? 'text-blue-100' : 'text-slate-700'}`}>{source.title}</div>
                                  <div className={`text-xs ${darkMode ? 'text-blue-300/50' : 'text-slate-500'}`}>{source.domain}</div>
                                </div>
                                <ExternalLink className={`w-4 h-4 ${darkMode ? 'text-blue-300/50' : 'text-slate-400'} group-hover:text-blue-500`} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isThinking && <ThinkingAnimation />}
            </div>
          </div>

          <div className={`${darkMode ? 'bg-slate-950/60 border-blue-900/40' : 'bg-white/40 border-blue-200/30'} backdrop-blur-xl border-t p-6`}>
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-4">
                {['general', 'creative', 'code', 'image'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setAiMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-light capitalize ${
                      aiMode === mode
                        ? darkMode ? 'bg-blue-600/40 text-blue-100' : 'bg-blue-500/20 text-blue-700'
                        : darkMode ? 'bg-slate-800/30 text-blue-200/60 hover:bg-slate-800/50' : 'bg-white/50 text-slate-600 hover:bg-white/70'
                    }`}
                  >
                    {mode === 'general' && <Brain className="w-4 h-4 inline mr-1" />}
                    {mode === 'creative' && <Sparkles className="w-4 h-4 inline mr-1" />}
                    {mode === 'code' && <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                    {mode === 'image' && <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    {mode}
                  </button>
                ))}
              </div>
              
              <div className={`flex items-center space-x-3 p-4 rounded-2xl ${darkMode ? 'bg-slate-900/70 border-blue-800/50' : 'bg-white/70 border-blue-200/30'} backdrop-blur-sm border focus-within:border-blue-500`}>
                <Search className={`w-5 h-5 ${darkMode ? 'text-blue-300/50' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  placeholder={
                    aiMode === 'general' ? 'Ask anything...' :
                    aiMode === 'creative' ? 'Create something...' :
                    aiMode === 'code' ? 'Write code...' :
                    'Describe image...'
                  }
                  className={`flex-1 bg-transparent outline-none text-base font-light ${darkMode ? 'text-blue-50 placeholder-blue-300/30' : 'text-slate-800 placeholder-slate-400'}`}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className={`p-2 rounded-lg ${
                    input.trim()
                      ? darkMode ? 'bg-blue-600/40 hover:bg-blue-600/50 text-blue-100' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600'
                      : darkMode ? 'bg-slate-800/30 text-slate-600' : 'bg-slate-200/30 text-slate-400'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal />}
      {showProfile && <ProfileModal />}
    </div>
  );
};

export default VayuAI;
