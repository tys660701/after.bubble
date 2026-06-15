ArrayList<Ball> balls = new ArrayList<Ball>();
float gravityConstant = 0.5;
float maxSpeed = 3.5;

int lastSpawnTime = 0;
int spawnCooldown = 150;

void setup() {
  size(600, 400);
  for (int i = 0; i < 5; i++) {
    balls.add(new Ball(random(width), random(height)));
  }
}

void draw() {
  background(0);

  // 1. 物理計算與壽命檢查（10秒消失）
  for (int i = balls.size() - 1; i >= 0; i--) {
    Ball b = balls.get(i);
    b.resetDeform();
    b.applyRepulsion(balls);
    b.applyMouseGravity();
    b.update();
    b.checkEdges();

    if (b.isDead()) {
      balls.remove(i);
    }
  }

  // 2. 視覺渲染：去光暈、純藍色單線條演算
  loadPixels();
  for (int x = 0; x < width; x++) {
    for (int y = 0; y < height; y++) {
      float sum = 0;

      for (Ball b : balls) {
        float dx = x - b.pos.x;
        float dy = y - b.pos.y;

        // 擠壓形狀扭曲變形
        float distortedX = dx * (1.0 + b.deform.x * 0.1);
        float distortedY = dy * (1.0 + b.deform.y * 0.1);

        float d = sqrt(distortedX * distortedX + distortedY * distortedY);
        sum += 100 * b.currentRadius / (d + 1);
      }

      float mouseD = dist(x, y, mouseX, mouseY);
      sum += 100 * 15 / (mouseD + 1);

      int index = x + y * width;

      // 【核心修改】精準過濾窄帶，只留單一純藍色實線邊框，其餘全部塗黑
      if (sum > 165 && sum < 180) {
        pixels[index] = color(0, 150, 255); // 乾淨亮藍色線條
      } else {
        pixels[index] = color(0, 0, 0);     // 內部與外部全純黑
      }
    }
  }
  updatePixels();
}

void mouseDragged() {
  trySpawnBall();
}

void mousePressed() {
  trySpawnBall();
}

void trySpawnBall() {
  if (millis() - lastSpawnTime > spawnCooldown) {
    balls.add(new Ball(mouseX, mouseY));
    lastSpawnTime = millis();
  }
}

class Ball {
  PVector pos, vel, acc;
  PVector deform;
  float baseRadius;
  float currentRadius;
  int spawnTime;
  int lifetime = 10000;

  Ball(float startX, float startY) {
    pos = new PVector(startX, startY);
    vel = new PVector(random(-1.5, 1.5), random(-1.5, 1.5));
    acc = new PVector(0, 0);
    deform = new PVector(0, 0);

    baseRadius = random(8, 22);
    currentRadius = baseRadius;
    spawnTime = millis();
  }

  void resetDeform() {
    deform.set(0, 0);
  }

  void applyRepulsion(ArrayList<Ball> allBalls) {
    PVector steer = new PVector(0, 0);
    int count = 0;

    for (Ball other : allBalls) {
      if (other != this) {
        float d = PVector.dist(pos, other.pos);
        float minDist = (currentRadius + other.currentRadius) * 1.5;

        if (d > 0 && d < minDist) {
          PVector diff = PVector.sub(pos, other.pos);
          diff.normalize();

          float overlap = minDist - d;
          diff.mult(overlap);
          steer.add(diff);

          deform.x += abs(diff.x);
          deform.y += abs(diff.y);
          count++;
        }
      }
    }

    if (count > 0) {
      steer.div((float)count);
      deform.div((float)count);
    }

    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(1.8);
      acc.add(steer);
    }
  }

  void applyMouseGravity() {
    PVector mousePos = new PVector(mouseX, mouseY);
    PVector force = PVector.sub(mousePos, pos);
    float distance = force.mag();
    distance = constrain(distance, 20.0, 500.0);
    force.normalize();
    float strength = (gravityConstant * currentRadius) / (distance * distance);
    force.mult(strength);
    acc.add(force);
  }

  void update() {
    vel.add(acc);
    vel.limit(maxSpeed);
    pos.add(vel);
    acc.mult(0);

    int age = millis() - spawnTime;
    if (age < lifetime) {
      float lifeRatio = 1.0 - ((float)age / lifetime);
      currentRadius = baseRadius * lifeRatio;
    } else {
      currentRadius = 0;
    }
  }

  boolean isDead() {
    return currentRadius <= 0;
  }

  void checkEdges() {
    if (pos.x < 0 || pos.x > width) {
      vel.x *= -1;
      pos.x = constrain(pos.x, 0, width);
    }
    if (pos.y < 0 || pos.y > height) {
      vel.y *= -1;
      pos.y = constrain(pos.y, 0, height);
    }
  }
}
