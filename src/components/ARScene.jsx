import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import TreasureChest from './3D/TreasureChest'
import KeyProjectile from './3D/KeyProjectile'
import { ProjectilePhysics, checkSphereCollision, calculateVelocityFromDrag } from '../utils/physics'
import { getRandomReward } from '../utils/rewards'
import './ARScene.css'

function ARScene() {
  const containerRef = useRef(null)
  const mindarRef = useRef(null)
  const anchorRef = useRef(null)
  const chestsRef = useRef([])
  const keysRef = useRef([])
  const animationFrameRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(null)
  const dragCurrentRef = useRef(null)
  const [arInitialized, setArInitialized] = useState(false)
  
  const { 
    keysRemaining, 
    hitChest, 
    setReward, 
    chestsHit, 
    startGame,
    gameStarted,
    setARReady,
    setARError,
    setMarkerDetected
  } = useGameStore()

  useEffect(() => {
    if (!containerRef.current) return

    let mindarThree = null
    let anchor = null

    // Initialize MindAR
    const initAR = async () => {
      try {
        // Check if MindAR is available (loaded via CDN)
        // MindAR can be at different paths depending on how it's loaded
        const MindARThree = window.MINDAR?.IMAGE?.MindARThree || 
                           window.MindAR?.IMAGE?.MindARThree ||
                           (window.MINDAR && window.MINDAR.MindARThree)
        
        if (!MindARThree) {
          console.warn('MindAR not loaded, using fallback mode')
          setARReady(true)
          setupFallbackAR()
          return
        }

        mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: '/markers/cafe-marker.mind',
          maxTrack: 1,
        })

        const { renderer, scene, camera } = mindarThree

        // Add lighting to AR scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(5, 10, 5)
        scene.add(directionalLight)

        // Create anchor group for marker tracking
        anchor = mindarThree.addAnchor(0)
        anchorRef.current = anchor

        // Start AR
        await mindarThree.start()
        mindarRef.current = mindarThree
        setARReady(true)
        setArInitialized(true)
        console.log('AR started successfully')

        // Create treasure chests when marker is detected
        anchor.onTargetFound = () => {
          console.log('Marker detected!')
          setMarkerDetected(true)
          
          if (chestsRef.current.length === 0) {
            const chests = createTreasureChests(anchor.group)
            chestsRef.current = chests
            
            if (!gameStarted) {
              startGame()
            }
          }
        }

        anchor.onTargetLost = () => {
          console.log('Marker lost')
          setMarkerDetected(false)
        }

        // Start animation loop
        let lastTime = performance.now()
        const animate = () => {
          animationFrameRef.current = requestAnimationFrame(animate)
          
          const currentTime = performance.now()
          const deltaTime = (currentTime - lastTime) / 1000
          lastTime = currentTime

          // Update chest animations
          if (chestsRef.current.length > 0) {
            updateChests(chestsRef.current, deltaTime)
          }

          // Update key projectiles
          if (keysRef.current.length > 0) {
            updateKeys(keysRef.current, deltaTime, chestsRef.current, anchor.group)
          }

          // MindAR handles rendering
          renderer.render(scene, camera)
        }
        animate()

        // Handle window resize
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', handleResize)

        // Store cleanup function
        return () => {
          window.removeEventListener('resize', handleResize)
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }
          if (mindarThree) {
            mindarThree.stop()
          }
        }

      } catch (error) {
        console.error('AR initialization error:', error)
        setARError('Failed to initialize AR. Using fallback mode.')
        setARReady(false)
        // Fallback mode - create scene without marker tracking
        setupFallbackAR()
      }
    }

    initAR()

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (mindarRef.current) {
        mindarRef.current.stop()
      }
    }
  }, [])

  // Fallback AR setup (for demo without marker file)
  function setupFallbackAR() {
    // Create a simple Three.js scene for fallback
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)
    
    camera.position.set(0, 1.6, 0)
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)
    
    // Create a dummy anchor group for fallback
    const dummyGroup = new THREE.Group()
    scene.add(dummyGroup)
    anchorRef.current = { group: dummyGroup }
    
    // Create chests in fallback mode
    const chests = createTreasureChests(dummyGroup)
    chestsRef.current = chests
    
    if (!gameStarted) {
      startGame()
    }
    setMarkerDetected(true)
    
    // Simple animation loop for fallback
    let lastTime = performance.now()
    const animate = () => {
      requestAnimationFrame(animate)
      const currentTime = performance.now()
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime
      
      updateChests(chests, deltaTime)
      updateKeys(keysRef.current, deltaTime, chests, dummyGroup)
      
      renderer.render(scene, camera)
    }
    animate()
  }

  // Create treasure chests around marker
  function createTreasureChests(scene) {
    const chests = []
    const chestCount = 5
    const radius = 0.6
    const baseHeight = 0.3

    for (let i = 0; i < chestCount; i++) {
      const angle = (i / chestCount) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const y = baseHeight + Math.random() * 0.4

      const chest = new TreasureChest()
      chest.mesh.position.set(x, y, z)
      chest.mesh.userData.id = `chest-${i}`
      chest.mesh.userData.originalY = y
      chest.mesh.userData.angle = angle
      chest.mesh.userData.radius = radius
      chest.mesh.userData.timeOffset = Math.random() * Math.PI * 2
      
      scene.add(chest.mesh)
      chests.push(chest)
    }

    return chests
  }

  // Update chest floating animations
  function updateChests(chests, deltaTime) {
    chests.forEach((chest, index) => {
      const mesh = chest.mesh
      const time = performance.now() / 1000
      
      // Floating motion (sine wave)
      const floatOffset = Math.sin(time * 0.8 + mesh.userData.timeOffset) * 0.1
      mesh.position.y = mesh.userData.originalY + floatOffset
      
      // Side-to-side motion
      const sideOffset = Math.cos(time * 0.6 + mesh.userData.timeOffset) * 0.15
      const angle = mesh.userData.angle + sideOffset * 0.3
      mesh.position.x = Math.cos(angle) * mesh.userData.radius
      mesh.position.z = Math.sin(angle) * mesh.userData.radius
      
      // Rotation
      mesh.rotation.y += deltaTime * 0.5
      mesh.rotation.x = Math.sin(time * 0.5 + mesh.userData.timeOffset) * 0.1
      
      // Update chest animation
      chest.update(deltaTime)
    })
  }

  // Update key projectiles
  function updateKeys(keys, deltaTime, chests, sceneGroup) {
    if (!sceneGroup) return
    
    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i]
      
      if (!key.physics.isActive()) {
        // Remove inactive key
        sceneGroup.remove(key.mesh)
        keys.splice(i, 1)
        continue
      }

      // Update physics
      const newPos = key.physics.update(deltaTime)
      key.mesh.position.copy(newPos)
      key.mesh.rotation.y += deltaTime * 5
      
      // Update key trail
      key.update(deltaTime)

      // Check collision with chests
      chests.forEach((chest) => {
        const chestId = chest.mesh.userData.id
        if (chestsHit.includes(chestId)) return

        if (checkSphereCollision(
          key.mesh.position,
          0.05, // key radius
          chest.mesh.position,
          0.15 // chest radius
        )) {
          // Hit!
          handleChestHit(chest, chestId, sceneGroup)
          key.physics.active = false
        }
      })
    }
  }

  // Handle chest hit
  function handleChestHit(chest, chestId, sceneGroup) {
    hitChest(chestId)
    chest.onHit()
    
    // Generate reward
    const reward = getRandomReward()
    setReward(reward)
    
    // Add explosion effect
    createExplosionEffect(chest.mesh.position, sceneGroup)
  }

  // Create explosion effect
  function createExplosionEffect(position, sceneGroup) {
    if (!sceneGroup) return
    
    const particleCount = 20
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = []

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = position.x
      positions[i3 + 1] = position.y
      positions[i3 + 2] = position.z
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.2,
        y: Math.random() * 0.2,
        z: (Math.random() - 0.5) * 0.2
      })
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.05,
      transparent: true,
      opacity: 1
    })
    const particles = new THREE.Points(geometry, material)
    sceneGroup.add(particles)

    // Animate particles
    let time = 0
    const animateParticles = () => {
      time += 0.016
      const positions = geometry.attributes.position.array

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3] += velocities[i].x
        positions[i3 + 1] += velocities[i].y - 0.01 * time
        positions[i3 + 2] += velocities[i].z
      }

      geometry.attributes.position.needsUpdate = true
      material.opacity = Math.max(0, 1 - time * 2)

      if (material.opacity > 0) {
        requestAnimationFrame(animateParticles)
      } else {
        sceneGroup.remove(particles)
        geometry.dispose()
        material.dispose()
      }
    }
    animateParticles()
  }

  // Handle touch/mouse drag for throwing keys
  const handlePointerDown = (e) => {
    if (keysRemaining <= 0) return
    
    setIsDragging(true)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      time: performance.now()
    }
    dragCurrentRef.current = { x: clientX, y: clientY }
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    dragCurrentRef.current = { x: clientX, y: clientY }
  }

  const handlePointerUp = (e) => {
    if (!isDragging || !dragStartRef.current) {
      setIsDragging(false)
      return
    }

    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
    
    const dragDistance = Math.sqrt(
      Math.pow(clientX - dragStartRef.current.x, 2) +
      Math.pow(clientY - dragStartRef.current.y, 2)
    )

    if (dragDistance > 30 && keysRemaining > 0) {
      // Throw key
      throwKey(dragStartRef.current, { x: clientX, y: clientY }, dragDistance)
    }

    setIsDragging(false)
    dragStartRef.current = null
    dragCurrentRef.current = null
  }

  // Throw a key projectile
  function throwKey(start, end, dragDistance) {
    if (!anchorRef.current?.group) return
    
    const { useKey } = useGameStore.getState()
    useKey() // Deduct key from store

    // Calculate throw direction from screen coordinates
    // Start from center of marker (0, 0.5, 0 in marker space)
    const startPos = new THREE.Vector3(0, 0.5, 0)
    
    // Calculate direction based on drag vector
    const dragX = (end.x - start.x) / window.innerWidth
    const dragY = -(end.y - start.y) / window.innerHeight // Invert Y for screen to world
    
    // Normalize and scale direction
    const direction = new THREE.Vector3(dragX * 2, dragY * 2 + 0.3, 1).normalize()
    
    // Speed based on drag distance
    const speed = Math.min(dragDistance * 0.08, 12)
    const velocity = direction.multiplyScalar(speed)

    // Create key projectile
    const key = new KeyProjectile()
    key.mesh.position.copy(startPos)
    
    const physics = new ProjectilePhysics(startPos, velocity)
    key.physics = physics

    keysRef.current.push(key)
    anchorRef.current.group.add(key.mesh)
  }

  return (
    <div 
      className="ar-scene"
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {isDragging && dragStartRef.current && dragCurrentRef.current && (
        <div 
          className="drag-indicator"
          style={{
            left: dragStartRef.current.x,
            top: dragStartRef.current.y,
            transform: `translate(-50%, -50%) rotate(${Math.atan2(
              dragCurrentRef.current.y - dragStartRef.current.y,
              dragCurrentRef.current.x - dragStartRef.current.x
            ) * 180 / Math.PI}deg)`
          }}
        >
          <div className="catapult-band"></div>
        </div>
      )}
    </div>
  )
}

export default ARScene

