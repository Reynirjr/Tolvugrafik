"use strict";

var gl;
var points;
var NumPoints = 600000;
var scale = 0.5;
var offset = vec2(0, 0);
var color = [Math.random(), Math.random(), Math.random(), 1.0];
var erDraga = false;
var musSeinast = vec2(0, 0);
var program;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    setCanvasSize(canvas);

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.clearColor(0.6 , 0.8, 0.9, 1.0);

    calculatePoints();
    setUniformVariables();

    window.addEventListener("resize", function () {
        setCanvasSize(canvas);
        setUniformVariables();
    });

    canvas.addEventListener("wheel", function (event) {
        event.preventDefault();
        if (event.deltaY < 0) {
            scale *= 1.07;
        } else {
            scale *= 0.93;
        }
        setUniformVariables();
    });

    canvas.addEventListener("mousedown", function (event) {
        erDraga = true;
        musSeinast = vec2(event.clientX, event.clientY);
    });

    canvas.addEventListener("mousemove", function (event) {
        if (erDraga) {
            var musNuna = vec2(event.clientX, event.clientY);
            var breyting = subtract(musNuna, musSeinast);
            offset = add(offset, vec2(breyting[0] * 2.0 / canvas.width, breyting[1] * -2.0 / canvas.width));
            musSeinast = musNuna;
            setUniformVariables();
        }
    });

    canvas.addEventListener("mouseup", function () {
        erDraga = false;
    });

    canvas.addEventListener("mouseleave", function () {
        erDraga = false;
    });

    window.addEventListener("keydown", function (event) {
        event.preventDefault();
        if (event.code === "Space") {
            color = [Math.random(), Math.random(), Math.random(), 1.0];
            setUniformVariables();
        }
    });

    window.addEventListener("keydown", function (e) {
        if (e.key === "ArrowUp") {
            scale *= 1.07;
        } else if (e.key === "ArrowDown") {
            scale *= 0.93;
        }
        setUniformVariables();
    });
};

function setUniformVariables() {
    var scaleUniformLocation = gl.getUniformLocation(program, "scale");
    var offsetUniformLocation = gl.getUniformLocation(program, "offset");
    var colorUniformLocation = gl.getUniformLocation(program, "color");

    gl.uniform1f(scaleUniformLocation, scale);
    gl.uniform2fv(offsetUniformLocation, offset);
    gl.uniform4fv(colorUniformLocation, flatten(color));
}

function setCanvasSize(canvas) {
    var size = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.8);
    canvas.width = size;
    canvas.height = size;
    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
}

function calculatePoints() {
    var vertices = [
        vec2(-1, -1),
        vec2(0, 1),
        vec2(1, -1)
    ];

    var u = add(vertices[0], vertices[1]);
    var v = add(vertices[0], vertices[2]);
    var p = mix(u, v, 0.25);

    points = [p];

    for (var i = 0; points.length < NumPoints; ++i) {
        var j = Math.floor(Math.random() * 3);

        p = add(points[i], vertices[j]);
        p = mix(p, vec2(0, 0), 0.5);
        points.push(p);
    }

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
}

function render() {
    setUniformVariables();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, points.length);

    window.requestAnimFrame(render);
}
