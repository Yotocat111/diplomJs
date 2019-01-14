"use strict";
const ACTOR = 'actor'
  , LAVA = 'lava'
  , FIREBALL = 'fireball'
  , COIN = 'coin'
  , PLAYER = 'player'
  , WALL = 'wall'
  , FIRERAIN = 'firerain';

const GAME_OBJECTS = {
  'x': WALL,
  '!': LAVA,
  '@': PLAYER,
  'o': COIN,
  '=': FIREBALL,
  '|': FIREBALL,
  'v': FIRERAIN
}

const STATIC_GAME_OBJECTS = {
  'x': WALL,
  '!': LAVA
}
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(v) {
    if (!(v instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + v.x, this.y + v.y);
  }
  times(n) {
    return new Vector(this.x * n, this.y * n);
  }
}
class Actor {
  constructor(pos, size, speed) {
    if (!pos) {
      pos = new Vector(0, 0);
    }
    if (!size) {
      size = new Vector(1, 1);
    }
    if (!speed) {
      speed = new Vector(0, 0);
    }
    if (!(pos instanceof Vector)) {
      throw new Error('Расположение не является объектом типа Vector');
    }
    if (!(size instanceof Vector)) {
      throw new Error('Размер не является объектом типа Vector');
    }
    if (!(speed instanceof Vector)) {
      throw new Error('Скорость не является объектом типа Vector');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }
  act() { }
  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }


  get type() {
    return ACTOR;
  }
  isIntersect(obj) {
    if (!obj || !(obj instanceof Actor)) {
      throw new Error('Нужен объект типа Actor');
    }
    if (obj === this) {
      return false;
    }
    return this.left < obj.right && this.right > obj.left && this.top < obj.bottom && this.bottom > obj.top;

  }
}
class Player extends Actor {
  constructor(pos) {
    if (!pos) {
      pos = new Vector(0, 0);
    }
    pos = pos.plus(new Vector(0, -0.5));
    let size = new Vector(0.8, 1.5),
      speed = new Vector(0, 0);
    super(pos, size, speed);
  }
  get type() {
    return PLAYER;
  }
}
class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(actor => actor.type === PLAYER);
    this.status = null;
    this.finishDelay = 1;
  }
  get height() {
    return this.grid.length;
  }
  get width() {
    return this.grid.reduce(function (prev, arr) {
      return arr.length > prev ? arr.length : prev;
    }, 0);
  }
  isFinished() {
    return (this.status !== null) && (this.finishDelay < 0);
  }
  actorAt(actor) {
    if (!actor || !(actor instanceof Actor)) {
      throw new Error('Нужен объект типа Actor');
    }
    return this.actors.find((elem) => elem.isIntersect(actor));
  }
  obstacleAt(pos, size) {
    if (!pos || !(pos instanceof Vector) || !size || !(size instanceof Vector)) {
      throw new Error('Нужен объект типа Vector');
    }

    let xLeft = Math.floor(pos.x);
    let xRight = Math.floor(pos.x + size.x);
    let yTop = Math.floor(pos.y);
    let yBottom = Math.floor(pos.y + size.y);

    if ((xLeft < 0) || (xRight > this.width) || (yTop < 0)) {
      return WALL;
    }
    if (yBottom >= this.height) {
      return LAVA;
    }
    let x, y;
    for (x = xLeft; x <= xRight; x++) {
      for (y = yTop; y <= yBottom; y++) {
        if ((this.grid[y][x] === WALL) || (this.grid[y][x] === LAVA)) {
          return this.grid[y][x];
        }
      }
    }
  }
  removeActor(actor) {
    if (!actor || !(actor instanceof Actor)) {
      return;
    }
    let indexActor = this.actors.findIndex((elem) => elem === actor);
    if (indexActor !== -1) {
      this.actors.splice(indexActor, 1);
    }
  }
  noMoreActors(type) {
    return this.actors.findIndex((elem) => elem.type === type) === -1;
  }
  playerTouched(type, actor) {
    if (this.status !== null) {
      return;
    }
    if ((type === LAVA) || (type === FIREBALL)) {
      this.status = 'lost';
      return;
    }
    if ((type === COIN) && (actor.type === COIN)) {
      this.removeActor(actor);
      if (this.noMoreActors(COIN)) {
        this.status = 'won';
      }
      return;
    }
  }
}
class Coin extends Actor {
  constructor(pos) {
    if (!pos) {
      pos = new Vector(0, 0);
    }
    pos = pos.plus(new Vector(0.2, 0.1));
    let size = new Vector(0.6, 0.6);
    super(pos, size);

    this.startPos = pos;	// нужна в getNextPosition
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }
  get type() {
    return COIN;
  }
  updateSpring(t = 1) {
    this.spring += this.springSpeed * t;
  }
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist)
  }
  getNextPosition(t = 1) {
    this.updateSpring(t);
    return this.startPos.plus(this.getSpringVector());
  }
  act(t = 1) {
    this.pos = this.getNextPosition(t);
  }
}
class LevelParser {
  constructor(dictionary) {
    this.dictionary = dictionary;
  }
  actorFromSymbol(emblem) {
    if (emblem && this.dictionary) {
      return this.dictionary[emblem];
    }
  }
  obstacleFromSymbol(emblem) {
    if (emblem) {
      return STATIC_GAME_OBJECTS[emblem];
    }
  }
  createGrid(arr) {
    return arr.map(function (row) {
      return [...row].map(elem => STATIC_GAME_OBJECTS[elem]);
    });
  }
  createActors(arr) {
    let self = this;
    return arr.reduce(function (prev, row, Y) {
      [...row].forEach(function (c, X) {
        if (c) {
          let Creator = self.actorFromSymbol(c);
          if (Creator && typeof (Creator) === "function") {
            let pos = new Vector(X, Y);
            let maybeActor = new Creator(pos);
            if (maybeActor instanceof Actor) {
              prev.push(maybeActor);
            }
          }
        }
      });
      return prev;
    }, []);
  }
  parse(arr) {
    return new Level(this.createGrid(arr), this.createActors(arr));
  }
}
class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    let size = new Vector(1, 1);
    super(pos, size, speed);
  }
  get type() {
    return FIREBALL;
  }
  getNextPosition(t = 1) {
    return this.pos.plus(this.speed.times(t));
  }
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  act(t, level) {
    let NextPosition = this.getNextPosition(t);
    if (level.obstacleAt(NextPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = NextPosition;
    }
  }
}
class HorizontalFireball extends Fireball {
  constructor(pos) {
    let speed = new Vector(2, 0);
    super(pos, speed);
  }
}
class VerticalFireball extends Fireball {
  constructor(pos) {
    let speed = new Vector(0, 2);
    super(pos, speed);
  }
}
class FireRain extends Fireball {
  constructor(pos) {
    let speed = new Vector(0, 3);
    super(pos, speed);
    this.startPos = pos;
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}