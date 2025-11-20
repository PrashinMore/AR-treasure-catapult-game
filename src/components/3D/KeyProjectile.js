import * as THREE from 'three'

export default class KeyProjectile {
  constructor() {
    this.mesh = this.createKey()
    this.physics = null
  }

  createKey() {
    const group = new THREE.Group()

    // Key shaft
    const shaftGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8)
    const shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700, // Gold
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xFFD700,
      emissiveIntensity: 0.3
    })
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial)
    shaft.rotation.x = Math.PI / 2
    group.add(shaft)

    // Key head (bit)
    const headGeometry = new THREE.BoxGeometry(0.03, 0.02, 0.01)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xFFD700,
      emissiveIntensity: 0.3
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.set(0.02, 0, 0)
    group.add(head)

    // Trail effect
    const trailGeometry = new THREE.ConeGeometry(0.015, 0.1, 8)
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFA500,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
    this.trail = new THREE.Mesh(trailGeometry, trailMaterial)
    this.trail.rotation.x = Math.PI
    this.trail.position.set(0, -0.05, 0)
    group.add(this.trail)

    // Glow
    const glowGeometry = new THREE.SphereGeometry(0.02, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.5
    })
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial)
    group.add(this.glow)

    return group
  }

  update(deltaTime) {
    // Update trail based on velocity
    if (this.physics && this.physics.isActive()) {
      const velocity = this.physics.velocity
      const speed = velocity.length()
      
      // Orient trail in direction of motion
      if (speed > 0.1) {
        const direction = velocity.clone().normalize()
        this.trail.lookAt(
          this.mesh.position.x + direction.x,
          this.mesh.position.y + direction.y,
          this.mesh.position.z + direction.z
        )
        this.trail.material.opacity = Math.min(0.8, speed / 10)
      }
    }
  }
}

