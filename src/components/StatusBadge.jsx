import React from "react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  aberto: { label: "Aberto", className: "bg-slate-100 text-slate-700 border-slate-300" },
  atribuido: { label: "Atribuído", className: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  a_caminho: { label: "A Caminho", className: "bg-blue-100 text-blue-700 border-blue-300" },
  em_atendimento: { label: "Em Atendimento", className: "bg-amber-100 text-amber-700 border-amber-300" },
  concluido: { label: "Concluído", className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  cancelado: { label: "Cancelado", className: "bg-rose-100 text-rose-700 border-rose-300" },
};

const PRIORIDADE_CONFIG = {
  normal: { label: "Normal", className: "bg-slate-100 text-slate-600" },
  alta: { label: "Alta", className: "bg-orange-100 text-orange-700" },
  emergencia: { label: "Emergência", className: "bg-red-600 text-white animate-pulse" },
};

const CATEGORIA_CONFIG = {
  pequenos_reparos: "Pequenos Reparos",
  falta_energia: "Falta de Energia",
  outros: "Outros",
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.aberto;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", cfg.className)}>
      {cfg.label}
    </span>
  );
}

export function PrioridadeBadge({ prioridade }) {
  const cfg = PRIORIDADE_CONFIG[prioridade] || PRIORIDADE_CONFIG.normal;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", cfg.className)}>
      {cfg.label}
    </span>
  );
}

export function CategoriaLabel({ categoria }) {
  return <span>{CATEGORIA_CONFIG[categoria] || categoria}</span>;
}

export { STATUS_CONFIG, PRIORIDADE_CONFIG, CATEGORIA_CONFIG };