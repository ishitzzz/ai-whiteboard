const fs = require('fs');

const code = `
const cx = 400;
const cy = 250;
ctx.beginPath();
ctx.moveTo(cx - 150, cy);
ctx.bezierCurveTo(cx - 150, cy - 100, cx + 150, cy - 100, cx + 150, cy);
ctx.bezierCurveTo(cx + 150, cy + 100, cx - 150, cy + 100, cx - 150, cy);
ctx.stroke();
`;

class Interceptor {
    constructor() {
        this.path = [];
    }
    moveTo(x, y) { this.path.push({type: 'moveTo', x, y}); }
    lineTo(x, y) { this.path.push({type: 'lineTo', x, y}); }
    bezierCurveTo() { this.path.push({type: 'bezierCurveTo'}); }
    beginPath() {}
    stroke() {}
    execute(str) {
        this.path = [];
        const evaluator = new Function('ctx', '"use strict";\n' + str);
        evaluator(this);
        return this.path;
    }
}

const interceptor = new Interceptor();
let acc = "";
for (let i = 0; i < code.length; i++) {
    acc += code[i];
    try {
        const res = interceptor.execute(acc);
        console.log(`Length at i=${i}: ${res.length}`);
    } catch (e) {
        // silent
    }
}
