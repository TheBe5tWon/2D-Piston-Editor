class Block {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.block = null;
    this.movable = true;
    this.moving = false;
    this.movingTick;
  }

  newSolidBlock() {
    this.block = new Solid(this);
  }

  newPiston(r, s) {
    this.block = new Piston(this, r, s);
  }

  show(c, i) {
    this.block.show(c, i);
  }

  clone() {
    let newBlock = new Block(this.x, this.y);
    for (let p in newBlock) {
      if (p != 'block') newBlock[p] = this[p];
    }
    if (this.block != null) newBlock.block = this.block.clone(newBlock);
    return newBlock;
  }
}

class Solid {
  constructor(p) {
    this.p = p;
    this.g = createGraphics(32, 32);
    this.ctx = this.g.drawingContext;
    this.movable = true;
  }

  show(c, i, forceX = 0, forceY = 0) {
    this.g.clear();
    c.noStroke();
    c.fill(255);
    let x;
    let y;
    if (this.p != null) {
      x = this.p.x * 32;
      y = this.p.y * 32;
      if (this.p.movingTick != undefined && this.p.moving) {
        if (gameTick - this.p.movingTick < 3) {
          if (gameTick - this.p.movingTick == 2) this.p.movable = true;
          let toNextBlock = (gameTick - this.p.movingTick + i) * thirdOf32;
          switch (this.p.moveR) {
            case 0:
              y += 32 - toNextBlock;
              break;
            case 1:
              x -= 32 - toNextBlock;
              break;
            case 2:
              y -= 32 - toNextBlock;
              break;
            case 3:
              x += 32 - toNextBlock;
              break;
          }
        } else {
          this.p.moving = false;
        }
      }
    } else {
      x = forceX;
      y = forceY;
    }
    this.ctx.drawImage(woolImg, 0, 0);
    c.image(this.g, x, y);
  }

  clone(p) {
    return new Solid(p);
  }
}
