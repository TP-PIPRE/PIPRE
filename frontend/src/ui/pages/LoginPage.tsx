import React, { useState } from "react";
import { useAuth } from "../../application/hooks/useAuth";

export const LoginPage: React.FC = () => {
  const { login, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    if (isLogin) {
      await login(email, password);
    } else {
      const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;
      const lastname = (form.elements.namedItem("lastname") as HTMLInputElement)
        ?.value;
      const age = (form.elements.namedItem("age") as HTMLInputElement)?.value;
      const grade = (form.elements.namedItem("grade") as HTMLInputElement)
        ?.value;

      console.log("Registro:", { name, lastname, email, password, age, grade });
      alert(
        "Registro no implementado aún. Usa el login con admin@pipre.com / 123456",
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-8 geometric-bg">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-6 flex justify-center items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-pink-700 p-2.5 rounded-2xl shadow-lg">
              <span className="material-symbols-outlined text-white text-3xl">
                smart_toy
              </span>
            </div>
            <span className="text-2xl font-black bg-gradient-to-br from-pink-500 to-pink-700 bg-clip-text text-transparent font-headline tracking-tight">
              PIPRE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
            {isLogin ? "Bienvenido de nuevo" : "Comienza tu aventura"}
          </h1>
          <p className="text-on-surface-variant font-body text-lg">
            {isLogin
              ? "Tu viaje de aprendizaje continúa aquí."
              : "Únete a la comunidad de creadores del mañana"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-tertiary transition-colors">
                      person
                    </span>
                    <input
                      name="name"
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-0 rounded-lg focus:ring-2 focus:ring-tertiary transition-all shadow-sm text-lg"
                      placeholder="Nombre"
                      type="text"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-tertiary transition-colors">
                      badge
                    </span>
                    <input
                      name="lastname"
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-0 rounded-lg focus:ring-2 focus:ring-tertiary transition-all shadow-sm text-lg"
                      placeholder="Apellido"
                      type="text"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-tertiary transition-colors">
                    cake
                  </span>
                  <input
                    name="age"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-0 rounded-lg focus:ring-2 focus:ring-tertiary transition-all shadow-sm text-lg"
                    placeholder="Edad"
                    type="number"
                    required
                  />
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-tertiary transition-colors">
                    school
                  </span>
                  <input
                    name="grade"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-0 rounded-lg focus:ring-2 focus:ring-tertiary transition-all shadow-sm text-lg"
                    placeholder="Grado"
                    type="text"
                    required
                  />
                </div>
              </div>
            </>
          )}
          <div className="space-y-3">
            <label className="text-base font-semibold text-on-surface-variant">
              Correo electrónico
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-tertiary transition-colors">
                mail
              </span>
              <input
                name="email"
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-0 rounded-lg focus:ring-2 focus:ring-tertiary transition-all duration-300 placeholder:text-outline-variant shadow-sm text-lg"
                placeholder="ejemplo@pipre.com"
                type="email"
                required
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-base font-semibold text-on-surface-variant">
                Contraseña
              </label>
              <a
                className="text-sm font-bold text-secondary hover:text-secondary-dim transition-colors"
                href="#"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-tertiary transition-colors">
                lock
              </span>
              <input
                name="password"
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-0 rounded-lg focus:ring-2 focus:ring-tertiary transition-all duration-300 placeholder:text-outline-variant shadow-sm text-lg"
                placeholder="••••••••"
                type="password"
                required
              />
            </div>
          </div>
          {error && <p className="text-error text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 btn-gradient text-white font-bold rounded-full shadow-[0_10px_20px_-5px_rgba(176,13,106,0.3)] hover:shadow-[0_15px_30px_-8px_rgba(176,13,106,0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xl"
          >
            {isLogin ? "Iniciar Sesión" : "¡Registrarme!"}
          </button>
        </form>
        <div className="pt-4 text-center">
          <p className="text-on-surface-variant text-lg">
            {isLogin ? (
              <>
                ¿No tienes cuenta?{" "}
                <span
                  className="text-primary font-bold cursor-pointer"
                  onClick={() => setIsLogin(false)}
                >
                  Regístrate
                </span>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <span
                  className="text-primary font-bold cursor-pointer"
                  onClick={() => setIsLogin(true)}
                >
                  Inicia sesión
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
};
