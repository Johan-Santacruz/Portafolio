/**
 * Tus datos personales. Casi todo lo que quieras cambiar del portafolio
 * está en esta carpeta (`src/datos/`), no en los componentes.
 *
 * Lo marcado con [pendiente] es lo que falta por confirmar.
 */

export interface Enlace {
  etiqueta: string;
  url: string;
}

export const perfil = {
  nombre: "Johan Camilo Balanta Santacruz",
  nombreCorto: "Johan Balanta",
  rol: "Ingeniero de software",
  ubicacion: "Cali, Colombia",

  titular: "Construyo sistemas que no dejan pasar el error.",
  titularEnfasis: "no dejan pasar",

  tesis:
    "Backend en Python, interfaces en React y una obsesión concreta: que el dato quede validado en el momento en que se captura, no auditado tres semanas después.",
  // La parte en cursiva del párrafo anterior. Debe existir tal cual dentro de `tesis`.
  tesisEnfasis: "validado en el momento en que se captura",

  correo: "camilobalanta1@gmail.com",

  invitacion: {
    titulo: "¿Tienes un sistema que no puede equivocarse?",
    texto:
      "Estoy abierto a prácticas, trabajo por contrato y proyectos donde la corrección del dato importe de verdad. Escríbeme y te respondo el mismo día.",
  },

  enlaces: [
    { etiqueta: "GitHub [pendiente]", url: "#" },
    { etiqueta: "LinkedIn [pendiente]", url: "#" },
    { etiqueta: "Hoja de vida PDF [pendiente]", url: "#" },
  ] satisfies Enlace[],

  actualizado: "sep 2026",
} as const;
