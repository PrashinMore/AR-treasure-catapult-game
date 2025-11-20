import * as THREE from 'three'

// Simple physics for projectile motion
export class ProjectilePhysics {
  constructor(startPos, velocity, gravity = -9.8) {
    this.startPos = startPos.clone()
    this.velocity = velocity.clone()
    this.gravity = gravity
    this.time = 0
    this.active = true
  }
  
  update(deltaTime) {
    if (!this.active) return this.getPosition()
    
    this.time += deltaTime
    
    // Calculate position using physics: p = p0 + v0*t + 0.5*g*t^2
    const position = new THREE.Vector3()
    position.x = this.startPos.x + this.velocity.x * this.time
    position.y = this.startPos.y + this.velocity.y * this.time + 0.5 * this.gravity * this.time * this.time
    position.z = this.startPos.z + this.velocity.z * this.time
    
    // Deactivate if below ground level
    if (position.y < -0.5) {
      this.active = false
    }
    
    return position
  }
  
  getPosition() {
    return this.update(0)
  }
  
  isActive() {
    return this.active
  }
}

// Check collision between two spheres
export function checkSphereCollision(pos1, radius1, pos2, radius2) {
  const distance = pos1.distanceTo(pos2)
  return distance < (radius1 + radius2)
}

// Calculate velocity from drag gesture
export function calculateVelocityFromDrag(startPos, endPos, dragDistance, maxSpeed = 15) {
  const direction = new THREE.Vector3()
    .subVectors(endPos, startPos)
    .normalize()
  
  // Speed based on drag distance (clamped)
  const speed = Math.min(dragDistance * 0.1, maxSpeed)
  
  // Add upward component for arc
  direction.y += 0.3
  
  return direction.multiplyScalar(speed)
}

