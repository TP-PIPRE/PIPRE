import React, { useState } from "react";
import { useAuth } from "../../application/hooks/useAuth";

export const LoginPage: React.FC = () => {
  const { login, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        setTimeout(() => {
          alert(
            "El registro de nuevas entidades está restringido temporalmente.",
          );
          setIsLoading(false);
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Subtle Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(var(--primary) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 flex items-center justify-center font-mono font-black text-bg text-3xl mb-4 shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)]"
            style={{ backgroundColor: "var(--primary)" }}
          >
            P
          </div>
          <h1
            className="text-2xl font-mono font-bold tracking-[0.2em] transition-colors duration-300"
            style={{ color: "var(--text)" }}
          >
            PIPRE
          </h1>
          <p
            className="text-[10px] uppercase tracking-[0.3em] font-medium transition-colors duration-300"
            style={{ color: "var(--text-muted)" }}
          >
            Plataforma Industrial de Retos
          </p>
        </div>

        {/* Login Card */}
        <div
          className="border border-border p-8 relative group transition-all duration-300 hover:border-primary/50"
          style={{ backgroundColor: "rgba(var(--surface-rgb), 0.5)" }}
        >
          {/* Decorative elements */}
          <div className="absolute -top-px -left-px w-8 h-px bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute -top-px -left-px w-px h-8 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div
            className="absolute top-2 right-2 text-[8px] font-mono uppercase tracking-widest transition-colors duration-300"
            style={{ color: "rgba(var(--text-muted-rgb), 0.2)" }}
          >
            Auth_Node_0x44
          </div>
          <div
            className="absolute bottom-2 left-2 text-[8px] font-mono uppercase tracking-widest transition-colors duration-300"
            style={{ color: "rgba(var(--text-muted-rgb), 0.2)" }}
          >
            Secure_Input_Active
          </div>

          <div className="mb-8">
            <h2
              className="text-sm font-mono font-bold uppercase tracking-widest mb-1 transition-colors duration-300"
              style={{ color: "var(--text)" }}
            >
              {isLogin ? "Acceso al Sistema" : "Crear Cuenta"}
            </h2>
            <p
              className="text-[11px] transition-colors duration-300"
              style={{ color: "var(--text-muted)" }}
            >
              {isLogin
                ? "Introduce tus credenciales para conectar con el nodo."
                : "Regístrate para comenzar con los retos industriales."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="text-[10px] font-mono uppercase tracking-wider ml-1 transition-colors duration-300"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Nombre
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none transition-all duration-300 font-mono text-xs placeholder:text-text-muted/30"
                    style={{
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                      borderColor: "var(--border)",
                    }}
                    placeholder="Ej. Juan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-[10px] font-mono uppercase tracking-wider ml-1 transition-colors duration-300"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Apellido
                  </label>
                  <input
                    name="lastname"
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none transition-all duration-300 font-mono text-xs placeholder:text-text-muted/30"
                    style={{
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                      borderColor: "var(--border)",
                    }}
                    placeholder="Ej. Pérez"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                className="text-[10px] font-mono uppercase tracking-wider ml-1 transition-colors duration-300"
                style={{ color: "var(--text-muted)" }}
              >
                Identificador (Email)
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg opacity-40 transition-colors duration-300"
                  style={{ color: "var(--text-muted)" }}
                >
                  alternate_email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-border focus:border-primary focus:outline-none transition-all duration-300 font-mono text-xs placeholder:text-text-muted/30"
                  style={{
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                    borderColor: "var(--border)",
                  }}
                  placeholder="usuario@pipre.io"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-[10px] font-mono uppercase tracking-wider ml-1 transition-colors duration-300"
                style={{ color: "var(--text-muted)" }}
              >
                Contraseña de Seguridad
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg opacity-40 transition-colors duration-300"
                  style={{ color: "var(--text-muted)" }}
                >
                  key
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-border focus:border-primary focus:outline-none transition-all duration-300 font-mono text-xs placeholder:text-text-muted/30"
                  style={{
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                    borderColor: "var(--border)",
                  }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 font-mono text-[10px] uppercase tracking-wider text-center transition-all duration-300">
                Error de autenticación: Credenciales no válidas
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 font-mono font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 active:scale-[0.98] disabled:opacity-50 border"
              style={{
                backgroundColor: "transparent",
                color: "var(--text-muted)",
                borderColor: "var(--text-muted)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "var(--surface)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              {isLoading ? "PROCESANDO..." : isLogin ? "CONECTAR" : "REGISTRAR"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-mono text-[10px] uppercase tracking-widest transition-all duration-300 hover:underline"
              style={{ color: "var(--primary)" }}
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate aquí"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div
          className="mt-8 flex justify-center items-center gap-4 text-[9px] font-mono uppercase tracking-[0.2em] transition-colors duration-300"
          style={{ color: "var(--text-muted)" }}
        >
          <span>v2.0.4-stable</span>
          <span className="w-1 h-1 bg-border rounded-full" />
          <span>Encrypted_TLS_1.3</span>
          <span className="w-1 h-1 bg-border rounded-full" />
          <span>Status: Online</span>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
