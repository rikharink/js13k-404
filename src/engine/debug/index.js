let debug = undefined;
let avgFPS = 60;
let alpha = 0.9;
let dt = 0;

export function updateDebugInfo(deltaTime) {
    if (!debug) {
        debug = document.createElement("div");
        debug.id = "debug";
        debug.style.position = "absolute";
        debug.style.top = "8px";
        debug.style.left = "8px";
        document.body.appendChild(debug);
    }
    dt += deltaTime;
    avgFPS = alpha * avgFPS + (1.0 - alpha) * (1/ deltaTime);
    if(dt > 1){
        dt = 0;
        debug.innerText = `${avgFPS.toFixed(1)} fps`;
    }
}