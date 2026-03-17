import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import type { UserProfile } from "@/lib/api";
import { authApi } from "@/lib/api";

const CONTACTS = [
  { id: 1, name: "Алина Морозова", avatar: "А", color: "#a855f7", status: "online", lastMsg: "Окей, увидимся завтра!", time: "14:32", unread: 3, typing: false },
  { id: 2, name: "Дмитрий Волков", avatar: "Д", color: "#22d3ee", status: "online", lastMsg: "Отправил документы на почту", time: "13:15", unread: 0, typing: true },
  { id: 3, name: "Команда Pulse", avatar: "🚀", color: "#f472b6", status: "online", lastMsg: "Новый релиз уже доступен!", time: "12:00", unread: 7, typing: false },
  { id: 4, name: "Мария Соколова", avatar: "М", color: "#34d399", status: "away", lastMsg: "Хорошо, понял тебя", time: "11:44", unread: 0, typing: false },
  { id: 5, name: "Никита Петров", avatar: "Н", color: "#f59e0b", status: "offline", lastMsg: "Спасибо за помощь!", time: "Вчера", unread: 0, typing: false },
  { id: 6, name: "Юля Кузнецова", avatar: "Ю", color: "#ec4899", status: "offline", lastMsg: "Когда встретимся?", time: "Вчера", unread: 1, typing: false },
];

const MESSAGES: Record<number, { id: number; text: string; time: string; from: "me" | "them"; read: boolean }[]> = {
  1: [
    { id: 1, text: "Привет! Как дела?", time: "14:20", from: "them", read: true },
    { id: 2, text: "Всё отлично, работаю над новым проектом 🔥", time: "14:21", from: "me", read: true },
    { id: 3, text: "О, звучит круто! Расскажи подробнее", time: "14:25", from: "them", read: true },
    { id: 4, text: "Строим мессенджер нового поколения. Красивый дизайн, быстрый отклик", time: "14:28", from: "me", read: true },
    { id: 5, text: "Звучит невероятно! Когда можно будет попробовать?", time: "14:30", from: "them", read: true },
    { id: 6, text: "Окей, увидимся завтра!", time: "14:32", from: "them", read: false },
  ],
  2: [
    { id: 1, text: "Дим, нужны документы для встречи", time: "13:00", from: "me", read: true },
    { id: 2, text: "Сейчас подготовлю", time: "13:05", from: "them", read: true },
    { id: 3, text: "Отправил документы на почту", time: "13:15", from: "them", read: true },
  ],
  3: [
    { id: 1, text: "👋 Добро пожаловать в Pulse!", time: "10:00", from: "them", read: true },
    { id: 2, text: "Мы рады, что ты с нами", time: "10:01", from: "them", read: true },
    { id: 3, text: "Новый релиз уже доступен!", time: "12:00", from: "them", read: false },
  ],
  4: [{ id: 1, text: "Хорошо, понял тебя", time: "11:44", from: "them", read: true }],
  5: [{ id: 1, text: "Спасибо за помощь!", time: "Вчера", from: "them", read: true }],
  6: [{ id: 1, text: "Когда встретимся?", time: "Вчера", from: "them", read: false }],
};

const PROFILE = {
  name: "Кирилл Андреев",
  username: "@kirilldev",
  avatar: "К",
  status: "Разрабатываю будущее 🚀",
  color: "#a855f7",
};

type Tab = "chats" | "profile";
type ToastMsg = { id: number; contactName: string; text: string };

interface IndexProps {
  user: UserProfile;
  onLogout: () => void;
  onUpdateUser: (u: UserProfile) => void;
}

export default function Index({ user, onLogout, onUpdateUser }: IndexProps) {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messages, setMessages] = useState(MESSAGES);
  const [inputText, setInputText] = useState("");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [profileStatus, setProfileStatus] = useState(user.status_text || PROFILE.status);
  const [editingStatus, setEditingStatus] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalUnread = CONTACTS.reduce((sum, c) => sum + c.unread, 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat, messages]);

  useEffect(() => {
    if (!notifications) return;
    const timer = setTimeout(() => {
      const randomContact = CONTACTS[Math.floor(Math.random() * 3)];
      const texts = ["Привет! Есть минутка?", "Видел новое сообщение?", "Как проект?", "Отличная работа! 👏"];
      const toast: ToastMsg = {
        id: Date.now(),
        contactName: randomContact.name,
        text: texts[Math.floor(Math.random() * texts.length)],
      };
      setToasts((prev) => [...prev.slice(-2), toast]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 4000);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts, notifications]);

  const sendMessage = () => {
    if (!inputText.trim() || activeChat === null) return;
    const newMsg = {
      id: Date.now(),
      text: inputText.trim(),
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      from: "me" as const,
      read: false,
    };
    setMessages((prev) => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), newMsg] }));
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeContact = CONTACTS.find((c) => c.id === activeChat);
  const currentMessages = activeChat ? messages[activeChat] || [] : [];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      {/* Notification toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-notification glass-strong rounded-2xl p-4 max-w-xs flex items-start gap-3 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
            >
              {CONTACTS.find((c) => c.name === toast.contactName)?.avatar || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold neon-text-purple truncate">{toast.contactName}</p>
              <p className="text-xs text-white/70 truncate">{toast.text}</p>
            </div>
            <button className="text-white/30 hover:text-white/70 ml-1">
              <Icon name="X" size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`flex flex-col glass border-r border-white/5 transition-all duration-300 ${activeChat ? "w-0 md:w-80 overflow-hidden" : "w-full md:w-80"}`}>
          {/* Logo */}
          <div className="px-5 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}
              >
                P
              </div>
              <span className="font-black text-lg tracking-tight text-white">Pulse</span>
            </div>
            <button
              className={`relative p-2 rounded-xl transition-all ${notifications ? "text-purple-400 bg-purple-500/10" : "text-white/30"}`}
              onClick={() => setNotifications((p) => !p)}
              title={notifications ? "Выключить уведомления" : "Включить уведомления"}
            >
              <Icon name={notifications ? "Bell" : "BellOff"} size={18} />
              {notifications && totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-2.5 border border-white/5">
              <Icon name="Search" size={14} className="text-white/30" />
              <input className="bg-transparent text-sm text-white placeholder-white/30 flex-1 outline-none" placeholder="Поиск..." />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 pb-4 flex gap-1 flex-shrink-0">
            {(["chats", "profile"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70"}`}
                style={
                  activeTab === tab
                    ? { background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(99,102,241,0.2))", border: "1px solid rgba(168,85,247,0.3)" }
                    : {}
                }
              >
                {tab === "chats" ? "Чаты" : "Профиль"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "chats" && (
              <div className="px-2 pb-4 flex flex-col gap-0.5">
                {CONTACTS.map((contact, i) => (
                  <button
                    key={contact.id}
                    onClick={() => setActiveChat(contact.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 text-left hover:bg-white/5 ${activeChat === contact.id ? "bg-white/8" : ""}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${contact.color}99, ${contact.color}44)`,
                          border: `1.5px solid ${contact.color}55`,
                          boxShadow: activeChat === contact.id ? `0 0 0 2px ${contact.color}, 0 0 15px ${contact.color}66` : "none",
                        }}
                      >
                        {contact.avatar}
                      </div>
                      {contact.status === "online" && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full online-dot border-2 border-[hsl(230,20%,8%)]" />
                      )}
                      {contact.status === "away" && (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-yellow-400 border-2 border-[hsl(230,20%,8%)]"
                          style={{ boxShadow: "0 0 6px rgba(250,204,21,0.8)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white truncate">{contact.name}</span>
                        <span className="text-[11px] text-white/30 ml-2 flex-shrink-0">{contact.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        {contact.typing ? (
                          <span className="text-xs text-purple-400 italic">печатает...</span>
                        ) : (
                          <span className="text-xs text-white/40 truncate">{contact.lastMsg}</span>
                        )}
                        {contact.unread > 0 && (
                          <span
                            className="ml-2 flex-shrink-0 min-w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", padding: "0 5px" }}
                          >
                            {contact.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="px-4 pb-6 animate-fade-in">
                {/* Avatar */}
                <div className="flex flex-col items-center pt-6 pb-6">
                  <div className="relative mb-4">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white pulse-ring"
                      style={{ background: `linear-gradient(135deg, ${user.avatar_color}, ${user.avatar_color}88)`, boxShadow: `0 0 30px ${user.avatar_color}66` }}
                    >
                      {user.avatar_letter}
                    </div>
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full online-dot border-2 border-[hsl(230,20%,8%)]" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{user.display_name}</h2>
                  <p className="text-sm text-white/40">@{user.username}</p>
                  <p className="text-xs text-white/25 mt-1">{user.email}</p>
                </div>

                {/* Status */}
                <div className="glass rounded-2xl p-4 mb-3">
                  <p className="text-xs text-white/30 mb-2 font-medium uppercase tracking-wider">Статус</p>
                  {editingStatus ? (
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-white outline-none border border-purple-500/40 focus:border-purple-500/80 transition-colors"
                        value={profileStatus}
                        onChange={(e) => setProfileStatus(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            setEditingStatus(false);
                            setSavingStatus(true);
                            try {
                              await authApi.updateMe({ status_text: profileStatus });
                              onUpdateUser({ ...user, status_text: profileStatus });
                            } finally { setSavingStatus(false); }
                          }
                          if (e.key === "Escape") setEditingStatus(false);
                        }}
                        onBlur={async () => {
                          setEditingStatus(false);
                          setSavingStatus(true);
                          try {
                            await authApi.updateMe({ status_text: profileStatus });
                            onUpdateUser({ ...user, status_text: profileStatus });
                          } finally { setSavingStatus(false); }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setEditingStatus(true)}>
                      <p className="text-sm text-white/80">{savingStatus ? "Сохраняю..." : profileStatus}</p>
                      <Icon name="Pencil" size={13} className="text-white/20 group-hover:text-purple-400 transition-colors ml-2" />
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[{ label: "Чатов", val: "6" }, { label: "Онлайн", val: "3" }, { label: "Сообщ.", val: "41" }].map((s) => (
                    <div key={s.label} className="glass rounded-2xl p-3 text-center">
                      <p className="text-xl font-black neon-text-purple">{s.val}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Settings */}
                <div className="glass rounded-2xl overflow-hidden">
                  {[
                    { icon: "Bell", label: "Уведомления", action: () => setNotifications((p) => !p), toggle: notifications },
                    { icon: "Shield", label: "Конфиденциальность", action: undefined, toggle: undefined },
                    { icon: "Palette", label: "Тема оформления", action: undefined, toggle: undefined },
                    { icon: "LogOut", label: "Выйти", action: onLogout, toggle: undefined },
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors ${i < arr.length - 1 ? "border-b border-white/5" : ""}`}
                      onClick={item.action}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name={item.icon as "Bell"} size={15} className="text-white/40" />
                        <span className="text-sm text-white/70">{item.label}</span>
                      </div>
                      {item.toggle !== undefined ? (
                        <div className={`w-9 h-5 rounded-full transition-all duration-300 relative ${item.toggle ? "bg-purple-500" : "bg-white/10"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${item.toggle ? "left-4" : "left-0.5"}`} />
                        </div>
                      ) : (
                        <Icon name="ChevronRight" size={14} className="text-white/20" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${!activeChat ? "hidden md:flex" : "flex"}`}>
          {activeChat && activeContact ? (
            <>
              {/* Chat header */}
              <div className="glass border-b border-white/5 px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
                <button className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors mr-1" onClick={() => setActiveChat(null)}>
                  <Icon name="ChevronLeft" size={18} className="text-white/60" />
                </button>
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${activeContact.color}99, ${activeContact.color}44)`,
                      border: `1.5px solid ${activeContact.color}55`,
                    }}
                  >
                    {activeContact.avatar}
                  </div>
                  {activeContact.status === "online" && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full online-dot border-2 border-[hsl(230,20%,8%)]" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{activeContact.name}</h3>
                  <p className="text-xs text-white/40">
                    {activeContact.typing ? (
                      <span className="text-purple-400">печатает...</span>
                    ) : activeContact.status === "online" ? (
                      "в сети"
                    ) : activeContact.status === "away" ? (
                      "недавно был"
                    ) : (
                      "не в сети"
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <Icon name="Phone" size={16} className="text-white/50" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <Icon name="Video" size={16} className="text-white/50" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <Icon name="MoreVertical" size={16} className="text-white/50" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
                {currentMessages.map((msg, i) => (
                  <div
                    key={msg.id}
                    className="flex animate-slide-up"
                    style={{ animationDelay: `${i * 0.03}s`, justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}
                  >
                    {msg.from === "them" && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mr-2 mt-auto flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${activeContact.color}99, ${activeContact.color}44)` }}
                      >
                        {activeContact.avatar}
                      </div>
                    )}
                    <div className={`max-w-[72%] md:max-w-[60%] rounded-2xl px-4 py-2.5 ${msg.from === "me" ? "msg-bubble-out rounded-br-md" : "msg-bubble-in rounded-bl-md"}`}>
                      <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-white/30">{msg.time}</span>
                        {msg.from === "me" && (
                          <Icon name={msg.read ? "CheckCheck" : "Check"} size={10} className={msg.read ? "text-purple-300" : "text-white/30"} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="glass border-t border-white/5 px-4 py-3.5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-xl hover:bg-white/5 transition-colors flex-shrink-0">
                    <Icon name="Paperclip" size={16} className="text-white/40" />
                  </button>
                  <div className="flex-1 flex items-center bg-white/5 rounded-2xl border border-white/5 focus-within:border-purple-500/40 transition-colors px-4 py-2.5 gap-2">
                    <input
                      ref={inputRef}
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
                      placeholder="Напишите сообщение..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button className="flex-shrink-0">
                      <Icon name="Smile" size={16} className="text-white/30 hover:text-purple-400 transition-colors" />
                    </button>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim()}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30 disabled:scale-95 hover:scale-105 active:scale-95"
                    style={{
                      background: inputText.trim() ? "linear-gradient(135deg, #a855f7, #6366f1)" : "rgba(255,255,255,0.05)",
                      boxShadow: inputText.trim() ? "0 4px 20px rgba(168,85,247,0.4)" : "none",
                    }}
                  >
                    <Icon name="Send" size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                style={{
                  background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(34,211,238,0.1))",
                  border: "1px solid rgba(168,85,247,0.2)",
                }}
              >
                💬
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Выберите чат</h3>
                <p className="text-sm text-white/30 max-w-48">Выберите диалог слева, чтобы начать общение</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}