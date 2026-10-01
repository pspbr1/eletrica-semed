import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Search, MapPin, Wrench, Clock } from "lucide-react";
import { StatusBadge, CategoriaLabel } from "@/components/StatusBadge";
import { formatDate } from "@/lib/chamadoUtils";

export default function Prontuario() {
  const [busca, setBusca] = useState("");
  const [escolas, setEscolas] = useState([]);
  const [escolaSel, setEscolaSel] = useState(null);
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.entities.Escola.list("-created_date", 200).then(setEscolas).catch(() => {});
  }, []);

  const selecionar = async (esc) => {
    setEscolaSel(esc);
    setLoading(true);
    try {
      const lista = await base44.entities.Chamado.filter({ escola_id: esc.id }, "-data_abertura", 100);
      setChamados(lista);
    } catch (e) { setChamados([]); }
    setLoading(false);
  };

  const filtradas = escolas.filter((e) =>
    !busca || e.nome?.toLowerCase().includes(busca.toLowerCase()) || e.bairro?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">Prontuário Escolar</h1>
          <p className="text-xs text-slate-500">Histórico de manutenções por escola</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {!escolaSel && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar escola por nome ou bairro..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-2">
              {filtradas.map((e) => (
                <button key={e.id} onClick={() => selecionar(e)} className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{e.nome}</p>
                    <p className="text-xs text-slate-500">{e.bairro}</p>
                  </div>
                </button>
              ))}
              {filtradas.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Nenhuma escola encontrada.</p>}
            </div>
          </>
        )}

        {escolaSel && (
          <>
            <button onClick={() => { setEscolaSel(null); setChamados([]); }} className="text-sm text-slate-600 hover:text-slate-900">
              ← Voltar à lista
            </button>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-bold text-slate-900">{escolaSel.nome}</h2>
              <p className="text-sm text-slate-500">{escolaSel.bairro} · {escolaSel.endereco}</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
            ) : chamados.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Nenhum chamado registrado para esta escola.</p>
            ) : (
              <div className="space-y-2">
                {chamados.map((c) => (
                  <Link key={c.id} to={`/chamado/${c.id}`}>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-slate-400" />
                          <CategoriaLabel categoria={c.categoria} />
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.local_especifico && <p className="text-sm text-slate-600">{c.local_especifico}</p>}
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                        <Clock className="w-3 h-3" /> {formatDate(c.data_abertura)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}