/* cartanos · menú móvil, mapa bajo demanda y formulario de contacto (Web3Forms) */
(function () {
  'use strict';

  /* ---- cabecera: transparente sobre la portada, sólida al bajar ---- */
  var cabecera = document.querySelector('.cabecera');
  if (cabecera) {
    var fondo = function () { cabecera.classList.toggle('con-fondo', window.scrollY > 12); };
    window.addEventListener('scroll', fondo, { passive: true });
    fondo();
  }

  /* ---- menú lateral en móvil ---- */
  var menu = document.getElementById('menu');
  var abrir = document.getElementById('abrirMenu');
  var cerrar = document.getElementById('cerrarMenu');
  var velo = document.getElementById('velo');
  var movil = window.matchMedia('(max-width: 900px)');

  function enfocables() {
    return Array.prototype.filter.call(
      menu.querySelectorAll('a[href], button:not([disabled])'),
      function (el) { return el.offsetParent !== null; }
    );
  }
  function teclado(e) {
    if (e.key === 'Escape') { cerrarMenu(true); return; }
    if (e.key !== 'Tab') return;
    var lista = enfocables();
    if (!lista.length) return;
    var primero = lista[0], ultimo = lista[lista.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }
  function abrirMenu() {
    menu.classList.add('abierto');
    velo.classList.add('visible');
    abrir.setAttribute('aria-expanded', 'true');
    document.body.classList.add('sin-scroll');
    document.addEventListener('keydown', teclado);
    var enlace = menu.querySelector('.menu__lista a');
    if (enlace) { window.setTimeout(function () { enlace.focus(); }, 50); }
  }
  function cerrarMenu(devolverFoco) {
    if (!menu.classList.contains('abierto')) return;
    menu.classList.remove('abierto');
    velo.classList.remove('visible');
    abrir.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('sin-scroll');
    document.removeEventListener('keydown', teclado);
    if (devolverFoco) abrir.focus();
  }
  if (menu && abrir && cerrar && velo) {
    abrir.addEventListener('click', abrirMenu);
    cerrar.addEventListener('click', function () { cerrarMenu(true); });
    velo.addEventListener('click', function () { cerrarMenu(true); });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a') && movil.matches) cerrarMenu(false);
    });
    var alCambiar = function () { if (!movil.matches) cerrarMenu(false); };
    if (movil.addEventListener) movil.addEventListener('change', alCambiar);
    else if (movil.addListener) movil.addListener(alCambiar);
  }

  /* ---- mapa de Google: solo si se pide ---- */
  var botonMapa = document.getElementById('cargarMapa');
  if (botonMapa) {
    botonMapa.addEventListener('click', function () {
      var mapa = document.getElementById('mapa');
      var iframe = document.createElement('iframe');
      iframe.title = 'Mapa de Google con la ubicación de cartanos: calle José Carreras, 9, Dos Hermanas';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      iframe.src = 'https://www.google.com/maps?q=Calle%20Jos%C3%A9%20Carreras%209%2C%2041701%20Dos%20Hermanas%2C%20Sevilla&output=embed';
      mapa.textContent = '';
      mapa.appendChild(iframe);
      mapa.classList.add('cargado');
    });
  }

  /* ---- formulario ---- */
  var form = document.getElementById('formContacto');
  if (form) {
    form.noValidate = true;
    var CLAVE_PENDIENTE = 'PEGA-AQUI-LA-CLAVE-DE-WEB3FORMS';
    var estado = document.getElementById('estadoFormulario');
    var boton = form.querySelector('button[type="submit"]');
    var contacto = 'Escríbenos a <a href="mailto:info@cartanos.es">info@cartanos.es</a> o llama al <a href="tel:+34954726814">954&nbsp;72&nbsp;68&nbsp;14</a>.';

    var mensajeCampo = function (campo) {
      var aviso = document.getElementById(campo.id + '-error');
      if (!aviso) return;
      var texto = '';
      if (campo.validity.valueMissing) {
        texto = campo.type === 'checkbox'
          ? 'Marca la casilla para que podamos responderte.'
          : 'Rellena este campo.';
      } else if (campo.type === 'email' && campo.validity.typeMismatch) {
        texto = 'Escribe un correo válido, por ejemplo nombre@correo.es.';
      }
      aviso.textContent = texto;
      if (texto) campo.setAttribute('aria-invalid', 'true');
      else campo.removeAttribute('aria-invalid');
    };
    var ponerEstado = function (tipo, html) {
      estado.className = 'formulario__estado ' + tipo;
      estado.innerHTML = html;
    };

    Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (campo) {
      campo.addEventListener('blur', function () {
        if (campo.hasAttribute('aria-invalid') || campo.value) mensajeCampo(campo);
      });
      campo.addEventListener('change', function () {
        if (campo.hasAttribute('aria-invalid')) mensajeCampo(campo);
      });
      /* el aviso se quita mientras se corrige, no al salir del campo:
         si desapareciera al pulsar «Enviar», el botón se movería y el clic se perdería */
      campo.addEventListener('input', function () {
        if (campo.hasAttribute('aria-invalid')) mensajeCampo(campo);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ponerEstado('', '');

      var primeroMal = null;
      Array.prototype.forEach.call(form.querySelectorAll('[required], input[type="email"]'), function (campo) {
        mensajeCampo(campo);
        if (!campo.checkValidity() && !primeroMal) primeroMal = campo;
      });
      if (primeroMal) {
        ponerEstado('error', 'Revisa los campos marcados.');
        primeroMal.focus();
        return;
      }

      var clave = form.querySelector('[name="access_key"]').value.trim();
      if (!clave || clave === CLAVE_PENDIENTE) {
        ponerEstado('error', 'El formulario todavía no está activo. ' + contacto);
        return;
      }

      var datos = new FormData(form);
      datos.delete('redirect');
      var textoBoton = boton.textContent;
      boton.disabled = true;
      boton.textContent = 'Enviando…';

      fetch(form.action, { method: 'POST', body: datos, headers: { Accept: 'application/json' } })
        .then(function (r) {
          return r.json().then(function (j) { return { ok: r.ok, json: j }; });
        })
        .then(function (res) {
          if (!res.ok || !res.json || !res.json.success) throw new Error('envio');
          form.reset();
          ponerEstado('ok', 'Mensaje enviado. Te responderemos lo antes posible.');
        })
        .catch(function () {
          ponerEstado('error', 'No se ha podido enviar el mensaje. ' + contacto);
        })
        .then(function () {
          boton.disabled = false;
          boton.textContent = textoBoton;
        });
    });
  }

  /* ---- año del pie ---- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-ano]'), function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
