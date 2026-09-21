/**
 * Tus datos personales. Casi todo lo que quieras cambiar del portafolio
 * está en esta carpeta (`src/datos/`), no en los componentes.
 *
 * Lo marcado con [pendiente] es lo que falta por confirmar.
 */
import type { Par } from "../idioma/idioma";

export interface Enlace {
  etiqueta: Par;
  url: string;
}

export const perfil = {
  nombre: "Johan Camilo Balanta Santacruz",
  nombreCorto: "Johan Balanta",
  rol: { es: "Ingeniero de software", en: "Software engineer" },
  // Igual en los dos idiomas.
  ubicacion: "Cali, Colombia",

  titular: {
    es: "Construyo sistemas que no dejan pasar el error.",
    en: "I build systems that do not let errors through.",
  },
  titularEnfasis: { es: "no dejan pasar", en: "do not let" },

  tesis: {
    es: "Backend en Python, interfaces en React y una obsesión concreta: que el dato quede validado en el momento en que se captura, no auditado tres semanas después.",
    en: "Back end in Python, interfaces in React and one specific obsession: that data is validated the moment it is captured, not audited three weeks later.",
  },
  // La parte en cursiva del párrafo anterior. Debe existir tal cual dentro de `tesis`.
  tesisEnfasis: {
    es: "validado en el momento en que se captura",
    en: "validated the moment it is captured",
  },

  correo: "camilobalanta1@gmail.com",

  invitacion: {
    titulo: {
      es: "¿Tienes un sistema que no puede equivocarse?",
      en: "Have you got a system that cannot get it wrong?",
    },
    texto: {
      es: "Estoy abierto a prácticas, trabajo por contrato y proyectos donde la corrección del dato importe de verdad. Escríbeme y te respondo el mismo día.",
      en: "I am open to internships, contract work and projects where getting the data right actually matters. Write to me and I reply the same day.",
    },
  },

  enlaces: [
    { etiqueta: { es: "GitHub [pendiente]", en: "GitHub [pending]" }, url: "#" },
    { etiqueta: { es: "LinkedIn [pendiente]", en: "LinkedIn [pending]" }, url: "#" },
    {
      etiqueta: { es: "Hoja de vida PDF [pendiente]", en: "Résumé PDF [pending]" },
      url: "#",
    },
  ] satisfies Enlace[],

  actualizado: { es: "sep 2026", en: "Sep 2026" },
} as const;
