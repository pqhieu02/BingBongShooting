const FPS = 60;
const RELOAD_TIME = 300; //ms
const RESPAWN_TIME = 2000;
const DEGREE_TO_RAD = Math.PI / 180;
const BULLET_SPEED = 300;
const BALL_SPEED = 50;
const BULLET_DAMAGE = 10;

var MOUSE_X = 0, MOUSE_Y = 0;
var difficulty = 1;
var killed = 0, escaped = 0;
var bullets = [
    // {
    //  velocity : {
    //     x:...,
    //     y:...,
    // },
    // position : {
    //     x:...,
    //     y:...,
    // },
    // object: <div class = "bullet">,
    // }
];
var balls = [
    // {
    //     velocity : {
    //         x : ...,
    //         y : ...,
    //     },
    //     position : {
    //         x : ...,
    //         y : ...,
    //     }
    //     destruct : ...
    //     object : <div class = "enemy">
    // }
]
var UNFOCUS;
var DIFFICULTY_INTERVAL = undefined; 
var BULLETS_GENERATOR_INTERVAL = undefined; 
var ENEMIES_GENERATOR_INTERVAL = undefined; 
var OBJECTS_TRAVELING_INTERVAL = undefined;


window.addEventListener("mousemove", (e) => {
    MOUSE_X = e.clientX;
    MOUSE_Y = e.clientY;
})

function resetVariables() {
    MOUSE_X = 0; 
    MOUSE_Y = 0;
    difficulty = 1;
    killed = 0;
    escaped = 0;
    bullets = [];
    balls = [];
    DIFFICULTY_INTERVAL = undefined; 
    BULLETS_GENERATOR_INTERVAL = undefined; 
    ENEMIES_GENERATOR_INTERVAL = undefined; 
    OBJECTS_TRAVELING_INTERVAL = undefined;
    if (document.getElementById("audio")) {
        document.getElementById("audio").remove(); 
    }
}

function randomGenerator(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getVelocity(a, b, c, d, speed) { // From A(a, b) to B(c, d)
    let vectorX = a - c;
    let vectorY = b - d;
    let magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY) + 1e-5; // + 1e-5 to prevent the value of magnitude equal to 0
    return {
        x: difficulty * speed * vectorX / magnitude,
        y: difficulty * speed * vectorY / magnitude
    };
}

function playAudio(type) {
    let dom = document.createElement("audio");
    dom.setAttribute("src", type + ".mp4");
    dom.setAttribute("autoplay", "autoplay");
    document.getElementById("audio").appendChild(dom);
}

function outborderObjectDetection(object, x, y, i) {
    let rect = container.getBoundingClientRect();
    let X_MIN = 0;
    let X_MAX = rect.width;
    let Y_MIN = 0;
    let Y_MAX = rect.height;

    if (x < X_MIN || x > X_MAX || y < Y_MIN || y > Y_MAX) {
        let dom = document.getElementsByClassName(object)[i];
        dom.remove();
        return false;
    } else {
        return true;
    }
}

function render(objects) {
    objects.object.style.left = objects.position.x + "px";
    objects.object.style.top = objects.position.y + "px";
}

function enemiesGenerator() {
    let rect = container.getBoundingClientRect();
    let dom = document.createElement("div");
    dom.className = "ball";
    let destruct = randomGenerator(20, 40);
    let x = randomGenerator(0 + destruct, rect.width - destruct);
    let y = 0;
    dom.style.width = destruct + "px";
    dom.style.height = destruct + "px";
    let ball = {
        velocity : getVelocity(x, rect.height, x, y, BALL_SPEED),
        position : {
            x : x,
            y : y,
        },
        object : dom,
        destruct : destruct,
    }
    document.getElementById("Minigame").appendChild(dom);
    balls.push(ball);
    render(ball);
}

function bulletsGenerator() {
    let rect = container.getBoundingClientRect();
    let DEFENDER_X = document.getElementById("defender").offsetLeft,
        DEFENDER_Y = document.getElementById("defender").offsetTop;
    let dom = document.createElement("div");
    dom.className = "bullet";
    let bullet = {
        velocity: getVelocity(MOUSE_X, MOUSE_Y, DEFENDER_X + rect.left, DEFENDER_Y + rect.top, BULLET_SPEED),  
        position: {
            x: DEFENDER_X,
            y: DEFENDER_Y,
        },
        object : dom,
    };
    bullets.push(bullet);
    document.getElementById("Minigame").appendChild(dom);
    render(bullet);
}

// r = destruct / 2
// center I(a,b)

function collisionDetection() {
    balls.forEach((ball) => {
        let ball_x = ball.object.offsetLeft;
        let ball_y = ball.object.offsetTop;
        let r_ball = ball.object.offsetWidth / 2;
        bullets.forEach((bullet) => {
            let bullet_x = bullet.object.offsetLeft;
            let bullet_y = bullet.object.offsetTop;
            let vectorX = bullet_x - ball_x;
            let vectorY = bullet_y - ball_y;
            let r_bullet = bullet.object.offsetWidth / 2;
            let magnitude = vectorX * vectorX + vectorY * vectorY;
            if (magnitude < (r_ball + r_bullet) * (r_ball + r_bullet)) {
                bullet.status = -1;
                ball.destruct -= BULLET_DAMAGE;
            }
        });
    });
    traveling_bullets = [];
    traveling_balls = [];

    bullets.forEach((bullet, i) => {
        if (bullet.status != -1) {
            traveling_bullets.push(bullet);
        } else {
            dom = document.getElementsByClassName("bullet")[i];
            dom.remove();
        }
    });
    balls.forEach((ball, i) => {
        if (ball.destruct > 0) {
            traveling_balls.push(ball);
        } else {
            killed++;
            dom = document.getElementsByClassName("ball")[i];
            dom.remove();
            playAudio("explosion");
        }
    });
    bullets = traveling_bullets;
    balls = traveling_balls;
}

function updateTravelingData(obj) {
    let x = obj.position.x;
    let y = obj.position.y;
    x += obj.velocity.x / FPS;
    y += obj.velocity.y / FPS;
    obj.position = { x : x, y : y};
}

function isGameOver() {
    let flag = false;
    if (Math.floor(killed / 10) < escaped) {
        flag = true;
    }
    let DEFENDER_X = document.getElementById("defender").offsetLeft,
        DEFENDER_Y = document.getElementById("defender").offsetTop;
    let r_defender = document.getElementById("defender").offsetWidth / 2
    balls.forEach((ball) => {
        let ball_x = ball.object.offsetLeft;
        let ball_y = ball.object.offsetTop;
        let r_ball = ball.object.offsetWidth / 2;
        let vectorX = DEFENDER_X - ball_x;
        let vectorY = DEFENDER_Y - ball_y;
        let magnitude = vectorX * vectorX + vectorY * vectorY;
        // console.log(DEFENDER_X, DEFENDER_Y);
        // console.log(ball_x, ball_y);
        // console.log(r_defender, r_ball);
        // console.log(vectorX, vectorY);
        // console.log(magnitude);
        if (magnitude < (r_ball + r_defender) * (r_ball + r_defender)) {
            flag = true;
            return flag;
        }
    });
    return flag;
}

// let ball = {
//     velocity : 123,
//     position : {
//         x : 123,
//         y : 123,
//     },
//     object : document.getElementsByClassName("ball")[0],
//     destruct : 123,
// }
// balls.push(ball)
// console.log(isGameOver());

function objectsTraveling() {
    let traveling_bullets = [];
    let traveling_balls = [];
    bullets.forEach((bullet, i) => {
        updateTravelingData(bullet);
        if (outborderObjectDetection("bullet", bullet.position.x, bullet.position.y, i) == true) {
            traveling_bullets.push(bullet);
        }
    });
    balls.forEach((ball, i) => {
        updateTravelingData(ball);
        if (outborderObjectDetection("ball", ball.position.x, ball.position.y, i) == true) {
            traveling_balls.push(ball);
        } else {
            escaped++;
        }
    });
    bullets = traveling_bullets;
    balls = traveling_balls;

    collisionDetection();

    bullets.forEach(bullet => {
        render(bullet);
    }); 
    balls.forEach(ball => {
        render(ball);
    });
    document.getElementById("Killed").innerHTML = "KILLED: " + killed;
    document.getElementById("Escaped").innerHTML = "ESCAPED: " + escaped;
    if (isGameOver() == true) {
        Gameover();
    }
}

function destroy() {
    if (document.getElementById("Minigame")) {
        document.getElementById("Minigame").remove();
    } 
    document.getElementById("Killed").style.display = "none";
    document.getElementById("Escaped").style.display = "none";
    document.getElementById("Back").style.display = "none";
    document.getElementById("GameIntroduction").style.display = "none";
    document.getElementById("GuideBoard").style.display = "none";
    document.getElementById("GameOver").style.display = "none";
    window.removeEventListener("blur", Gameover);
    clearInterval(DIFFICULTY_INTERVAL);
    clearInterval(BULLETS_GENERATOR_INTERVAL);
    clearInterval(ENEMIES_GENERATOR_INTERVAL);
    clearInterval(OBJECTS_TRAVELING_INTERVAL);
}

function play() {
    destroy();
    resetVariables();
    let dom = document.createElement("div");
    dom.id = "Minigame";
    document.getElementById("container").appendChild(dom);

    dom = document.createElement("div");
    dom.id = "audio";
    document.getElementById("container").appendChild(dom);

    dom = document.createElement("div");
    dom.id = "defender";
    document.getElementById("Minigame").appendChild(dom);

    window.addEventListener("blur", Gameover);
    document.getElementById("Killed").style.display = "initial";
    document.getElementById("Escaped").style.display = "initial";
    document.getElementById("Back").style.display = "initial";
    
    
    DIFFICULTY_INTERVAL = setInterval(() => difficulty += 0.01, 10000);
    BULLETS_GENERATOR_INTERVAL = setInterval(bulletsGenerator, RELOAD_TIME);
    ENEMIES_GENERATOR_INTERVAL = setInterval(enemiesGenerator, RESPAWN_TIME)
    OBJECTS_TRAVELING_INTERVAL = setInterval(objectsTraveling, 1000 / FPS);
}

function back() {
    destroy();
    document.getElementById("GameIntroduction").style.display = "initial";
}

function Gameover() {
    playAudio("gameover");
    destroy();
    document.getElementById("GameOver").style.display = "initial";
}

function howToPlay() {
    destroy();
    document.getElementById("GuideBoard").style.display = "initial";
    document.getElementById("Back").style.display = "initial";
}

// setInterval function will set interval time to 1000ms when the tab is inactive.
// window.addEventlistener("blur", ()) will detect if the tab is active or inactive 
// window.addEventlistener("focus", ()) will only do the function if the tab is re-focused after being inactive
// The angle is upside down, 90 degree object will point downward