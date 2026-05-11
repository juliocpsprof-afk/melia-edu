export function Navbar() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Melia EDU</h1>
        </div>

        <nav className="hidden gap-8 text-sm text-slate-300 md:flex">
          <a href="#" className="transition hover:text-white">
            Recursos
          </a>

          <a href="#" className="transition hover:text-white">
            Plataforma
          </a>

          <a href="#" className="transition hover:text-white">
            Sobre
          </a>
        </nav>

        <button className="rounded-xl bg-violet-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-400">
          Entrar
        </button>
      </div>
    </header>
  );
}