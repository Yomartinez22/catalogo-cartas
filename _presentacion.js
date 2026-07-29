/* ==========================================================================
   CAPA DE PRESENTACIÓN — motor del revelado (compartido por los 10 registros)
   ==========================================================================
   Va con _presentacion.css. Aquí sólo hay tres responsabilidades:

     1. Marcar <html class="js-rev"> ANTES de pintar, para que el CSS pueda
        esconder las fotos. Sin esta marca el CSS las deja visibles: si este
        script no llega a ejecutarse, la carta se ve igual. La animación es un
        adorno; que se vea la comida, no.
     2. Revelar cada foto cuando entra en pantalla, en cascada.
     3. Soltar will-change cuando la transición termina.

   Sin dependencias y sin configuración: el registro ajusta el carácter con sus
   variables CSS (--rev-dur, --rev-desp, --rev-escala, --rev-escalon).
   ========================================================================== */
(function () {
	'use strict';

	var raiz = document.documentElement;
	raiz.classList.add('js-rev');

	function revelaTodo(nodos) {
		for (var i = 0; i < nodos.length; i++) nodos[i].classList.add('visto', 'asentado');
	}

	function arranca() {
		// .rev = fotos; [data-entra] = cualquier elemento con firma de entrada
		// propia (etiquetas de MERCADO, chapas de RÓTULO, líneas de SUIZO...).
		// Mismo mecanismo, misma cascada: el registro decide QUÉ hace .visto.
		var cajas = document.querySelectorAll('.rev, [data-entra]');
		if (!cajas.length) return;

		// Cascada: el escalón se asigna por posición DENTRO de su grupo, no en
		// todo el documento. Si no, la foto nº 30 heredaría 2 segundos de espera.
		var porPadre = new Map();
		for (var i = 0; i < cajas.length; i++) {
			var caja = cajas[i];
			var padre = caja.parentNode;
			var n = (porPadre.get(padre) || 0);
			caja.setAttribute('data-i', String(Math.min(n, 4)));
			porPadre.set(padre, n + 1);
		}

		// Sin IntersectionObserver (navegador viejo) se revela todo y ya está.
		if (!('IntersectionObserver' in window)) {
			revelaTodo(cajas);
			return;
		}

		var obs = new IntersectionObserver(function (entradas) {
			entradas.forEach(function (e) {
				if (!e.isIntersecting) return;
				var caja = e.target;
				caja.classList.add('visto');
				obs.unobserve(caja);
				// soltar la capa de GPU cuando ya no hace falta
				var img = caja.tagName === 'IMG' ? caja : caja.querySelector('img');
				if (img) {
					img.addEventListener('transitionend', function marca(ev) {
						if (ev.propertyName !== 'opacity') return;
						caja.classList.add('asentado');
						img.removeEventListener('transitionend', marca);
					});
				}
			});
		}, {
			// Abajo, -12%: la foto termina de entrar justo cuando el ojo llega.
			// Arriba, 9999px: TODO lo ya rebasado cuenta como visto. Sin esto, un
			// flick fuerte salta el elemento de "debajo" a "encima" sin intersectar
			// nunca y el plato se queda invisible para siempre (cazado midiendo:
			// un scroll de 2200px dejaba 2 de 4 etiquetas de MERCADO en opacity 0).
			rootMargin: '9999px 0px -12% 0px',
			threshold: 0.01
		});

		for (var j = 0; j < cajas.length; j++) obs.observe(cajas[j]);

		// Red de seguridad: una foto que falle al cargar no puede quedarse en
		// opacity 0 para siempre — se revela igual y se ve el tono de fondo.
		document.addEventListener('error', function (e) {
			var t = e.target;
			if (t && t.tagName === 'IMG') {
				var c = t.closest('.rev') || t;
				c.classList.add('visto', 'asentado');
			}
		}, true);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', arranca);
	} else {
		arranca();
	}
})();
