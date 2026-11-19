/* Música de fondo: único JavaScript del proyecto. Sin librerías externas. */
(function () {
  'use strict';
  // Paso 1: buscar los elementos de la página
  var audio = document.getElementById('musica');
  if (!audio) return;
  var btn = document.getElementById('btn-musica');
  var entrada = document.getElementById('entrada');
  var esSalon = document.body.getAttribute('data-pagina') === 'salon';
  var aviso = document.getElementById('aviso-musica');
  audio.volume = 0.5;

  // Paso 2: leer/guardar en sessionStorage (con protección ante errores)
  function leer(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  var silenciada = leer('musMute') === '1'; // true si la persona la silenció a mano
  var entrado = leer('entrado') === '1';    // true si ya apretó "Entrar"
  var listo = false;                        // true cuando ya se retomó el segundo guardado

  // Paso 3: retomar la música desde el segundo guardado
  function restaurar() {
    var t = parseFloat(leer('musT'));
    if (!isNaN(t) && audio.duration) { audio.currentTime = t % audio.duration; }
    listo = true;
  }
  if (audio.readyState >= 1) { restaurar(); }
  else { audio.addEventListener('loadedmetadata', restaurar, { once: true }); }

  // Paso 4: texto del botón según el estado
  function etiqueta() {
    if (!btn) return;
    var t = audio.paused ? 'Activar música' : 'Silenciar música';
    btn.textContent = t;
    btn.setAttribute('aria-label', t);
    if (!audio.paused) btn.classList.remove('btn-musica--aviso');
    if (aviso && !audio.paused) aviso.style.display = 'none';
  }
  audio.addEventListener('play', etiqueta);
  audio.addEventListener('pause', etiqueta);

  // Paso 5: reproducir; si el navegador lo rechaza, esperar el primer clic
  var armado = false;
  function primerClic(e) {
    if (btn && btn.contains(e.target)) return;
    document.removeEventListener('click', primerClic);
    if (!silenciada && !esSalon && audio.paused) { audio.play().catch(function () {}); }
  }
  function reproducir() {
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function () {
        etiqueta();
        if (btn) btn.classList.add('btn-musica--aviso');
        if (!armado) { armado = true; document.addEventListener('click', primerClic); }
      });
    }
  }

  // Paso 6: pantalla de entrada (solo existe en index.html)
  if (entrada) {
    if (entrado) {
      entrada.remove();
    } else {
      entrada.querySelector('a').addEventListener('click', function (e) {
        e.preventDefault();
        guardar('entrado', '1'); guardar('musMute', '0'); silenciada = false;
        entrada.classList.add('oculta');
        reproducir();
        setTimeout(function () { entrada.remove(); }, 1000);
      });
    }
  }

  // Paso 7: arranque según la página
  if (esSalon) { audio.pause(); } // en salon.html la música se pausa sola
  else if (!silenciada && (!entrada || entrado)) { reproducir(); }
  etiqueta();

  // Paso 8: botón de pausa/reanudación (recuerda la elección de la persona)
  if (btn) {
    btn.addEventListener('click', function () {
      if (audio.paused) { guardar('musMute', '0'); silenciada = false; reproducir(); }
      else { audio.pause(); guardar('musMute', '1'); silenciada = true; }
    });
  }

  // Paso 9: guardar el segundo actual al salir de la página
  function guardarTiempo() { if (listo) guardar('musT', String(audio.currentTime)); }
  window.addEventListener('pagehide', guardarTiempo);
  document.addEventListener('visibilitychange', guardarTiempo);
})();
