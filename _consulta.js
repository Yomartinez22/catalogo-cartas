/* ==========================================================================
   CAPA DE CONSULTA — motor (compartido por los 10 registros)
   ==========================================================================
   Va con _consulta.css. Tres responsabilidades y nada más:

     1. Filtros que funcionan: [data-filtro-grupo] con botones data-valor,
        items [data-item] con data-<grupo>="token token". Varios grupos se
        combinan en Y (bodega: uva Y zona). Un contenedor [data-filtrable]
        que se queda sin items visibles recibe .filtro-vacio.
     2. Nav de secciones [data-nav]: salto suave + estado activo (scrollspy).
        data-scroll="selector" cuando el scroll no es del documento (GALERÍA).
     3. La lupa: tocar una img[data-amplia] la abre a pantalla completa sobre
        su propio --tono. Intenta la variante -560 y cae a la original si no.

   Todo es mejora progresiva: sin este script la carta se lee entera igual.
   ========================================================================== */
(function () {
	'use strict';

	/* ---------- 1. filtros ---------- */
	var estado = {};

	function aplicaFiltros() {
		var conts = document.querySelectorAll('[data-filtrable]');
		for (var i = 0; i < conts.length; i++) {
			var vivos = 0;
			var items = conts[i].querySelectorAll('[data-item]');
			for (var j = 0; j < items.length; j++) {
				var it = items[j];
				var visible = true;
				for (var g in estado) {
					var v = estado[g];
					if (!v) continue;
					var tags = (it.getAttribute('data-' + g) || '').split(/\s+/);
					if (tags.indexOf(v) < 0) { visible = false; break; }
				}
				it.classList.toggle('filtro-oculto', !visible);
				if (visible) vivos++;
			}
			conts[i].classList.toggle('filtro-vacio', items.length > 0 && vivos === 0);
			// Los supervivientes RE-ENTRAN en cascada (el registro define la animación
			// de .refiltrado): filtrar no es esconder, es volver a presentar.
			conts[i].classList.remove('refiltrado');
			void conts[i].offsetWidth;
			conts[i].classList.add('refiltrado');
		}
	}

	function cableaFiltros() {
		var grupos = document.querySelectorAll('[data-filtro-grupo]');
		for (var i = 0; i < grupos.length; i++) {
			(function (gr) {
				var g = gr.getAttribute('data-filtro-grupo');
				estado[g] = '';
				gr.addEventListener('click', function (e) {
					var b = e.target.closest('button[data-valor]');
					if (!b) return;
					estado[g] = b.getAttribute('data-valor') || '';
					var bs = gr.querySelectorAll('button[data-valor]');
					for (var k = 0; k < bs.length; k++) {
						bs[k].setAttribute('aria-pressed', bs[k] === b ? 'true' : 'false');
					}
					aplicaFiltros();
				});
			})(grupos[i]);
		}
		if (grupos.length) aplicaFiltros();
	}

	/* ---------- 2. nav de secciones ---------- */
	function cableaNav() {
		var navs = document.querySelectorAll('[data-nav]');
		for (var i = 0; i < navs.length; i++) {
			(function (nav) {
				var enlaces = nav.querySelectorAll('a[href^="#"]');
				if (!enlaces.length) return;
				var rootSel = nav.getAttribute('data-scroll');
				var root = rootSel ? document.querySelector(rootSel) : null;
				var mapa = new Map();

				for (var k = 0; k < enlaces.length; k++) {
					(function (a) {
						var sec = document.getElementById(a.getAttribute('href').slice(1));
						if (sec) mapa.set(sec, a);
						a.addEventListener('click', function (e) {
							var destino = document.getElementById(a.getAttribute('href').slice(1));
							if (!destino) return;
							e.preventDefault();
							var suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
							destino.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
						});
					})(enlaces[k]);
				}

				if (!('IntersectionObserver' in window)) return;
				var obs = new IntersectionObserver(function (es) {
					for (var m = 0; m < es.length; m++) {
						if (!es[m].isIntersecting) continue;
						for (var n = 0; n < enlaces.length; n++) {
							enlaces[n].classList.remove('activo');
							enlaces[n].removeAttribute('aria-current');
						}
						var a = mapa.get(es[m].target);
						if (a) { a.classList.add('activo'); a.setAttribute('aria-current', 'true'); }
					}
				}, { root: root, rootMargin: '-30% 0px -60% 0px' });
				mapa.forEach(function (_a, sec) { obs.observe(sec); });
			})(navs[i]);
		}
	}

	/* ---------- 3. lupa ---------- */
	var velo = null;
	var focoPrevio = null;

	function cierraLupa() {
		if (!velo) return;
		velo.remove();
		velo = null;
		document.documentElement.classList.remove('lupa-abierta');
		if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
		focoPrevio = null;
	}

	function abreLupa(img) {
		var src = img.currentSrc || img.src;
		var grande = src.replace('-360.webp', '-560.webp');
		var tono = (getComputedStyle(img).getPropertyValue('--tono') || '#111').trim();

		velo = document.createElement('div');
		velo.className = 'lupa';
		velo.setAttribute('role', 'dialog');
		velo.setAttribute('aria-label', img.alt || 'Foto del plato');

		var fig = document.createElement('figure');
		var im = document.createElement('img');
		im.alt = img.alt || '';
		im.style.background = tono;
		im.onerror = function () { if (im.src !== src) im.src = src; };
		im.src = grande;
		fig.appendChild(im);
		if (img.alt) {
			var cap = document.createElement('figcaption');
			cap.textContent = img.alt;
			fig.appendChild(cap);
		}

		var x = document.createElement('button');
		x.className = 'lupa-x';
		x.type = 'button';
		x.setAttribute('aria-label', 'Cerrar');
		x.textContent = '×';

		velo.appendChild(fig);
		velo.appendChild(x);
		velo.addEventListener('click', cierraLupa);
		document.body.appendChild(velo);
		document.documentElement.classList.add('lupa-abierta');
		focoPrevio = img.closest('button, a');
		x.focus();
	}

	// En captura: varias fotos viven dentro de un <button> de plato; la foto
	// gana al botón (que en la demo no hace nada más) sin tocar su markup.
	document.addEventListener('click', function (e) {
		var img = e.target.closest ? e.target.closest('img[data-amplia]') : null;
		if (!img) return;
		e.preventDefault();
		e.stopPropagation();
		if (velo) cierraLupa(); else abreLupa(img);
	}, true);

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') cierraLupa();
	});

	/* ---------- arranque ---------- */
	function arranca() { cableaFiltros(); cableaNav(); }
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', arranca);
	} else {
		arranca();
	}
})();
