import * as THREE from 'three'

export default class TreasureChest {
  constructor() {
    this.mesh = this.createChest()
    this.isHit = false
    this.hitTime = 0
  }

  createChest() {
    const group = new THREE.Group()

    // Main chest body
    const bodyGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.2)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      metalness: 0.3,
      roughness: 0.7
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.075
    group.add(body)

    // Chest lid
    const lidGeometry = new THREE.BoxGeometry(0.2, 0.03, 0.2)
    const lidMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Darker brown
      metalness: 0.4,
      roughness: 0.6
    })
    this.lid = new THREE.Mesh(lidGeometry, lidMaterial)
    this.lid.position.set(0, 0.18, 0)
    this.lid.rotation.x = 0
    group.add(this.lid)

    // Metal bands
    const bandGeometry = new THREE.BoxGeometry(0.2, 0.02, 0.02)
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0, // Silver
      metalness: 0.8,
      roughness: 0.2
    })

    const band1 = new THREE.Mesh(bandGeometry, bandMaterial)
    band1.position.set(0, 0.1, 0.101)
    group.add(band1)

    const band2 = new THREE.Mesh(bandGeometry, bandMaterial)
    band2.position.set(0, 0.05, 0.101)
    group.add(band2)

    // Lock/keyhole
    const lockGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 16)
    const lockMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700, // Gold
      metalness: 0.9,
      roughness: 0.1
    })
    const lock = new THREE.Mesh(lockGeometry, lockMaterial)
    lock.position.set(0, 0.075, 0.11)
    lock.rotation.x = Math.PI / 2
    group.add(lock)

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(0.15, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    })
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial)
    this.glow.position.set(0, 0.1, 0)
    group.add(this.glow)

    // Add sparkles
    this.sparkles = []
    for (let i = 0; i < 8; i++) {
      const sparkleGeometry = new THREE.SphereGeometry(0.01, 8, 8)
      const sparkleMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.8
      })
      const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial)
      const angle = (i / 8) * Math.PI * 2
      sparkle.position.set(
        Math.cos(angle) * 0.12,
        0.1 + Math.sin(i) * 0.05,
        Math.sin(angle) * 0.12
      )
      sparkle.userData.angle = angle
      sparkle.userData.timeOffset = i * 0.5
      group.add(sparkle)
      this.sparkles.push(sparkle)
    }

    return group
  }

  update(deltaTime) {
    const time = performance.now() / 1000

    // Update sparkles
    this.sparkles.forEach((sparkle, index) => {
      const angle = sparkle.userData.angle + time * 0.5
      sparkle.position.x = Math.cos(angle) * 0.12
      sparkle.position.z = Math.sin(angle) * 0.12
      sparkle.position.y = 0.1 + Math.sin(time * 2 + sparkle.userData.timeOffset) * 0.05
      sparkle.material.opacity = 0.5 + Math.sin(time * 3 + sparkle.userData.timeOffset) * 0.3
    })

    // Update glow
    this.glow.material.opacity = 0.2 + Math.sin(time * 2) * 0.1

    // Handle hit animation
    if (this.isHit) {
      this.hitTime += deltaTime
      
      // Open lid
      this.lid.rotation.x = Math.min(Math.PI / 2, this.hitTime * 3)
      
      // Shake effect
      const shake = Math.sin(this.hitTime * 20) * 0.02 * Math.exp(-this.hitTime * 2)
      this.mesh.position.x += shake
      this.mesh.position.z += shake
      
      // Increase glow
      this.glow.material.opacity = Math.min(0.8, 0.2 + this.hitTime * 2)
      
      if (this.hitTime > 2) {
        this.isHit = false
      }
    }
  }

  onHit() {
    this.isHit = true
    this.hitTime = 0
  }
}

