import React, { useState } from "react";
import { useAuth } from "../../application/hooks/useAuth";
import { apiService } from "../../infrastructure/api/apiService";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setRegError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const age = parseInt(formData.get("age") as string);
        const grade = formData.get("grade") as string;
        const institution = formData.get("institution") as string;
        const zone = formData.get("zone") as string;

        const uuid = await apiService.users.create({
          firstName,
          lastName,
          age,
          grade,
          email,
          passwordHash: password,
          institution,
          zone,
        });

        // Store UUID for login lookup
        const storedUsers = JSON.parse(localStorage.getItem("pipre_registered_users") || "{}");
        storedUsers[email] = uuid;
        localStorage.setItem("pipre_registered_users", JSON.stringify(storedUsers));

        setSuccessMessage("Nodo de usuario creado. Identifícate para entrar.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error("Error in auth/reg:", err);
      setRegError(
        isLogin
          ? "Credenciales inválidas"
          : "Error de sincronización. Verifica los datos del nodo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-bg animate-fade-in relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="w-full max-w-md z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-20 h-20 flex items-center justify-center font-bold text-bg text-3xl mb-4 shadow-2xl hover:rotate-12 transition-transform duration-500"
            style={{
              backgroundColor: "var(--primary)",
              borderRadius: "var(--theme-radius)",
            }}
          >
            P
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-text mb-2">
            PIPRE
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-text-muted font-bold">
            Plataforma Industrial de Retos
          </p>
        </div>

        {/* Login/Reg Card */}
        <div
          className="bg-surface/50 backdrop-blur-xl border border-border p-7 shadow-2xl relative group transition-all duration-500 hover:border-primary/30"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          <div className="mb-5">
            <h2 className="text-xl font-bold text-text mb-2">
              {isLogin ? "Acceso al Nodo" : "Registro de Estudiante"}
            </h2>
            <p className="text-[11px] text-text-muted">
              {isLogin
                ? "Introduce tus credenciales para sincronizar sesión."
                : "Crea tu perfil para empezar los retos industriales."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                    Nombre
                  </label>
                  <input
                    name="firstName"
                    required
                    className="w-full px-4 py-3 bg-bg/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                    Apellido
                  </label>
                  <input
                    name="lastName"
                    required
                    className="w-full px-4 py-3 bg-bg/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                    Edad
                  </label>
                  <input
                    name="age"
                    type="number"
                    required
                    className="w-full px-4 py-3 bg-bg/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                    Grado
                  </label>
                  <input
                    name="grade"
                    required
                    className="w-full px-4 py-3 bg-bg/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                    Institución
                  </label>
                  <input
                    name="institution"
                    required
                    className="w-full px-4 py-3 bg-bg/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                    Zona
                  </label>
                  <input
                    name="zone"
                    required
                    className="w-full px-4 py-3 bg-bg/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-bg/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                style={{ borderRadius: "var(--theme-radius)" }}
                placeholder="usuario@pipre.io"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-bg/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                style={{ borderRadius: "var(--theme-radius)" }}
                placeholder="••••••••"
              />
            </div>

            {regError && (
              <div
                className="p-4 bg-danger/10 border border-danger/20 text-danger text-[10px] font-bold uppercase tracking-widest text-center animate-shake"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                {regError}
              </div>
            )}

            {successMessage && (
              <div
                className="p-4 bg-success/10 border border-success/20 text-success text-[10px] font-bold uppercase tracking-widest text-center animate-fade-in"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 btn-premium font-bold uppercase tracking-[0.25em] text-[11px] active:scale-95 transition-all shadow-xl hover:shadow-primary/20 disabled:opacity-50"
              style={{ borderRadius: "var(--theme-radius)" }}
            >
              {isLoading
                ? "Sincronizando..."
                : isLogin
                  ? "IDENTIFICARSE"
                  : "REGISTRARSE"}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-border/50 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setSuccessMessage(null);
                setRegError(null);
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:glow-text transition-all"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate aquí"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
