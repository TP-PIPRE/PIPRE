import { getApiErrorMessage } from "../../infrastructure/api/errors";
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../application/hooks/useAuth";
import { apiService } from "../../infrastructure/api/apiService";
import { RobotIcon } from "../components/common/RobotIcon";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const errorRef = useRef<HTMLDivElement>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  useEffect(() => { if (regError) errorRef.current?.focus(); }, [regError]);

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

        await apiService.users.create({
          firstName,
          lastName,
          age,
          grade,
          email,
          passwordHash: password,
          roleIdList: [],
        });

        setSuccessMessage("Tu cuenta está lista. Inicia sesión para continuar.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error("Error in auth/reg:", err);
      setRegError(getApiErrorMessage(err, "No pudimos completar la solicitud."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="flex items-center gap-3 mb-8">
          <RobotIcon size={48} />
          <div><span className="text-xl font-extrabold tracking-tight">PIPRE</span><p className="text-sm text-text-muted">Aprende. Experimenta. Resuelve.</p></div>
        </div>
        <div className="auth-card">
          <p className="page-eyebrow mb-3">Tu laboratorio de aprendizaje</p>
          <h1 className="text-2xl font-bold mb-2">{isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h1>
          <p className="text-sm text-text-muted mb-6">{isLogin ? "Inicia sesión para continuar con tus retos de lógica." : "Regístrate para explorar Neon Flow y TetriLogic."}</p>
          <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
            {!isLogin && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["firstName", "Nombre", "text", "given-name"],
                ["lastName", "Apellido", "text", "family-name"],
                ["age", "Edad", "number", "off"],
                ["grade", "Grado", "text", "off"],
              ].map(([name, label, type, autoComplete]) => <div key={name}><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} autoComplete={autoComplete} min={type === "number" ? 0 : undefined} required className="auth-input" /></div>)}
            </div>}
            <div><label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" autoComplete="username" required className="auth-input" placeholder="tu.correo@ejemplo.com" aria-describedby={regError ? "auth-error" : undefined} /></div>
            <div><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} required className="auth-input" aria-describedby={regError ? "auth-error" : undefined} /></div>
            {regError && <div id="auth-error" ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg border border-danger bg-danger/5 p-3 text-sm text-danger">{regError}</div>}
            {successMessage && <div role="status" className="rounded-lg border border-success bg-success/5 p-3 text-sm text-success">{successMessage}</div>}
            <button type="submit" disabled={isLoading} className="btn-premium w-full">{isLoading ? "Conectando…" : isLogin ? "Iniciar sesión" : "Crear cuenta"}</button>
          </form>
          <div className="mt-6 pt-5 border-t border-border text-center">
            <button disabled={isLoading} onClick={() => { setIsLogin(!isLogin); setSuccessMessage(null); setRegError(null); }} className="min-h-11 text-sm font-semibold text-primary">{isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}</button>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-text-muted">Pensamiento lógico · Robótica educativa</p>
      </div>
    </main>
  );
};
