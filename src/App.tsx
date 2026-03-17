import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { authApi, getToken, removeToken } from "@/lib/api";
import type { UserProfile } from "@/lib/api";

const queryClient = new QueryClient();

function AppRoutes() {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    authApi.me()
      .then((u) => setUser(u))
      .catch(() => { removeToken(); setUser(null); });
  }, []);

  const handleAuthSuccess = () => {
    authApi.me().then((u) => setUser(u));
  };

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    removeToken();
    setUser(null);
  };

  if (user === undefined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user
            ? <Index user={user} onLogout={handleLogout} onUpdateUser={setUser} />
            : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/auth"
        element={
          user
            ? <Navigate to="/" replace />
            : <Auth onSuccess={handleAuthSuccess} />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
