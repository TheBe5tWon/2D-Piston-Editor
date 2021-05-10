let editorWidth = 25;
let editorHeight = 25;

let startingBlocks;
let startPosBlocks;
let blocks = [];
for (let i = 0; i < editorWidth; i++) {
  blocks[i] = [];
  for (let j = 0; j < editorHeight; j++) {
    blocks[i][j] = new Block(i, j);
  }
}

let totalGameTicks = 60;
let timeline = [];
let collapsed = [];
for (let i = 0; i < totalGameTicks; i++) {
  timeline[i] = [[]];
  collapsed[i] = [];
}

let timelineT;
let gameTick = 0;
let lastGameTickMS;
let gameTickDelay = 200;

let thirdOf32 = 32 / 3;

let backgroundColor;

let editing = true;
let grid = false;
let slot = 0;
let invArr;
let slotArr;
let defaultRotation = 0;
let clickB = false;
let mouseBeginX;
let mouseBeginY;
let mouseGridX;
let mouseGridY;
let selected = [];
let moveSelected = false;
let dragSelect = false;

let timelineHeight = 300;
let timelineClickB = false;
let moveTimelineB = false;
let timelineMoveStartInd;
let timelineSelectInd = new Array(2);
let timelineSelected = [];
let startingTimeline;

let extensionF = (b) => b.extend();
let retractionF = (b) => b.retract();

function preload() {
  for (let i = 0; i < 12; i++) {
    pistonImages[i] = new Image(32, 32);
    pistonImages[i].src = `Blocks/Piston/piston${
      i < 4 ? '' : i < 8 ? '_sticky' : '_head'
    }${i % 4}.png`;
  }
  woolImg = new Image(32, 32);
  woolImg.src = `Blocks/SolidBlocks/wool.png`;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  invArr = new Array(3);
  invArr[0] = {
    s: new Piston(null, 0, false),
    f: (x, y) => blocks[x][y].newPiston(defaultRotation, false),
  };
  invArr[1] = {
    s: new Piston(null, 0, true),
    f: (x, y) => blocks[x][y].newPiston(defaultRotation, true),
  };
  invArr[2] = { s: new Solid(null), f: (x, y) => blocks[x][y].newSolidBlock() };
  slotArr = new Array(9);
  for (let i = 0; i < 9; i++) {
    if (i < invArr.length) slotArr[i] = invArr[i];
  }
  backgroundColor = color(182, 209, 255);
  createCamWind(
    'editor',
    0,
    0,
    min(windowWidth, editorWidth * 32),
    min(windowHeight - timelineHeight - 50, editorHeight * 32)
  );
  wind.x = (width - wind.width) * 0.5;
  wind.y = (height - wind.height - timelineHeight - 50) * 0.5;
  wind.c.drawingContext.imageSmoothingEnabled = false;
  wind.setLimits(0, 0, editorWidth * 32, editorHeight * 32);
  wind.setMaxZoom(2);
  createCamWind('timeline', 0, height - timelineHeight, width, timelineHeight);
  wind.allowZoom = false;
  limitTimeline();
  setWind('editor');
  frameRate(144);
}

function draw() {
  background(180);
  wind.c.background(backgroundColor);
  wind.c.noStroke();
  let percentToNextTick;
  if (timelineT != null && gameTick <= timeline.length) {
    percentToNextTick = map(
      Date.now() - lastGameTickMS,
      0,
      gameTickDelay,
      0,
      1
    );
  }
  for (let y = 0; y < editorHeight; y++) {
    for (let x = 0; x < editorWidth; x++) {
      if (blocks[x][y].block != null)
        blocks[x][y].show(wind.c, percentToNextTick);
    }
  }
  if (editing && slot != 0 && wind.isPosWithin(mouseX, mouseY)) {
    if (!mouseIsPressed || (mouseIsPressed && clickB)) {
      if (slotArr[slot - 1] != undefined) {
        let x = floor(wind.getCMouseX() / 32);
        let y = floor(wind.getCMouseY() / 32);
        wind.c.push();
        wind.c.tint(0, 255, 255, 100);
        let showBlock = slotArr[slot - 1].s.clone();
        if (showBlock.r != undefined) showBlock.r = defaultRotation;
        showBlock.show(wind.c, 0, x * 32, y * 32);
        wind.c.pop();
      }
    }
  }
  wind.c.push();
  wind.c.tint(0, 255, 0, 100);
  for (let block of selected) {
    block.b.show(wind.c, 0, block.x * 32, block.y * 32);
  }
  wind.c.pop();
  if (editing && grid) {
    wind.c.stroke(0);
    for (let x = 1; x < editorWidth; x++) {
      wind.c.line(x * 32, 0, x * 32, 32 * editorWidth);
    }
    for (let y = 1; y < editorHeight; y++) {
      wind.c.line(0, y * 32, 32 * editorHeight, y * 32);
    }
  }
  if (dragSelect && editing && !clickB) {
    wind.c.noStroke();
    wind.c.fill(0, 255, 0, 100);
    let vec = wind.getPosVector(mouseBeginX, mouseBeginY);
    wind.c.push();
    wind.c.rectMode(CORNERS);
    wind.c.rect(vec.x, vec.y, wind.getCMouseX(), wind.getCMouseY());
    wind.c.pop();
  }
  setWind('timeline');
  wind.c.background(220);
  wind.c.stroke(200);
  for (let y = 25; y < wind.limiter.y2; y += 25) {
    wind.c.line(0, y, timeline.length * 50, y);
  }
  wind.c.stroke(0);
  for (let i = 1; i <= timeline.length; i++) {
    wind.c.line(50 * i, 0, 50 * i, wind.limiter.y2);
  }
  for (let i = 0; i < timeline.length; i++) {
    let y = 0;
    for (let j = 0; j < timeline[i].length; j++) {
      if (collapsed[i][j] == false) y += 25 * timeline[i][j].length;
      y += 25;
      wind.c.line(50 * i, y, 50 * (i + 1), y);
    }
  }
  wind.c.fill(0);
  wind.c.noStroke();
  wind.c.push();
  for (let i = 0; i < timeline.length; i++) {
    let y = 0;
    for (let j = 0; j < timeline[i].length; j++) {
      if (collapsed[i][j] == true) {
        wind.c.push();
        wind.c.fill(170);
        drawTimelineNode('expand', i * 50, y, wind.c);
        wind.c.pop();
      } else {
        for (let k = 0; k < timeline[i][j].length; k++) {
          drawTimelineNode(timeline[i][j][k][0].t, i * 50, y, wind.c);
          if (timeline[i][j][k][1] != undefined)
            drawTimelineNode(timeline[i][j][k][1].t, i * 50 + 25, y, wind.c);
          let highlight = false;
          for (let block of selected) {
            if (timeline[i][j][k][0].b == block.b) highlight = true;
          }
          if (highlight) {
            wind.c.push();
            wind.c.fill(0, 255, 0, 50);
            wind.c.rect(i * 50, y, 50, 25);
            wind.c.pop();
          }
          if (i == timelineSelectInd[0] && j == timelineSelectInd[1]) {
            for (let ob of timelineSelected) {
              if (k == ob.ind1 && ob.ind2 == 0) {
                wind.c.push();
                wind.c.fill(0, 255, 255, 100);
                wind.c.rect(i * 50, y, 25, 25);
                wind.c.pop();
              } else if (k == ob.ind1 && ob.ind2 == 1) {
                wind.c.push();
                wind.c.fill(0, 255, 255, 100);
                wind.c.rect(i * 50 + 25, y, 25, 25);
                wind.c.pop();
              }
            }
          }
          y += 25;
        }
        if (collapsed[i][j] == false) {
          wind.c.push();
          wind.c.fill(170);
          drawTimelineNode('collapse', i * 50, y, wind.c);
          wind.c.pop();
        }
      }
      y += 25;
    }
  }
  wind.c.pop();
  if (timelineT != null && gameTick < timeline.length) {
    wind.c.stroke(200, 0, 0);
    wind.c.strokeWeight(2);
    let x = (gameTick + percentToNextTick) * 50;
    wind.c.line(x, 0, x, wind.limiter.y2);
  }
  setWind('editor');
  drawAllWinds();
  noFill();
  stroke(0);
  for (let i = 1; i <= 9; i++) {
    if (slot == i) {
      strokeWeight(5);
    } else {
      strokeWeight(2);
    }
    rect(width * 0.5 + (i - 5.5) * 50, height - 50 - timelineHeight, 50, 50);
  }
  if (slotArr.length > 0) {
    for (let i = 0; i < 9; i++) {
      if (slotArr[i] != undefined) {
        slotArr[i].s.show(
          window,
          0,
          width * 0.5 + (i - 4.5) * 50 + 9,
          height - 41 - timelineHeight
        );
      }
    }
  }
  noStroke();
  fill(0);
  textAlign(LEFT, TOP);
  textSize(12);
  text(round(frameRate()), 0, 0);
}

function setKeyText() {
  textSize(20);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
}

function setStringText() {
  textSize(18);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);
}

function calcStart() {
  startingBlocks = blocks.clone();
  startingTimeline = [];
  for (let i = 0; i < timeline.length; i++) {
    startingTimeline[i] = [];
    for (let j = 0; j < timeline[i].length; j++) {
      startingTimeline[i][j] = [];
      for (let k = 0; k < timeline[i][j].length; k++) {
        startingTimeline[i][j][k] = new Array(2);
        for (let l = 0; l < 2; l++) {
          let block = timeline[i][j][k][l];
          if (block != undefined)
            startingTimeline[i][j][k][l] = {
              b: startingBlocks[block.b.p.x][block.b.p.y].block,
              f: block.f,
              t: block.t,
            };
        }
      }
    }
  }
}

function selectedIncludes(x, y) {
  for (let block of selected) {
    if (block.x == x && block.y == y) return true;
  }
  return false;
}

function putDownSelected(B = true) {
  for (let i = 0; i < selected.length; i++) {
    if (B) {
      block = selected[i];
    } else {
      block = { b: selected[i].b.clone(), x: selected[i].x, y: selected[i].y };
      for (let j = 0; j < timeline.length; j++) {
        for (let k = 0; k < timeline[j].length; k++) {
          for (let l = timeline[j][k].length - 1; l >= 0; l--) {
            let tB = timeline[j][k][l];
            if (tB[0] != undefined && tB[0].b == selected[i].b) {
              let newArr = [];
              newArr.push({ b: block.b, f: tB[0].f, t: tB[0].t });
              if (tB[1] != undefined) {
                newArr.push({ b: block.b, f: tB[1].f, t: tB[1].t });
              } else {
                newArr.push(undefined);
              }
              timeline[j][k].splice(l, 0, newArr);
            }
          }
        }
      }
    }
    if (inGridRange(block.x, block.y)) {
      block.b.p = blocks[block.x][block.y];
      if (blocks[block.x][block.y].block != null)
        deleteFromTimeline(blocks[block.x][block.y].block);
      blocks[block.x][block.y].block = block.b;
      blocks[block.x][block.y].movable = block.b.movable;
    }
  }
  if (B) selected = [];
}

function rotateSelected(B) {
  for (let block of selected) {
    let dx = mouseGridX - block.x;
    let dy = mouseGridY - block.y;
    if (block.b.r != undefined) block.b.r = (block.b.r + (B ? 1 : 3)) % 4;
    block.x = mouseGridX + (B ? dy : -dy);
    block.y = mouseGridY + (B ? -dx : dx);
  }
}

function timelineHandler() {
  gameTick++;
  let i = gameTick - 1;
  for (let x = 0; x < editorWidth; x++) {
    for (let y = 0; y < editorHeight; y++) {
      if (blocks[x][y].block != null) {
        blocks[x][y].block.update();
      }
    }
  }
  for (let j = 0; j < timeline[i].length; j++) {
    for (let k = 0; k < timeline[i][j].length; k++) {
      let block = timeline[i][j][k][0];
      block.f(block.b);
    }
    for (let k = 0; k < timeline[i][j].length; k++) {
      let block = timeline[i][j][k][1];
      if (block != undefined) {
        block.f(block.b);
      }
    }
  }
  if (gameTick >= timeline.length) stopTimeline();
  lastGameTickMS = Date.now();
}

function startTimeline() {
  timelineT = setInterval(timelineHandler, gameTickDelay);
  gameTick = 0;
  lastGameTickMS = Date.now();
}

function stopTimeline() {
  clearInterval(timelineT);
  timelineT = null;
  editing = true;
  blocks = startingBlocks;
  timeline = startingTimeline;
  startingTimeline = null;
  startingBlocks = null;
  gameTick = 0;
}

function getTimelineSpot() {
  setWind('timeline');
  let mX = wind.getCMouseX();
  let mY = wind.getCMouseY();
  setWind('editor');
  let ind1 = min(floor(mX / 50), timeline.length - 1);
  let ind2 = timeline[ind1].length;
  let y = 0;
  let tempY = y;
  for (let i = 0; i < timeline[ind1].length; i++) {
    if (collapsed[ind1][i] == false) tempY += timeline[ind1][i].length * 25;
    if (tempY + 25 > mY) {
      ind2 = i;
      break;
    }
    tempY += 25;
    y = tempY;
  }
  let ind3;
  if (ind2 == timeline[ind1].length) {
    ind3 = 0;
  } else {
    ind3 = timeline[ind1][ind2].length;
    tempY = y;
    for (let i = 0; i < timeline[ind1][ind2].length; i++) {
      if (collapsed[ind1][ind2] == false) tempY += 25;
      if (tempY > mY) {
        ind3 = i;
        break;
      }
      y = tempY;
    }
  }
  let ind4 = mX - 50 * ind1 > 25 ? 1 : 0;
  return [ind1, ind2, ind3, ind4];
}

function limitTimeline() {
  let maxH = 50;
  for (let i = 0; i < timeline.length; i++) {
    let h = 0;
    for (let j = 0; j < timeline[i].length; j++) {
      if (collapsed[i][j] == false) h += 25 * timeline[i][j].length;
      h += 25;
    }
    h += 25;
    if (h > maxH) maxH = h;
  }
  setWind('timeline');
  wind.setLimits(
    0,
    0,
    max(width, totalGameTicks * 50),
    max(timelineHeight, maxH)
  );
}

function deleteFromTimeline(block) {
  for (let i = timeline.length - 1; i >= 0; i--) {
    for (let j = timeline[i].length - 1; j >= 0; j--) {
      for (let k = timeline[i][j].length - 1; k >= 0; k--) {
        if (timeline[i][j][k][0].b == block) {
          timeline[i][j].splice(k, 1);
          if (timeline[i][j].length == 0) {
            if (timeline[i].length > 1) timeline[i].splice(j, 1);
            collapsed[i].splice(j, 1);
          }
        }
      }
    }
  }
}

function drawTimelineNode(t, x, y, c = window) {
  switch (t) {
    case 'piston extend':
      c.beginShape();
      c.vertex(x + 7, y + 5);
      c.vertex(x + 20, y + 12.5);
      c.vertex(x + 7, y + 20);
      c.endShape();
      break;
    case 'piston retract':
      c.beginShape();
      c.vertex(x + 18, y + 5);
      c.vertex(x + 18, y + 20);
      c.vertex(x + 5, y + 12.5);
      c.endShape();
      break;
    case 'collapse':
      c.beginShape();
      c.vertex(x + 15, y + 17);
      c.vertex(x + 25, y + 8);
      c.vertex(x + 35, y + 17);
      c.endShape();
      break;
    case 'expand':
      c.beginShape();
      c.vertex(x + 15, y + 8);
      c.vertex(x + 35, y + 8);
      c.vertex(x + 25, y + 17);
      c.endShape();
      break;
  }
}

function deleteTimelineSelected() {
  let spliceArr = [];
  let t = timeline[timelineSelectInd[0]][timelineSelectInd[1]];
  for (let ob of timelineSelected) {
    t[ob.ind1][ob.ind2] = undefined;
    if (t[ob.ind1][0] == undefined && t[ob.ind1][1] == undefined)
      spliceArr.push(ob.ind1);
  }
  for (let ob of timelineSelected) {
    if (ob.ind2 == 0 && t[ob.ind1][1] != undefined) {
      t[ob.ind1][0] = t[ob.ind1][1];
      t[ob.ind1][1] = undefined;
    }
  }
  sort(spliceArr);
  reverse(spliceArr);
  for (let i of spliceArr) {
    t.splice(i, 1);
  }
  if (t.length == 0) {
    if (timeline[timelineSelectInd[0]].length > 1) {
      timeline[timelineSelectInd[0]].splice(timelineSelectInd[1], 1);
    }
    collapsed[timelineSelectInd[0]].splice(timelineSelectInd[1], 1);
  }
  timelineSelected = [];
  limitTimeline();
}

function mergeTimelineEnds(ind1, ind2) {
  let t = timeline[ind1][ind2];
  let spliceArr = [];
  for (let i = 0; i < t.length; i++) {
    for (let j = i + 1; j < t.length; j++) {
      if (t[i][1] != undefined) break;
      if (t[j][1] != undefined) continue;
      if (t[i][0].b == t[j][0].b) {
        if (t[i][0].t == 'piston extend' && t[j][0].t == 'piston retract') {
          t[i][1] = t[j][0];
          spliceArr.push(j);
        } else if (
          t[i][0].t == 'piston retract' &&
          t[j][0].t == 'piston extend'
        ) {
          let temp = t[i][0];
          t[i][0] = t[j][0];
          t[i][1] = temp;
          spliceArr.push(j);
        }
      }
    }
  }
  sort(spliceArr);
  reverse(spliceArr);
  for (let i of spliceArr) {
    t.splice(i, 1);
  }
  limitTimeline();
}

function keyPressed() {
  for (let i = 1; i <= 9; i++) {
    if (key == i.toString()) {
      if (slot == i) {
        slot = 0;
      } else {
        putDownSelected();
        slot = i;
      }
    }
  }
  if (key == ' ') {
    if (timelineT == null) {
      putDownSelected();
      calcStart();
      clickB = false;
      wind.allowDrag = true;
      moveSelected = false;
      dragSelect = false;
      startTimeline();
      editing = false;
    } else {
      stopTimeline();
    }
  } else if (key == 'g' && editing) {
    grid = !grid;
  } else if (keyCode == BACKSPACE || keyCode == DELETE) {
    if (selected.length > 0) {
      for (let block of selected) {
        deleteFromTimeline(block.b);
      }
    } else if (timelineSelected.length > 0) {
      deleteTimelineSelected();
    }
    if (!keyIsDown(CONTROL)) selected = [];
  } else if (keyCode == LEFT_ARROW) {
    if (editing) {
      if (slot != 0) {
        defaultRotation = (defaultRotation + 3) % 4;
      } else {
        rotateSelected(false);
      }
    }
  } else if (keyCode == RIGHT_ARROW || key == 'r') {
    if (editing) {
      if (slot != 0) {
        defaultRotation = (defaultRotation + 1) % 4;
      } else {
        rotateSelected(true);
      }
    }
  } else if (key == 'c') {
    if (editing && slot == 0) putDownSelected(false);
  }
}

function mousePressed() {
  if (mouseButton == LEFT) {
    mouseBeginX = mouseX;
    mouseBeginY = mouseY;
    if (wind.isPosWithin(mouseX, mouseY)) {
      clickB = true;
      let x = floor(wind.getCMouseX() / 32);
      let y = floor(wind.getCMouseY() / 32);
      if (keyIsDown(SHIFT)) {
        wind.allowDrag = false;
        mouseGridX = x;
        mouseGridY = y;
        dragSelect = true;
      } else {
        if (selectedIncludes(x, y)) {
          wind.allowDrag = false;
          mouseGridX = x;
          mouseGridY = y;
          moveSelected = true;
        }
      }
    } else {
      setWind('timeline');
      if (wind.isPosWithin(mouseX, mouseY)) {
        timelineClickB = true;
        if (!keyIsDown(SHIFT)) {
          let ind = getTimelineSpot();
          let b = false;
          for (let ob of timelineSelected) {
            if (
              ind[0] == timelineSelectInd[0] &&
              ind[1] == timelineSelectInd[1] &&
              ob.ind1 == ind[2] &&
              ob.ind2 == ind[3]
            )
              b = true;
          }
          if (b) {
            timelineMoveStartInd = [ind[0], ind[1]];
            moveTimelineB = true;
            setWind('timeline');
            wind.allowDrag = false;
          }
        }
      }
      setWind('editor');
    }
  }
}

function mouseDragged() {
  if (mouseButton == LEFT) {
    if (clickB) {
      if (dist(mouseX, mouseY, mouseBeginX, mouseBeginY) > 8) clickB = false;
    } else if (timelineClickB) {
      if (dist(mouseX, mouseY, mouseBeginX, mouseBeginY) > 8)
        timelineClickB = false;
    } else {
      if (moveSelected && editing) {
        let x = floor(wind.getCMouseX() / 32);
        let y = floor(wind.getCMouseY() / 32);
        let dx = x - mouseGridX;
        let dy = y - mouseGridY;
        for (let block of selected) {
          block.x += dx;
          block.y += dy;
        }
        if (dx != 0) mouseGridX = x;
        if (dy != 0) mouseGridY = y;
      }
    }
  }
}

function mouseReleased() {
  if (mouseButton == LEFT) {
    if (clickB) dragSelect = false;
    if (clickB && editing && wind.isPosWithin(mouseX, mouseY)) {
      if (slot != 0) {
        if (slotArr[slot - 1] != undefined) {
          let x = floor(wind.getCMouseX() / 32);
          let y = floor(wind.getCMouseY() / 32);
          if (inGridRange(x, y)) {
            if (blocks[x][y].block != null)
              deleteFromTimeline(blocks[x][y].block);
            slotArr[slot - 1].f(x, y);
          }
        }
      } else {
        let x = floor(wind.getCMouseX() / 32);
        let y = floor(wind.getCMouseY() / 32);
        if (blocks[x][y].block != null) {
          let newBlock = blocks[x][y].block;
          newBlock.p = undefined;
          mouseGridX = x;
          mouseGridY = y;
          if (keyIsDown(SHIFT)) {
            selected.push({ b: newBlock, x: x, y: y });
            blocks[x][y].block = null;
            blocks[x][y].movable = true;
            timelineSelected = [];
          } else {
            putDownSelected();
            selected = [{ b: newBlock, x: x, y: y }];
            blocks[x][y].block = null;
            blocks[x][y].movable = true;
            timelineSelected = [];
          }
        } else if (!keyIsDown(SHIFT)) {
          putDownSelected();
          if (blocks[x][y].block != null) {
            let newBlock = blocks[x][y].block;
            newBlock.p = undefined;
            selected = [{ b: newBlock, x: x, y: y }];
            blocks[x][y].block = null;
            blocks[x][y].movable = true;
            mouseGridX = x;
            mouseGridY = y;
            timelineSelected = [];
          }
        }
      }
    } else if (dragSelect && editing) {
      putDownSelected();
      selected = [];
      let x = floor(wind.getCMouseX() / 32);
      let y = floor(wind.getCMouseY() / 32);
      for (
        let gX = mouseGridX;
        x > mouseGridX ? gX <= x : gX >= x;
        gX += x > mouseGridX ? 1 : -1
      ) {
        for (
          let gY = mouseGridY;
          y > mouseGridY ? gY <= y : gY >= y;
          gY += y > mouseGridY ? 1 : -1
        ) {
          if (inGridRange(gX, gY)) {
            if (blocks[gX][gY].block != null) {
              let newBlock = blocks[gX][gY].block;
              newBlock.p = undefined;
              selected.push({ b: newBlock, x: gX, y: gY });
              blocks[gX][gY].block = null;
              blocks[gX][gY].movable = true;
              timelineSelected = [];
            }
          }
        }
      }
    } else if (timelineClickB && editing) {
      let ind = getTimelineSpot();
      if (
        ind[1] != timeline[ind[0]].length &&
        ind[2] == timeline[ind[0]][ind[1]].length &&
        timeline[ind[0]][ind[1]].length > 0
      ) {
        if (keyIsDown(SHIFT)) {
          timelineSelected = [];
          let t = timeline[ind[0]][ind[1]];
          for (let i = 0; i < t.length; i++) {
            for (let j = 0; j < 2; j++) {
              if (t[i][j] != undefined)
                timelineSelected.push({ ind1: i, ind2: j });
            }
          }
          timelineSelectInd = [ind[0], ind[1]];
        } else {
          collapsed[ind[0]][ind[1]] = !collapsed[ind[0]][ind[1]];
        }
      } else if (selected.length > 0) {
        if (timeline[ind[0]].length == 1 && timeline[ind[0]][0].length == 0) {
          ind[1] = 0;
        }
        for (let block of selected) {
          blockLoop: {
            if (block.b instanceof Piston) {
              for (let i = 0; i < timeline[ind[0]].length; i++) {
                for (let j = 0; j < timeline[ind[0]][i].length; j++) {
                  if (timeline[ind[0]][i][j][0].b == block.b) break blockLoop;
                }
              }
              if (timeline[ind[0]].length == ind[1]) {
                timeline[ind[0]][ind[1]] = [];
              }
              if (collapsed[ind[0]].length == ind[1]) {
                collapsed[ind[0]][ind[1]] = false;
              }
              timeline[ind[0]][ind[1]].push([
                { b: block.b, f: extensionF, t: 'piston extend' },
                { b: block.b, f: retractionF, t: 'piston retract' },
              ]);
            }
          }
        }
      } else {
        if (timelineSelectInd[0] != ind[0] || timelineSelectInd[1] != ind[1]) {
          timelineSelectInd = [ind[0], ind[1]];
          timelineSelected = [];
        }
        if (
          timeline[ind[0]].length > ind[1] &&
          timeline[ind[0]][ind[1]][ind[2]] != undefined
        ) {
          if (!keyIsDown(SHIFT)) timelineSelected = [];
          let b = true;
          let B = timeline[ind[0]][ind[1]][ind[2]][1] == undefined;
          for (let ob of timelineSelected) {
            if (ob.ind1 == ind[2] && (B ? ob.ind2 == 0 : ob.ind2 == ind[3]))
              b = false;
          }
          let ind2 = B ? 0 : ind[3];
          if (b) timelineSelected.push({ ind1: ind[2], ind2: ind2 });
        }
      }
      limitTimeline();
      setWind('editor');
    } else if (moveTimelineB && editing) {
      setWind('timeline');
      if (wind.isPosWithin(mouseX, mouseY)) {
        let ind = getTimelineSpot();
        if (
          timelineMoveStartInd[0] != ind[0] ||
          timelineMoveStartInd[1] != ind[1]
        ) {
          let newArr = [];
          let ind1Arr = [];
          for (let ob of timelineSelected) {
            let b = true;
            for (let i = 0; i < ind1Arr.length; i++) {
              if (ob.ind1 == ind1Arr[i]) {
                b = false;
                newArr[i][ob.ind2] =
                  timeline[timelineMoveStartInd[0]][timelineMoveStartInd[1]][
                    ob.ind1
                  ][ob.ind2];
              }
            }
            if (b) {
              ind1Arr.push(ob.ind1);
              let arrL2 = new Array(2);
              arrL2[ob.ind2] =
                timeline[timelineMoveStartInd[0]][timelineMoveStartInd[1]][
                  ob.ind1
                ][ob.ind2];
              newArr.push(arrL2);
            }
          }
          for (let arr of newArr) {
            if (arr[0] == undefined) {
              arr[0] = arr[1];
              arr[1] = undefined;
            }
          }
          if (timeline[ind[0]].length == 1 && timeline[ind[0]][0].length == 0) {
            ind[1] = 0;
          }
          if (timeline[ind[0]].length == ind[1]) {
            timeline[ind[0]][ind[1]] = [];
          }
          if (collapsed[ind[0]].length == ind[1]) {
            collapsed[ind[0]][ind[1]] = false;
          }
          let l = timeline[ind[0]][ind[1]].length;
          for (let i = 0; i < newArr.length; i++) {
            timeline[ind[0]][ind[1]][l + i] = newArr[i];
          }
          mergeTimelineEnds(ind[0], ind[1]);
          if (!keyIsDown(CONTROL)) {
            deleteTimelineSelected();
          }
          limitTimeline();
        } else if (timelineSelected.length == 1) {
          label: {
            let ind1 = timelineSelected[0].ind1;
            if (
              timelineSelected[0].ind2 == 1 ||
              timeline[ind[0]][ind[1]][ind1][1] != undefined
            ) {
              console.log('nope');
              break label;
            }
            if (ind[2] > ind1) {
              let s1 = timeline[ind[0]][ind[1]].slice(ind1 + 1, ind[2] + 1);
              s1.push(timeline[ind[0]][ind[1]][ind1]);
              for (let i = 0; i < s1.length; i++) {
                timeline[ind[0]][ind[1]][ind1 + i] = s1[i];
              }
              timelineSelected = [{ ind1: ind[2], ind2: 0 }];
            } else if (ind[2] < ind1) {
              let s1 = timeline[ind[0]][ind[1]].slice(ind[2], ind1);
              s1.splice(0, 0, timeline[ind[0]][ind[1]][ind1]);
              for (let i = 0; i < s1.length; i++) {
                timeline[ind[0]][ind[1]][ind[2] + i] = s1[i];
              }
              timelineSelected = [{ ind1: ind[2], ind2: 0 }];
            }
          }
        } else if (
          timelineSelected.length == 2 &&
          timelineSelected[0].ind1 == timelineSelected[1].ind1
        ) {
          let ind1 = timelineSelected[0].ind1;
          if (ind[2] > ind1) {
            let s1 = timeline[ind[0]][ind[1]].slice(ind1 + 1, ind[2] + 1);
            s1.push(timeline[ind[0]][ind[1]][ind1]);
            for (let i = 0; i < s1.length; i++) {
              timeline[ind[0]][ind[1]][ind1 + i] = s1[i];
            }
            timelineSelected = [
              { ind1: ind[2], ind2: 0 },
              { ind1: ind[2], ind2: 1 },
            ];
          } else if (ind[2] < ind1) {
            let s1 = timeline[ind[0]][ind[1]].slice(ind[2], ind1);
            s1.splice(0, 0, timeline[ind[0]][ind[1]][ind1]);
            for (let i = 0; i < s1.length; i++) {
              timeline[ind[0]][ind[1]][ind[2] + i] = s1[i];
            }
            timelineSelected = [
              { ind1: ind[2], ind2: 0 },
              { ind1: ind[2], ind2: 1 },
            ];
          }
        }
      }
      setWind('editor');
    }
    clickB = false;
    wind.allowDrag = true;
    moveSelected = false;
    dragSelect = false;
    setWind('timeline');
    wind.allowDrag = true;
    setWind('editor');
    timelineClickB = false;
    moveTimelineB = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setWind('timeline');
  wind.resize(width, timelineHeight);
  wind.y = height - timelineHeight;
  limitTimeline();
  setWind('editor');
  wind.resize(
    min(windowWidth, editorWidth * 32),
    min(windowHeight - timelineHeight - 50, editorHeight * 32)
  );
  wind.c.drawingContext.imageSmoothingEnabled = false;
  wind.x = (width - wind.width) * 0.5;
  wind.y = (height - wind.height - timelineHeight - 50) * 0.5;
  wind.limiter.limitScale();
  wind.limiter.limitEdges();
}

function inGridRange(x, y) {
  return !(x < 0 || x >= editorWidth || y < 0 || y >= editorHeight);
}

Array.prototype.clone = function () {
  let newArr = [];
  for (let i = 0; i < this.length; i++) {
    let n = this[i];
    if (typeof n == 'number' || n == undefined || n == null) {
      newArr[i] = n;
    } else if (typeof n == 'object') {
      newArr[i] = n.clone();
    }
  }
  return newArr;
};
