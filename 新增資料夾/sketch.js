// noprotect

let balls = [];
let gravityConstant = 5.0; 
let maxSpeed = 3.5;

let lastSpawnTime = 0;
let spawnCooldown = 150;

function setup() {
  createCanvas(600, 400);
  for (let i = 0; i < 5; i++) {
    balls.push(new Ball(random(width), random(height)));
  }
}

function draw() {
  background(0);

  // 1. 物理計算與壽命檢查
  for (let i = balls.length - 1; i >= 0; i--) {
    let b = balls[i];
    b.resetDeform();
    b.applyRepulsion(balls);
    b.applyMouseGravity();
    b.update();
    b.checkEdges();

    if (b.isDead()) {
      balls.splice(i, 1);
    }
  }

  // 2. 視覺渲染：步長改為 2，大幅優化效能
  loadPixels();
  
  let mX = mouseX;
  let mY = mouseY;
  let step = 2; // 步長：2代表每 2x2 像素算一次

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      let sum = 0;

      for (let b of balls) {
        let dx = x - b.pos.x;
        let dy = y - b.pos.y;

        let distortedX = dx * (1.0 + b.deform.x * 0.1);
        let distortedY = dy * (1.0 + b.deform.y * 0.1);

        let d = Math.sqrt(distortedX * distortedX + distortedY * distortedY);
        sum += (100 * b.currentRadius) / (d + 1);
      }

      let mouseD = dist(x, y, mX, mY);
      sum += (100 * 15) / (mouseD + 1);

      // 填滿 step x step 的區域
      for (let ky = 0; ky < step; ky++) {
        for (let kx = 0; kx < step; kx++) {
          let px = x + kx;
          let py = y + ky;
          if (px < width && py < height) {
            let index = (px + py * width) * 4;
            if (sum > 165 && sum < 180) {
              pixels[index]     = 0;   
              pixels[index + 1] = 150; 
              pixels[index + 2] = 255; 
              pixels[index + 3] = 255; 
            } else {
              pixels[index]     = 0;   
              pixels[index + 1] = 0;   
              pixels[index + 2] = 0;   
              pixels[index + 3] = 255; 
            }
          }
        }
      }

    }
  }
  updatePixels();
}

function mousePressed() {
  trySpawnBall(mouseX, mouseY);
}

function mouseDragged() {
  trySpawnBall(mouseX, mouseY);
}

function touchStarted() {
  if (touches.length > 0) {
    trySpawnBall(touches[0].x, touches[0].y);
  }
  return false; 
}

function touchMoved() {
  if (touches.length > 0) {
    trySpawnBall(touches[0].x, touches[0].y);
  }
  return false; 
}

function trySpawnBall(targetX, targetY) {
  if (targetX >= 0 && targetX <= width && targetY >= 0 && targetY <= height) {
    if (millis() - lastSpawnTime > spawnCooldown) {
      balls.push(new Ball(targetX, targetY));
      lastSpawnTime = millis();
    }
  }
}

class Ball {
  constructor(startX, startY) {
    this.pos = createVector(startX, startY);
    this.vel = createVector(random(-1.5, 1.5), random(-1.5, 1.5));
    this.acc = createVector(0, 0);
    this.deform = createVector(0, 0);

    this.baseRadius = random(8, 22);
    this.currentRadius = this.baseRadius;
    this.spawnTime = millis();
    this.lifetime = 10000;
  }

  resetDeform() {
    this.deform.set(0, 0);
  }

  applyRepulsion(allBalls) {
    let steer = createVector(0, 0);
    let count = 0;

    for (let other of allBalls) {
      if (other !== this) {
        let d = p5.Vector.dist(this.pos, other.pos);
        let minDist = (this.currentRadius + other.currentRadius) * 1.5;

        if (d > 0 && d < minDist) {
          let diff = p5.Vector.sub(this.pos, other.pos);
          diff.normalize();

          let overlap = minDist - d;
          diff.mult(overlap);
          steer.add(diff);

          this.deform.x += Math.abs(diff.x);
          this.deform.y += Math.abs(diff.y);
          count++;
        }
      }
    }

    if (count > 0) {
      steer.div(count);
      this.deform.div(count);
    }

    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(1.8);
      this.acc.add(steer);
    }
  }

  applyMouseGravity() {
    let mousePos = createVector(mouseX, mouseY);
    let force = p5.Vector.sub(mousePos, this.pos);
    let distance = force.mag();
    distance = constrain(distance, 20.0, 500.0);
    force.normalize();
    
    let strength = (gravityConstant * this.currentRadius) / (distance * distance);
    force.mult(strength);
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    let age = millis() - this.spawnTime;
    if (age < this.lifetime) {
      let lifeRatio = 1.0 - (age / this.lifetime);
      this.currentRadius = this.baseRadius * lifeRatio;
    } else {
      this.currentRadius = 0;
    }
  }

  isDead() {
    return this.currentRadius <= 0;
  }

  checkEdges() {
    if (this.pos.x < 0 || this.pos.x > width) {
      this.vel.x *= -1;
      this.pos.x = constrain(this.pos.x, 0, width);
    }
    if (this.pos.y < 0 || this.pos.y > height) {
      this.vel.y *= -1;
      this.pos.y = constrain(this.pos.y, 0, height);
    }
  }
}