"use client";

import { useState } from "react";

import {
  Eye,
  GraduationCap,
  Lock,
  Mail,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin() {
    setError("");

    if (!email || !password) {
      setError(
        "Preencha email e senha."
      );

      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    setLoading(false);

    if (error) {
      setError(
        "Email ou senha inválidos."
      );

      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020817] px-6 py-10 text-white">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#081028] shadow-2xl lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-600/20 to-transparent p-12 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-500/20 p-3 text-violet-300">
                <GraduationCap size={34} />
              </div>

              <h1 className="text-4xl font-bold">
                Melia EDU
              </h1>
            </div>

            <h2 className="mt-14 max-w-md text-6xl font-black leading-tight">
              Gestão pedagógica inteligente
            </h2>

            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">
              Plataforma moderna para acompanhamento
              completo de alunos, frequência,
              desempenho e evolução pedagógica.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-lg font-semibold">
              Acompanhe indicadores em tempo real
            </p>

            <div className="mt-6 flex gap-6">
              <div>
                <p className="text-4xl font-black text-violet-300">
                  96%
                </p>

                <span className="text-sm text-slate-400">
                  Frequência média
                </span>
              </div>

              <div>
                <p className="text-4xl font-black text-violet-300">
                  8.7
                </p>

                <span className="text-sm text-slate-400">
                  Média geral
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-8 md:p-14">
          <div className="w-full max-w-xl">
            <div className="text-center">
              <h2 className="text-5xl font-black">
                Entrar no{" "}
                <span className="text-violet-400">
                  Melia EDU
                </span>
              </h2>

              <p className="mt-4 text-lg text-slate-400">
                Acesse sua conta para continuar
              </p>
            </div>

            {error && (
              <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
                {error}
              </div>
            )}

            <div className="mt-10 space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  E-mail
                </label>

                <div className="flex h-16 items-center gap-4 rounded-2xl border border-white/10 bg-[#0B1739] px-5 transition focus-within:border-violet-400">
                  <Mail className="text-slate-400" />

                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    className="w-full bg-transparent text-lg outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  Senha
                </label>

                <div className="flex h-16 items-center gap-4 rounded-2xl border border-white/10 bg-[#0B1739] px-5 transition focus-within:border-violet-400">
                  <Lock className="text-slate-400" />

                  <input
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    className="w-full bg-transparent text-lg outline-none placeholder:text-slate-500"
                  />

                  <Eye className="text-slate-500" />
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex h-16 w-full items-center justify-center rounded-2xl bg-violet-500 text-lg font-bold transition hover:bg-violet-400 disabled:opacity-50"
              >
                {loading
                  ? "Entrando..."
                  : "Entrar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}