"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.

    document.getElementById("dyptSlider").addEventListener("input", updateDypt);
    teiknaTeppi();

};

    function updateDypt() {
        NumTimesToSubdivide = parseInt(document.getElementById("dyptSlider").value);
        document.getElementById("dyptValue").textContent = NumTimesToSubdivide;
        teiknaTeppi();
    }

    function teiknaTeppi() {
        points = [];
    

    var vertices = [
        vec2( -1, -1 ),
        vec2( -1,  1 ),
        vec2(  1, 1 ),
        vec2(  1, -1 )
    ];

    divideKassi( vertices[0], vertices[1], vertices[2],vertices[3],
                    NumTimesToSubdivide);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.7, 0.9, 0.9, 1.0 );

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



function kassi( a, b, c, d )
{
    points.push( a, b, d );
    points.push( b, c, d );
}


function divideKassi( a, b, c, d,count )
{

    // check for end of recursion

    if ( count === 0 ) {
        kassi( a, b, c, d );
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 1/3 );
        var ab2 = mix( a, b, 2/3 );
        var bc = mix( b, c, 1/3 );
        var bc2 = mix( b, c, 2/3 );
        var cd = mix( c, d, 1/3 );
        var cd2 = mix( c, d, 2/3 );
        var da = mix( d, a, 1/3 );
        var da2 = mix( d, a, 2/3 );
        var midja1 = vec2(da2[0],ab[1]);
        var midja2 = vec2(da2[0],ab2[1]);
        var midja3 = vec2(da[0],ab2[1]);
        var midja4 = vec2(da[0],ab[1]);

        --count;


        divideKassi( a, ab, midja1, da2, count );
        divideKassi( ab, ab2, midja2, midja1, count );
        divideKassi( ab2, b, bc, midja2, count );
        divideKassi( midja2, bc ,bc2, midja3, count );
        divideKassi( midja3, bc2, c, cd, count );
        divideKassi( midja4, midja3, cd, cd2, count );
        divideKassi( da, midja4, cd2, d, count );
        divideKassi( da2, midja1, midja4, da, count );
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
