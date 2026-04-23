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
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Implementación de registro simulada
        setTimeout(() => {
          alert("El registro de nuevas entidades está restringido temporalmente.");
          setIsLoading(false);
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-bg relative">
      {/* Subtle Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary flex items-center justify-center font-mono font-black text-bg text-3xl mb-4 shadow-[0_0_40px_rgba(var(--primary),0.2)]">
            P
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-[0.2em] text-text mb-1">PIPRE</h1>
          <p className="text-text-muted text-[10px] uppercase tracking-[0.3em] font-medium">Plataforma Industrial de Retos</p>
        </div>

        {/* Login Card */}
        <div className="border border-border bg-surface/50 backdrop-blur-md p-8 relative group transition-all hover:border-primary/30">
          {/* Decorative elements */}
          <div className="absolute -top-px -left-px w-8 h-px bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -top-px -left-px w-px h-8 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="absolute top-2 right-2 text-[8px] font-mono text-text-muted/20 uppercase tracking-widest pointer-events-none">
            Auth_Node_0x44
          </div>
          <div className="absolute bottom-2 left-2 text-[8px] font-mono text-text-muted/20 uppercase tracking-widest pointer-events-none">
            Secure_Input_Active
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-mono font-bold text-text uppercase tracking-widest mb-1">
              {isLogin ? "Acceso al Sistema" : "Crear Cuenta"}
            </h2>
            <p className="text-text-muted text-[11px]">
              {isLogin 
                ? "Introduce tus credenciales para conectar con el nodo." 
                : "Regístrate para comenzar con los retos industriales."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider ml-1">Nombre</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-bg border border-border focus:border-primary focus:outline-none transition-colors font-mono text-xs text-text placeholder:text-text-muted/30"
                    placeholder="Ej. Juan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider ml-1">Apellido</label>
                  <input
                    name="lastname"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-bg border border-border focus:border-primary focus:outline-none transition-colors font-mono text-xs text-text placeholder:text-text-muted/30"
                    placeholder="Ej. Pérez"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider ml-1">Identificador (Email)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg opacity-40">
                  alternate_email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-bg border border-border focus:border-primary focus:outline-none transition-colors font-mono text-xs text-text placeholder:text-text-muted/30"
                  placeholder="usuario@pipre.io"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider ml-1">Contraseña de Seguridad</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg opacity-40">
                  key
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-bg border border-border focus:border-primary focus:outline-none transition-colors font-mono text-xs text-text placeholder:text-text-muted/30"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 font-mono text-[10px] uppercase tracking-wider text-center">
                Error de autenticación: Credenciales no válidas
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary text-bg font-mono font-bold uppercase tracking-[0.2em] text-xs hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? "PROCESANDO..." : (isLogin ? "CONECTAR" : "REGISTRAR")}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-text-muted font-mono text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex justify-center items-center gap-4 text-[9px] font-mono text-text-muted uppercase tracking-[0.2em]">
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
