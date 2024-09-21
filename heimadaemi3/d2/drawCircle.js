var gl;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    setCanvasSize(canvas);
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.6 , 0.8, 0.9, 1.0);
    
    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
 
    //  The vertices of a square, filling the whole canvas
    var vertices = [ vec2( -1, -1 ), vec2( 1,  -1 ), vec2( 1, 1 ),
                     vec2( -1, -1 ), vec2( 1,  1 ), vec2( -1, 1 )
    ];

     // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    locTime = gl.getUniformLocation( program, "time" );
    
    iniTime = Date.now();

    //  Get canvas resolution and send to shaders
    canvasRes = vec2(canvas.width, canvas.height);
    gl.uniform2fv( gl.getUniformLocation( program, "resolution" ), flatten(canvasRes) )

    render();
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    var msek = Date.now() - iniTime;
    var time = ((msek * 0.0005));
    gl.uniform1f( locTime, time );
    
    gl.drawArrays( gl.TRIANGLES, 0, 6 );

    window.requestAnimFrame(render);
}

function setCanvasSize(canvas) {
    var size = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.8);
    canvas.width = size;
    canvas.height = size;
    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
}