import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, MapPin, Clock, Search, ClipboardList, History } from "lucide-react";
import { StatusBadge, PrioridadeBadge, CategoriaLabel } from "@/components/StatusBadge";
import { tempoEspera } from "@/lib/chamadoUtils";

export default function Home() {
  const [user, setUser] = useState(null);
  const [escola, setEscola] = useState(null);
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me.perfil === "escola" && me.escola_id) {
          const esc = await base44.entities.Escola.get(me.escola_id);
          setEscola(esc);
          const lista = await base44.entities.Chamado.filter({ escola_id: me.escola_id }, "-data_abertura", 50);
          setChamados(lista);
        } else {
          // tecnico: carrega chamados abertos/atribuídos para o painel
          const abertos = await base44.entities.Chamado.filter({ status: "aberto" }, "-data_abertura", 50);
          const meus = await base44.entities.Chamado.filter({ tecnico_id: me.id }, "-data_abertura", 50);
          setChamados([...meus, ...abertos.filter((c) => c.tecnico_id !== me.id)]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isEscola = user.perfil === "escola";
  const isTecnico = user.perfil === "tecnico" || user.perfil === "tecnico_lider";

  if (isEscola) return <EscolaHome user={user} escola={escola} chamados={chamados} />;
  if (isTecnico) return <TecnicoHome user={user} chamados={chamados} />;

  return (
    <div className="p-6">
      <p className="text-slate-600">Seu perfil ainda não foi configurado. Contate o administrador.</p>
    </div>
  );
}

function EscolaHome({ user, escola, chamados }) {
  const emAndamento = chamados.filter((c) => !["concluido", "cancelado"].includes(c.status));
  const historico = chamados.filter((c) => ["concluido", "cancelado"].includes(c.status));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{escola?.nome || "Escola"}</h1>
            <p className="text-xs text-slate-500">{escola?.bairro} {escola?.endereco ? `· ${escola.endereco}` : ""}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
            {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Link to="/novo-chamado">
          <button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-lg transition-all active:scale-[0.98]">
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center">
              <Plus className="w-7 h-7" />
            </div>
            <span className="text-lg font-semibold">Abrir Novo Chamado</span>
            <span className="text-sm text-white/70">Solicite manutenção elétrica</span>
          </button>
        </Link>

        {emAndamento.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">Em Andamento</h2>
            <div className="space-y-3">
              {emAndamento.map((c) => (
                <Link key={c.id} to={`/chamado/${c.id}`}>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-slate-400" />
                        <CategoriaLabel categoria={c.categoria} />
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.local_especifico && <p className="text-sm text-slate-600">{c.local_especifico}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <PrioridadeBadge prioridade={c.prioridade} />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {tempoEspera(c.data_abertura)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">Histórico</h2>
          {historico.length === 0 ? (
            <p className="text-sm text-slate-400 px-1">Nenhum chamado concluído ainda.</p>
          ) : (
            <div className="space-y-2">
              {historico.map((c) => (
                <Link key={c.id} to={`/chamado/${c.id}`}>
                  <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2">
                      <CategoriaLabel categoria={c.categoria} />
                      <span className="text-xs text-slate-400">{tempoEspera(c.data_abertura)}</span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function TecnicoHome({ user, chamados }) {
  const meus = chamados.filter((c) => c.tecnico_id === user.id && !["concluido", "cancelado"].includes(c.status));
  const fila = chamados.filter((c) => c.status === "aberto");

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Olá, {user.full_name?.split(" ")[0] || "Técnico"}</h1>
            <p className="text-xs text-slate-500">{user.perfil === "tecnico_lider" ? "Técnico-Líder" : "Técnico de Campo"}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
            {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/fila">
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-slate-900 text-sm">Fila Geral</span>
              <span className="text-xs text-slate-500">{fila.length} disponíveis</span>
            </div>
          </Link>
          <Link to="/prontuario">
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
              <Search className="w-6 h-6 text-emerald-600" />
              <span className="font-semibold text-slate-900 text-sm">Prontuário</span>
              <span className="text-xs text-slate-500">Histórico por escola</span>
            </div>
          </Link>
        </div>

        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">Minhas OS</h2>
          {meus.length === 0 ? (
            <p className="text-sm text-slate-400 px-1">Nenhum chamado atribuído a você.</p>
          ) : (
            <div className="space-y-3">
              {meus.map((c) => (
                <Link key={c.id} to={`/chamado/${c.id}`}>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-slate-400" />
                        <CategoriaLabel categoria={c.categoria} />
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.local_especifico && <p className="text-sm text-slate-600">{c.local_especifico}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <PrioridadeBadge prioridade={c.prioridade} />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {tempoEspera(c.data_abertura)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}