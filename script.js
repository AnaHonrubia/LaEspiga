/* ==========================================================
   La Espiga · JavaScript
   1. Menú del móvil
   2. Filtros de la carta
   3. "Abierto ahora" y hornadas según la hora real
   4. Validación del formulario de encargos
   ========================================================== */

/* ---------- 1. MENÚ DEL MÓVIL ---------- */
const botonMenu = document.querySelector('.boton-menu');
const menu = document.querySelector('#menu');

botonMenu.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierto');
  botonMenu.setAttribute('aria-expanded', abierto);
  botonMenu.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});

// Al pulsar un enlace, cerramos el menú
menu.querySelectorAll('a').forEach((enlace) => {
  enlace.addEventListener('click', () => {
    menu.classList.remove('abierto');
    botonMenu.setAttribute('aria-expanded', 'false');
  });
});


/* ---------- 2. FILTROS DE LA CARTA ---------- */
const filtros = document.querySelectorAll('.filtro');
const platos = document.querySelectorAll('.plato');

filtros.forEach((filtro) => {
  filtro.addEventListener('click', () => {
    const categoria = filtro.dataset.categoria; // lee data-categoria del botón

    // Marcamos solo el botón pulsado
    filtros.forEach((f) => f.setAttribute('aria-pressed', f === filtro));

    // Ocultamos los platos que no son de esa categoría
    platos.forEach((plato) => {
      plato.hidden = categoria !== 'todo' && plato.dataset.categoria !== categoria;
    });
  });
});


/* ---------- 3. ¿ABIERTO AHORA? ---------- */
// Todo en minutos desde medianoche (7:30 = 7*60+30 = 450).
// Clave = día de la semana como lo da getDay(): 0 domingo, 1 lunes … 6 sábado.
const HORARIO = {
  0: [],
  1: [[450, 840], [1020, 1230]],
  2: [[450, 840], [1020, 1230]],
  3: [[450, 840], [1020, 1230]],
  4: [[450, 840], [1020, 1230]],
  5: [[450, 840], [1020, 1230]],
  6: [[480, 840]],
};

// Hornadas de cada día (6:00, 12:00 y 17:30 entre semana)
const HORNADAS = {
  0: [],
  1: [360, 720, 1050],
  2: [360, 720, 1050],
  3: [360, 720, 1050],
  4: [360, 720, 1050],
  5: [360, 720, 1050],
  6: [360, 720],
};

const NOMBRES_DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// 450 -> "7:30"
function aHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// Busca la próxima vez que abrimos, mirando hoy y los 6 días siguientes
function proximaApertura(dia, minutoActual) {
  for (let i = 0; i < 7; i++) {
    const d = (dia + i) % 7;
    for (const [apertura] of HORARIO[d]) {
      if (i > 0 || apertura > minutoActual) {
        const cuando = i === 0 ? 'hoy' : i === 1 ? 'mañana' : `el ${NOMBRES_DIAS[d]}`;
        return `Abrimos ${cuando} a las ${aHora(apertura)}`;
      }
    }
  }
  return '';
}

function actualizarEstado() {
  const ahora = new Date();
  const dia = ahora.getDay();
  const minuto = ahora.getHours() * 60 + ahora.getMinutes();

  const estado = document.querySelector('#estado');
  const detalle = document.querySelector('#estado-detalle');

  // ¿Estamos dentro de algún tramo de hoy?
  const tramo = HORARIO[dia].find(([abre, cierra]) => minuto >= abre && minuto < cierra);

  if (tramo) {
    estado.textContent = 'Abierto ahora';
    estado.className = 'estado estado--abierto';
    detalle.textContent = `Cerramos a las ${aHora(tramo[1])}`;
  } else {
    estado.textContent = 'Cerrado ahora';
    estado.className = 'estado estado--cerrado';
    detalle.textContent = proximaApertura(dia, minuto);
  }

  // Hornadas: tachamos las que ya han salido y resaltamos la siguiente
  const hornadasHoy = HORNADAS[dia];
  const siguiente = hornadasHoy.find((h) => h > minuto);

  document.querySelectorAll('.hornada').forEach((el) => {
    const min = Number(el.dataset.min);
    el.classList.toggle('no-hoy', !hornadasHoy.includes(min));
    el.classList.toggle('pasada', hornadasHoy.includes(min) && min <= minuto);
    el.classList.toggle('siguiente', min === siguiente);
  });

  // Resaltamos la fila de hoy en la tabla de horario
  document.querySelectorAll('.horario tr').forEach((fila) => {
    const dias = fila.dataset.dias.split(',').map(Number);
    fila.classList.toggle('hoy', dias.includes(dia));
  });
}

actualizarEstado();
setInterval(actualizarEstado, 60 * 1000); // se actualiza cada minuto


/* ---------- 4. FORMULARIO DE ENCARGOS ---------- */
const formulario = document.querySelector('#formulario');
const campoFecha = document.querySelector('#fecha');
const aviso = document.querySelector('#aviso-envio');

// No se puede elegir un día pasado. 'sv-SE' da la fecha en formato AAAA-MM-DD
campoFecha.min = new Date().toLocaleDateString('sv-SE');

// Cada regla: [id del campo, función que comprueba el valor, mensaje de error]
const reglas = [
  ['nombre', (v) => v.trim().length >= 2, 'Escribe tu nombre.'],
  ['telefono', (v) => /^[6789]\d{8}$/.test(v.replace(/\s/g, '')), 'Pon un teléfono español de 9 cifras.'],
  ['fecha', (v) => v !== '', 'Elige el día de recogida.'],
  ['mensaje', (v) => v.trim().length >= 10, 'Cuéntanos un poco más (mínimo 10 caracteres).'],
];

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault(); // evita que la página se recargue

  let todoBien = true;

  reglas.forEach(([id, esValido, mensaje]) => {
    const input = formulario.elements[id];
    const campo = input.closest('.campo');
    const error = campo.querySelector('.error');

    if (esValido(input.value)) {
      campo.classList.remove('invalido');
      error.textContent = '';
    } else {
      campo.classList.add('invalido');
      error.textContent = mensaje;
      todoBien = false;
    }
  });

  if (!todoBien) {
    aviso.hidden = true;
    // Llevamos el cursor al primer campo con error
    formulario.querySelector('.invalido input, .invalido textarea').focus();
    return;
  }

  const nombre = formulario.elements.nombre.value.trim();
  aviso.textContent = `Gracias, ${nombre}. Esta web es una demo, así que el encargo no se ha enviado a ningún sitio.`;
  aviso.hidden = false;
  formulario.reset();
});
