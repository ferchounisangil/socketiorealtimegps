var menu = `<nav class="navbar navbar-expand-lg navbar-light bg-primary">
		<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
			<span class="navbar-toggler-icon"></span>
		</button>

		<div class="collapse navbar-collapse" id="navbarSupportedContent">
			<ul class="navbar-nav mr-auto">
				<li class="nav-item active">
					<a class="nav-link" href="monitor.html" target="iframe_a">Home <span class="sr-only">(current)</span></a>
				</li>

				<li class="nav-item active">
					<a class="nav-link" href="asociacion.html">Relacion<span class="sr-only">(current)</span></a>
				</li>

				<li class="nav-item dropdown">
					<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						Informes
					</a>
					<div class="dropdown-menu" aria-labelledby="navbarDropdown">
						<a class="dropdown-item" href="informe control.html" target="iframe_a">Geocercas</a>
						<a class="dropdown-item" href="informesRutas.html" target="iframe_a">Rutas</a>
						<a class="dropdown-item" href="informesVehiculos.html" target="iframe_a">Vehiculos</a>
						<div class="dropdown-divider"></div>
						<a class="dropdown-item" onclick=mensaje()>Acerca de</a>
					</div>
				</li>
			</ul>
		</div>
	</nav>`;
	function mensaje () {

		alert("Aplicación desarrollada por Luis Fernando Rodriguez Leon \npara obtener el título de ingeniero de sistemas UNISANGIL");
	}