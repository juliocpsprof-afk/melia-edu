import { MessagesPanel } from "../../../components/MessagesPanel";

export default function MensagensPage() {
  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Mensagens</h1>
        <p className="mt-1 text-slate-400">
          Acompanhe e responda mensagens enviadas pelos alunos.
        </p>
      </header>

      <section className="p-6">
        <MessagesPanel />
      </section>
    </>
  );
}