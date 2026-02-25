/**
 * 3D Toy Parts Library - Creates 3D geometric models for each toy part type
 * Supports: head, body, arm, wheel, accessory + missing part placeholders
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Color scheme for different toy parts  
const PART_COLORS = {
    head: '#ff6584',      // Pink-red for heads
    body: '#6c63ff',      // Purple for body
    arm: '#43e97b',       // Green for arms  
    wheel: '#ffd93d',     // Yellow for wheels
    accessory: '#4ecdc4', // Teal for accessories
    missing: '#444444',   // Dark gray for missing parts
    assembly: '#ffffff'   // White for assembly guides
}

// 3D Part Components
export function ToyHead({ position, detected = true, confidence = 1, size = 1, animated = false }) {
    const meshRef = useRef()
    
    useFrame((state) => {
        if (animated && meshRef.current) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05
        }
    })

    const opacity = detected ? confidence * 0.8 + 0.2 : 0.3
    const color = detected ? PART_COLORS.head : PART_COLORS.missing

    return (
        <group position={position}>
            {/* Main head sphere */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.8 * size, 32, 32]} />
                <meshPhongMaterial 
                    color={color} 
                    transparent 
                    opacity={opacity}
                    shininess={30}
                />
            </mesh>
            
            {/* Eyes */}
            {detected && (
                <>
                    <mesh position={[-0.25 * size, 0.15 * size, 0.6 * size]}>
                        <sphereGeometry args={[0.08 * size, 16, 16]} />
                        <meshPhongMaterial color="#000000" />
                    </mesh>
                    <mesh position={[0.25 * size, 0.15 * size, 0.6 * size]}>
                        <sphereGeometry args={[0.08 * size, 16, 16]} />
                        <meshPhongMaterial color="#000000" />
                    </mesh>
                </>
            )}

            {/* Missing part wireframe */}
            {!detected && (
                <mesh>
                    <sphereGeometry args={[0.8 * size, 16, 16]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    )
}

export function ToyBody({ position, detected = true, confidence = 1, size = 1, animated = false }) {
    const meshRef = useRef()
    
    useFrame((state) => {
        if (animated && meshRef.current) {
            meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
        }
    })

    const opacity = detected ? confidence * 0.8 + 0.2 : 0.3
    const color = detected ? PART_COLORS.body : PART_COLORS.missing

    return (
        <group position={position}>
            {/* Main body cylinder */}
            <mesh ref={meshRef}>
                <cylinderGeometry args={[0.6 * size, 0.8 * size, 1.5 * size, 32]} />
                <meshPhongMaterial 
                    color={color} 
                    transparent 
                    opacity={opacity}
                    shininess={30}
                />
            </mesh>

            {/* Body details */}
            {detected && (
                <>
                    {/* Chest plate */}
                    <mesh position={[0, 0.3 * size, 0.7 * size]}>
                        <boxGeometry args={[0.8 * size, 0.4 * size, 0.1 * size]} />
                        <meshPhongMaterial color="#4a4a4a" />
                    </mesh>
                    
                    {/* Belt */}
                    <mesh position={[0, -0.2 * size, 0]}>
                        <cylinderGeometry args={[0.65 * size, 0.65 * size, 0.1 * size, 32]} />
                        <meshPhongMaterial color="#2a2a2a" />
                    </mesh>
                </>
            )}

            {/* Missing part wireframe */}
            {!detected && (
                <mesh>
                    <cylinderGeometry args={[0.6 * size, 0.8 * size, 1.5 * size, 16]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    )
}

export function ToyArm({ position, detected = true, confidence = 1, size = 1, side = 'left', animated = false }) {
    const meshRef = useRef()
    
    useFrame((state) => {
        if (animated && meshRef.current) {
            const direction = side === 'left' ? 1 : -1
            meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.3 * direction
        }
    })

    const opacity = detected ? confidence * 0.8 + 0.2 : 0.3
    const color = detected ? PART_COLORS.arm : PART_COLORS.missing

    return (
        <group position={position}>
            {/* Upper arm */}
            <mesh ref={meshRef} position={[0, -0.3 * size, 0]}>
                <cylinderGeometry args={[0.15 * size, 0.2 * size, 0.8 * size, 16]} />
                <meshPhongMaterial 
                    color={color} 
                    transparent 
                    opacity={opacity}
                    shininess={30}
                />
            </mesh>

            {/* Forearm */}
            {detected && (
                <mesh position={[0, -0.9 * size, 0]}>
                    <cylinderGeometry args={[0.12 * size, 0.15 * size, 0.6 * size, 16]} />
                    <meshPhongMaterial color={color} transparent opacity={opacity} />
                </mesh>
            )}

            {/* Hand */}
            {detected && (
                <mesh position={[0, -1.3 * size, 0]}>
                    <sphereGeometry args={[0.12 * size, 16, 16]} />
                    <meshPhongMaterial color={color} transparent opacity={opacity} />
                </mesh>
            )}

            {/* Missing part wireframe */}
            {!detected && (
                <>
                    <mesh position={[0, -0.3 * size, 0]}>
                        <cylinderGeometry args={[0.15 * size, 0.2 * size, 0.8 * size, 8]} />
                        <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
                    </mesh>
                    <mesh position={[0, -0.9 * size, 0]}>
                        <cylinderGeometry args={[0.12 * size, 0.15 * size, 0.6 * size, 8]} />
                        <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
                    </mesh>
                </>
            )}
        </group>
    )
}

export function ToyWheel({ position, detected = true, confidence = 1, size = 1, animated = false }) {
    const meshRef = useRef()
    
    useFrame((state) => {
        if (animated && meshRef.current) {
            meshRef.current.rotation.x += 0.02
        }
    })

    const opacity = detected ? confidence * 0.8 + 0.2 : 0.3
    const color = detected ? PART_COLORS.wheel : PART_COLORS.missing

    return (
        <group position={position}>
            {/* Main wheel */}
            <mesh ref={meshRef}>
                <cylinderGeometry args={[0.4 * size, 0.4 * size, 0.2 * size, 32]} />
                <meshPhongMaterial 
                    color={color} 
                    transparent 
                    opacity={opacity}
                    shininess={50}
                />
            </mesh>

            {/* Wheel spokes */}
            {detected && (
                <>
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                        <mesh key={i} rotation={[0, 0, (angle * Math.PI) / 180]} position={[0.2 * size, 0, 0]}>
                            <boxGeometry args={[0.3 * size, 0.05 * size, 0.15 * size]} />
                            <meshPhongMaterial color="#2a2a2a" />
                        </mesh>
                    ))}
                    
                    {/* Center hub */}
                    <mesh>
                        <cylinderGeometry args={[0.1 * size, 0.1 * size, 0.25 * size, 16]} />
                        <meshPhongMaterial color="#1a1a1a" />
                    </mesh>
                </>
            )}

            {/* Missing part wireframe */}
            {!detected && (
                <mesh>
                    <cylinderGeometry args={[0.4 * size, 0.4 * size, 0.2 * size, 16]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    )
}

export function ToyAccessory({ position, detected = true, confidence = 1, size = 1, type = 'hat', animated = false }) {
    const meshRef = useRef()
    
    useFrame((state) => {
        if (animated && meshRef.current) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1
        }
    })

    const opacity = detected ? confidence * 0.8 + 0.2 : 0.3
    const color = detected ? PART_COLORS.accessory : PART_COLORS.missing

    return (
        <group position={position}>
            {type === 'hat' && (
                <>
                    {/* Hat brim */}
                    <mesh ref={meshRef}>
                        <cylinderGeometry args={[0.6 * size, 0.6 * size, 0.05 * size, 32]} />
                        <meshPhongMaterial 
                            color={color} 
                            transparent 
                            opacity={opacity}
                            shininess={30}
                        />
                    </mesh>
                    
                    {/* Hat top */}
                    {detected && (
                        <mesh position={[0, 0.25 * size, 0]}>
                            <cylinderGeometry args={[0.4 * size, 0.45 * size, 0.4 * size, 32]} />
                            <meshPhongMaterial color={color} transparent opacity={opacity} />
                        </mesh>
                    )}
                </>
            )}

            {type === 'weapon' && (
                <>
                    {/* Weapon handle */}
                    <mesh ref={meshRef} rotation={[0, 0, Math.PI / 4]}>
                        <cylinderGeometry args={[0.05 * size, 0.05 * size, 0.8 * size, 16]} />
                        <meshPhongMaterial color={color} transparent opacity={opacity} />
                    </mesh>
                    
                    {/* Weapon blade */}
                    {detected && (
                        <mesh position={[0.3 * size, 0.3 * size, 0]} rotation={[0, 0, Math.PI / 4]}>
                            <boxGeometry args={[0.6 * size, 0.1 * size, 0.05 * size]} />
                            <meshPhongMaterial color="#c0c0c0" transparent opacity={opacity} />
                        </mesh>
                    )}
                </>
            )}

            {/* Missing part wireframe */}
            {!detected && (
                <mesh>
                    <boxGeometry args={[0.3 * size, 0.3 * size, 0.3 * size]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    )
}

// Assembly position calculator
export const calculateAssemblyPositions = (detectedParts, toyType = 'Action Figure') => {
    const positions = {
        head: [0, 2.2, 0],
        body: [0, 0, 0], 
        leftArm: [-1.2, 0.5, 0],
        rightArm: [1.2, 0.5, 0],
        leftWheel: [-0.6, -1.5, 0],
        rightWheel: [0.6, -1.5, 0],
        accessory: [0, 3, 0]
    }

    // Adjust positions based on toy type
    if (toyType.includes('Vehicle') || toyType.includes('Car')) {
        positions.body = [0, -0.5, 0]
        positions.leftWheel = [-1, -0.8, 0]
        positions.rightWheel = [1, -0.8, 0]
        positions.head = [0, 0.3, 0.8] // Driver seat
    }

    return positions
}

// Assembly sequence for step-by-step animation
export const getAssemblySequence = (detectedParts) => {
    const sequence = []
    
    // Always start with body as foundation
    if (detectedParts.some(p => p.label === 'body')) {
        sequence.push({ part: 'body', delay: 0 })
    }
    
    // Add head
    if (detectedParts.some(p => p.label === 'head')) {
        sequence.push({ part: 'head', delay: 1 })
    }
    
    // Add arms simultaneously 
    const arms = detectedParts.filter(p => p.label === 'arm')
    arms.forEach((_, i) => {
        sequence.push({ 
            part: i === 0 ? 'leftArm' : 'rightArm', 
            delay: 2 + i * 0.5 
        })
    })
    
    // Add wheels
    const wheels = detectedParts.filter(p => p.label === 'wheel')
    wheels.forEach((_, i) => {
        sequence.push({ 
            part: i === 0 ? 'leftWheel' : 'rightWheel', 
            delay: 3.5 + i * 0.3 
        })
    })
    
    // Add accessories last
    if (detectedParts.some(p => p.label === 'accessory')) {
        sequence.push({ part: 'accessory', delay: 4.5 })
    }
    
    return sequence
}