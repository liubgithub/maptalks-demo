var keleyi_canvas =document.getElementById("canvas-kel" + "eyi-com");
var ctx = keleyi_canvas.getContext("2d");
var W = window.innerWidth, H = window.innerHeight;
keleyi_canvas.width = W;
keleyi_canvas.height = H;


var particles = [];
var mouse = {};
//Lets create some particles now
var particle_count = 100;
for (var i = 0; i < particle_count; i++) {
    particles.push(new particle());
}
keleyi_canvas.addEventListener('mousemove', track_mouse, false);
function track_mouse(e) {
    mouse.x = e.pageX;
    mouse.y = e.pageY;
}
function particle() {
    this.speed = { x: -2.5 + Math.random() * 5, y: -15 + Math.random() * 10 };
    //location = mouse coordinates
    //Now the flame follows the mouse coordinates
    if (mouse.x && mouse.y) {
        this.location = { x: mouse.x, y: mouse.y };
    }
    else {
        this.location = { x: W / 2, y: H / 2 };
    }
    //radius range = 10-30
    this.radius = 10 + Math.random() * 20;
    //life range = 20-30
    this.life = 20 + Math.random() * 10;
    this.remaining_life = this.life;
    //colors
    this.r = Math.round(Math.random() * 255);
    this.g = Math.round(Math.random() * 255);
    this.b = Math.round(Math.random() * 255);
}
function draw() {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        ctx.beginPath();
        p.opacity = Math.round(p.remaining_life / p.life * 100) / 100
        var gradient = ctx.createRadialGradient(p.location.x, p.location.y, 0, p.location.x, p.location.y, p.radius);
        gradient.addColorStop(0, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + p.opacity + ")");
        gradient.addColorStop(0.5, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + p.opacity + ")");
        gradient.addColorStop(1, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", 0)");
        ctx.fillStyle = gradient;
        ctx.arc(p.location.x, p.location.y, p.radius, Math.PI * 2, false);
        ctx.fill();
        p.remaining_life--;
        p.radius--;
        p.location.x += p.speed.x;
        p.location.y += p.speed.y;
        if (p.remaining_life < 0 || p.radius < 0) {
            particles[i] = new particle();
        }
    }
}
setInterval(draw, 86);