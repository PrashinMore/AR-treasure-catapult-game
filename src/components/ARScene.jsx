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
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(null)
  const dragCurrentRef = useRef(null)
  const [arInitialized, setArInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  
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

    // Initialize camera and 3D scene
    const init = async () => {
      setIsInitializing(true)
      
      // Start camera feed
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
        
        streamRef.current = stream
        
        // Create video element for camera feed
        const video = document.createElement('video')
        video.srcObject = stream
        video.autoplay = true
        video.playsInline = true
        video.muted = true
        video.style.width = '100%'
        video.style.height = '100%'
        video.style.position = 'absolute'
        video.style.top = '0'
        video.style.left = '0'
        video.style.objectFit = 'cover'
        video.style.zIndex = '0'
        videoRef.current = video
        
        if (containerRef.current) {
          containerRef.current.appendChild(video)
        }
      } catch (error) {
        console.warn('Camera access error (continuing without camera):', error)
        // Continue without camera - black background
      }
      
      // Setup 3D scene
      setARReady(true)
      setupFallbackAR()
      setIsInitializing(false)
    }
    
    init()

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (containerRef.current?._cleanup) {
        try {
          containerRef.current._cleanup()
        } catch (e) {
          // Cleanup might fail if elements are already removed, that's okay
          console.warn('Cleanup error (safe to ignore):', e)
        }
        delete containerRef.current._cleanup
      }
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
          track.enabled = false
        })
        streamRef.current = null
      }
      // Remove video element
      if (videoRef.current && containerRef.current) {
        try {
          if (containerRef.current.contains(videoRef.current)) {
            containerRef.current.removeChild(videoRef.current)
          }
        } catch (e) {
          // Already removed
        }
        videoRef.current = null
      }
    }
  }, [])

  // Old AR initialization code removed - using fallback mode only
  /*
    let mindarThree = null
    let anchor = null

    // Initialize MindAR
    const initAR = async () => {
      setIsInitializing(true)
      try {
        // Wait a bit for previous camera stream to fully stop
        // This gives time for the cleanup in MarkerDetectionScreen to complete
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Wait for MindAR to be loaded from CDN (with timeout)
        let MindARThree = null
        let attempts = 0
        const maxAttempts = 20 // Wait up to 2 seconds
        
        while (!MindARThree && attempts < maxAttempts) {
          MindARThree = window.MINDAR?.IMAGE?.MindARThree || 
                       window.MindAR?.IMAGE?.MindARThree ||
                       (window.MINDAR && window.MINDAR.MindARThree)
          
          if (!MindARThree) {
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
          }
        }
        
        if (!MindARThree) {
          console.warn('MindAR not loaded after waiting, using fallback mode')
          console.log('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('mind')))
          setARReady(true)
          setupFallbackAR()
          setIsInitializing(false)
          return
        }
        
        console.log('MindAR found:', MindARThree)

        console.log('Initializing MindAR with container:', containerRef.current)
        
        // Check if marker file exists (optional check)
        try {
          const markerResponse = await fetch('/markers/cafe-marker.mind', { method: 'HEAD' })
          if (!markerResponse.ok) {
            console.warn('Marker file not found or not accessible, MindAR may fail')
          }
        } catch (fetchError) {
          console.warn('Could not check marker file:', fetchError)
        }
        
        mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: '/markers/cafe-marker.mind',
          maxTrack: 1,
        })

        const { renderer, scene, camera } = mindarThree
        console.log('MindAR created, renderer:', renderer, 'scene:', scene, 'camera:', camera)

        // Ensure container has proper styling
        if (containerRef.current) {
          containerRef.current.style.width = '100%'
          containerRef.current.style.height = '100%'
          containerRef.current.style.position = 'relative'
        }

        // Add lighting to AR scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(5, 10, 5)
        scene.add(directionalLight)

        // Create anchor group for marker tracking
        anchor = mindarThree.addAnchor(0)
        anchorRef.current = anchor
        console.log('Anchor created:', anchor)

        // Start AR
        try {
          console.log('Starting MindAR...')
          await mindarThree.start()
          console.log('MindAR started, checking container contents...')
          
          // Check if MindAR created video/canvas elements
          // Wait a bit for MindAR to create DOM elements
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const videoElements = containerRef.current?.querySelectorAll('video')
          const canvasElements = containerRef.current?.querySelectorAll('canvas')
          console.log('Video elements found:', videoElements?.length, 'Canvas elements found:', canvasElements?.length)
          console.log('Container innerHTML length:', containerRef.current?.innerHTML?.length)
          
          if (!videoElements || videoElements.length === 0) {
            console.warn('No video element found after MindAR start - this might indicate an issue')
          }
          
          if (!canvasElements || canvasElements.length === 0) {
            console.warn('No canvas element found after MindAR start - this might indicate an issue')
          }
          
          // Log container structure for debugging
          console.log('Container children:', Array.from(containerRef.current?.children || []).map(c => c.tagName))
          
          mindarRef.current = mindarThree
          setARReady(true)
          setArInitialized(true)
          setIsInitializing(false)
          console.log('AR started successfully')
          
          // Set a timeout to check if rendering is working
          // If no video/canvas appears after 3 seconds, fall back
          setTimeout(() => {
            const hasVideo = containerRef.current?.querySelector('video')
            const hasCanvas = containerRef.current?.querySelector('canvas')
            
            if (!hasVideo && !hasCanvas) {
              console.error('MindAR started but no video/canvas elements found after 3 seconds - falling back')
              setARError('AR rendering failed. Using fallback mode.')
              try {
                if (mindarRef.current) {
                  mindarRef.current.stop()
                }
                setupFallbackAR()
              } catch (e) {
                console.error('Error setting up fallback:', e)
              }
            } else {
              console.log('MindAR rendering confirmed - video/canvas elements present')
            }
          }, 3000)
        } catch (startError) {
          console.error('MindAR start error:', startError)
          throw startError
        }

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
        // Note: MindAR handles its own rendering loop internally
        // We only need to update our 3D objects
        let lastTime = performance.now()
        const animate = () => {
          if (!mindarRef.current) {
            animationFrameRef.current = requestAnimationFrame(animate)
            return
          }
          
          animationFrameRef.current = requestAnimationFrame(animate)
          
          const currentTime = performance.now()
          const deltaTime = (currentTime - lastTime) / 1000
          lastTime = currentTime

          // Update chest animations
          if (chestsRef.current.length > 0) {
            updateChests(chestsRef.current, deltaTime)
          }

          // Update key projectiles
          if (keysRef.current.length > 0 && anchor?.group) {
            updateKeys(keysRef.current, deltaTime, chestsRef.current, anchor.group)
          }

          // MindAR handles rendering internally - we don't need to call renderer.render()
          // The renderer is managed by MindAR's internal loop
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
        try {
          setupFallbackAR()
          setIsInitializing(false)
        } catch (fallbackError) {
          console.error('Fallback AR setup error:', fallbackError)
          setARError('Failed to initialize AR. Please refresh the page.')
          setIsInitializing(false)
        }
      }
    }

    initAR()
    */

  // Fallback AR setup (for demo without marker file)
  function setupFallbackAR() {
    if (!containerRef.current) return
    
    // Clear container first - but check if React is managing children
    // Only clear if there are non-React children or if it's safe to do so
    const existingCanvas = containerRef.current.querySelector('canvas')
    if (existingCanvas) {
      try {
        containerRef.current.removeChild(existingCanvas)
      } catch (e) {
        // Already removed, continue
      }
    }
    
    // Create a simple Three.js scene for fallback
    const scene = new THREE.Scene()
    // No background - transparent so camera feed shows through
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }) // alpha: true for transparency
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0) // Transparent background
    
    // Store references for cleanup
    rendererRef.current = renderer
    sceneRef.current = scene
    cameraRef.current = camera
    
    if (containerRef.current) {
      // Set canvas z-index to be above video
      renderer.domElement.style.position = 'absolute'
      renderer.domElement.style.top = '0'
      renderer.domElement.style.left = '0'
      renderer.domElement.style.zIndex = '1'
      containerRef.current.appendChild(renderer.domElement)
    }
    
    camera.position.set(0, 1.6, 3)
    camera.lookAt(0, 0, 0)
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    
    // Store cleanup function
    const cleanup = () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (rendererRef.current && containerRef.current && rendererRef.current.domElement) {
        const canvas = rendererRef.current.domElement
        // Check if the element is actually a child before removing
        if (containerRef.current.contains(canvas)) {
          try {
            containerRef.current.removeChild(canvas)
          } catch (e) {
            // Element might have already been removed, that's okay
            console.warn('Could not remove canvas element:', e)
          }
        }
        rendererRef.current.dispose()
        rendererRef.current = null
      }
    }
    
    // Store cleanup in a way we can access it
    containerRef.current._cleanup = cleanup
    
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
    setArInitialized(true)
    
    // Simple animation loop for fallback
    let lastTime = performance.now()
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      const currentTime = performance.now()
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime
      
      updateChests(chests, deltaTime)
      updateKeys(keysRef.current, deltaTime, chests, dummyGroup)
      
      try {
        renderer.render(scene, camera)
      } catch (renderError) {
        console.error('Fallback render error:', renderError)
      }
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

  // Convert screen coordinates to 3D world coordinates using raycaster
  function screenToWorld(screenX, screenY, distance = 2) {
    if (!cameraRef.current || !sceneRef.current) return new THREE.Vector3(0, 0, 0)
    
    const camera = cameraRef.current
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    
    // Normalize screen coordinates to -1 to 1 (NDC)
    mouse.x = (screenX / window.innerWidth) * 2 - 1
    mouse.y = -(screenY / window.innerHeight) * 2 + 1 // Invert Y
    
    // Set raycaster to cast from camera through this screen point
    raycaster.setFromCamera(mouse, camera)
    
    // Get a point along the ray at the specified distance
    // We'll use the ray's direction and multiply by distance
    const worldPos = raycaster.ray.origin.clone().add(
      raycaster.ray.direction.multiplyScalar(distance)
    )
    
    return worldPos
  }

  // Throw a key projectile
  function throwKey(start, end, dragDistance) {
    if (!anchorRef.current?.group || !cameraRef.current) return
    
    const { useKey } = useGameStore.getState()
    useKey() // Deduct key from store

    // Convert start position to 3D world coordinates (near camera)
    const startPos = screenToWorld(start.x, start.y, 1.5)
    
    // Convert end position to 3D world coordinates
    const endPos = screenToWorld(end.x, end.y, 2.5)
    
    // Calculate direction from start to end (this is the throw direction)
    const direction = endPos.clone().sub(startPos).normalize()
    
    // Calculate speed based on drag distance (more drag = more power)
    // Scale speed appropriately - longer drags = faster throws
    const baseSpeed = 8
    const speedMultiplier = Math.min(dragDistance / 100, 2) // Max 2x speed
    const speed = baseSpeed * (1 + speedMultiplier)
    
    // Add some upward component for arc
    direction.y += 0.2 // Slight upward angle
    
    const velocity = direction.normalize().multiplyScalar(speed)

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
      style={{
        backgroundColor: '#000000',
        width: '100vw',
        height: '100vh',
        position: 'relative'
      }}
    >
      {isInitializing && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          zIndex: 1000,
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '20px',
          borderRadius: '10px'
        }}>
          <div className="loading-spinner" style={{
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p>Initializing AR...</p>
        </div>
      )}
      {isDragging && dragStartRef.current && dragCurrentRef.current && (
        <>
          {/* Catapult pull indicator */}
          <div 
            className="drag-indicator"
            style={{
              position: 'fixed',
              left: dragStartRef.current.x,
              top: dragStartRef.current.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            {/* Key preview at start position */}
            <div style={{
              width: '30px',
              height: '30px',
              background: 'rgba(255, 215, 0, 0.8)',
              borderRadius: '50%',
              border: '2px solid #ffd700',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🔑
            </div>
          </div>
          
          {/* Drag line showing trajectory */}
          <svg
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 999
            }}
          >
            <line
              x1={dragStartRef.current.x}
              y1={dragStartRef.current.y}
              x2={dragCurrentRef.current.x}
              y2={dragCurrentRef.current.y}
              stroke="rgba(255, 215, 0, 0.6)"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
            {/* Arrow head at end */}
            <polygon
              points={`
                ${dragCurrentRef.current.x},${dragCurrentRef.current.y}
                ${dragCurrentRef.current.x - 10},${dragCurrentRef.current.y - 15}
                ${dragCurrentRef.current.x + 10},${dragCurrentRef.current.y - 15}
              `}
              fill="rgba(255, 215, 0, 0.8)"
            />
          </svg>
          
          {/* Power indicator */}
          <div
            style={{
              position: 'fixed',
              left: dragCurrentRef.current.x + 20,
              top: dragCurrentRef.current.y - 20,
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '12px',
              zIndex: 1001,
              pointerEvents: 'none'
            }}
          >
            Power: {Math.min(Math.round((Math.sqrt(
              Math.pow(dragCurrentRef.current.x - dragStartRef.current.x, 2) +
              Math.pow(dragCurrentRef.current.y - dragStartRef.current.y, 2)
            ) / 100) * 100), 100)}%
          </div>
        </>
      )}
    </div>
  )
}

export default ARScene

