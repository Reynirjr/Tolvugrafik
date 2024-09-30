var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];
var keysPressed = {};//Heldur utan um hvort lykill sé niðri eða ekki

var movement = false;     // Do we rotate?
var spinX = -10;
var spinY = 180;
var origX;
var origY;

var scale = 1.0;

var matrixLoc;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.6 , 0.8, 0.9, 1.0);
    
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

    matrixLoc = gl.getUniformLocation( program, "transform" );

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

     // til að stækka og minnka með scrollinu/Skruninu
     canvas.addEventListener("wheel", function (event) {
        event.preventDefault();
        if (event.deltaY < 0) {
            scale *= 1.07;  // Stækka
        } else {
            scale *= 0.93;  // Minnka
        }
    });

    window.addEventListener("keydown", function(e){
        keysPressed[e.key] = true;
    });

    window.addEventListener("keyup", function (e) {
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
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    //vertex color assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}
function spinBilly() {
    if (keysPressed["ArrowUp"]) {
        spinX += 1;
    }
    if (keysPressed["ArrowDown"]) {
        spinX -= 1;
    }
    if (keysPressed["ArrowLeft"]) {
        spinY += 1;
    }
    if (keysPressed["ArrowRight"]) {
        spinY -= 1;
    }
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    spinBilly();

    spinX += 0.1;
    spinY -= 0.2;

   

    var mv = mat4();
    mv = mult(mv, scalem(scale, scale, scale));
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    // botn
    mv1 = mult(mv, translate(0.0, -0.4, 0.0));
    mv1 = mult(mv1, scalem(0.85, 0.05, 0.45));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Toppur
    mv1 = mult(mv, translate(0.0, 0.4, 0.0));
    mv1 = mult(mv1, scalem(0.85, 0.05, 0.45));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Vinstri hlið
    mv1 = mult(mv, translate(-0.4, -0.05, 0.0));
    mv1 = mult(mv1, scalem(0.05, 0.9, 0.45));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Hægri hlið
    mv1 = mult(mv, translate(0.4, -0.05, 0.0));
    mv1 = mult(mv1, scalem(0.05, 0.9, 0.45));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Bak
    mv1 = mult(mv, translate(0.0, -0.05, -0.2));
    mv1 = mult(mv1, scalem(0.8, 0.9, 0.05));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    //stoðdæmið undir neðstu hillu
    mv1 = mult(mv, translate(0.0, -0.45, 0.175));
    mv1 = mult(mv1, scalem(0.8, 0.1, 0.05));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Neðri hilla
    mv1 = mult(mv, translate(0.0, 0.12, 0.0));
    mv1 = mult(mv1, scalem(0.8, 0.05, 0.45));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Efri hilla
    mv1 = mult(mv, translate(0.0, -0.12, 0.0));
    mv1 = mult(mv1, scalem(0.8, 0.05, 0.45));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    

    requestAnimFrame(render);
}