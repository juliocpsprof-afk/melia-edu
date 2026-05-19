export function Navbar() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15">
            <span className="text-xl font-black text-violet-400">
              M
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              Melia <span className="text-violet-400">EDU</span>
            </h1>

            <p className="text-xs text-slate-400">
              Plataforma pedagógica inteligente
            </p>
          </div>
        </div>

        <nav className="hidden gap-8 text-sm text-slate-300 md:flex">
          <a href="#" className="transition hover:text-violet-300">
            Recursos
          </a>

          <a href="#" className="transition hover:text-violet-300">
            Plataforma
          </a>

          <a href="#" className="transition hover:text-violet-300">
            Sobre
          </a>
        </nav>
      </div>
    </header>
  );
}