//Canvas
const cvs = document.getElementById('game');
const game = cvs.getContext('2d');

//Load Sounds
const score_sound = new Audio();
score_sound.src = 'audio/sfx_point.wav';

const flap_sound = new Audio();
flap_sound.src = 'audio/sfx_flap.wav';

const hit_sound = new Audio();
hit_sound.src = 'audio/sfx_hit.wav';

const swoosh_sound = new Audio();
swoosh_sound.src = 'audio/sfx_swooshing.wav';

const die_sound = new Audio();
die_sound.src = 'audio/sfx_die.wav';


//Game Variables and Constants
let frames = 0;
const RADIAN = Math.PI / 180;

//Game State
const state = {
    current: 0,
    start: 0,
    playing: 1,
    end: 2
}

//Sprite Image
const sprite = new Image();
sprite.src = "img/sprite.png";

//Get Ready to Play Gui
const getReadyMessage = {
    sX: 0,
    sY: 228,
    w: 173,
    h: 152,
    x: cvs.width/2 - 173/2,
    y: 80,
    draw: function() {
        if (state.current === state.start) {
            game.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
}

//Game Over Gui
const gameOverMessage = {
    sX: 175,
    sY: 228,
    w: 225,
    h: 202,
    x: cvs.width/2 - 225/2,
    y: 90,
    draw: function() {
        if (state.current === state.end) {
            game.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
}

//Background Image
const bg = {
    sX: 0,
    sY: 0,
    w: 275,
    h: 226,
    x: 0,
    y: cvs.height - 226,
    draw: function() {
        game.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);

        game.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    }
}

//Foreground Image
const fg = {
    sX: 276,
    sY: 0,
    w: 224,
    h: 112,
    x: 0,
    y: cvs.height - 112,
    dx: 2,
    draw: function() {
        game.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);

        game.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    },
    update: function() {
        if (state.current === state.playing) {
            this.x = (this.x - this.dx) % (this.w/2);
        }
    }

}

//Bird Object
const bird = {
    //Bird falling image positions in Sprite
    animation: [
        {sX: 276, sY: 112},
        {sX: 276, sY: 139},
        {sX: 276, sY: 164},
        {sX: 276, sY: 139},
    ],
    x: 50,
    y: 150,
    w: 34,
    h: 26,
    frame: 0,
    speed: 0,
    gravity: 0.2,
    jump: 5,
    rotation: 0,
    radius: 12,
    playCounter: 0,

    draw: function() {
        let pos = this.animation[this.frame];

        game.save();
        game.translate(this.x, this.y);
        game.rotate(this.rotation);

        game.drawImage(sprite, pos.sX, pos.sY, this.w, this.h, -this.w/2, -this.h/2, this.w, this.h);

        game.restore();
    },
    flap: function() {
        //Reverse Speed So Bird Goes Up On Canvas
        this.speed = -1 * this.jump;
    },
    update: function() {
        //Bird Flaps Slower When Game Is In Start State
        this.period = (state.current === state.start) ? 10 : 5;

        //Increment Frame of Bird Each Period
        this.frame = this.frame  + ( (frames % this.period === 0) ? 1 : 0);

        //Array Animation Frame Cannot Exceed Array Size
        this.frame = this.frame % this.animation.length;

        if (state.current === state.start) {
            //Reset Bird Height
            this.y = 150;
            this.rotation = 0 * RADIAN;
        } else {
            //Gravity Pulls Bird Down
            this.speed += this.gravity;
            this.y += this.speed;

            //Check If Bird Hit Ground
            if (this.y + this.h/2 >= cvs.height - fg.h) {
                this.y = cvs.height - fg.h - this.h/2;
                if (this.playCounter == 0) {
                    die_sound.play();
                    this.playCounter++;
                }
                state.current = state.end;
            }

            //Check If Bird Went Above Sky
            if (this.y + this.h/2 <= 0) {
                if (this.playCounter == 0) {
                    die_sound.play();
                    this.playCounter++;
                }
                state.current = state.end;
            }

            //Speed Slightly Positive Means Bird Falling Down
            if (this.speed >= 3) {
                this.rotation = 65 * RADIAN;
                this.frame = 1;
            } else {
                this.rotation = -25 * RADIAN;
            }
        }
    }
}

//Pipes
const pipes = {
    position: [],
    top: {
        sX: 553,
        sY: 0
    },
    bottom: {
        sX: 502,
        sY: 0,
    },
    w: 53,
    h: 400,
    maxYPos: -150,
    dx: 2,
    draw: function() {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            let topYPos = p.y;
            let bottomYPos = p.y + this.h + p.gap;

            //top pipe
            game.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, p.x, topYPos, this.w, this.h);

            //bottom pipe
            game.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYPos, this.w, this.h);
        }
    },
    update: function() {
        if (state.current !== state.playing) return;

        if (frames % 100 === 0) {
            this.position.push({
                x: cvs.width,
                y: this.maxYPos * (Math.random() + 1),
                gap: 80 * (Math.random() + 1), // 80 < pipe < 160
                gotPoint: false
            });
        }
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;

            let bottomPipeYPos = p.y + this.h + p.gap;

            //Collision Test
            //Top Pipe
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h) {
                state.current = state.end;
                hit_sound.play();
            }

            //Bottom Pipe
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > bottomPipeYPos && bird.y - bird.radius < bottomPipeYPos + this.h) {
                state.current = state.end;
                hit_sound.play();
            }

            if (p.x + this.w < bird.x - bird.w) {
                if (!p.gotPoint) {
                    //update score
                    score.value++;
                    score.best = Math.max(score.value, score.best);
                    localStorage.setItem("best", score.best);
                    console.log(localStorage.getItem('best'));
                    p.gotPoint = true;
                    score_sound.play();
                }
            }

            if (p.x + this.w <= 0) {
                this.position.shift();
            }
        }
    }
}

//Score Gui
const score = {
    best: parseInt(localStorage.getItem("best")) || 0,
    value: 0,
    draw: function() {
        game.save();
        game.fillStyle = '#FFF';
        game.strokeStyle = '#000';

        if (state.current === state.playing) {
            game.lineWidth = 2;
            game.font = "35px Teko";
            game.fillText(this.value, cvs.width/2, 50);
            game.strokeText(this.value, cvs.width/2, 50);
        } else if (state.current === state.end) {
            game.font = "25px Teko";

            //Current Score
            game.fillText(this.value, 225, 186);
            game.strokeText(this.value, 225, 186);

            //Best Score
            game.fillText(this.best, 225, 228);
            game.strokeText(this.best, 225, 228);
        }
        game.restore();
    }
}

//Re-play Button
const startBtn = {
    x: 120,
    y: 263,
    w: 83,
    h: 29
}

function resetSpeed() {
    bird.speed = 0;
    bird.playCounter = 0;
}

function resetScore() {
    score.value = 0;
}

function resetPipes() {
    pipes.position = [];
}






/* GAME CONTROLLER */
cvs.addEventListener("click", event => {
    switch(state.current) {
        case state.start:
            state.current = state.playing;
            swoosh_sound.play();
            break;
        case state.playing:
            bird.flap();
            flap_sound.play();
            break;
        case state.end:
            let rect = cvs.getBoundingClientRect();
            let clickX = event.clientX - rect.left;
            let clickY = event.clientY - rect.top;

            //Check if we click the start button
            if (clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w && clickY >= startBtn.y && clickY <= startBtn.y + startBtn.h) {
                resetScore();
                resetPipes();
                resetSpeed();
                state.current = state.start;
            }
            
            break;
    }
});


//Start Game
loop();


//Keep Game Running
function loop() {
    frames++;

    update();
    draw();

    //animate game using callback function at 60 frames/sec
    requestAnimationFrame(loop);
}

//Update Game
function update() {
    bird.update();
    fg.update();
    pipes.update();
}

//Draw To Canvas
function draw() {
    game.fillRect(0, 0, cvs.clientWidth, cvs.height);
    game.fillStyle = "#70c5ce";
    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    getReadyMessage.draw();
    gameOverMessage.draw();
    score.draw();
}