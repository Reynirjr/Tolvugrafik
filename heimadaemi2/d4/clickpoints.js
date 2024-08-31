/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Teiknar punkt á strigann þar sem notandinn smellir
//     með músinni
//
//    Hjálmtýr Hafsteinsson, ágúst 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

// Þarf hámarksfjölda punkta til að taka frá pláss í grafíkminni

var maxNumPoints = 200;  
var index = 0;

var numCirclePoints = 50;
var points = [];

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumPoints *(numCirclePoints + 2), gl.DYNAMIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    canvas.addEventListener("mousedown", function(e){

        
        
        // Calculate coordinates of new point
        var midja = vec2(2*e.offsetX/canvas.width-1, 2*(canvas.height-e.offsetY)/canvas.height-1);

        var rad = Math.random()*0.1 +0.05;

        createCirclePoints(midja,rad, numCirclePoints);

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
        
        // Add new point behind the others
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index * (numCirclePoints + 2), flatten(points));

        index++;
    } );

    render();
}

function createCirclePoints( midja, rad, numCirclePoints)
{
    points = [];
    points.push( midja );
    
    var dAngle = 2*Math.PI/numCirclePoints;
    for( var i=0; i <= numCirclePoints; i++ ) {

    	a = i*dAngle;
    	var p = vec2( rad*Math.sin(a) + midja[0], rad*Math.cos(a) + midja[1] );
    	points.push(p);
    }
}



function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    for( var i=0; i < index; i++ ) {
        gl.drawArrays( gl.TRIANGLE_FAN, i*(numCirclePoints+2), numCirclePoints+2 );
    }

    window.requestAnimFrame(render);
}
