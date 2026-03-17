import { useState } from "react";
import Icon from "@/components/ui/icon";
import { authApi, setToken } from "@/lib/api";

type Mode = "login" | "register";

interface AuthProps {
  onSuccess: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    display_name: "",
  });

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const res = await authApi.login({ login: form.email || form.username, password: form.password });
        setToken(res.token);
      } else {
        const res = await authApi.register({
          username: form.username,
          email: form.email,
          password: form.password,
          display_name: form.display_name || form.username,
        });
        setToken(res.token);
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #f472b6, transparent)" }} />
      </div>

      <div className="w-full max-w-sm mx-4 animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl" style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)", boxShadow: "0 0 30px rgba(168,85,247,0.4)" }}>
            P
          </div>
          <span className="font-black text-3xl tracking-tight text-white">Pulse</span>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-6">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === m ? "text-white" : "text-white/40 hover:text-white/70"}`}
                style={mode === m ? { background: "linear-gradient(135deg, rgba(168,85,247,0.5), rgba(99,102,241,0.4))", border: "1px solid rgba(168,85,247,0.4)" } : {}}
              >
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "register" && (
              <>
                <Field
                  icon="User"
                  placeholder="Имя (как вас зовут)"
                  value={form.display_name}
                  onChange={(v) => set("display_name", v)}
                  autoComplete="name"
                />
                <Field
                  icon="AtSign"
                  placeholder="Имя пользователя (@username)"
                  value={form.username}
                  onChange={(v) => set("username", v.toLowerCase().replace(/\s/g, ""))}
                  autoComplete="username"
                />
              </>
            )}

            <Field
              icon="Mail"
              placeholder={mode === "login" ? "Email или @username" : "Email"}
              value={form.email}
              onChange={(v) => set("email", v)}
              type="email"
              autoComplete="email"
            />

            <Field
              icon="Lock"
              placeholder="Пароль"
              value={form.password}
              onChange={(v) => set("password", v)}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-bounce-in">
                <Icon name="AlertCircle" size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 24px rgba(168,85,247,0.4)" }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={16} />
                  {mode === "login" ? "Войти в Pulse" : "Создать аккаунт"}
                </>
              )}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-xs text-white/30 mt-4">
              Нет аккаунта?{" "}
              <button className="text-purple-400 hover:text-purple-300 transition-colors font-medium" onClick={() => setMode("register")}>
                Зарегистрироваться
              </button>
            </p>
          )}
          {mode === "register" && (
            <p className="text-center text-xs text-white/30 mt-4">
              Уже есть аккаунт?{" "}
              <button className="text-purple-400 hover:text-purple-300 transition-colors font-medium" onClick={() => setMode("login")}>
                Войти
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-white/15 mt-6">Pulse Messenger · {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-2xl border border-white/8 focus-within:border-purple-500/50 transition-colors px-4 py-3">
      <Icon name={icon as "Mail"} size={15} className="text-white/30 flex-shrink-0" />
      <input
        className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        autoComplete={autoComplete}
        required
      />
    </div>
  );
}