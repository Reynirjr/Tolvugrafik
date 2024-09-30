"use strict";

var gl;
var points;

var NumPoints = 5000;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.

    var vertices = [
        vec2( -1, -1 ),
        vec2(  0,  1 ),
        vec2(  1, -1 )
    ];

    // Specify a starting point p for our iterations
    // p must lie inside any set of three vertices


    document.getElementById("a").addEventListener("change", uppfaeraPunkta);
    document.getElementById("b").addEventListener("change", uppfaeraPunkta);
    document.getElementById("numPointsSlider").addEventListener("input", updateNumPoints);

    function updateNumPoints() {
        NumPoints = parseInt(document.getElementById("numPointsSlider").value);
        document.getElementById("numPointsValue").textContent = NumPoints;
        uppfaeraPunkta();
    }

    function uppfaeraPunkta(){

    var p;


    if (document.getElementById("a").checked) {
    p = vec2( 100, 100 );
    } else {
        var u = add(vertices[0], vertices[1]);
        var v = add(vertices[0], vertices[2]);
        p = scale(0.25, add(u, v));
    }
    // And, add our initial point into our array of points

    points = [ p ];

    // Compute new points
    // Each new point is located midway between
    // last point and a randomly chosen vertex
    
    if (document.getElementById("b").checked) {
        for (var i = 0; points.length < NumPoints; ++i) {
            var r = Math.random();
            var j;
    
            if (r < 0.9) {
                j = 0; 
            } else if (r < 0.95) {
                j = 1; 
            } else { 
                j = 2; 
            }
    
            p = add(points[i], vertices[j]);
            p = scale(0.5, p);
            points.push(p);
        }

    }else{
    for ( var i = 0; points.length < NumPoints; ++i ) {
        var j = Math.floor(Math.random() * 3);
        p = add( points[i], vertices[j] );
        p = scale( 0.5, p );
        points.push( p );
    }
    }
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.7, 0.9, 0.9, 1.0 );
    gl.clear(gl.COLOR_BUFFER_BIT);

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
}
uppfaeraPunkta();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.POINTS, 0, points.length );
}