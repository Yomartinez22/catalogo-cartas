/* ==========================================================================
   CAPA DE DATOS — la prueba de que la carta obedece al panel
   ==========================================================================
   Lee estado-demo.json (que en producción es Postgres editado desde el panel
   de Adianta) y lo aplica sobre los elementos [data-plato]:
     - precio nuevo  → se pinta sin tocar el HTML
     - disponible=false → el plato queda tachado con su chip "agotado hoy"
   Es el MISMO patrón que ya usa app-carta en producción (disponibilidad.ts):
   carta estática + parche de estado en runtime. El diseño es la piel; el
   dato manda desde el panel.
   Sobre file:// el fetch falla y la carta se queda tal cual: la demo degrada.
   ========================================================================== */
(function () {
	'use strict';

	fetch('estado-demo.json')
		.then(function (r) { return r.json(); })
		.then(function (d) {
			var platos = (d && d.platos) || {};
			Object.keys(platos).forEach(function (id) {
				var el = document.querySelector('[data-plato="' + id + '"]');
				if (!el) return;
				var est = platos[id];

				if (est.precio) {
					var p = el.querySelector('.precio');
					if (p) p.textContent = est.precio;
				}

				if (est.disponible === false) {
					el.classList.add('agotado');
					var n = el.querySelector('.nombre');
					if (n && !n.querySelector('.agotado-chip')) {
						var chip = document.createElement('span');
						chip.className = 'marca-fuego agotado-chip';
						chip.textContent = est.nota || 'agotado hoy';
						n.appendChild(chip);
					}
				}
			});
		})
		.catch(function () { /* sin servidor: la carta estática sigue entera */ });
})();
