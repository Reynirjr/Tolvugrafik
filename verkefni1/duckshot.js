var canvas;
var gl;

var mouseX;
var movement = false;

var moveStep = 0.03;  // Hraði leikmanns
var keysPressed = {}; // Fylki til að halda utan um lykla
var bullets = [];     // Fylki til að halda utan um kúlurnar
var bulletSpeed = 0.02; // Kúlu hraði
var ducks = [];       // Fylki fyrir endurnar
var duckSize = 0.1;   // Stærð "Anda"
var FjoldiBullet = 20; //Fjöldi kúla sem leikmaður hefur 
var duckShotCount = 0; // Fjöldi skotna anda

var bulletCooldown = 500; // Tími á milli skotanna í millisekúndum(þurfti að hafa smá cooldown annars komu skotin út á skrítnum tímum)
var lastBulletTime = 0;   // Tími síðasta skots

/*Booleans fyrir upphaf og enda leiks*/
var gameOver = false;
var Sigur = false;
var leikurHafinn = false;


var playerBufferId, bulletBufferId, duckBufferId,countBufferId;
var duckColorBufferId;
var playerVertices;


window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vPosition = gl.getAttribLocation(program, "vPosition");

    //leikmaður
    playerVertices = [
        vec2(-0.05, -0.9),  
        vec2(0.05, -0.9),  
        vec2(0.0, -0.7)     
    ];


    playerBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, playerBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(playerVertices), gl.DYNAMIC_DRAW);

    
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // setur endur inn í 
    for (var i = 0; i < 5; i++) {
        ducks.push({
            pos: vec2(Math.random() * 2 - 1,Math.random() *(0.9-0.6)+ 0.6),
            dir: (Math.random() < 0.5 ? 1 : -1),   // random átt
            speed: Math.random() * 0.02 + 0.01  // random hraði
        });
    }

    bulletBufferId = gl.createBuffer(); 
    duckBufferId = gl.createBuffer();  
    countBufferId = gl.createBuffer(); 
    duckColorBufferId = gl.createBuffer();

    // Event listeners fyrir músina
    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        mouseX = e.offsetX;
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            var xmove = (2 * (e.offsetX - mouseX)) / canvas.width;
            mouseX = e.offsetX;
            for (i = 0; i < 3; i++) {
                playerVertices[i][0] += xmove; 
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, playerBufferId);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(playerVertices));
        }
    });

    // Event listeners fyrir space og skýtur 
    window.addEventListener("keydown", function (e) {
        keysPressed[e.key] = true;

        var currentTime = Date.now();
        if (e.key === " " && bullets.length < FjoldiBullet && currentTime - lastBulletTime > bulletCooldown) {
            bullets.push(vec2(playerVertices[2][0], playerVertices[2][1]));
            lastBulletTime = currentTime;
            FjoldiBullet--;
        }
        
    });

    window.addEventListener("keyup", function (e) {
        keysPressed[e.key] = false;
    });

    function updateMovement() {
        //hreyfir leikmann til vinstri
        if (keysPressed["ArrowLeft"]) {
            var lengstVinstriX = playerVertices[0][0] - moveStep;
            if (lengstVinstriX >= -1.0) {
            for (i = 0; i < 3; i++) { 
                playerVertices[i][0] -= moveStep;
            }
        }
        }
        // hreyfir leikmann til hægri
        if (keysPressed["ArrowRight"]) {
            var lengstHaegriX = playerVertices[1][0] + moveStep;
            if (lengstHaegriX <= 1.0) {
            for (i = 0; i < 3; i++) { 
                playerVertices[i][0] += moveStep;
            }
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, playerBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(playerVertices));
    }

    function updateBullets() {
        for (var i = bullets.length - 1; i >= 0; i--) {
            bullets[i][1] += bulletSpeed;  // hreyfir kúlur upp

            // Eyðir kúlum ef þar fara út fyrir skjáinn
            if (bullets[i][1] > 1.0) {
                bullets.splice(i, 1);
            }
        }
        if(FjoldiBullet <= 0 && bullets.length === 0){
            gameOver = true;
        }
    }

    function updateDucks() {
        for (var i = ducks.length - 1; i >= 0; i--) {
            ducks[i].pos[0] += ducks[i].dir * ducks[i].speed; // Hreyfa önd

            // færir önd ef hún snertir endann á canvasinum
            if (ducks[i].pos[0] > 1.0 || ducks[i].pos[0] < -1.0) {
                ducks[i].dir *= -1;
            }

            // skoðar hvört önd snertir kúlu
            for (var j = bullets.length - 1; j >= 0; j--) {
                if (bullets[j][0] > ducks[i].pos[0] - duckSize / 2 &&
                    bullets[j][0] < ducks[i].pos[0] + duckSize / 2 &&
                    bullets[j][1] > ducks[i].pos[1] - duckSize / 2 &&
                    bullets[j][1] < ducks[i].pos[1] + duckSize / 2) {

                    // Eyðir kúlu og önd ef þær snertast
                    ducks.splice(i, 1);
                    bullets.splice(j, 1);
                    duckShotCount++;

                    if (duckShotCount >= 5){
                        Sigur = true;
                    }

                    break;
                }
            }
        }
    }

    function teiknaCount(x, y, width, height){
        var lineVertices = [
            vec2(x, y),
            vec2(x + width, y),
            vec2(x + width, y + height),
            vec2(x,y),
            vec2(x + width, y + height),
            vec2(x, y + height)
        ];
        gl.bufferData(gl.ARRAY_BUFFER, flatten(lineVertices), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function renderCounter() {
        gl.bindBuffer(gl.ARRAY_BUFFER, countBufferId);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    
        var xStart = -0.9;
        var yStart = -0.8;
        var width = 0.01;
        var height = 0.1;
    
        // teiknar strik 1-4
        for (var i = 0; i < Math.min(duckShotCount, 4); i++) {
            teiknaCount(xStart + i * 0.03, yStart, width, height);
        }
    
        // teiknar strik 5 
        if (duckShotCount >= 5) {
            var diagonalVertices = [
                
                vec2(xStart - 0.02, yStart),                   // vinstri botn
                vec2(xStart + 0.12, yStart + height),         // hægra horn
                vec2(xStart + 0.12 + width, yStart + height - 0.02), // hægri toppur
    
                
                vec2(xStart - 0.02, yStart + 0.02),                  //vinstri botn
                vec2(xStart + width -0.02, yStart),                 // Bottom-left shifted for width
                vec2(xStart + 0.12 + width, yStart + height - 0.02)  // Top-right shifted for width
            ];
            gl.bufferData(gl.ARRAY_BUFFER, flatten(diagonalVertices), gl.DYNAMIC_DRAW);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    
       
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (!leikurHafinn){
            displayLeidbeiningar();
            return;
        }

        if (gameOver){
            displayGameOver();
            return;
        }

        if (Sigur){
            displaySigur();
            return;
        }

        updateMovement();  
        updateBullets();   
        updateDucks();     

        // Teiknar leikmann
        gl.bindBuffer(gl.ARRAY_BUFFER, playerBufferId);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); 
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(playerVertices));
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // Teiknar kúlur
        gl.bindBuffer(gl.ARRAY_BUFFER, bulletBufferId);
        for (var i = 0; i < bullets.length; i++) {
            var bulletVertices = [
                vec2(bullets[i][0] - 0.01, bullets[i][1]),   
                vec2(bullets[i][0] + 0.01, bullets[i][1]),   
                vec2(bullets[i][0], bullets[i][1] + 0.04)    
            ];
            gl.bufferData(gl.ARRAY_BUFFER, flatten(bulletVertices), gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); 
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        // Teiknar endur
        gl.bindBuffer(gl.ARRAY_BUFFER, duckBufferId);
        for (var i = 0; i < ducks.length; i++) {
            var duckVertices = [
                vec2(ducks[i].pos[0] - duckSize / 2, ducks[i].pos[1] - duckSize / 2),  
                vec2(ducks[i].pos[0] + duckSize / 2, ducks[i].pos[1] - duckSize / 2),  
                vec2(ducks[i].pos[0] + duckSize / 2, ducks[i].pos[1] + duckSize / 2), 
                vec2(ducks[i].pos[0] - duckSize / 2, ducks[i].pos[1] + duckSize / 2)   
            ];
            gl.bufferData(gl.ARRAY_BUFFER, flatten(duckVertices), gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); 
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
        renderCounter();

        window.requestAnimFrame(render);
    }

    function displayLeidbeiningar(){
        var overlay = document.createElement('div');
        overlay.id = 'leidbeiningar';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = 'white';
        overlay.style.fontSize = '24px';
        overlay.style.textAlign = 'center';
        overlay.style.paddingTop = '150px';
        overlay.innerHTML = `
        <h1> Velkominn í Leikinn minn Duckshot! </h1>
        <p> Hreyfðu Leikmanninn með örvartökkunum eða músinni og skjóttu með Spacebar!</p>
        <p>Markmiðið er að skjóta allar "endurnar" þú hefur 20 skot til þess.</p>
        <p>Gangi þér vel!</p>
        <button id="startBtn">Hefja Leik</button>
        `;
        document.body.appendChild(overlay);

        document.getElementById('startBtn').onclick = function () {
            leikurHafinn = true;
            document.body.removeChild(overlay);
            render();
        };
    }

    function displayGameOver() {
        var overlay = document.createElement('div');
        overlay.id = 'gameOver';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = 'white';
        overlay.style.fontSize = '24px';
        overlay.style.textAlign = 'center';
        overlay.style.paddingTop = '150px';
        overlay.innerHTML = `
            <h1>Sorry þú tapaðir :/</h1>
            <p>Þú kláraðir allar kúlurnar!</p>
            <button id="restartBtn">Reyna aftur?</button>
        `;
        document.body.appendChild(overlay);

        document.getElementById('restartBtn').onclick = function () {
            restart();
        }
    }

    function displaySigur(){
        var overlay = document.createElement('div');
        overlay.id = 'sigur';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = 'white';
        overlay.style.fontSize = '24px';
        overlay.style.textAlign = 'center';
        overlay.style.paddingTop = '150px';
        overlay.innerHTML = `
            <h1>Til Hamingju!</h1>
            <p>Þú Skaust Allar Endurnar!</p>
            <button id="restartBtn">Reyna aftur?</button>
        `;
        document.body.appendChild(overlay);

        document.getElementById('restartBtn').onclick = function () {
            restart();
        }
    }

        function restart(){
            gameOver = false;
            Sigur = false;
            bullets = [];
            ducks = [];
            FjoldiBullet = 20;
            duckShotCount = 0;

            for (var i = 0; i < 5; i++) {
                ducks.push({
                    pos: vec2(Math.random() * 2 - 1, Math.random() * (0.9 - 0.6) + 0.6), // Random x position
                    dir: (Math.random() < 0.5 ? 1 : -1),  // Random direction
                    speed: Math.random() * 0.02 + 0.01  // Random speed
                });
            }
            var overlay = document.getElementById('gameOver') || document.getElementById('sigur');
            if (overlay) {
            document.body.removeChild(overlay);
            }

            render();
        
        }

    

    render();
}
