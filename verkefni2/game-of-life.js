
		
	var isUserInteracting = false, pause = false,
	onMouseDownMouseX = 0, onMouseDownMouseY = 0,
	lon = 45, onMouseDownLon = 0,
	lat = 45, onMouseDownLat = 0,
	phi = 0, theta = 0;
	var d = 140;
	
	var container;
	var camera, scene, renderer,
	geometry, material, mesh, cubes = [];
	var light, light2;
	
	if(!Detector.webgl){
		Detector.addGetWebGLMessage();
	} else {	
		window.addEventListener( 'load', init, false );
	}
	
	TWEEN.start();
	
	var fov = 75;
	var side = 10;
	var size = 10;
	var cells = [];
	var tweens = [];
	var timeout;
	var screenSaverTimeout;
	var screenSaverEnabled = false;
	
	var title = document.getElementById( 'title' );
			
	function init() {
	
		var links = document.querySelectorAll( 'a[rel=external]' );
		for( var j = 0; j < links.length; j++ ) {
			var a = links[ j ];
			a.addEventListener( 'click', function( e ) {
				window.open( this.href, '_blank' );
				e.preventDefault();
			}, false );
		}
		
		var el = document.getElementById( 'toggleScreensaver' );
		el.addEventListener( 'click', function( e ) {
			e.preventDefault();
			if( screenSaverEnabled ) {
				screenSaverTimeout = clearTimeout( screenSaverTimeout );
				el.innerHTML = 'Go to screen saver mode';
				screenSaverEnabled = false;
				title.style.opacity = 1;
			} else {
				el.innerHTML = 'Stop screen saver mode';
				screenSaverEnabled = true;
				d = 32;
				title.style.opacity = 0;
			}
		}, false );
		
		container = document.getElementById( 'container' );
		
        scene = new THREE.Scene();
		
		camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.z = 1000;
		camera.target = new THREE.Vector3( 0, 0, 0 );
		scene.add( camera );
		
        geometry = new THREE.CubeGeometry( size, size, size );
		
		for( var z = 0; z < side; z++ ) {
			for( var y = 0; y < side; y++ ) {
				for( var x = 0; x < side; x++ ) {
					var mesh = new THREE.Mesh( 
						geometry, 
						new THREE.MeshLambertMaterial( { 
							color: ( z * 255 / side ) * 256 * 256 + ( y * 255 / side ) * 256 + ( x * 255 / side ), 
							transparent: true 
						} )
					);
					mesh.castShadow = true;
					mesh.receiveShadow = true;
					mesh.position.x = ( x - .5 * side ) * size;
					mesh.position.y = ( y - .5 * side ) * size;
					mesh.position.z = ( z - .5 * side ) * size;
					var conwayStatus = ( Math.random() < .1 );
					mesh.conway = conwayStatus?1:0;
					scene.add( mesh );
					cubes.push( mesh );
					cells.push( { status: conwayStatus } );
					tweens.push( new TWEEN.Tween( mesh ).easing( TWEEN.Easing.Quadratic.EaseOut ) );
				}
			}
		}
		
		var mesh = new THREE.Mesh( new THREE.SphereGeometry( 1000, 40, 40 ), new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
		mesh.flipSided = true;
		//mesh.receiveShadow = true;
		scene.addObject( mesh );
		
		light = new THREE.SpotLight( 0xff170f, 1 );//Math.random() * 0xffffff, 2 );
		light.position.set( 0, 500, 2000 );
		light.castShadow = true;
		scene.add( light );
		
		light2 = new THREE.SpotLight( 0xffcf0f, 1 );//Math.random() * 0xffffff, 2 );
		light2.position.set( 0, -400, -1800 );
		light2.castShadow = true;
		scene.add( light2 );
		
        renderer = new THREE.WebGLRenderer( {antialias: true });
		renderer.sortObjects = true;
        renderer.setSize( window.innerWidth, window.innerHeight );
		//renderer.setClearColor( 0, 1 );
		
		renderer.shadowCameraFov = camera.fov;
		renderer.shadowMapBias = 0.0039;
		renderer.shadowMapDarkness = 0.5;
		renderer.shadowMapWidth = renderer.shadowMapHeight = 2048;

		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
		
        container.appendChild( renderer.domElement );
		
		window.addEventListener( 'keydown', onWindowKeyDown, false );
		window.addEventListener( 'resize', onWindowResize, false );
		
		container.addEventListener( 'mousedown', onDocumentMouseDown, false );
		container.addEventListener( 'mousemove', onDocumentMouseMove, false );
		container.addEventListener( 'mouseup', onDocumentMouseUp, false );
		container.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
		container.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);
				
		onWindowResize();
		
		animate();
		next();
		
	}
	
	function onWindowResize( event ) {
		if( renderer ) {
			renderer.setSize( window.innerWidth, window.innerHeight );
			camera.projectionMatrix = THREE.Matrix4.makePerspective( fov, window.innerWidth / window.innerHeight, 1, 3000 );
		}
	}
		
	function onWindowKeyDown( event ) {
		switch( event.keyCode ) {
			case 32: {
				pause = !pause;
				if( !pause ) next();
				else timeout = clearTimeout( timeout );
				break;
			}
		}
	}
	
	function onDocumentMouseDown( event ) {

		event.preventDefault();

		isUserInteracting = true;
		var el = document.querySelectorAll( '.hide' );
		for( var j = 0; j < el.length; j++ ) {
			el[ j ].style.opacity = 0;
			el[ j ].style.pointerEvents = 'none';
		}
		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;

		onPointerDownLon = lon;
		onPointerDownLat = lat;

	}

	function onDocumentMouseMove( event ) {

		if( screenSaverEnabled ) {
			title.style.opacity = 1;
			screenSaverTimeout = clearTimeout( screenSaverTimeout );
			screenSaverTimeout = setTimeout( function() { title.style.opacity = 0; }, 2000 );
		}
		
		if ( isUserInteracting ) {

			lon = ( event.clientX - onPointerDownPointerX ) * 0.1 + onPointerDownLon;
			lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;

		}
	}

	function onDocumentMouseUp( event ) {

		var el = document.querySelectorAll( '.hide' );
		for( var j = 0; j < el.length; j++ ) {
			el[ j ].style.opacity = 1;
			el[ j ].style.pointerEvents = 'auto';
		}
		
		isUserInteracting = false;

	}

	function onDocumentMouseWheel( event ) {

		// WebKit

		if ( event.wheelDeltaY ) {

			d -= .1 * event.wheelDeltaY;

		// Opera / Explorer 9

		} else if ( event.wheelDelta ) {

			d -= .1 * event.wheelDelta;

		// Firefox

		} else if ( event.detail ) {

			d += event.detail;

		}

		render();
	}
	
	function animate() {

		requestAnimationFrame( animate );
		render();
		
	}
	
	function evaluateCell( current ) {
	
		var status = cells[ current ].status;
		var count = 0;
		for( var z = -1; z <=1; z++ ) {
			for( var y = -1; y <=1; y++ ) {
				for( var x = -1; x <=1; x++ ) {
					var p = current + z * side * side + y * side + x;
					if( cells[ p ] && cells[ p ].status ) {
						count++;
					}
					
				}
			}
		}
		
		if( count > 4 ) return false; 
		if( count < 3 ) return false;
		if( count == 4 ) return true;
		return status;
	}
	
	function next() {
	
		if( pause ) {
			return;
		}
		
		var nextGen = [];
		
		var p = 0;
		for( var z = 0; z < side; z++ ) {
			for( var y = 0; y < side; y++ ) {
				for( var x = 0; x < side; x++ ) {
					nextGen[ p ] = { status: evaluateCell( p ) };
					p++;
				}
			}
		}
		
		cells = nextGen;
		
		for( var p = 0, m = cells.length; p < m; p++ ) {
			tweens[ p ].to( { conway: cells[ p ].status?1:0 }, 1000 ).start();
		}
		
		timeout = setTimeout( next, 3000 );
		
	}
	
	
	function render() {
		
		if( !pause ) {
			for( var p = 0, m = cells.length; p < m; p++ ) {
				cubes[ p ].material.opacity = cubes[ p ].conway;
				cubes[ p ].rotation.y = Math.PI * cubes[ p ].conway;
				var s = cubes[ p ].conway;
				if( s < .001 ) s = .001;
				cubes[ p ].scale.set( s, s, s );
			}
		}
		if( !isUserInteracting ) lon += .1;
		
		lat = Math.max( - 85, Math.min( 85, lat ) );
		phi = ( 90 - lat ) * Math.PI / 180;
		theta = lon * Math.PI / 180;

		camera.position.x = d * Math.sin( phi ) * Math.cos( theta );
		camera.position.y = d * Math.cos( phi );
		camera.position.z = d * Math.sin( phi ) * Math.sin( theta );
		camera.lookAt( camera.target );
		
		if( !pause ) {
			var dt = new Date();
			var dl = 400;
			var t = .0003 * dt.getTime();
			light.position.set( camera.position.x, camera.position.y + 50, camera.position.z );//dl * Math.sin( t ), dl * Math.cos( t ), dl * Math.cos( t ) * Math.sin( t ) ); 
			var t = .00025 * dt.getTime();
			light2.position.set( dl * Math.sin( t ) * Math.cos( t ), dl * Math.sin( t ), dl * Math.cos( t ) ); 
		}
		renderer.render( scene, camera );
	}
	
