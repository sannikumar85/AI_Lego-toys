/**
 * 3D Toy Assembly Viewer - Main component for visualizing toy assembly
 * Features: Step-by-step assembly, missing parts, 3D animation, camera controls
 */

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, Text, Html, useTexture } from '@react-three/drei'
import { useSpring, animated, config } from '@react-spring/three'
import * as THREE from 'three'
import { 
    ToyHead, ToyBody, ToyArm, ToyWheel, ToyAccessory,
    calculateAssemblyPositions, getAssemblySequence 
} from './ToyParts3D'

// Animated 3D Text Component
function FloatingText({ children, position, color = '#ffffff', size = 0.5 }) {
    const textRef = useRef()
    
    useFrame((state) => {
        if (textRef.current) {
            textRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
        }
    })
    
    return (
        <Text
            ref={textRef}
            position={position}
            fontSize={size}
            color={color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff"
        >
            {children}
        </Text>
    )
}

// Assembly Progress Indicator
function AssemblyProgress({ currentStep, totalSteps, position = [0, 4, 0] }) {
    return (
        <group position={position}>
            <Html>
                <div style={{
                    background: 'rgba(20,20,40,0.9)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid rgba(108,99,255,0.3)',
                    color: '#f0f0ff',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'center',
                    minWidth: '150px'
                }}>
                    Assembly Progress: {currentStep}/{totalSteps}
                    <div style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(108,99,255,0.2)',
                        borderRadius: '2px',
                        marginTop: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${(currentStep / totalSteps) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #6c63ff, #43e97b)',
                            borderRadius: '2px',
                            transition: 'width 0.5s ease'
                        }}></div>
                    </div>
                </div>
            </Html>
        </group>
    )
}

// Assembly Guide Arrows
function AssemblyArrow({ from, to, visible = true }) {
    if (!visible) return null
    
    const direction = new THREE.Vector3().subVectors(
        new THREE.Vector3(...to),
        new THREE.Vector3(...from)
    ).normalize()
    
    const length = new THREE.Vector3(...from).distanceTo(new THREE.Vector3(...to))
    
    return (
        <group>
            {/* Arrow line */}
            <mesh position={[
                (from[0] + to[0]) / 2,
                (from[1] + to[1]) / 2 + 0.1,
                (from[2] + to[2]) / 2
            ]}>
                <cylinderGeometry args={[0.02, 0.02, length * 0.8, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>
            
            {/* Arrow head */}
            <mesh position={to} rotation={[0, 0, Math.atan2(direction.y, direction.x)]}>
                <coneGeometry args={[0.06, 0.15, 8]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        </group>
    )
}

// Real-time Highlighting Component
function RealTimeHighlight({ position, color, status, pieceType }) {
    const meshRef = useRef()
    const [scale, setScale] = useSpring(() => ({ scale: 1, config: config.wobbly }))
    const [flashColor, setFlashColor] = useSpring(() => ({ 
        color: color || '#6c63ff', 
        config: config.gentle 
    }))

    useEffect(() => {
        if (status === 'correct') {
            // Flash green and scale up
            setFlashColor({ color: '#43e97b' })
            setScale({ scale: 1.3 })
            
            setTimeout(() => {
                setScale({ scale: 1 })
                setTimeout(() => setFlashColor({ color: color || '#6c63ff' }), 1000)
            }, 1000)
        } else if (status === 'wrong') {
            // Pulse yellow
            setFlashColor({ color: '#ffd93d' })
            setScale({ 
                scale: [1, 1.1, 1], 
                config: { duration: 600 }
            })
            
            setTimeout(() => {
                setFlashColor({ color: color || '#6c63ff' })
            }, 2000)
        }
    }, [status, color, setFlashColor, setScale])

    useFrame((state) => {
        if (meshRef.current && status === 'scanning') {
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
        }
    })

    return (
        <animated.mesh 
            ref={meshRef}
            position={position}
            scale={scale.scale}
        >
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <animated.meshPhongMaterial 
                color={flashColor.color}
                transparent 
                opacity={status === 'scanning' ? 0.3 : 0.6}
                wireframe={status === 'scanning'}
                emissive={flashColor.color}
                emissiveIntensity={status === 'correct' ? 0.3 : 0.1}
            />
        </animated.mesh>
    )
}

// Ghost Piece Component (shows where piece should be placed)
function GhostPiece({ position, pieceType, visible = true }) {
    const meshRef = useRef()

    useFrame((state) => {
        if (meshRef.current && visible) {
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05
            meshRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.1
        }
    })

    if (!visible) return null

    const getGeometry = () => {
        switch (pieceType) {
            case 'head': return <sphereGeometry args={[0.3, 16, 16]} />
            case 'body': return <boxGeometry args={[0.6, 1, 0.4]} />
            case 'arm': return <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
            case 'wheel': return <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
            case 'accessory': return <coneGeometry args={[0.2, 0.4, 8]} />
            default: return <boxGeometry args={[0.5, 0.5, 0.5]} />
        }
    }

    return (
        <mesh ref={meshRef} position={position}>
            {getGeometry()}
            <meshPhongMaterial 
                color="#ffffff"
                transparent 
                opacity={0.3}
                wireframe
                emissive="#6c63ff"
                emissiveIntensity={0.2}
            />
        </mesh>
    )
}

// Particle Burst Effect  
function ParticleBurst({ position, trigger = false, color = '#43e97b' }) {
    const particlesRef = useRef()
    const [particles] = useState(() => {
        const temp = new THREE.Object3D()
        const particles = new THREE.InstancedMesh(
            new THREE.SphereGeometry(0.02),
            new THREE.MeshBasicMaterial({ color }),
            50
        )
        
        for (let i = 0; i < 50; i++) {
            temp.position.set(
                position[0] + (Math.random() - 0.5) * 2,
                position[1] + Math.random() * 1,
                position[2] + (Math.random() - 0.5) * 2
            )
            temp.updateMatrix()
            particles.setMatrixAt(i, temp.matrix)
        }
        particles.instanceMatrix.needsUpdate = true
        return particles
    })

    useFrame((state, delta) => {
        if (particlesRef.current && trigger) {
            particlesRef.current.rotation.y += delta * 2
            particlesRef.current.scale.setScalar(
                Math.max(0, particlesRef.current.scale.x - delta * 2)
            )
        }
    })

    useEffect(() => {
        if (trigger && particlesRef.current) {
            particlesRef.current.scale.setScalar(1)
        }
    }, [trigger])

    return <primitive ref={particlesRef} object={particles} position={position} />
}

// Auto-rotating Camera for Idle State
function IdleRotateCamera({ isIdle = false, targetPosition = [0, 0, 0] }) {
    const { camera } = useThree()
    
    useFrame((state) => {
        if (isIdle) {
            const radius = 6
            const x = Math.cos(state.clock.elapsedTime * 0.2) * radius
            const z = Math.sin(state.clock.elapsedTime * 0.2) * radius
            camera.position.x = x
            camera.position.z = z
            camera.lookAt(...targetPosition)
        }
    })

    return null
}

// Main 3D Assembly Scene
function AssemblyScene({ 
    detections, 
    predictedToy, 
    assemblyMode = 'step-by-step',
    realTimeState = null, // New prop for real-time status
    onUpdateAssemblyState = () => {} // Callback for assembly updates
}) {
    const [assemblyStep, setAssemblyStep] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [showGuides, setShowGuides] = useState(true)
    const [isIdle, setIsIdle] = useState(false)
    const [particleEffects, setParticleEffects] = useState({})
    const [lastInteraction, setLastInteraction] = useState(Date.now())
    
    // Calculate detected parts and missing parts
    const detectedParts = detections || []
    const requiredParts = ['head', 'body', 'arm', 'arm', 'wheel', 'wheel'] // For action figure
    const presentParts = detectedParts.map(d => d.label)
    const missingParts = requiredParts.filter(part => 
        !presentParts.includes(part) || 
        (part === 'arm' && presentParts.filter(p => p === 'arm').length < 2) ||
        (part === 'wheel' && presentParts.filter(p => p === 'wheel').length < 2)
    )
    
    // Get assembly positions and sequence
    const positions = calculateAssemblyPositions(detectedParts, predictedToy?.name)
    const assemblySequence = getAssemblySequence(detectedParts)
    const totalSteps = assemblySequence.length + missingParts.length
    
    // Auto-advance assembly animation
    useEffect(() => {
        if (assemblyMode === 'step-by-step' && !isAnimating) {
            const timer = setTimeout(() => {
                setAssemblyStep(prev => (prev + 1) % (totalSteps + 1))
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [assemblyStep, assemblyMode, totalSteps, isAnimating])

    // Real-time state updates
    useEffect(() => {
        if (realTimeState) {
            setLastInteraction(Date.now())
            setIsIdle(false)
            
            // Trigger particle effect on correct detection
            if (realTimeState.status === 'correct') {
                setParticleEffects(prev => ({
                    ...prev,
                    [realTimeState.pieceType]: Date.now()
                }))
            }
            
            // Notify parent component of assembly state change
            onUpdateAssemblyState(assemblyStep, realTimeState.status)
        }
    }, [realTimeState, assemblyStep, onUpdateAssemblyState])

    // Handle idle state for auto-rotate camera
    useEffect(() => {
        const checkIdle = () => {
            if (Date.now() - lastInteraction > 10000) { // 10 seconds idle
                setIsIdle(true)
            } else {
                setIsIdle(false)
            }
        }
        
        const interval = setInterval(checkIdle, 1000)
        return () => clearInterval(interval)
    }, [lastInteraction])

    // Progressive assembly: pieces get more solid as steps complete
    const getPieceOpacity = (pieceType, stepIndex) => {
        if (assemblyMode === 'complete') return 1
        if (assemblyMode === 'step-by-step' && stepIndex <= assemblyStep) {
            return Math.min(1, 0.3 + (stepIndex / totalSteps) * 0.7)
        }
        return 0.3
    }
    
    // Get which parts should be visible at current step
    const getVisibleParts = () => {
        if (assemblyMode === 'complete') {
            return {
                head: true, body: true, leftArm: true, rightArm: true,
                leftWheel: true, rightWheel: true, accessory: true
            }
        }
        
        const visible = {}
        assemblySequence.forEach((seq, i) => {
            visible[seq.part] = i < assemblyStep
        })
        return visible
    }
    
    const visibleParts = getVisibleParts()
    
    // Get part confidence from detections
    const getPartConfidence = (partType) => {
        const detection = detectedParts.find(d => d.label === partType)
        return detection ? detection.confidence : 0
    }
    
    const isPartDetected = (partType) => {
        if (partType === 'leftArm' || partType === 'rightArm') {
            const arms = detectedParts.filter(d => d.label === 'arm')
            return arms.length >= (partType === 'leftArm' ? 1 : 2)
        }
        if (partType === 'leftWheel' || partType === 'rightWheel') {
            const wheels = detectedParts.filter(d => d.label === 'wheel')
            return wheels.length >= (partType === 'leftWheel' ? 1 : 2)
        }
        return detectedParts.some(d => d.label === partType)
    }

    return (
        <group>
            {/* Assembly Progress */}
            {assemblyMode === 'step-by-step' && (
                <AssemblyProgress 
                    currentStep={assemblyStep} 
                    totalSteps={totalSteps}
                    position={[0, 4, 0]}
                />
            )}
            
            {/* Toy Title */}
            <FloatingText 
                position={[0, 3.5, 0]} 
                color="#6c63ff" 
                size={0.3}
            >
                {predictedToy?.name || 'Unknown Toy'}
            </FloatingText>
            
            {/* Assembly Platform */}
            <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[3, 64]} />
                <meshPhongMaterial 
                    color="#2a2a3a" 
                    transparent 
                    opacity={0.3}
                    shininess={100}
                />
            </mesh>
            
            {/* Grid Guidelines */}
            {showGuides && (
                <Grid 
                    position={[0, -2.49, 0]}
                    args={[6, 6]}
                    cellSize={0.5}
                    cellThickness={0.5}
                    cellColor="#444466"
                    sectionSize={2}
                    sectionThickness={1}
                    sectionColor="#6c63ff"
                    fadeDistance={8}
                    fadeStrength={1}
                />
            )}
            
            {/* TOY PARTS */}
            
            {/* Real-time Highlighting and Ghost Pieces */}
            {realTimeState && (
                <>
                    <RealTimeHighlight 
                        position={positions[realTimeState.expectedPieceType] || [0, 0, 0]}
                        color={realTimeState.status === 'correct' ? '#43e97b' : 
                               realTimeState.status === 'wrong' ? '#ffd93d' : '#6c63ff'}
                        status={realTimeState.status}
                        pieceType={realTimeState.expectedPieceType}
                    />
                    
                    {realTimeState.status === 'scanning' && (
                        <GhostPiece 
                            position={positions[realTimeState.expectedPieceType] || [0, 0, 0]}
                            pieceType={realTimeState.expectedPieceType}
                        />
                    )}
                </>
            )}

            {/* Particle Effects for Completed Steps */}
            {Object.entries(particleEffects).map(([pieceType, timestamp]) => (
                <ParticleBurst 
                    key={`${pieceType}-${timestamp}`}
                    position={positions[pieceType] || [0, 0, 0]}
                    trigger={Date.now() - timestamp < 2000}
                    color="#43e97b"
                />
            ))}

            {/* Auto-rotating Camera */}
            <IdleRotateCamera isIdle={isIdle} targetPosition={[0, 0, 0]} />

            {/* TOY PARTS */}
            
            {/* Head */}
            {(visibleParts.head || assemblyMode === 'complete') && (
                <ToyHead
                    position={positions.head}
                    detected={isPartDetected('head')}
                    confidence={getPartConfidence('head')}
                    size={1}
                    animated={assemblyMode === 'step-by-step'}
                />
            )}
            
            {/* Body */}
            {(visibleParts.body || assemblyMode === 'complete') && (
                <ToyBody
                    position={positions.body}
                    detected={isPartDetected('body')}
                    confidence={getPartConfidence('body')}
                    size={1}
                    animated={assemblyMode === 'step-by-step'}
                />
            )}
            
            {/* Left Arm */}
            {(visibleParts.leftArm || assemblyMode === 'complete') && (
                <ToyArm
                    position={positions.leftArm}
                    detected={isPartDetected('leftArm')}
                    confidence={getPartConfidence('arm')}
                    size={1}
                    side="left"
                    animated={assemblyMode === 'step-by-step'}
                />
            )}
            
            {/* Right Arm */}
            {(visibleParts.rightArm || assemblyMode === 'complete') && (
                <ToyArm
                    position={positions.rightArm}
                    detected={isPartDetected('rightArm')}
                    confidence={getPartConfidence('arm')}
                    size={1}
                    side="right"
                    animated={assemblyMode === 'step-by-step'}
                />
            )}
            
            {/* Left Wheel */}
            {(visibleParts.leftWheel || assemblyMode === 'complete') && (
                <ToyWheel
                    position={positions.leftWheel}
                    detected={isPartDetected('leftWheel')}
                    confidence={getPartConfidence('wheel')}
                    size={1}
                    animated={assemblyMode === 'step-by-step'}
                />
            )}
            
            {/* Right Wheel */}
            {(visibleParts.rightWheel || assemblyMode === 'complete') && (
                <ToyWheel
                    position={positions.rightWheel}
                    detected={isPartDetected('rightWheel')}
                    confidence={getPartConfidence('wheel')}
                    size={1}
                    animated={assemblyMode === 'step-by-step'}
                />
            )}
            
            {/* Accessory */}
            {(visibleParts.accessory || assemblyMode === 'complete') && 
             detectedParts.some(d => d.label === 'accessory') && (
                <ToyAccessory
                    position={positions.accessory}
                    detected={isPartDetected('accessory')}
                    confidence={getPartConfidence('accessory')}
                    size={1}
                    type="hat"
                    animated={assemblyMode === 'step-by-step'}
                />
            )}
            
            {/* Missing Parts Indicators */}
            {missingParts.map((part, i) => (
                <FloatingText
                    key={`missing-${i}`}
                    position={[2.5 + i * 0.5, 1 + i * 0.3, 2]}
                    color="#ff6b6b"
                    size={0.2}
                >
                    Missing: {part}
                </FloatingText>
            ))}
        </group>
    )
}

// Main Assembly Viewer Component
export default function ToyAssembly3D({ 
    detections = [], 
    predictedToy = {}, 
    className = "",
    controls = true,
    realTimeState = null, // New: Real-time detection state
    onAssemblyChange = () => {} // New: Callback for assembly state changes
}) {
    const [assemblyMode, setAssemblyMode] = useState('step-by-step') // 'step-by-step' | 'complete' | 'exploded'
    const [cameraPosition, setCameraPosition] = useState([4, 3, 4])
    const [assemblyStateHistory, setAssemblyStateHistory] = useState([])

    // Exposed function to update assembly state from parent
    const updateAssemblyState = useCallback((stepNumber, status) => {
        const newState = {
            step: stepNumber,
            status,
            timestamp: Date.now()
        }
        setAssemblyStateHistory(prev => [newState, ...prev.slice(0, 9)])
        onAssemblyChange(newState)
    }, [onAssemblyChange])

    // Auto-focus camera on detected piece
    useEffect(() => {
        if (realTimeState?.status === 'correct' && realTimeState.pieceType) {
            // Smooth camera transition to focus on detected piece
            setCameraPosition(prev => {
                const newPos = [...prev]
                newPos[1] = Math.max(2, newPos[1]) // Ensure good viewing angle
                return newPos
            })
        }
    }, [realTimeState])
    
    return (
        <div className={`relative w-full h-96 rounded-xl overflow-hidden ${className}`}>
            {/* Control Panel */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                {['step-by-step', 'complete', 'exploded'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setAssemblyMode(mode)}
                        className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                            assemblyMode === mode
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                        }`}
                    >
                        {mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>
            
            {/* 3D Canvas */}
            <Canvas
                camera={{ position: cameraPosition, fov: 60 }}
                style={{ background: 'linear-gradient(135deg, #0a0a1a, #1a1a2e)' }}
            >
                <Suspense fallback={null}>
                    {/* Lighting */}
                    <ambientLight intensity={0.4} />
                    <directionalLight
                        position={[5, 5, 5]}
                        intensity={0.8}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                    />
                    <pointLight position={[-5, 3, -5]} intensity={0.3} color="#6c63ff" />
                    <pointLight position={[5, 3, 5]} intensity={0.3} color="#43e97b" />
                    
                    {/* Environment */}
                    <Environment preset="studio" />
                    
                    {/* Main Assembly Scene */}
                    <AssemblyScene 
                        detections={detections}
                        predictedToy={predictedToy}
                        assemblyMode={assemblyMode}
                        realTimeState={realTimeState}
                        onUpdateAssemblyState={updateAssemblyState}
                    />
                    
                    {/* Camera Controls */}
                    {controls && (
                        <OrbitControls
                            enablePan={true}
                            enableZoom={true}
                            enableRotate={true}
                            maxPolarAngle={Math.PI / 1.5}
                            minDistance={2}
                            maxDistance={15}
                            target={[0, 0, 0]}
                        />
                    )}
                </Suspense>
            </Canvas>
            
            {/* Stats Panel */}
            <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 text-sm">
                <div className="text-gray-300 mb-1">Assembly Stats</div>
                <div className="text-green-400">✓ Detected: {detections.length} parts</div>
                <div className="text-yellow-400">⚠ Missing: {
                    Math.max(0, 5 - detections.length)} parts
                </div>
                <div className="text-blue-400 mt-1 text-xs">
                    Confidence: {detections.length > 0 
                        ? Math.round(detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length * 100)
                        : 0}%
                </div>
                
                {/* Real-time Status */}
                {realTimeState && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="text-gray-300 text-xs mb-1">Real-time:</div>
                        <div className={`text-xs ${
                            realTimeState.status === 'correct' ? 'text-green-400' :
                            realTimeState.status === 'wrong' ? 'text-red-400' :
                            'text-yellow-400'
                        }`}>
                            {realTimeState.status === 'correct' ? '✓ Correct piece!' :
                             realTimeState.status === 'wrong' ? '✗ Wrong piece' :
                             '👁 Scanning...'}
                        </div>
                        {realTimeState.expectedPieceType && (
                            <div className="text-xs text-gray-500">
                                Expected: {realTimeState.expectedPieceType}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Assembly History Panel */}
            {assemblyStateHistory.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 text-sm max-w-48">
                    <div className="text-gray-300 mb-1">Recent Activity</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {assemblyStateHistory.slice(0, 5).map((state, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                                <span className={
                                    state.status === 'correct' ? 'text-green-400' :
                                    state.status === 'wrong' ? 'text-red-400' : 'text-yellow-400'
                                }>
                                    Step {state.step}
                                </span>
                                <span className="text-gray-500">
                                    {new Date(state.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    // Expose the updateAssemblyState function for external use
    ToyAssembly3D.updateAssemblyState = updateAssemblyState
}