/* ==========================================================================
   CAPA DE CONSULTA — motor (compartido por los 10 registros)
   ==========================================================================
   Va con _consulta.css. Cuatro responsabilidades y nada más:

     1. Filtros que funcionan: [data-filtro-grupo] con botones data-valor,
        items [data-item] con data-<grupo>="token token". Varios grupos se
        combinan en Y (bodega: uva Y zona). Un contenedor [data-filtrable]
        que se queda sin items visibles recibe .filtro-vacio.
     2. Nav de secciones [data-nav]: salto suave + estado activo (scrollspy).
        data-scroll="selector" cuando el scroll no es del documento (GALERÍA).
     3. La lupa: tocar una img[data-amplia] la abre a pantalla completa sobre
        su propio --tono. Intenta la variante -560 y cae a la original si no.
     4. La ficha de plato (2026-08-07): tocar un plato lo amplía a ficha
        completa (foto + nombre + descripción + precio), calco de la de
        producción. Contenedor = '.plato' o el selector que declare
        <body data-fichas="...">. Los datos y las fuentes salen del propio
        plato tocado; los colores, del body — camaleón sin config. Donde hay
        ficha, la foto abre la ficha (la lupa queda para fotos sueltas).

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

	// En captura: varias fotos viven dentro de un <button> de plato. Si el plato
	// tiene ficha, la foto abre LA FICHA (ahí ya se ve grande); si no, la lupa.
	document.addEventListener('click', function (e) {
		var img = e.target.closest ? e.target.closest('img[data-amplia]') : null;
		if (!img) return;
		var cont = selectorFicha ? img.closest(selectorFicha) : null;
		e.preventDefault();
		e.stopPropagation();
		if (cont && !velo) { abreFicha(cont); return; }
		if (velo) cierraLupa(); else abreLupa(img);
	}, true);

	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Escape') return;
		if (velo) { cierraLupa(); return; }
		cierraFicha();
	});

	/* ---------- 4. la ficha de plato ---------- */
	var ficha = null;
	var fichaFocoPrevio = null;
	var selectorFicha = '';

	// Solo los nodos de TEXTO directos: el nombre de BRASA lleva dentro spans
	// de marca ("al fuego") que van a los chips, no al título.
	function textoPropio(el) {
		var t = '';
		for (var i = 0; i < el.childNodes.length; i++) {
			if (el.childNodes[i].nodeType === 3) t += el.childNodes[i].nodeValue;
		}
		t = t.replace(/\s+/g, ' ').trim();
		return t || el.textContent.replace(/\s+/g, ' ').trim();
	}

	// NEÓN escribe los ingredientes como spans pegados: unirlos con separador.
	function textoLista(el) {
		var spans = el.querySelectorAll('span');
		if (spans.length > 1) {
			var partes = [];
			for (var i = 0; i < spans.length; i++) {
				var t = spans[i].textContent.replace(/\s+/g, ' ').trim();
				if (t) partes.push(t);
			}
			return partes.join(' · ');
		}
		return el.textContent.replace(/\s+/g, ' ').trim();
	}

	function cierraFicha() {
		if (!ficha) return;
		var v = ficha;
		ficha = null;
		document.documentElement.classList.remove('ficha-abierta');
		var fin = function () {
			v.remove();
			if (fichaFocoPrevio && fichaFocoPrevio.focus) fichaFocoPrevio.focus();
			fichaFocoPrevio = null;
		};
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) { fin(); return; }
		v.classList.add('cerrando');
		setTimeout(fin, 210);
	}

	function abreFicha(cont) {
		if (ficha || velo) return;
		var busca = function (sel) { return cont.querySelector(sel); };
		var elNombre = busca('.nombre') || busca('.n');
		if (!elNombre) return;
		var elDesc = busca('.desc') || busca('.d') || busca('.ingredientes');
		var elPrecio = busca('.precio') || busca('.p');
		var elSub = busca('.racion') || busca('.unidad');
		var elMarida = busca('.maridaje');
		var img = busca('img[data-amplia]') || busca('img');

		ficha = document.createElement('div');
		ficha.className = 'ficha-velo';

		var lamina = document.createElement('article');
		lamina.className = 'f-lamina';
		lamina.setAttribute('role', 'dialog');
		lamina.setAttribute('aria-modal', 'true');
		lamina.setAttribute('aria-label', textoPropio(elNombre));

		// Camaleón: colores del body, tipografías del propio plato. Cero config.
		var cb = getComputedStyle(document.body);
		var fondo = cb.backgroundColor;
		if (!fondo || fondo === 'rgba(0, 0, 0, 0)' || fondo === 'transparent') {
			fondo = getComputedStyle(document.documentElement).backgroundColor;
		}
		if (fondo && fondo !== 'rgba(0, 0, 0, 0)' && fondo !== 'transparent') {
			lamina.style.setProperty('--f-fondo', fondo);
		}
		lamina.style.setProperty('--f-tinta', cb.color);

		var x = document.createElement('button');
		x.className = 'f-x';
		x.type = 'button';
		x.setAttribute('aria-label', 'Cerrar');
		x.textContent = '×';
		x.addEventListener('click', cierraFicha);
		lamina.appendChild(x);

		if (img) {
			var media = document.createElement('div');
			media.className = 'f-media';
			var tono = (getComputedStyle(img).getPropertyValue('--tono') || '').trim();
			if (tono) media.style.setProperty('--tono', tono);
			var im = document.createElement('img');
			im.alt = '';
			var src = img.currentSrc || img.src;
			var grande = src.replace('-360.webp', '-560.webp');
			im.onerror = function () { if (im.src !== src) im.src = src; };
			im.src = grande;
			media.appendChild(im);
			var scrim = document.createElement('div');
			scrim.className = 'f-scrim';
			media.appendChild(scrim);
			lamina.appendChild(media);
		} else {
			lamina.className += ' sin-foto';
		}

		var cuerpo = document.createElement('div');
		cuerpo.className = 'f-cuerpo';

		var seccion = cont.closest('section, .seccion');
		var elTitSec = seccion ? seccion.querySelector('h2, h3') : null;
		if (elTitSec) {
			var eyebrow = document.createElement('p');
			eyebrow.className = 'f-eyebrow';
			eyebrow.textContent = textoPropio(elTitSec);
			cuerpo.appendChild(eyebrow);
		}

		var cab = document.createElement('div');
		cab.className = 'f-cab';
		var h = document.createElement('h3');
		h.className = 'f-nombre';
		h.textContent = textoPropio(elNombre);
		h.style.fontFamily = getComputedStyle(elNombre).fontFamily;
		cab.appendChild(h);
		if (elPrecio) {
			var precio = document.createElement('span');
			precio.className = 'f-precio';
			precio.textContent = textoPropio(elPrecio);
			var cp = getComputedStyle(elPrecio);
			precio.style.fontFamily = cp.fontFamily;
			lamina.style.setProperty('--f-acento', cp.color);
			cab.appendChild(precio);
		}
		cuerpo.appendChild(cab);

		if (elSub) {
			var sub = document.createElement('p');
			sub.className = 'f-sub';
			sub.textContent = textoPropio(elSub);
			cuerpo.appendChild(sub);
		}

		if (elDesc) {
			var desc = document.createElement('p');
			desc.className = 'f-desc';
			desc.textContent = textoLista(elDesc);
			desc.style.fontFamily = getComputedStyle(elDesc).fontFamily;
			cuerpo.appendChild(desc);
		}

		if (elMarida) {
			var marida = document.createElement('p');
			marida.className = 'f-marida';
			marida.textContent = textoPropio(elMarida);
			cuerpo.appendChild(marida);
		}

		// Chips: las marcas del nombre + etiquetas/sellos/marcas del plato.
		var fuentes = elNombre.querySelectorAll('span');
		var extra = cont.querySelectorAll('.etiquetas span, .sellos span, .pie .marca');
		var vistos = {};
		var chips = document.createElement('div');
		chips.className = 'f-chips';
		var mete = function (nodo) {
			var t = textoPropio(nodo);
			if (!t || vistos[t]) return;
			vistos[t] = true;
			var s = document.createElement('span');
			s.textContent = t;
			chips.appendChild(s);
		};
		for (var i = 0; i < fuentes.length; i++) mete(fuentes[i]);
		for (var j = 0; j < extra.length; j++) mete(extra[j]);
		if (chips.childNodes.length) cuerpo.appendChild(chips);

		lamina.appendChild(cuerpo);
		ficha.appendChild(lamina);
		ficha.addEventListener('click', function (e) {
			if (e.target === ficha) cierraFicha();
		});
		document.body.appendChild(ficha);
		document.documentElement.classList.add('ficha-abierta');
		fichaFocoPrevio = cont;
		x.focus();
	}

	function cableaFicha() {
		var sel = document.body.getAttribute('data-fichas') || '.plato';
		var conts = document.querySelectorAll(sel);
		if (!conts.length) return; // GALERÍA y BODEGA quedan fuera a propósito
		selectorFicha = sel;
		for (var i = 0; i < conts.length; i++) {
			var c = conts[i];
			c.setAttribute('data-ficha-lista', '');
			if (c.tagName !== 'BUTTON' && c.tagName !== 'A') {
				if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
				c.setAttribute('role', 'button');
			}
		}
		document.addEventListener('click', function (e) {
			if (ficha || velo) return;
			var c = e.target.closest ? e.target.closest(selectorFicha) : null;
			if (!c) return;
			if (e.target.closest('a')) return; // un enlace dentro del plato gana
			abreFicha(c);
		});
		document.addEventListener('keydown', function (e) {
			if (e.key !== 'Enter' && e.key !== ' ') return;
			if (ficha || velo) return;
			var c = e.target.closest ? e.target.closest(selectorFicha) : null;
			if (!c || c.tagName === 'BUTTON' || c.tagName === 'A') return;
			e.preventDefault();
			abreFicha(c);
		});
	}

	/* ---------- arranque ---------- */
	function arranca() { cableaFiltros(); cableaNav(); cableaFicha(); }
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', arranca);
	} else {
		arranca();
	}
})();
