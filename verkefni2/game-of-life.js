var canvas;
var gl;


var points = [];
var colors = [];
var gridSize = 10;
var grid = createGrid(gridSize);
var prevGrid = copyGrid(grid);
var lastUpdateTime = Date.now();
var matrixLoc;
var spinX = 30, spinY = 45, zoom = 25.0;
var keysPressed = {};
var movement = false; 

var initialPinchDistance = null;
var lastPinchZoom = zoom;

var origX, origY;
var scale = 1.0; 

var deathTimes = createTimeGrid(gridSize);
var reviveTimes = createTimeGrid(gridSize);

var animationDuration = 1500;
var updateInterval = 3500;

var startingAnimationInProgress = false;
var delayAfterStart = false;

var resetInProgress = false;
var resetStartTime = null;



var vertexColors = [
    [0.3, 0.5, 0.7, 1.0], 
    [1.0, 1.0, 1.0, 1.0], 
];

window.onload = function () {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

	grid = createEmptyGrid(gridSize);
	prevGrid = createEmptyGrid(gridSize);
	lastUpdateTime = Date.now();

	deathTimes = createTimeGrid(gridSize);
	reviveTimes = createTimeGrid(gridSize);

	const resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', function () {
		resetInProgress = true;
        grid = createEmptyGrid(gridSize);
        prevGrid = createEmptyGrid(gridSize);
		deathTimes = createTimeGrid(gridSize);
		reviveTimes = createTimeGrid(gridSize);
        lastUpdateTime = Date.now();

		animateStart();
    });

    colorCube();
    setupWebGL();

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    initBuffers(program);

	canvas.addEventListener("mousedown", function (e) {
		movement = true;
		origX = e.offsetX;
		origY = e.offsetY;
		e.preventDefault();  
	});
	canvas.addEventListener("mouseup", function (e) {
		movement = false;
	});
	
	canvas.addEventListener("mousemove", function (e) {
		if (movement) {
			spinY = (spinY + (origX - e.offsetX)) % 360;
			spinX = (spinX + (origY - e.offsetY)) % 360;
			origX = e.offsetX;
			origY = e.offsetY;
		}
	});
	canvas.addEventListener("wheel", function (event) {
		event.preventDefault();
		if (event.deltaY < 0) {
			scale *= 1.07;  
		} else {
			scale *= 0.93; 
		}
	});

	canvas.addEventListener("touchstart", function (e) {
        if (e.touches.length === 1) {
            movement = true;
            origX = e.touches[0].clientX;
            origY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            movement = false; 
            initialPinchDistance = getPinchDistance(e.touches[0], e.touches[1]);
            lastPinchZoom = zoom;
        }
    });
	canvas.addEventListener("touchmove", function (e) {
        if (e.touches.length === 1 && movement) {
            var deltaX = e.touches[0].clientX - origX;
            var deltaY = e.touches[0].clientY - origY;
            spinY += (deltaX * 0.5) % 360;
            spinX += (deltaY * 0.5) % 360;

            origX = e.touches[0].clientX;
            origY = e.touches[0].clientY;
        } else if (e.touches.length === 2 && initialPinchDistance) {
            var currentPinchDistance = getPinchDistance(e.touches[0], e.touches[1]);
            var pinchZoomFactor = initialPinchDistance / currentPinchDistance;
            zoom = lastPinchZoom * pinchZoomFactor;
            zoom = Math.max(Math.min(zoom, 100.0), 0.5); // Gera ráð fyrir mín/maks zoom
            e.preventDefault();
        }
    });
	canvas.addEventListener("touchend", function (e) {
        if (e.touches.length < 2) {
            initialPinchDistance = null;
        }
        if (e.touches.length === 0) {
            movement = false;
        }
    });
    matrixLoc = gl.getUniformLocation(program, "transform");

	animateStart();

    render();
};

function animateStart() {
	startingAnimationInProgress = true;
    let totalCells = gridSize * gridSize * gridSize;
    let cellsToActivate = Math.floor(totalCells * 0.5); 
    let activatedCells = 0;

    let startInterval = setInterval(() => {
        if (activatedCells >= cellsToActivate) {
            clearInterval(startInterval);
			startingAnimationInProgress = false;

			delayAfterStart = true;
			setTimeout(() => {
				delayAfterStart = false;
			},2000);
            return;
        }

        let x = Math.floor(Math.random() * gridSize);
        let y = Math.floor(Math.random() * gridSize);
        let z = Math.floor(Math.random() * gridSize);

        if (grid[x][y][z] === 0) {
            grid[x][y][z] = 1;
            reviveTimes[x][y][z] = Date.now();
            activatedCells++;
        }
    }, 1); 
}

function getPinchDistance(touch1, touch2) {
    let dx = touch1.clientX - touch2.clientX;
    let dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy); 
}

function setupWebGL() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.6 , 0.8, 0.9, 1.0);
    gl.enable(gl.DEPTH_TEST);
}
function initBuffers(program) {

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}



function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}


function quad(a, b, c, d) {
    var vertices = [
        vec3(-0.5, -0.5, 0.5),
        vec3(-0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, -0.5, 0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5, 0.5, -0.5),
        vec3(0.5, 0.5, -0.5),
        vec3(0.5, -0.5, -0.5)
    ];

    var vertexColors = [
        [0.0, 0.0, 0.0, 1.0],  // black
        [1.0, 0.0, 0.0, 1.0],  // red
        [1.0, 1.0, 0.0, 1.0],  // yellow
        [0.0, 1.0, 0.0, 1.0],  // green
        [0.0, 0.0, 1.0, 1.0],  // blue
        [1.0, 0.0, 1.0, 1.0],  // magenta
        [0.0, 1.0, 1.0, 1.0],  // cyan
        [1.0, 1.0, 1.0, 1.0]   // white
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        colors.push(vertexColors[a]);
    }
}


function spinTheGame(){
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
window.addEventListener("keydown", function (e) {
    keysPressed[e.key] = true;
    e.preventDefault();
});

window.addEventListener("keyup", function (e) {
    keysPressed[e.key] = false;
});
function createGrid(size) {
    let grid = [];
    for (let x = 0; x < size; x++) {
        grid[x] = [];
        for (let y = 0; y < size; y++) {
            grid[x][y] = [];
            for (let z = 0; z < size; z++) {
                grid[x][y][z] = Math.random() < 0.2 ? 1 : 0;
            }
        }
    }
    return grid;
}
function createTimeGrid(size) {
	let timeGrid = [];
	for (let x = 0; x < size; x++) {
		timeGrid[x] = [];
		for (let y = 0; y < size; y++) {
			timeGrid[x][y] = [];
			for (let z = 0; z < size; z++) {
				timeGrid[x][y][z] = 0;
			}
		}
	}
	return timeGrid;
}

function createEmptyGrid(size) {
    let grid = [];
    for (let x = 0; x < size; x++) {
        grid[x] = [];
        for (let y = 0; y < size; y++) {
            grid[x][y] = [];
            for (let z = 0; z < size; z++) {
                grid[x][y][z] = 0;
            }
        }
    }
    return grid;
}



function copyGrid(grid) {
    let newGrid = [];
    for (let x = 0; x < grid.length; x++) {
        newGrid[x] = [];
        for (let y = 0; y < grid[x].length; y++) {
            newGrid[x][y] = [];
            for (let z = 0; z < grid[x][y].length; z++) {
                newGrid[x][y][z] = grid[x][y][z]; 
            }
        }
    }
    return newGrid;
}
function updateGrid() {
    prevGrid = copyGrid(grid);
    let newGrid = createEmptyGrid(gridSize);

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                let neighbors = countNeighbors(x, y, z);
                if (grid[x][y][z] === 1) {
                    if (neighbors >= 5 && neighbors <= 7) {
                        newGrid[x][y][z] = 1;
                    } else {
                        newGrid[x][y][z] = 0;
                        deathTimes[x][y][z] = Date.now(); 
                    }
                } else {
                    if (neighbors === 6) {
                        newGrid[x][y][z] = 1;
						reviveTimes[x][y][z] = Date.now();
                    }
                }
            }
        }
    }
    grid = newGrid;
}

function countNeighbors(x, y, z) {
    let neighbors = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            for (let k = -1; k <= 1; k++) {
                if (i === 0 && j === 0 && k === 0) continue;
                let nx = x + i, ny = y + j, nz = z + k;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && nz >= 0 && nz < gridSize) {
                    neighbors += grid[nx][ny][nz];
                }
            }
        }
    }
    return neighbors;
}
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	spinTheGame();

	var aspectRatio = canvas.width / canvas.height;
    var projectionMatrix = perspective(45, aspectRatio, 0.1, 100.0);
    var viewMatrix = lookAt(vec3(0, 0, zoom), vec3(0, 0, 0), vec3(0, 1, 0));
    var globalTransform = mult(projectionMatrix, viewMatrix);

   
    globalTransform = mult(globalTransform, scalem(scale, scale, scale));
    globalTransform = mult(globalTransform, rotateX(spinX));
    globalTransform = mult(globalTransform, rotateY(spinY));

	let currentTime = Date.now();

	if (!startingAnimationInProgress && !delayAfterStart && (currentTime - lastUpdateTime > updateInterval)) {
		updateGrid();
		lastUpdateTime = currentTime;
	}

    drawGrid(globalTransform);

    requestAnimationFrame(render);
}

function drawGrid(globalTransform) {
    let currentTime = Date.now();

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                let isAlive = grid[x][y][z] === 1;
                let wasAlive = prevGrid[x][y][z] === 1;
                let deathTime = deathTimes[x][y][z];
                let reviveTime = reviveTimes[x][y][z];

                if (isAlive || wasAlive) {
                    let scaleFactor = 1.0;
                    if (!isAlive && deathTime) {
                        let elapsedTimeSinceDeath = (currentTime - deathTime) / animationDuration;
                        scaleFactor = Math.max(0.0, 1.0 - elapsedTimeSinceDeath);
                    } else if (isAlive && reviveTime) {
                        let elapsedTimeSinceRevive = (currentTime - reviveTime) / animationDuration;
                        scaleFactor = Math.min(1.0, elapsedTimeSinceRevive);
                    }

                    drawCube(x, y, z, globalTransform, scaleFactor);
                }
            }
        }
    }
}


function drawCube(x, y, z, globalTransform, scaleFactor) {
    let modelMatrix = translate((x - gridSize / 2) * 1.1, (y - gridSize / 2) * 1.1, (z - gridSize / 2) * 1.1);
    
    
    modelMatrix = mult(modelMatrix, scalem(scaleFactor, scaleFactor, scaleFactor));

    let finalTransform = mult(globalTransform, modelMatrix);
    gl.uniformMatrix4fv(matrixLoc, false, flatten(finalTransform));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}