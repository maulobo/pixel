import type { UnidadConModelo } from "../types";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export function buildUnitWhatsAppUrl(unidad: UnidadConModelo, whatsapp: string) {
  const capacidad = unidad.atributos.capacidad ?? "";
  const color = unidad.atributos.color ?? "";
  const parts = [unidad.modelo.nombre, capacidad, color].filter(Boolean).join(" ");
  const msg = `Hola! Me interesa el ${parts} (ref: ${unidad.unidad_id}). ¿Está disponible?`;
  return `https://wa.me/${whatsapp}?text=${encodeMessage(msg)}`;
}

export function buildCartWhatsAppUrl(
  items: UnidadConModelo[],
  whatsapp: string,
  note?: string,
) {
  const lines = items.map((unidad, index) => {
    const attrs = Object.entries(unidad.atributos)
      .filter(([, v]) => v)
      .map(([, v]) => v);
    const parts = [
      `${index + 1}. ${unidad.modelo.nombre}`,
      ...attrs,
      `ref: ${unidad.unidad_id}`,
      `$${unidad.modelo.precio.toLocaleString("es-AR")}`,
    ].filter(Boolean);

    return `- ${parts.join(" · ")}`;
  });

  const total = items.reduce((sum, item) => sum + item.modelo.precio, 0);
  const sections = [
    "Hola! Quiero consultar por estos productos:",
    "",
    ...lines,
    "",
    `Total estimado: $${total.toLocaleString("es-AR")}`,
  ];

  if (note?.trim()) {
    sections.push("", `Comentario: ${note.trim()}`);
  }

  sections.push("", "Quedo atento a disponibilidad y formas de coordinacion.");

  return `https://wa.me/${whatsapp}?text=${encodeMessage(sections.join("\n"))}`;
}
