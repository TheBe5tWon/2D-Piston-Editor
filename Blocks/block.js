class Block {
  constructor(x, y, movable) {
    this.x = x;
    this.y = y;
    this.block = null;
    this.movable = movable;
    this.moving = false;
    this.movingTick;
  }

  newStandardBlock(movable, id) {
    this.block = new StandardBlock(this, movable, id);
  }

  newPiston(r, s) {
    this.block = new Piston(this, r, s);
  }

  show(c, i) {
    this.block.show(c, i);
  }

  clone() {
    let newBlock = new Block(this.x, this.y, this.movable);
    for (let p in newBlock) {
      if (p != 'block') newBlock[p] = this[p];
    }
    if (this.block != null) newBlock.block = this.block.clone(newBlock);
    return newBlock;
  }
}

let standardBlockImages = [];

class StandardBlock {
  constructor(p, movable, id) {
    this.p = p;
    if (this.p != null) this.p.movable = movable;
    this.movable = movable;
    this.id = id;
    this.imgInd = parseInt(this.id) - 2;
  }

  show(c, i, forceX = 0, forceY = 0) {
    c.noStroke();
    c.fill(255);
    let x;
    let y;
    if (this.p != null) {
      x = this.p.x * 32;
      y = this.p.y * 32;
      if (this.p.movingTick != undefined && this.p.moving) {
        if (gameTick - this.p.movingTick < 3) {
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
        }
      }
    } else {
      x = forceX;
      y = forceY;
    }
    c.image(standardBlockImages[this.imgInd], x, y);
  }

  update() {
    if (this.p.movingTick != undefined && this.p.moving) {
      if (gameTick - this.p.movingTick == 3) {
        this.p.moving = true;
        this.p.movable = true;
      }
    }
  }

  clone(p) {
    return new StandardBlock(p, this.movable, this.id);
  }
}
