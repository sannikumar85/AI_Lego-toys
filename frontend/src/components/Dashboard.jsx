/**
 * Assembly Progress Dashboard Component
 * Features: Circular progress, step tracking, timer, accuracy score, streak counter
 * Saves progress to localStorage for session persistence
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
    Clock, Target, Zap, CheckCircle, Circle, RotateCcw, 
    Save, Download, TrendingUp, Award 
} from 'lucide-react'

const Dashboard = ({ 
    currentStep = 0, 
    totalSteps = 8, 
    detectionHistory = [], 
    sessionActive = false,
    onReset = () => {},
    onExport = () => {}
}) => {
    const [sessionStartTime, setSessionStartTime] = useState(null)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [totalAttempts, setTotalAttempts] = useState(0)
    const [correctAttempts, setCorrectAttempts] = useState(0)
    const intervalRef = useRef(null)

    // Initialize session
    useEffect(() => {
        if (sessionActive && !sessionStartTime) {
            const startTime = Date.now()
            setSessionStartTime(startTime)
            
            // Load saved progress
            const savedProgress = localStorage.getItem('assembly_progress')
            if (savedProgress) {
                try {
                    const parsed = JSON.parse(savedProgress)
                    setBestStreak(parsed.bestStreak || 0)
                } catch (error) {
                    console.error('Error loading saved progress:', error)
                }
            }
        }
    }, [sessionActive, sessionStartTime])

    // Timer effect
    useEffect(() => {
        if (sessionActive && sessionStartTime) {
            intervalRef.current = setInterval(() => {
                setElapsedTime(Date.now() - sessionStartTime)
            }, 1000)
        } else {
            clearInterval(intervalRef.current)
        }

        return () => clearInterval(intervalRef.current)
    }, [sessionActive, sessionStartTime])

    // Update statistics from detection history
    useEffect(() => {
        let currentStreak = 0
        let maxStreak = 0
        let correct = 0
        
        // Calculate from most recent detections
        const recentHistory = detectionHistory.slice(0, 20) // Last 20 attempts
        
        for (let i = recentHistory.length - 1; i >= 0; i--) {
            const detection = recentHistory[i]
            
            if (detection.correct) {
                correct++
                currentStreak++
                maxStreak = Math.max(maxStreak, currentStreak)
            } else {
                currentStreak = 0
            }
        }

        setCorrectAttempts(correct)
        setTotalAttempts(recentHistory.length)
        setStreak(currentStreak)
        
        // Update best streak if current is better
        if (maxStreak > bestStreak) {
            setBestStreak(maxStreak)
        }
    }, [detectionHistory, bestStreak])

    // Format time display
    const formatTime = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    // Calculate completion percentage
    const completionPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

    // Calculate accuracy score
    const accuracyScore = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0

    // Get step status icon
    const getStepIcon = (stepIndex) => {
        if (stepIndex < currentStep) {
            return <CheckCircle size={16} className="text-green-400" />
        } else if (stepIndex === currentStep) {
            return <div className="w-4 h-4 border-2 border-blue-400 rounded-full animate-pulse" />
        } else {
            return <Circle size={16} className="text-gray-600" />
        }
    }

    // Save progress to localStorage
    const saveProgress = () => {
        const progressData = {
            completionPercent,
            accuracyScore,
            bestStreak,
            elapsedTime,
            totalAttempts,
            correctAttempts,
            timestamp: Date.now(),
            steps: Array.from({ length: totalSteps }, (_, i) => ({
                completed: i < currentStep,
                index: i + 1
            }))
        }

        localStorage.setItem('assembly_progress', JSON.stringify(progressData))
        
        // Show success feedback
        const button = document.getElementById('save-progress-btn')
        if (button) {
            const originalText = button.textContent
            button.textContent = 'Saved!'
            button.classList.add('bg-green-600')
            setTimeout(() => {
                button.textContent = originalText
                button.classList.remove('bg-green-600')
            }, 2000)
        }
    }

    // Export progress as JSON
    const exportProgress = () => {
        const exportData = {
            sessionData: {
                startTime: sessionStartTime,
                endTime: Date.now(),
                elapsedTime,
                completionPercent,
                accuracyScore
            },
            statistics: {
                totalAttempts,
                correctAttempts,
                streak,
                bestStreak
            },
            steps: Array.from({ length: totalSteps }, (_, i) => ({
                stepNumber: i + 1,
                completed: i < currentStep,
                status: i < currentStep ? 'completed' : i === currentStep ? 'current' : 'pending'
            })),
            detectionHistory: detectionHistory.slice(0, 50) // Last 50 attempts
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `assembly-progress-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        onExport(exportData)
    }

    // SVG Circular Progress Ring
    const CircularProgress = ({ percent, size = 120, strokeWidth = 8 }) => {
        const radius = (size - strokeWidth) / 2
        const circumference = radius * 2 * Math.PI
        const strokeDasharray = circumference
        const strokeDashoffset = circumference - (percent / 100) * circumference

        return (
            <div className="relative">
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="rgba(108, 99, 255, 0.2)"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="url(#gradient)"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 ease-out"
                    />
                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6c63ff" />
                            <stop offset="100%" stopColor="#43e97b" />
                        </linearGradient>
                    </defs>
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                            {Math.round(percent)}%
                        </div>
                        <div className="text-xs text-gray-400">Complete</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass-card p-6 max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Target size={24} className="text-blue-400" />
                    Assembly Dashboard
                </h3>
                <button
                    onClick={onReset}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    title="Reset Assembly"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Circular Progress */}
            <div className="flex justify-center mb-6">
                <CircularProgress percent={completionPercent} />
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Timer */}
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <Clock size={20} className="text-blue-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">
                        {formatTime(elapsedTime)}
                    </div>
                    <div className="text-xs text-gray-400">Time Elapsed</div>
                </div>

                {/* Accuracy */}
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <TrendingUp size={20} className="text-green-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">
                        {Math.round(accuracyScore)}%
                    </div>
                    <div className="text-xs text-gray-400">Accuracy</div>
                </div>

                {/* Current Streak */}
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <Zap size={20} className="text-yellow-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{streak}</div>
                    <div className="text-xs text-gray-400">Streak</div>
                </div>

                {/* Best Streak */}
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <Award size={20} className="text-purple-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{bestStreak}</div>
                    <div className="text-xs text-gray-400">Best Streak</div>
                </div>
            </div>

            {/* Steps Progress List */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Assembly Steps</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <div 
                            key={i} 
                            className={`flex items-center justify-between p-2 rounded-lg ${
                                i < currentStep ? 'bg-green-500/20' :
                                i === currentStep ? 'bg-blue-500/20' : 'bg-gray-700/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {getStepIcon(i)}
                                <span className="text-sm text-gray-300">
                                    Step {i + 1}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500">
                                {i < currentStep ? '✓' : 
                                 i === currentStep ? 'Current' : 'Pending'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detection Stats */}
            <div className="bg-gray-800/50 rounded-lg p-3 mb-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Detection Stats</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <div className="text-lg font-bold text-green-400">{correctAttempts}</div>
                        <div className="text-xs text-gray-500">Correct</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-red-400">
                            {totalAttempts - correctAttempts}
                        </div>
                        <div className="text-xs text-gray-500">Missed</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-blue-400">{totalAttempts}</div>
                        <div className="text-xs text-gray-500">Total</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    id="save-progress-btn"
                    onClick={saveProgress}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                >
                    <Save size={16} />
                    Save Progress
                </button>
                <button
                    onClick={exportProgress}
                    className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                    title="Export as JSON"
                >
                    <Download size={16} />
                </button>
            </div>

            {/* Session Info */}
            {sessionStartTime && (
                <div className="mt-4 text-xs text-gray-500 text-center">
                    Session started: {new Date(sessionStartTime).toLocaleTimeString()}
                </div>
            )}
        </div>
    )
}

export default Dashboard