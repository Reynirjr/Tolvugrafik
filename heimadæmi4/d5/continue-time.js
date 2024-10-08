var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];
var keysPressed = {};

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 180;
var origX;
var origY;

var sekonduAngle = 0;
var minutuAngle = 0;
var klukkutimaAngle = 0;

var matrixLoc;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.6 , 0.8, 0.9, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "rotation" );

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    window.addEventListener("keydown", function(e){
        keysPressed[e.key] = true;
        e.preventDefault();
    });
    window.addEventListener("keyup", function(e){
        keysPressed[e.key] = false;
    });


    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [0.9686, 0.7098, 0.5961, 1.0  ],  // red
        [ 0.6392, 0.8667, 0.8745, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.6392, 0.8667, 0.8745, 1.0  ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];


    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}

function spinModel() {
    if (keysPressed["ArrowLeft"]) {
        spinY -= 1;
    }
    if (keysPressed["ArrowRight"]) {
        spinY += 1;
    }
    if (keysPressed["ArrowUp"]) {
        spinX += 1;
    }
    if (keysPressed["ArrowDown"]) {
        spinX -= 1;
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    spinModel();

    var mv = mat4();
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );


    sekonduAngle = (sekonduAngle + 6) % 360;
    minutuAngle = (minutuAngle + 1/60) % 360;
    klukkutimaAngle = (klukkutimaAngle + 1/360) % 360;


    // teikna vegg til að setja klukkuna á
    var mv1 = mult(mv, translate(0.0, 0.0, -0.05));
    var mv1 = mult(mv1, rotateX(180));
    mv1 = mult(mv1, scalem(1.5, 1.5, 0.01));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    var armaLengd = 0.4;
    var armaBreidd = 0.04;

    //teiknum klukkutíma hendi
    mv1 = mult( mv, rotateZ(klukkutimaAngle) );
    mv1Final = mult( mv1, translate( armaLengd / 2, 0.0, 0.0 ) );
    mv1Final = mult( mv1Final, scalem( armaLengd, armaBreidd, armaBreidd ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1Final));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    //teiknum mínútu hendi
    var mv2 = mv1;
    mv2 = mult(mv2, translate(armaLengd, 0.0, 0.04));
    mv2 = mult(mv2, rotateZ(minutuAngle));
    mv2Final = mult(mv2, translate(armaLengd / 2, 0.0, 0.0));
    mv2Final = mult(mv2Final, scalem(armaLengd, armaBreidd * 0.8, armaBreidd * 0.8));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv2Final));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    //teiknum sekúndu hendi
    var mv3 = mv2;
    mv3 = mult(mv3, translate(armaLengd, 0.0, 0.04));
    mv3 = mult(mv3, rotateZ(sekonduAngle));
    mv3Final = mult(mv3, translate(armaLengd / 2, 0.0, 0.0));
    mv3Final = mult(mv3Final, scalem(armaLengd, armaBreidd * 0.6, armaBreidd * 0.6));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv3Final));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


   

    requestAnimFrame( render );
}
