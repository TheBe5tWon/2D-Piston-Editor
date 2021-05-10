let winds = [];
let wind;

class Window {
  constructor(n, x, y, w, h, c) {
    this.n = n;
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.c = createGraphics(w, h);
    // this.c.id(n);
    this.camOn = c;
    this.camExists = c;
    this.allowDrag = c;
    this.allowZoom = c;
    this.maxZoom = 10;
    if (this.camOn) {
      this.limiter = new WindowLimiter(0, 0, w, h, this);
      this.limiter.mz = this.maxZoom;
    }
    this.parameters = [];
    this.parameterNames = [];
    this.show = true;
  }

  draw() {
    if (this.show) {
      image(this.c, this.x, this.y);
    }
  }

  getMouseX() {
    return mouseX - this.x;
  }

  getMouseY() {
    return mouseY - this.y;
  }

  getCMouseX() {
    return this.camExists
      ? (mouseX - this.x - this.limiter.tm[1]) / this.limiter.tm[0]
      : mouseX - this.x;
  }

  getCMouseY() {
    return this.camExists
      ? (mouseY - this.y - this.limiter.tm[2]) / this.limiter.tm[0]
      : mouseY - this.y;
  }

  isPosWithin(x, y) {
    return (
      x > this.x &&
      x < this.x + this.width &&
      y > this.y &&
      y < this.y + this.height
    );
  }

  mousePressed() {
    this.sx = mouseX;
    this.sy = mouseY;
    if (this.camOn && this.isPosWithin(mouseX, mouseY) && this.show) {
      this.limiter.mousePressed();
    }
  }

  mouseDragged() {
    if (this.camOn && this.allowDrag && this.isPosWithin(this.sx, this.sy) && this.show)
      this.limiter.mouseDragged();
  }

  mouseWheel(e) {
    if (this.camOn && this.allowZoom && this.isPosWithin(mouseX, mouseY) && this.show)
      this.limiter.mouseWheel(e);
  }

  setLimits(x1, y1, x2, y2) {
    if (this.camOn) {
      this.limiter.x1 = x1;
      this.limiter.y1 = y1;
      this.limiter.x2 = x2;
      this.limiter.y2 = y2;
      this.limiter.limitScale();
      this.limiter.limitEdges();
    }
  }

  setMaxZoom(n) {
    if (this.camOn) {
      this.maxZoom = n;
      this.limiter.mz = n;
    }
  }

  setParameter(p, b) {
    for (let i = 0; i < this.parameterNames.length; i++) {
      if (p == this.parameterNames[i]) {
        this.parameters[i] = new Function('n', 'n.' + p + ' = ' + b);
        return;
      }
    }
    this.parameters.push(new Function('n', 'n.' + p + ' = ' + b));
    this.parameterNames.push(p);
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.c = createGraphics(w, h);
  }

  getPosVector(x, y) {
    let posVec = createVector(x, y);
    if (this.camExists) {
      return posVec.sub(createVector(this.x, this.y)).sub(createVector(this.limiter.tm[1], this.limiter.tm[2])).div(this.limiter.tm[0]);
    } else {
      return posVec.sub(createVector(this.x, this.y));
    }
  }
}

class WindowLimiter {
  constructor(x1, y1, x2, y2, i) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.index = i;
    this.tm = [1, 0, 0];
  }

  limitEdges() {
    if (this.tm[1] / this.tm[0] > -this.x1) {
      this.tm[1] = this.tm[0] * -this.x1;
    }
    if ((this.index.width - this.tm[1]) / this.tm[0] > this.x2) {
      this.tm[1] = -(this.x2 * this.tm[0] - this.index.width);
    }
    if (this.tm[2] / this.tm[0] > -this.y1) {
      this.tm[2] = this.tm[0] * -this.y1;
    }
    if ((this.index.height - this.tm[2]) / this.tm[0] > this.y2) {
      this.tm[2] = -(this.y2 * this.tm[0] - this.index.height);
    }
  }

  mousePressed() {
    this.sm = this.tm.copy();
    this.sx = mouseX;
    this.sy = mouseY;
  }

  mouseDragged() {
    this.tm[1] = this.sm[1] - (this.sx - mouseX);
    this.tm[2] = this.sm[2] - (this.sy - mouseY);
    this.limitEdges();
  }

  mouseWheel(e) {
    let nS = 1 - e.deltaY / 1000;
    if (this.tm[0] * nS < this.index.width / (this.x2 - this.x1))
      nS = this.index.width / (this.x2 - this.x1) / this.tm[0];
    if (this.tm[0] * nS < this.index.height / (this.y2 - this.y1))
      nS = this.index.height / (this.y2 - this.y1) / this.tm[0];
    if (this.tm[0] * nS > this.mz) nS = this.mz / this.tm[0];
    this.addM(nS, this.index.getMouseX(), this.index.getMouseY());
    this.sm = this.tm.copy();
    this.sx = mouseX;
    this.sy = mouseY;
    this.limitEdges();
  }

  addM(s, x, y) {
    x = -((x - this.tm[1]) / this.tm[0]) * (s - 1);
    y = -((y - this.tm[2]) / this.tm[0]) * (s - 1);
    this.tm[1] += x * this.tm[0];
    this.tm[2] += y * this.tm[0];
    this.tm[0] *= s;
  }

  limitScale() {
    // let side = (this.index.width < this.index.height) ? this.index.height : this.index.width
    if (this.tm[0] < this.index.width / (this.x2 - this.x1))
      this.tm[0] = this.index.width / (this.x2 - this.x1);
    if (this.tm[0] < this.index.height / (this.y2 - this.y1))
      this.tm[0] = this.index.height / (this.y2 - this.y1);
  }
}

function createWind(n, x, y, w, h) {
  winds.push(new Window(n, x, y, w, h, false));
  wind = winds[winds.length - 1];
}

function createCamWind(n, x, y, w, h) {
  winds.push(new Window(n, x, y, w, h, true));
  wind = winds[winds.length - 1];
}

function setWind(n) {
  for (let w of winds) {
    if (w.n == n) {
      wind = w;
      return;
    }
  }
}

function drawAllWinds() {
  for (let w of winds) {
    w.draw();
  }
}

function deleteWind(n) {
  for (let i = 0; i < winds.length; i++) {
    if (winds[i].n == n) {
      winds.splice(i, 1);
      return;
    }
  }
}

Array.prototype.copy = function () {
  let newArr = [];
  for (let i = 0; i < this.length; i++) {
    newArr[i] = this[i];
  }
  return newArr;
};

addEventListener('mousedown', (e) => {
  for (let w of winds) {
    w.mousePressed(e);
  }
});

addEventListener('mousemove', (e) => {
  if (mouseIsPressed) {
    for (let w of winds) {
      w.mouseDragged(e);
    }
  }
});

addEventListener('wheel', (e) => {
  for (let w of winds) {
    w.mouseWheel(e);
  }
});

for (let w of winds) {
  for (let i = 0; i < w.parameters.length; i++) {
    w.parameters[i](w);
  }
  if (w.camOn) {
    w.c.resetMatrix();
    w.c.applyMatrix(
      w.limiter.tm[0],
      0,
      0,
      w.limiter.tm[0],
      w.limiter.tm[1],
      w.limiter.tm[2]
    );
  }
}

p5.prototype.redraw = function (n) {
  for (let w of winds) {
    for (let i = 0; i < w.parameters.length; i++) {
      w.parameters[i](w);
    }
    if (w.camOn) {
      w.c.resetMatrix();
      w.c.applyMatrix(
        w.limiter.tm[0],
        0,
        0,
        w.limiter.tm[0],
        w.limiter.tm[1],
        w.limiter.tm[2]
      );
    }
  }
  if (this._inUserDraw || !this._setupDone) {
    return;
  }

  var numberOfRedraws = parseInt(n);
  if (isNaN(numberOfRedraws) || numberOfRedraws < 1) {
    numberOfRedraws = 1;
  }

  var context = this._isGlobal ? window : this;
  var userSetup = context.setup;
  var userDraw = context.draw;
  if (typeof userDraw === 'function') {
    if (typeof userSetup === 'undefined') {
      context.scale(context._pixelDensity, context._pixelDensity);
    }
    var callMethod = function callMethod(f) {
      f.call(context);
    };
    for (var idxRedraw = 0; idxRedraw < numberOfRedraws; idxRedraw++) {
      context.resetMatrix();
      if (context._renderer.isP3D) {
        context._renderer._update();
      }
      context._setProperty('frameCount', context.frameCount + 1);
      context._registeredMethods.pre.forEach(callMethod);
      this._inUserDraw = true;
      try {
        userDraw();
      } finally {
        this._inUserDraw = false;
      }
      context._registeredMethods.post.forEach(callMethod);
    }
  }
};
