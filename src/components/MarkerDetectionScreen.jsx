import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import './MarkerDetectionScreen.css'

function MarkerDetectionScreen() {
  const videoRef = useRef(null)
  const { setMarkerDetected, setARReady } = useGameStore()
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setHasPermission(true)
          setARReady(true)
        }
      } catch (error) {
        console.error('Camera access error:', error)
        setARReady(false)
      }
    }

    initCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [])

  // Simulate marker detection for demo (replace with actual AR tracking)
  useEffect(() => {
    const timer = setTimeout(() => {
      // In real implementation, this would be triggered by actual marker detection
      // For now, we'll auto-detect after 2 seconds for demo
      setMarkerDetected(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="marker-detection-screen">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-feed"
      />
      <div className="overlay-content">
        <div className="scanning-area">
          <div className="scan-frame"></div>
          <div className="scan-line"></div>
        </div>
        <div className="instructions">
          <h2>🎯 Point at the Marker</h2>
          <p>Scan the café marker to start the treasure hunt!</p>
          <div className="marker-hint">
            <p>Look for the waffle plate marker</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarkerDetectionScreen

