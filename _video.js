/* ==========================================================================
   CAPA DE VÍDEO — el plato en movimiento (compartida)
   ==========================================================================
   Decisión Yago 2026-07-28: la carta puede llevar vídeo. La disciplina que lo
   mantiene premium en vez de feria:

     - Vídeo SOLO en el héroe (la pieza del día, un pase): un autoplay por
       pantalla. Cuarenta vídeos a la vez es una tómbola y funde la batería.
     - SIEMPRE muted + playsinline + loop, con la FOTO real como poster: si el
       vídeo no llega, la carta es exactamente la de antes.
     - Se reproduce solo cuando está en pantalla (IO) y se pausa al salir.
     - prefers-reduced-motion o ahorro de datos (Save-Data): NO hay autoplay —
       queda el poster y los controles nativos, y decide el comensal.
   ========================================================================== */
(function () {
	'use strict';

	var vids = document.querySelectorAll('video[data-video]');
	if (!vids.length) return;

	var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
	var ahorro = false;
	try { ahorro = !!(navigator.connection && navigator.connection.saveData); } catch (e) { /* sin API */ }

	if (quieto || ahorro) {
		for (var i = 0; i < vids.length; i++) {
			vids[i].setAttribute('controls', '');
			vids[i].preload = 'none';
		}
		return;
	}

	function reproduce(v) {
		var p = v.play();
		// si el navegador bloquea el autoplay, se enseñan los controles y listo:
		// nunca un rectángulo muerto que parece una foto rota
		if (p && p.catch) p.catch(function () { v.setAttribute('controls', ''); });
	}

	if (!('IntersectionObserver' in window)) {
		for (var j = 0; j < vids.length; j++) reproduce(vids[j]);
		return;
	}

	var obs = new IntersectionObserver(function (es) {
		for (var k = 0; k < es.length; k++) {
			var v = es[k].target;
			if (es[k].isIntersecting) reproduce(v);
			else v.pause();
		}
	}, { threshold: 0.25 });

	for (var m = 0; m < vids.length; m++) obs.observe(vids[m]);
})();
