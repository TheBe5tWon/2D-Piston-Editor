let pistonImages = [];

class Piston {
  constructor(p, r, s) {
    this.p = p;
    this.r = r;
    this.sticky = s;
    this.extended = false;
    this.extensionTick;
    this.retractionTick;
    this.extending = false;
    this.retracting = false;
    this.g = createGraphics(64, 64);
    this.movable = true;
  }

  show(c, i, forceX = 0, forceY = 0) {
    this.g.clear();
    let x;
    let y;
    let toNextBlock;
    if (this.p != null) {
      toNextBlock;
      if (this.extended) {
        if (this.extensionTick != undefined && this.extending) {
          if (gameTick - this.extensionTick < 3) {
            toNextBlock = (gameTick - this.extensionTick + i) * thirdOf32;
          } else {
            toNextBlock = 32;
          }
        } else {
          toNextBlock = 32;
        }
      } else {
        if (this.retractionTick != undefined && this.retracting) {
          if (gameTick - this.retractionTick < 3) {
            toNextBlock = 32 - (gameTick - this.retractionTick + i) * thirdOf32;
          } else {
            toNextBlock = 0;
          }
        } else {
          toNextBlock = 0;
        }
      }
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
      toNextBlock = 0;
    }
    switch (this.r) {
      case 0:
        c.image(pistonImages[this.sticky ? 4 : 0], x, y);
        c.image(pistonImages[8], x, y - toNextBlock, 32, 8 + toNextBlock, 0, 0, 32, 8 + toNextBlock);
        break;
      case 1:
        c.image(pistonImages[this.sticky ? 5 : 1], x, y);
        c.image(pistonImages[9], x + 24, y, 8 + toNextBlock, 32, 32 - toNextBlock, 0, 8 + toNextBlock, 32);
        break;
      case 2:
        c.image(pistonImages[this.sticky ? 6 : 2], x, y);
        c.image(pistonImages[10], x, y + 24, 32, 8 + toNextBlock, 0, 32 - toNextBlock, 32, 8 + toNextBlock);
        break;
      case 3:
        c.image(pistonImages[this.sticky ? 7 : 3], x, y);
        c.image(pistonImages[11], x - toNextBlock, y, 8 + toNextBlock, 32, 0, 0, 8 + toNextBlock, 32);
        break;
    }
  }

  extend() {
    if (!this.extended && this.p.movable) {
      let dir;
      switch (this.r) {
        case 0:
          dir = [0, -1];
          break;
        case 1:
          dir = [1, 0];
          break;
        case 2:
          dir = [0, 1];
          break;
        case 3:
          dir = [-1, 0];
          break;
      }
      let l = 0;
      let x = this.p.x;
      let y = this.p.y;
      let moveArr = [];
      while (true) {
        x += dir[0];
        y += dir[1];
        if (l == 13) break;
        if (this.inBounds(x, y)) {
          let block = blocks[x][y].block;
          if (blocks[x][y].movable == false) break;
          if (block == null) {
            this.extensionTick = gameTick;
            this.extended = true;
            this.extending = true;
            this.p.movable = false;
            for (let i = l - 1; i >= 0; i--) {
              blocks[x][y].block = moveArr[i];
              blocks[x][y].movable = false;
              blocks[x][y].moving = true;
              blocks[x][y].movingTick = gameTick;
              blocks[x][y].moveR = this.r;
              moveArr[i].p = blocks[x][y];
              x -= dir[0];
              y -= dir[1];
            }
            blocks[x][y].block = null;
            blocks[x][y].movable = false;
            break;
          }
          moveArr.push(block);
        } else break;
        l++;
      }
    }
  }

  retract() {
    if (this.extended) {
      this.retractionTick = gameTick;
      this.extended = false;
      this.retracting = true;
      let dir;
      switch (this.r) {
        case 0:
          dir = [0, -1];
          break;
        case 1:
          dir = [1, 0];
          break;
        case 2:
          dir = [0, 1];
          break;
        case 3:
          dir = [-1, 0];
          break;
      }
      if (this.sticky) {
        let x = this.p.x + 2 * dir[0];
        let y = this.p.y + 2 * dir[1];
        if (this.inBounds(x, y)) {
          if (blocks[x][y].movable) {
            if (blocks[x][y].block != null) {
              let newBlock = blocks[this.p.x + dir[0]][this.p.y + dir[1]];
              blocks[x][y].block.p = newBlock;
              newBlock.block = blocks[x][y].block;
              newBlock.moving = true;
              newBlock.movingTick = gameTick;
              newBlock.moveR = (this.r + 2) % 4;
              newBlock.movable = false;
              blocks[x][y].block = null;
              blocks[x][y].movable = true;
            } else {
              blocks[this.p.x + dir[0]][this.p.y + dir[1]].movable = true;
              blocks[x][y].moving = false;
              blocks[x][y].movable = true;
            }
          } else if (blocks[x][y].moveR == this.r) {
            blocks[this.p.x + dir[0]][this.p.y + dir[1]].movable = true;
            blocks[x][y].moving = false;
            blocks[x][y].movable = true;
          }
        }
      } else {
        blocks[this.p.x + dir[0]][this.p.y + dir[1]].movable = true;
      }
    }
  }

  update() {
    if (this.extensionTick != undefined && this.extending) {
      if (gameTick - this.extensionTick == 3) this.extending = false;
    }
    if (this.retractionTick != undefined && this.retracting) {
      if (gameTick - this.retractionTick == 3) {
        this.retracting = false;
        this.p.movable = true;
      }
    }
    if (this.p.movingTick != undefined && this.p.moving) {
      if (gameTick - this.p.movingTick == 3) {
        this.p.moving = true;
        this.p.movable = true;
      }
    }
  }

  inBounds(x, y) {
    return !(x == -1 || x == editorWidth || y == -1 || y == editorHeight);
  }

  clone(p) {
    return new Piston(p, this.r, this.sticky);
  }
}
