import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Navigation, Check, Camera, FileText, PenTool, AlertCircle, Loader2 } from "lucide-react";
import { StatusBadge, PrioridadeBadge, CategoriaLabel } from "@/components/StatusBadge";
import PhotoUploader from "@/components/PhotoUploader";
import SignatureCanvas from "@/components/SignatureCanvas";
import { distanciaMetros, formatDate } from "@/lib/chamadoUtils";

export default function ChamadoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chamado, setChamado] = useState(null);
  const [escola, setEscola] = useState(null);
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");

  // formulário de encerramento
  const [encForm, setEncForm] = useState({
    foto_antes_url: null,
    foto_depois_url: null,
    causa_raiz: "",
    relatorio_servico: "",
    nome_recebedor: "",
    cargo_recebedor: "",
    assinatura_url: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const c = await base44.entities.Chamado.get(id);
        setChamado(c);
        const esc = await base44.entities.Escola.get(c.escola_id);
        setEscola(esc);
        const logs = await base44.entities.AtendimentoLog.filter({ chamado_id: id }, "-data_checkin", 10);
        if (logs.length) setLog(logs[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const refresh = async () => {
    const c = await base44.entities.Chamado.get(id);
    setChamado(c);
    const logs = await base44.entities.AtendimentoLog.filter({ chamado_id: id }, "-data_checkin", 10);
    if (logs.length) setLog(logs[0]);
  };

  const isTecnico = user?.perfil === "tecnico" || user?.perfil === "tecnico_lider";
  const isMeu = chamado?.tecnico_id === user?.id;

  const assumir = async () => {
    setActionLoading(true);
    try {
      await base44.entities.Chamado.update(id, { tecnico_id: user.id, status: "atribuido" });
      await refresh();
    } catch (e) { alert("Erro ao assumir"); }
    setActionLoading(false);
  };

  const aCaminho = async () => {
    setActionLoading(true);
    try {
      await base44.entities.Chamado.update(id, { status: "a_caminho" });
      await refresh();
    } catch (e) { alert("Erro"); }
    setActionLoading(false);
  };

  const checkin = async () => {
    setGpsStatus("Obtendo localização...");
    if (!navigator.geolocation) { setGpsStatus("GPS indisponível neste dispositivo"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = distanciaMetros(latitude, longitude, escola.latitude, escola.longitude);
        if (dist > 200) {
          setGpsStatus(`Você está a ${Math.round(dist)}m da escola. É preciso estar a até 200m para o check-in.`);
          return;
        }
        setActionLoading(true);
        try {
          const novoLog = await base44.entities.AtendimentoLog.create({
            chamado_id: id,
            tecnico_id: user.id,
            data_checkin: new Date().toISOString(),
            lat_checkin: latitude,
            long_checkin: longitude,
          });
          setLog(novoLog);
          await base44.entities.Chamado.update(id, { status: "em_atendimento" });
          await refresh();
          setGpsStatus("Check-in realizado!");
        } catch (e) {
          setGpsStatus("Erro no check-in");
        }
        setActionLoading(false);
      },
      (err) => setGpsStatus("Não foi possível obter o GPS: " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const canEncerrar = () =>
    encForm.foto_depois_url &&
    encForm.causa_raiz &&
    encForm.relatorio_servico &&
    encForm.assinatura_url &&
    encForm.nome_recebedor;

  const encerrar = async () => {
    if (!canEncerrar()) return;
    setActionLoading(true);
    try {
      await base44.entities.AtendimentoLog.update(log.id, {
        foto_antes_url: encForm.foto_antes_url,
        foto_depois_url: encForm.foto_depois_url,
        causa_raiz: encForm.causa_raiz,
        relatorio_servico: encForm.relatorio_servico,
        nome_recebedor: encForm.nome_recebedor,
        cargo_recebedor: encForm.cargo_recebedor,
        assinatura_url: encForm.assinatura_url,
        data_checkout: new Date().toISOString(),
      });
      await base44.entities.Chamado.update(id, { status: "concluido", data_conclusao: new Date().toISOString() });
      await refresh();
    } catch (e) { alert("Erro ao encerrar: " + (e.message || "")); }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!chamado) return <div className="p-6">Chamado não encontrado.</div>;

  const status = chamado.status;
  const mapsUrl = escola ? `https://www.google.com/maps/dir/?api=1&destination=${escola.latitude},${escola.longitude}` : "#";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900">{escola?.nome}</h1>
            <p className="text-xs text-slate-500">{escola?.bairro} · {escola?.endereco}</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Resumo */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CategoriaLabel categoria={chamado.categoria} />
            </div>
            <PrioridadeBadge prioridade={chamado.prioridade} />
          </div>
          {chamado.local_especifico && <InfoRow label="Local" value={chamado.local_especifico} />}
          {chamado.quantidade_estimada && <InfoRow label="Quantidade" value={chamado.quantidade_estimada} />}
          {chamado.tipo_falta_energia && <InfoRow label="Tipo de falta" value={chamado.tipo_falta_energia} className="capitalize" />}
          <InfoRow label="Afeta cozinha/bomba" value={chamado.afeta_cozinha_bomba ? "Sim" : "Não"} />
          {chamado.descricao && <InfoRow label="Descrição" value={chamado.descricao} />}
          <InfoRow label="Aberto em" value={formatDate(chamado.data_abertura)} />
          {chamado.data_conclusao && <InfoRow label="Concluído em" value={formatDate(chamado.data_conclusao)} />}
        </div>

        {/* Linha do tempo de status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Timeline status={status} />
        </div>

        {/* Ações do técnico */}
        {isTecnico && (
          <div className="space-y-3">
            {status === "aberto" && (
              <Button className="w-full" size="lg" onClick={assumir} disabled={actionLoading}>
                {actionLoading ? "Assumindo..." : "Assumir Chamado"}
              </Button>
            )}

            {status === "atribuido" && isMeu && (
              <>
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    <Navigation className="w-4 h-4 mr-2" /> Abrir no Google Maps / Waze
                  </Button>
                </a>
                <Button className="w-full" size="lg" onClick={aCaminho} disabled={actionLoading}>
                  {actionLoading ? "Iniciando..." : "Iniciar Deslocamento (A Caminho)"}
                </Button>
              </>
            )}

            {status === "a_caminho" && isMeu && (
              <>
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    <Navigation className="w-4 h-4 mr-2" /> Abrir no Google Maps / Waze
                  </Button>
                </a>
                <Button className="w-full" size="lg" onClick={checkin} disabled={actionLoading}>
                  <MapPin className="w-4 h-4 mr-2" /> Fazer Check-in na Escola
                </Button>
                {gpsStatus && (
                  <p className={`text-sm text-center ${gpsStatus.includes("Check-in") ? "text-emerald-600" : "text-amber-600"}`}>
                    {gpsStatus}
                  </p>
                )}
              </>
            )}

            {status === "em_atendimento" && isMeu && log && (
              <EncerramentoForm form={encForm} setForm={setEncForm} onSubmit={encerrar} canSubmit={canEncerrar()} loading={actionLoading} />
            )}

            {status === "concluido" && log && (
              <RelatorioFinal log={log} />
            )}
          </div>
        )}

        {!isTecnico && status !== "concluido" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            {status === "aberto" && "Seu chamado está na fila aguardando um técnico assumir."}
            {status === "atribuido" && "Um técnico assumiu seu chamado e iniciará o deslocamento em breve."}
            {status === "a_caminho" && "O técnico está a caminho da escola."}
            {status === "em_atendimento" && "O técnico está realizando o atendimento no local."}
          </div>
        )}
      </main>
    </div>
  );
}

function InfoRow({ label, value, className }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`text-slate-900 font-medium text-right ${className || ""}`}>{value}</span>
    </div>
  );
}

const STEPS = [
  { key: "aberto", label: "Aberto" },
  { key: "atribuido", label: "Atribuído" },
  { key: "a_caminho", label: "A Caminho" },
  { key: "em_atendimento", label: "Em Atendimento" },
  { key: "concluido", label: "Concluído" },
];

function Timeline({ status }) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              i <= idx ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
            }`}>
              {i < idx ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 ${i <= idx ? "text-slate-700 font-medium" : "text-slate-400"}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < idx ? "bg-slate-900" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function EncerramentoForm({ form, setForm, onSubmit, canSubmit, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-5">
      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
        <FileText className="w-5 h-5" /> Encerramento do Atendimento
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <PhotoUploader label="Foto do Antes" value={form.foto_antes_url} onChange={(v) => setForm({ ...form, foto_antes_url: v })} />
        <PhotoUploader label="Foto do Depois *" value={form.foto_depois_url} onChange={(v) => setForm({ ...form, foto_depois_url: v })} required />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Causa raiz do problema *</label>
        <textarea
          value={form.causa_raiz}
          onChange={(e) => setForm({ ...form, causa_raiz: e.target.value })}
          rows={2}
          placeholder="Ex: Curto no disjuntor por sobrecarga..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Serviço realizado *</label>
        <textarea
          value={form.relatorio_servico}
          onChange={(e) => setForm({ ...form, relatorio_servico: e.target.value })}
          rows={3}
          placeholder="Ex: Substituído disjuntor e refeita a ligação..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Nome do servidor *</label>
          <input
            value={form.nome_recebedor}
            onChange={(e) => setForm({ ...form, nome_recebedor: e.target.value })}
            placeholder="Quem acompanhou"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cargo</label>
          <input
            value={form.cargo_recebedor}
            onChange={(e) => setForm({ ...form, cargo_recebedor: e.target.value })}
            placeholder="Ex: Diretor"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1">
          <PenTool className="w-4 h-4" /> Assinatura do servidor *
        </label>
        <SignatureCanvas onChange={(v) => setForm({ ...form, assinatura_url: v })} />
      </div>

      <Button className="w-full" size="lg" disabled={!canSubmit || loading} onClick={onSubmit}>
        {loading ? "Encerrando..." : "Encerrar e Salvar Chamado"} <Check className="w-4 h-4 ml-1" />
      </Button>
      {!canSubmit && (
        <p className="text-xs text-slate-400 text-center">Preencha todos os campos obrigatórios (*) para encerrar.</p>
      )}
    </div>
  );
}

function RelatorioFinal({ log }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
        <Check className="w-5 h-5 text-emerald-600" /> Relatório de Atendimento
      </h2>
      <InfoRow label="Check-in" value={formatDate(log.data_checkin)} />
      <InfoRow label="Check-out" value={formatDate(log.data_checkout)} />
      {log.causa_raiz && <InfoRow label="Causa raiz" value={log.causa_raiz} />}
      {log.relatorio_servico && <InfoRow label="Serviço realizado" value={log.relatorio_servico} />}
      {log.nome_recebedor && <InfoRow label="Recebedor" value={`${log.nome_recebedor}${log.cargo_recebedor ? " (" + log.cargo_recebedor + ")" : ""}`} />}
    </div>
  );
}