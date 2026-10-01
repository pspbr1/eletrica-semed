import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Wrench, Zap, MoreHorizontal, ArrowLeft, ArrowRight, Check, Camera } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import { calcularPrioridade } from "@/lib/chamadoUtils";
import { PrioridadeBadge } from "@/components/StatusBadge";

const CATEGORIAS = [
  { value: "pequenos_reparos", label: "Pequenos Reparos", icon: Wrench, desc: "Substituições e reparos menores" },
  { value: "falta_energia", label: "Falta de Energia", icon: Zap, desc: "Total ou parcial no prédio" },
  { value: "outros", label: "Outros", icon: MoreHorizontal, desc: "Outras demandas elétricas" },
];

const LOCAIS = ["Sala de aula", "Cozinha", "Refeitório", "Banheiro", "Sala de professores", "Diretoria", "Secretaria", "Quadra", "Biblioteca", "Laboratório", "Corredor", "Pátio", "Outro"];

export default function NewChamado() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [escola, setEscola] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    categoria: "",
    local_especifico: "",
    quantidade_estimada: "",
    afeta_cozinha_bomba: false,
    tipo_falta_energia: "",
    descricao: "",
    foto_abertura_url: null,
  });

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      setUser(me);
      if (me.escola_id) {
        const esc = await base44.entities.Escola.get(me.escola_id);
        setEscola(esc);
      }
    })();
  }, []);

  const prioridade = calcularPrioridade(form);

  const canSubmit = () => {
    if (!form.categoria) return false;
    if (form.categoria === "pequenos_reparos") return !!form.local_especifico;
    if (form.categoria === "falta_energia") return !!form.tipo_falta_energia;
    if (form.categoria === "outros") return !!form.descricao;
    return false;
  };

  const submit = async () => {
    if (!canSubmit() || !escola) return;
    setSaving(true);
    try {
      await base44.entities.Chamado.create({
        escola_id: escola.id,
        solicitante_id: user.id,
        categoria: form.categoria,
        local_especifico: form.local_especifico || null,
        quantidade_estimada: form.quantidade_estimada || null,
        afeta_cozinha_bomba: form.afeta_cozinha_bomba,
        tipo_falta_energia: form.tipo_falta_energia || null,
        descricao: form.descricao || null,
        foto_abertura_url: form.foto_abertura_url || null,
        prioridade,
        status: "aberto",
        data_abertura: new Date().toISOString(),
      });
      navigate("/");
    } catch (e) {
      alert("Erro ao abrir chamado: " + (e.message || "tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900">Novo Chamado</h1>
            <p className="text-xs text-slate-500">{escola?.nome || ""}</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? "bg-slate-900" : "bg-slate-200"}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Qual o tipo de problema?</h2>
            <p className="text-sm text-slate-500 mb-4">Selecione a categoria do chamado</p>
            {CATEGORIAS.map((cat) => {
              const Icon = cat.icon;
              const selected = form.categoria === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setForm({ ...form, categoria: cat.value })}
                  className={`w-full text-left rounded-2xl border-2 p-5 flex items-center gap-4 transition-all ${
                    selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{cat.label}</p>
                    <p className="text-xs text-slate-500">{cat.desc}</p>
                  </div>
                  {selected && <Check className="w-5 h-5 text-slate-900" />}
                </button>
              );
            })}
            <Button
              className="w-full mt-6"
              size="lg"
              disabled={!form.categoria}
              onClick={() => setStep(2)}
            >
              Continuar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Detalhes do problema</h2>

            {form.categoria === "pequenos_reparos" && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Local específico *</label>
                  <select
                    value={form.local_especifico}
                    onChange={(e) => setForm({ ...form, local_especifico: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Selecione...</option>
                    {LOCAIS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Quantidade estimada</label>
                  <input
                    value={form.quantidade_estimada}
                    onChange={(e) => setForm({ ...form, quantidade_estimada: e.target.value })}
                    placeholder="Ex: 4 lâmpadas"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <PhotoUploader label="Foto (opcional)" value={form.foto_abertura_url} onChange={(v) => setForm({ ...form, foto_abertura_url: v })} />
              </>
            )}

            {form.categoria === "falta_energia" && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tipo de falta de energia *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["parcial", "total"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, tipo_falta_energia: t })}
                        className={`rounded-xl border-2 p-4 text-center transition-all capitalize ${form.tipo_falta_energia === t ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}
                      >
                        <span className="font-semibold text-slate-900">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border-2 border-slate-200 p-4 bg-white">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Afeta cozinha ou bomba d'água?</p>
                    <p className="text-xs text-slate-500">Interrompe alimentação/abastecimento</p>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, afeta_cozinha_bomba: !form.afeta_cozinha_bomba })}
                    className={`relative w-12 h-7 rounded-full transition-colors ${form.afeta_cozinha_bomba ? "bg-slate-900" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${form.afeta_cozinha_bomba ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <PhotoUploader label="Foto (opcional)" value={form.foto_abertura_url} onChange={(v) => setForm({ ...form, foto_abertura_url: v })} />
              </>
            )}

            {form.categoria === "outros" && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Descrição *</label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    rows={4}
                    placeholder="Descreva o problema elétrico..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <PhotoUploader label="Foto *" value={form.foto_abertura_url} onChange={(v) => setForm({ ...form, foto_abertura_url: v })} required />
              </>
            )}

            <div className="rounded-xl bg-slate-100 p-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">Prioridade calculada</span>
              <PrioridadeBadge prioridade={prioridade} />
            </div>

            <Button className="w-full" size="lg" disabled={!canSubmit()} onClick={() => setStep(3)}>
              Revisar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Confirmar e enviar</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <Row label="Categoria" value={CATEGORIAS.find((c) => c.value === form.categoria)?.label} />
              {form.local_especifico && <Row label="Local" value={form.local_especifico} />}
              {form.quantidade_estimada && <Row label="Quantidade" value={form.quantidade_estimada} />}
              {form.tipo_falta_energia && <Row label="Tipo de falta" value={form.tipo_falta_energia} className="capitalize" />}
              <Row label="Afeta cozinha/bomba" value={form.afeta_cozinha_bomba ? "Sim" : "Não"} />
              {form.descricao && <Row label="Descrição" value={form.descricao} />}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-sm text-slate-600">Prioridade</span>
                <PrioridadeBadge prioridade={prioridade} />
              </div>
            </div>
            <Button className="w-full" size="lg" disabled={saving} onClick={submit}>
              {saving ? "Enviando..." : "Confirmar e Enviar"} <Check className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, className }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-medium text-slate-900 text-right ${className || ""}`}>{value}</span>
    </div>
  );
}