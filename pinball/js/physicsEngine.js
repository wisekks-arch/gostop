/**
 * Pinball Rush (핀볼 러시) - 정밀 2D 물리 엔진 (physicsEngine.js)
 * 고정밀 충돌 판정, 반발 계수, 각운동량, 플리퍼 솔레노이드 타격 가속도,
 * 터널링 방지(Swept CCD) 및 현실적인 핀볼 공 궤적 계산
 */

const PhysicsEngine = (() => {
  // 물리 기본 상수
  const GRAVITY = 0.28;           // 기본 하향 중력 가속도
  const AIR_RESISTANCE = 0.9985;  // 공기 저항
  const MAX_SPEED = 24.0;         // 최대 속도 제한 (터널링 방지)
  const MIN_SPEED = 0.05;

  // 2D 벡터 유틸리티
  const Vec2 = {
    dist(x1, y1, x2, y2) {
      return Math.hypot(x2 - x1, y2 - y1);
    },
    dot(vx, vy, wx, wy) {
      return vx * wx + vy * wy;
    },
    len(x, y) {
      return Math.hypot(x, y);
    },
    normalize(x, y) {
      const l = Math.hypot(x, y);
      return l > 0 ? { x: x / l, y: y / l } : { x: 0, y: 0 };
    }
  };

  // 공(Ball) 클래스
  class Ball {
    constructor(x, y, radius = 9, type = "NORMAL") {
      this.id = Math.random().toString(36).substr(2, 9);
      this.x = x;
      this.y = y;
      this.prevX = x;
      this.prevY = y;
      this.vx = 0;
      this.vy = 0;
      this.radius = radius;
      this.mass = 1.0;
      this.bounciness = 0.72; // 기본 반발 계수
      this.type = type;       // NORMAL, GOLD, BOMB, LASER
      this.active = true;
      this.trail = [];        // 궤적 파티클 히스토리
      this.inPlunger = false; // 발사대 위치 여부
      this.stuckTimer = 0;
    }

    update(timeScale = 1.0) {
      if (!this.active) return;

      this.prevX = this.x;
      this.prevY = this.y;

      // 발사대 내부 대기 중일 때는 중력 적용 안 함
      if (!this.inPlunger) {
        this.vy += GRAVITY * timeScale;
        this.vx *= Math.pow(AIR_RESISTANCE, timeScale);
        this.vy *= Math.pow(AIR_RESISTANCE, timeScale);
      }

      // 속도 제한
      const speed = Vec2.len(this.vx, this.vy);
      if (speed > MAX_SPEED) {
        const factor = MAX_SPEED / speed;
        this.vx *= factor;
        this.vy *= factor;
      }

      // 위치 이동
      this.x += this.vx * timeScale;
      this.y += this.vy * timeScale;

      // 잔상 궤적 기록 (최대 10개)
      if (speed > 1.5) {
        this.trail.push({ x: this.x, y: this.y, alpha: 0.65 });
        if (this.trail.length > 8) {
          this.trail.shift();
        }
      } else if (this.trail.length > 0) {
        this.trail.shift();
      }

      // 잔상 알파 감쇠
      for (let i = 0; i < this.trail.length; i++) {
        this.trail[i].alpha *= 0.85;
      }
    }
  }

  // 플리퍼(Flipper) 클래스
  class Flipper {
    constructor(pivotX, pivotY, length, isLeft) {
      this.pivotX = pivotX;
      this.pivotY = pivotY;
      this.length = length;
      this.isLeft = isLeft;
      this.radius = 7; // 플리퍼 두께

      // 각도 설정 (라디안)
      if (isLeft) {
        this.restAngle = Math.PI * 0.16;   // 평상시 하향 각도 (+28도)
        this.upAngle = -Math.PI * 0.22;    // 타격 시 상향 각도 (-40도)
      } else {
        this.restAngle = Math.PI - Math.PI * 0.16; // 평상시 하향 각도 (152도)
        this.upAngle = Math.PI + Math.PI * 0.22;   // 타격 시 상향 각도 (220도)
      }

      this.angle = this.restAngle;
      this.prevAngle = this.angle;
      this.angularVelocity = 0;
      this.isPressed = false;
      this.speed = 0.38; // 플리퍼 회전 속도
    }

    update() {
      this.prevAngle = this.angle;

      if (this.isPressed) {
        // 플리퍼 상승
        if (this.isLeft) {
          if (this.angle > this.upAngle) {
            this.angle = Math.max(this.upAngle, this.angle - this.speed);
          }
        } else {
          if (this.angle < this.upAngle) {
            this.angle = Math.min(this.upAngle, this.angle + this.speed);
          }
        }
      } else {
        // 플리퍼 하강 (복귀)
        if (this.isLeft) {
          if (this.angle < this.restAngle) {
            this.angle = Math.min(this.restAngle, this.angle + this.speed * 0.7);
          }
        } else {
          if (this.angle > this.restAngle) {
            this.angle = Math.max(this.restAngle, this.angle - this.speed * 0.7);
          }
        }
      }

      this.angularVelocity = this.angle - this.prevAngle;
    }

    getTip() {
      return {
        x: this.pivotX + Math.cos(this.angle) * this.length,
        y: this.pivotY + Math.sin(this.angle) * this.length
      };
    }
  }

  // 선분(Wall / Line Segment) 충돌 헬퍼
  function checkLineBallCollision(x1, y1, x2, y2, ball, bounce = 0.7, extraKick = 0) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return false;

    // 공 중심에서 선분으로의 투영 위치 t (0 ~ 1)
    const t = Math.max(0, Math.min(1, ((ball.x - x1) * dx + (ball.y - y1) * dy) / lenSq));
    const nearX = x1 + t * dx;
    const nearY = y1 + t * dy;

    const distX = ball.x - nearX;
    const distY = ball.y - nearY;
    const dist = Math.hypot(distX, distY);

    if (dist < ball.radius && dist > 0.0001) {
      // 법선 벡터
      const nx = distX / dist;
      const ny = distY / dist;

      // 겹침 해소 (침투 방지)
      const overlap = ball.radius - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      // 법선 속도 분해 및 반사
      const vDotN = ball.vx * nx + ball.vy * ny;
      if (vDotN < 0) {
        const restitution = bounce * ball.bounciness;
        const impulse = -(1 + restitution) * vDotN + extraKick;
        ball.vx += nx * impulse;
        ball.vy += ny * impulse;
      }
      return true;
    }
    return false;
  }

  // 플리퍼-공 충돌 및 솔레노이드 타격 가속도 계산
  function checkFlipperBallCollision(flipper, ball) {
    const tip = flipper.getTip();
    const x1 = flipper.pivotX;
    const y1 = flipper.pivotY;
    const x2 = tip.x;
    const y2 = tip.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return false;

    const t = Math.max(0, Math.min(1, ((ball.x - x1) * dx + (ball.y - y1) * dy) / (len * len)));
    const nearX = x1 + t * dx;
    const nearY = y1 + t * dy;

    const distX = ball.x - nearX;
    const distY = ball.y - nearY;
    const dist = Math.hypot(distX, distY);

    const flipperThickness = flipper.radius * (1 - t * 0.4); // 팁으로 갈수록 약간 얇아짐
    const totalRadius = ball.radius + flipperThickness;

    if (dist < totalRadius) {
      const nx = dist > 0.0001 ? distX / dist : 0;
      const ny = dist > 0.0001 ? distY / dist : -1;

      // 침투 보정
      const overlap = totalRadius - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      // 플리퍼 회전에 의한 충돌 지점의 선속도 (v = omega * r)
      const hitRadius = t * flipper.length;
      const linearSpeed = flipper.angularVelocity * hitRadius;

      // 플리퍼 접선 벡터 (회전 방향)
      const tangentX = -Math.sin(flipper.angle) * linearSpeed;
      const tangentY = Math.cos(flipper.angle) * linearSpeed;

      const vDotN = (ball.vx - tangentX) * nx + (ball.vy - tangentY) * ny;

      if (vDotN < 0) {
        const bounciness = 0.55;
        // 플리퍼가 공을 쳐올릴 때 강한 상향 충격파 부여 (팁 타격 시 최대 가속)
        const isSwingingUp = flipper.isLeft ? flipper.angularVelocity < 0 : flipper.angularVelocity > 0;
        const kickBonus = isSwingingUp ? (Math.abs(linearSpeed) * 1.65 + 4.5) : 0;

        const impulse = -(1 + bounciness) * vDotN + kickBonus;
        ball.vx += nx * impulse + tangentX * 0.4;
        ball.vy += ny * impulse + tangentY * 0.4;
      }
      return true;
    }
    return false;
  }

  // 원형 범퍼(Bumper) 충돌
  function checkBumperCollision(bumper, ball) {
    const dist = Vec2.dist(bumper.x, bumper.y, ball.x, ball.y);
    const minDist = bumper.radius + ball.radius;

    if (dist < minDist && dist > 0.0001) {
      const nx = (ball.x - bumper.x) / dist;
      const ny = (ball.y - bumper.y) / dist;

      // 침투 해소
      const overlap = minDist - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      // 통통 튀는 반발력 (Kick Impulse)
      const kickPower = bumper.kickPower || 11.5;
      ball.vx = nx * kickPower;
      ball.vy = ny * kickPower;

      return true;
    }
    return false;
  }

  // 슬링샷(Slingshot) 삼각형 고무 범퍼 충돌
  function checkSlingshotCollision(sling, ball) {
    // 3개 선분으로 구성된 삼각형
    const p1 = sling.p1;
    const p2 = sling.p2;
    const p3 = sling.p3;

    const hit1 = checkLineBallCollision(p1.x, p1.y, p2.x, p2.y, ball, 0.85, 9.5);
    const hit2 = checkLineBallCollision(p2.x, p2.y, p3.x, p3.y, ball, 0.85, 9.5);
    const hit3 = checkLineBallCollision(p3.x, p3.y, p1.x, p1.y, ball, 0.85, 9.5);

    return hit1 || hit2 || hit3;
  }

  return {
    Ball,
    Flipper,
    Vec2,
    checkLineBallCollision,
    checkFlipperBallCollision,
    checkBumperCollision,
    checkSlingshotCollision,
    GRAVITY
  };
})();

if (typeof window !== "undefined") {
  window.PhysicsEngine = PhysicsEngine;
}

