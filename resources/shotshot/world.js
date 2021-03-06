// 世界

function World (info) {
  this.E = info.E; // 相关引擎
  this._instance = info._instance;
  this.engine = info.engine;
  this.metrics = info.metrics; // 世界的各种尺寸
  this.lockedHero = null; // 被锁定的hero
  this.heros = []; // 在场的所有人
  /*
  世界宽度
  世界高度
  heros
  视角锁定hero
  */
  this.initRender()
  this.initWorld()
  this.makeBound()
  this.bootStrapLoop()
}

World.prototype.removeHero = function (hero) {
  this.heros = this.heros.filter(h => h != hero)
}

World.prototype.initRender = function () {
  let { vPortWidth, vPortHeight } = this.metrics;
  let { Render } = this.E;
  let { engine } = this;
  this.render = Render.create({
    element: document.body,
    engine,
    options: {
        width: vPortWidth,
        height: vPortHeight,
        // showAngleIndicator: true,
        hasBounds: true,
        wireframes: false
    }
  });
}

World.prototype.initWorld = function () {
  let world = this._instance;
  let {width, height} = this.metrics;

  world.gravity.y = 0;

  world.bounds.min.x = 0;
  world.bounds.min.y = 0;
  world.bounds.max.x = width;
  world.bounds.max.y = height;
}

World.prototype.makeBound = function () {
  let { width, height } = this.metrics;
  let {thicknessOfBound} = this.metrics;
  let STATIC = { isStatic: true };

  let { Bodies, World } = this.E;
  let bounds = [
/* 上 */ Bodies.rectangle(
          width / 2,
          0,
          width,
          thicknessOfBound,
          STATIC
        ),
/* 下 */ Bodies.rectangle(
          width / 2,
          height,
          width,
          thicknessOfBound,
          STATIC
        ),
/* 左 */Bodies.rectangle(
          0,
          height / 2,
          thicknessOfBound,
          width,
          STATIC
        ),
/* 右 */Bodies.rectangle(
          width,
          height / 2,
          thicknessOfBound,
          width,
          STATIC
        ),
  ]
  World.add(this._instance, bounds)
}

World.prototype.lockon = function (hero) {
  this.lockedHero = hero // so it is me
  hero.reportStatusLoop()
}


World.prototype.bootStrapLoop = function () {
  var canvasEle = document.getElementsByTagName('canvas')[0]
  var cWidth = canvasEle.width;
  var cHeight = canvasEle.height;
  var viewportCentre = {
    x: cWidth * 0.5,
    y: cHeight * 0.5
  };
  var yourPositionAbs = Object.assign({}, viewportCentre);
  let { Events, Body } = this.E
  let world = this._instance
  // 安装循环
  Events.on(engine, 'beforeUpdate', event => {
    this.heros.forEach(hero => {
      if(hero === this.lockedHero) {
        hero.nextFrame()
      } else { // 其实应该没什么不同
        hero.nextFrame()
      }
    })

    let lockedHeroInstance = this.lockedHero._instance
    let dead = this.lockedHero.isDead();
    if(!dead) { // 视角，自己挂了之后则可以选择看谁的视角

      var aposi = this.controller.getMousePosition();
      var viewOffsetX = (aposi.x - viewportCentre.x) / 3;
      var viewOffsetY = (aposi.y - viewportCentre.y) / 3;


      yourPositionAbs.x = viewportCentre.x + viewOffsetX;
      yourPositionAbs.y = viewportCentre.y + viewOffsetY;
      this.lockedHero.fixedPosi = yourPositionAbs; // 需要获取英雄的固定位置用来发射子弹

      var www = aposi.x - yourPositionAbs.x;
      var hhh = aposi.y - yourPositionAbs.y;
      var ang = Math.atan(hhh / www)
      Body.setAngle(lockedHeroInstance, ang)

      var { FOV } = this.lockedHero.metrics
      // Fallow Hero X
      this.render.bounds.min.x = lockedHeroInstance.position.x - (cWidth / 2) * FOV + viewOffsetX;
      this.render.bounds.max.x = lockedHeroInstance.position.x + (cWidth / 2) * FOV + viewOffsetX;

      // Fallow Hero Y
      this.render.bounds.min.y = lockedHeroInstance.position.y - (cHeight / 2) * FOV + viewOffsetY;
      this.render.bounds.max.y = lockedHeroInstance.position.y + (cHeight / 2) * FOV + viewOffsetY;

    } else {
      // 可以看别人的视角 => P2
    }
  })

  Events.on(engine, 'collisionStart', function(event) {
    var { bodyA, bodyB } = event.pairs[0];
    var bullet = bodyA._isBullet ? bodyA : (bodyB._isBullet ? bodyB : null)
    var hero = bodyA._isHero ? bodyA : (bodyB._isHero ? bodyB : null)

    if(bullet) {
      bullet._obj.removeBecauseHit()
    }

    if(bullet && hero) {
      hero._obj.fuckedBy(bullet._obj.attck(), bullet._obj)
    }
  });
}
