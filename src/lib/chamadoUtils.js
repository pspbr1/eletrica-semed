// Cálculo de prioridade automática conforme regras de negócio
export function calcularPrioridade({ categoria, tipo_falta_energia, afeta_cozinha_bomba }) {
  if (categoria === "falta_energia") {
    if (tipo_falta_energia === "total" || afeta_cozinha_bomba) return "emergencia";
    if (tipo_falta_energia === "parcial") return "alta";
  }
  return "normal";
}

export function tempoEspera(dataAbertura) {
  if (!dataAbertura) return "—";
  const agora = new Date();
  const abertura = new Date(dataAbertura);
  const diffMs = agora - abertura;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ${min % 60}min`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Distância em metros entre duas coordenadas (Haversine)
export function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}