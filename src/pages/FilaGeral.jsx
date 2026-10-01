import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Wrench, Clock, MapPin, AlertTriangle, Filter } from "lucide-react";
import { PrioridadeBadge, CategoriaLabel } from "@/components/StatusBadge";
import { tempoEspera } from "@/lib/chamadoUtils";

export default function FilaGeral() {
  const [chamados, setChamados] = useState([]);
  const [escolas, setEscolas] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtroBairro, setFiltroBairro] = useState("");
  const [soEmergencias, setSoEmergencias] = useState(false);
  const [user, setUser] = useState(null);
  const [assumindo, setAssumindo] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const lista = await base44.entities.Chamado.filter({ status: "aberto" }, "-data_abertura", 100);
        setChamados(lista);
        const escIds = [...new Set(lista.map((c) => c.escola_id))];
        const escs = await Promise.all(escIds.map((id) => base44.entities.Escola.get(id).catch(() => null)));
        const map = {};
        escs.forEach((e) => { if (e) map[e.id] = e; });
        setEscolas(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const assumir = async (chamado) => {
    setAssumindo(chamado.id);
    try {
      await base44.entities.Chamado.update(chamado.id, { tecnico_id: user.id, status: "atribuido" });
      window.location.href = `/chamado/${chamado.id}`;
    } catch (e) {
      alert("Erro ao assumir chamado");
    } finally {
      setAssumindo(null);
    }
  };

  const bairros = [...new Set(Object.values(escolas).map((e) => e.bairro).filter(Boolean))];

  const filtrados = chamados.filter((c) => {
    const esc = escolas[c.escola_id];
    if (filtroBairro && esc?.bairro !== filtroBairro) return false;
    if (soEmergencias && c.prioridade !== "emergencia") return false;
    return true;
  });

  // ordena por prioridade (emergencia > alta > normal) e depois por tempo
  const ordemPrioridade = { emergencia: 0, alta: 1, normal: 2 };
  filtrados.sort((a, b) => ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">Fila Geral de Chamados</h1>
          <p className="text-xs text-slate-500">{filtrados.length} chamados disponíveis</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <select
            value={filtroBairro}
            onChange={(e) => setFiltroBairro(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Todos os bairros</option>
            {bairros.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <button
            onClick={() => setSoEmergencias(!soEmergencias)}
            className={`px-3 rounded-lg border text-sm font-medium flex items-center gap-1.5 transition-colors ${
              soEmergencias ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Emerg.
          </button>
        </div>

        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Filter className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum chamado disponível com esses filtros.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((c) => {
              const esc = escolas[c.escola_id];
              return (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{esc?.nome || "Escola"}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {esc?.bairro}
                      </p>
                    </div>
                    <PrioridadeBadge prioridade={c.prioridade} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <Wrench className="w-4 h-4 text-slate-400" />
                    <CategoriaLabel categoria={c.categoria} />
                    {c.local_especifico && <span className="text-slate-400">· {c.local_especifico}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {tempoEspera(c.data_abertura)}
                    </span>
                    <button
                      onClick={() => assumir(c)}
                      disabled={assumindo === c.id}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {assumindo === c.id ? "Assumindo..." : "Assumir Chamado"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}