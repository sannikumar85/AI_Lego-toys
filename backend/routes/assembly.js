/**
 * Assembly Step Validation API Routes
 * Handles step-by-step assembly validation, session management, and progress tracking
 * Endpoints: /validate-step, /session/start, /session/complete, /steps/:setId
 */

const express = require('express')
const router = express.Router()

// In-memory storage for demo (replace with database in production)
let assemblySessions = new Map()
let assemblySteps = new Map()

// Default assembly steps for demo
const defaultSteps = {
    demo_set: [
        { 
            id: 1, 
            required_piece: 'body', 
            instruction: 'Place the main body piece as the foundation of your toy', 
            position: { x: 0, y: 0, z: 0 }, 
            color: '#6c63ff',
            estimated_time: 30 
        },
        { 
            id: 2, 
            required_piece: 'head', 
            instruction: 'Attach the head piece on top of the body', 
            position: { x: 0, y: 1, z: 0 }, 
            color: '#ff6584',
            estimated_time: 25 
        },
        { 
            id: 3, 
            required_piece: 'arm', 
            instruction: 'Add the left arm to the side of the body', 
            position: { x: -1, y: 0.5, z: 0 }, 
            color: '#43e97b',
            estimated_time: 20 
        },
        { 
            id: 4, 
            required_piece: 'arm', 
            instruction: 'Add the right arm to complete the upper body', 
            position: { x: 1, y: 0.5, z: 0 }, 
            color: '#43e97b',
            estimated_time: 20 
        },
        { 
            id: 5, 
            required_piece: 'wheel', 
            instruction: 'Attach the first wheel to the bottom left', 
            position: { x: -0.5, y: -1, z: 0 }, 
            color: '#ffd93d',
            estimated_time: 15 
        },
        { 
            id: 6, 
            required_piece: 'wheel', 
            instruction: 'Attach the second wheel to the bottom right', 
            position: { x: 0.5, y: -1, z: 0 }, 
            color: '#ffd93d',
            estimated_time: 15 
        },
        { 
            id: 7, 
            required_piece: 'wheel', 
            instruction: 'Add the third wheel for stability and movement', 
            position: { x: 0, y: -1, z: 0.5 }, 
            color: '#ffd93d',
            estimated_time: 15 
        },
        { 
            id: 8, 
            required_piece: 'accessory', 
            instruction: 'Add the final accessory piece to complete your amazing toy!', 
            position: { x: 0, y: 1.5, z: 0 }, 
            color: '#4ecdc4',
            estimated_time: 10 
        }
    ],
    car_set: [
        { id: 1, required_piece: 'body', instruction: 'Start with the car chassis', position: { x: 0, y: 0, z: 0 }, color: '#ff6584', estimated_time: 25 },
        { id: 2, required_piece: 'wheel', instruction: 'Add front left wheel', position: { x: -1, y: -0.5, z: 1 }, color: '#333333', estimated_time: 15 },
        { id: 3, required_piece: 'wheel', instruction: 'Add front right wheel', position: { x: 1, y: -0.5, z: 1 }, color: '#333333', estimated_time: 15 },
        { id: 4, required_piece: 'wheel', instruction: 'Add rear left wheel', position: { x: -1, y: -0.5, z: -1 }, color: '#333333', estimated_time: 15 },
        { id: 5, required_piece: 'wheel', instruction: 'Add rear right wheel', position: { x: 1, y: -0.5, z: -1 }, color: '#333333', estimated_time: 15 },
        { id: 6, required_piece: 'accessory', instruction: 'Add steering wheel inside', position: { x: 0, y: 0.5, z: 0.5 }, color: '#4ecdc4', estimated_time: 10 }
    ]
}

// Initialize default steps
assemblySteps.set('demo_set', defaultSteps.demo_set)
assemblySteps.set('car_set', defaultSteps.car_set)

// Input validation middleware
const validateInput = (req, res, next) => {
    const { body, method } = req
    
    switch (req.route.path) {
        case '/validate-step':
            if (!body.detectedPiece || typeof body.currentStep !== 'number') {
                return res.status(400).json({
                    error: 'Missing required fields: detectedPiece, currentStep'
                })
            }
            break
            
        case '/session/start':
            if (body.setId && typeof body.setId !== 'string') {
                return res.status(400).json({
                    error: 'setId must be a string'
                })
            }
            break
    }
    
    next()
}

// POST /api/validate-step - Validate detected piece against current step
router.post('/validate-step', validateInput, (req, res) => {
    try {
        const { detectedPiece, currentStep, sessionId, confidence = 0 } = req.body
        
        // Get session or use demo set
        const setId = sessionId ? assemblySessions.get(sessionId)?.setId || 'demo_set' : 'demo_set'
        const steps = assemblySteps.get(setId)
        
        if (!steps) {
            return res.status(404).json({
                error: 'Assembly set not found',
                setId
            })
        }
        
        if (currentStep < 0 || currentStep >= steps.length) {
            return res.status(400).json({
                error: 'Invalid step number',
                validRange: `0-${steps.length - 1}`
            })
        }
        
        const currentStepData = steps[currentStep]
        const requiredPiece = currentStepData.required_piece.toLowerCase()
        const detectedLower = detectedPiece.toLowerCase()
        
        // Check if pieces match
        const isCorrect = detectedLower === requiredPiece
        
        // Update session statistics if sessionId provided
        if (sessionId && assemblySessions.has(sessionId)) {
            const session = assemblySessions.get(sessionId)
            session.totalAttempts++
            session.lastActivity = Date.now()
            
            if (isCorrect) {
                session.correctAttempts++
                session.currentStreak++
                session.bestStreak = Math.max(session.bestStreak, session.currentStreak)
            } else {
                session.currentStreak = 0
            }
            
            assemblySessions.set(sessionId, session)
        }
        
        // Prepare response
        const response = {
            correct: isCorrect,
            message: isCorrect 
                ? `Perfect! ${detectedPiece} is correct for step ${currentStep + 1}`
                : `Not quite right. Need ${currentStepData.required_piece}, but detected ${detectedPiece}`,
            currentStep: {
                ...currentStepData,
                stepNumber: currentStep + 1
            },
            nextStep: currentStep + 1 < steps.length ? {
                ...steps[currentStep + 1],
                stepNumber: currentStep + 2
            } : null,
            completionPercent: ((currentStep + (isCorrect ? 1 : 0)) / steps.length) * 100,
            confidence,
            sessionStats: sessionId && assemblySessions.has(sessionId) ? {
                totalAttempts: assemblySessions.get(sessionId).totalAttempts,
                correctAttempts: assemblySessions.get(sessionId).correctAttempts,
                accuracy: (assemblySessions.get(sessionId).correctAttempts / assemblySessions.get(sessionId).totalAttempts * 100).toFixed(1),
                currentStreak: assemblySessions.get(sessionId).currentStreak,
                bestStreak: assemblySessions.get(sessionId).bestStreak
            } : null
        }
        
        res.json(response)
        
    } catch (error) {
        console.error('Step validation error:', error)
        res.status(500).json({
            error: 'Internal server error during step validation'
        })
    }
})

// POST /api/session/start - Create new assembly session
router.post('/session/start', validateInput, (req, res) => {
    try {
        const { setId = 'demo_set', playerName = 'Anonymous' } = req.body
        
        // Validate set exists
        if (!assemblySteps.has(setId)) {
            return res.status(404).json({
                error: 'Assembly set not found',
                availableSets: Array.from(assemblySteps.keys())
            })
        }
        
        // Generate unique session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Create session
        const session = {
            sessionId,
            setId,
            playerName,
            startTime: Date.now(),
            totalAttempts: 0,
            correctAttempts: 0,
            currentStreak: 0,
            bestStreak: 0,
            currentStep: 0,
            completed: false,
            lastActivity: Date.now()
        }
        
        assemblySessions.set(sessionId, session)
        
        // Get first step
        const steps = assemblySteps.get(setId)
        const firstStep = steps[0]
        
        res.json({
            sessionId,
            setId,
            totalSteps: steps.length,
            firstStep: {
                ...firstStep,
                stepNumber: 1
            },
            message: `Assembly session started! Ready to build with ${steps.length} steps.`,
            estimatedTime: steps.reduce((total, step) => total + step.estimated_time, 0)
        })
        
    } catch (error) {
        console.error('Session start error:', error)
        res.status(500).json({
            error: 'Failed to start assembly session'
        })
    }
})

// POST /api/session/complete - Mark session as complete
router.post('/session/complete', (req, res) => {
    try {
        const { sessionId } = req.body
        
        if (!sessionId || !assemblySessions.has(sessionId)) {
            return res.status(404).json({
                error: 'Session not found'
            })
        }
        
        const session = assemblySessions.get(sessionId)
        const completionTime = Date.now()
        const duration = completionTime - session.startTime
        
        // Update session
        session.completed = true
        session.completionTime = completionTime
        session.totalDuration = duration
        
        assemblySessions.set(sessionId, session)
        
        // Calculate final statistics
        const accuracy = session.totalAttempts > 0 
            ? (session.correctAttempts / session.totalAttempts * 100).toFixed(1)
            : 0
            
        const averageTimePerStep = session.totalAttempts > 0 
            ? (duration / session.totalAttempts / 1000).toFixed(1)
            : 0
        
        res.json({
            sessionId,
            completed: true,
            duration: {
                milliseconds: duration,
                formatted: formatDuration(duration)
            },
            accuracy: `${accuracy}%`,
            totalAttempts: session.totalAttempts,
            correctAttempts: session.correctAttempts,
            bestStreak: session.bestStreak,
            averageTimePerStep: `${averageTimePerStep}s`,
            message: 'Assembly completed successfully! Great job!',
            performance: getPerformanceRating(accuracy, duration, session.bestStreak)
        })
        
    } catch (error) {
        console.error('Session completion error:', error)
        res.status(500).json({
            error: 'Failed to complete session'
        })
    }
})

// GET /api/steps/:setId - Get steps for specific assembly set
router.get('/steps/:setId', (req, res) => {
    try {
        const { setId } = req.params
        
        if (!assemblySteps.has(setId)) {
            return res.status(404).json({
                error: 'Assembly set not found',
                availableSets: Array.from(assemblySteps.keys())
            })
        }
        
        const steps = assemblySteps.get(setId)
        const totalEstimatedTime = steps.reduce((total, step) => total + step.estimated_time, 0)
        
        res.json({
            setId,
            totalSteps: steps.length,
            estimatedTime: totalEstimatedTime,
            steps: steps.map((step, index) => ({
                ...step,
                stepNumber: index + 1
            }))
        })
        
    } catch (error) {
        console.error('Steps retrieval error:', error)
        res.status(500).json({
            error: 'Failed to retrieve assembly steps'
        })
    }
})

// GET /api/session/:sessionId - Get session details
router.get('/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params
        
        if (!assemblySessions.has(sessionId)) {
            return res.status(404).json({
                error: 'Session not found'
            })
        }
        
        const session = assemblySessions.get(sessionId)
        const currentTime = Date.now()
        const elapsedTime = currentTime - session.startTime
        
        res.json({
            ...session,
            elapsedTime: {
                milliseconds: elapsedTime,
                formatted: formatDuration(elapsedTime)
            },
            accuracy: session.totalAttempts > 0 
                ? (session.correctAttempts / session.totalAttempts * 100).toFixed(1)
                : 0
        })
        
    } catch (error) {
        console.error('Session retrieval error:', error)
        res.status(500).json({
            error: 'Failed to retrieve session'
        })
    }
})

// Utility functions
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`
    } else {
        return `${seconds}s`
    }
}

function getPerformanceRating(accuracy, duration, bestStreak) {
    let rating = 'Good'
    let badges = []
    
    if (accuracy >= 90) {
        rating = 'Excellent'
        badges.push('🎯 Precision Master')
    } else if (accuracy >= 80) {
        rating = 'Very Good'
        badges.push('👍 Great Accuracy')
    } else if (accuracy >= 70) {
        rating = 'Good'
    } else {
        rating = 'Keep Practicing'
    }
    
    if (bestStreak >= 5) {
        badges.push('🔥 Streak Master')
    }
    
    if (duration < 120000) { // Less than 2 minutes
        badges.push('⚡ Speed Demon')
    }
    
    return {
        rating,
        badges,
        score: Math.round((accuracy + (bestStreak * 5) + (120000 / Math.max(duration, 30000)) * 10))
    }
}

// Cleanup old sessions (run periodically)
setInterval(() => {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    
    for (const [sessionId, session] of assemblySessions.entries()) {
        if (session.lastActivity < cutoffTime) {
            assemblySessions.delete(sessionId)
        }
    }
}, 60 * 60 * 1000) // Clean up every hour

module.exports = router