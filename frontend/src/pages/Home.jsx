import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Upload, Sparkles, Zap, Shield, Layers, ChevronRight, X, Image as ImgIcon, Camera, CameraOff, Play, Square } from 'lucide-react'
import { detectToyParts } from '../services/api'

const PART_COLORS = {
    head: '#ff6584', body: '#6c63ff', arm: '#43e97b',
    wheel: '#ffd93d', accessory: '#4ecdc4', unknown: '#a8a4ff',
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{title}</div>
            <div style={{ color: '#8a8ab0', fontSize: '0.85rem', lineHeight: 1.6 }}>{desc}</div>
        </div>
    )
}

export default function Home() {
    const navigate = useNavigate()
    const [files, setFiles] = useState([])
    const [previews, setPreviews] = useState([])
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    
    // Webcam Real-time Detection State
    const [webcamActive, setWebcamActive] = useState(false)
    const [detectionActive, setDetectionActive] = useState(false)
    const [currentDetection, setCurrentDetection] = useState(null)
    const [detectionHistory, setDetectionHistory] = useState([])
    const [cameraError, setCameraError] = useState('')
    
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const detectionIntervalRef = useRef(null)

    // Webcam Functions
    const startWebcam = async () => {
        try {
            setCameraError('')
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480, facingMode: 'environment' } 
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setWebcamActive(true)
                toast.success('📸 Webcam started! Ready for real-time detection')
            }
        } catch (error) {
            setCameraError('Camera access denied. Please allow camera permissions.')
            toast.error('Camera access failed. Check permissions.')
            console.error('Webcam error:', error)
        }
    }

    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setWebcamActive(false)
        setDetectionActive(false)
        clearInterval(detectionIntervalRef.current)
        setCurrentDetection(null)
        toast('📸 Webcam stopped')
    }

    const captureFrame = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return null

        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        return canvas.toDataURL('image/jpeg', 0.8)
    }

    const toggleDetection = () => {
        if (detectionActive) {
            clearInterval(detectionIntervalRef.current)
            setDetectionActive(false)
            setCurrentDetection(null)
            toast('🔍 Real-time detection stopped')
        } else {
            setDetectionActive(true)
            toast.success('🔍 Real-time detection started!')
            
            detectionIntervalRef.current = setInterval(async () => {
                const frameData = captureFrame()
                if (!frameData) return

                try {
                    // Convert base64 to blob for API
                    const response = await fetch(frameData)
                    const blob = await response.blob()
                    const formData = new FormData()
                    formData.append('images', blob, 'webcam-frame.jpg')

                    const result = await detectToyParts(formData)
                    const detection = {
                        timestamp: new Date(),
                        pieces: result.detections || [],
                        confidence: result.detections?.[0]?.confidence || 0
                    }
                    
                    setCurrentDetection(detection)
                    setDetectionHistory(prev => [detection, ...prev.slice(0, 9)]) // Keep last 10
                    
                } catch (error) {
                    console.error('Detection error:', error)
                }
            }, 1500) // Every 1.5 seconds
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWebcam()
            clearInterval(detectionIntervalRef.current)
        }
    }, [])

    const onDrop = useCallback((accepted) => {
        if (accepted.length + files.length > 5) {
            toast.error('Maximum 5 images allowed')
            return
        }
        const newPreviews = accepted.map(f => ({ file: f, url: URL.createObjectURL(f) }))
        setFiles(prev => [...prev, ...accepted])
        setPreviews(prev => [...prev, ...newPreviews])
    }, [files])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
        maxSize: 10 * 1024 * 1024,
    })

    const removeFile = (idx) => {
        URL.revokeObjectURL(previews[idx].url)
        setFiles(prev => prev.filter((_, i) => i !== idx))
        setPreviews(prev => prev.filter((_, i) => i !== idx))
    }

    const handleBuild3D = async () => {
        if (!files.length) { toast.error('Please upload at least one image'); return }
        setLoading(true); setProgress(0)
        try {
            const fd = new FormData()
            files.forEach(f => fd.append('images', f))
            const result = await detectToyParts(fd, setProgress)
            toast.success('🎯 3D Assembly ready! View your toy →')
            navigate(`/results/${result.result_id}`, { state: { result } })
        } catch (e) {
            toast.error(e.response?.data?.error || 'Detection failed. Ensure the AI server is running.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem' }}>

            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: 50, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#a8a4ff', fontWeight: 600 }}>
                    <Sparkles size={14} /> AI-Powered Toy Reconstruction
                </div>
                <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.2rem' }}>
                    Upload Parts.{' '}
                    <span style={{ background: 'linear-gradient(135deg, #6c63ff, #43e97b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Build in 3D.
                    </span>
                </h1>
                <p style={{ color: '#8a8ab0', fontSize: '1.1rem', maxWidth: 620, margin: '0 auto 2rem', lineHeight: 1.7 }}>
                    Upload images of toy components and watch our YOLOv8 AI detect parts, then{' '}
                    <span style={{ color: '#6c63ff', fontWeight: 600 }}>assemble them step-by-step in interactive 3D</span>{' '}
                    with missing part detection and realistic animations.
                </p>
            </div>

            {/* Upload Zone */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', maxWidth: 760, margin: '0 auto 2rem' }}>
                <div
                    {...getRootProps()}
                    style={{
                        border: `2px dashed ${isDragActive ? '#6c63ff' : 'rgba(108,99,255,0.3)'}`,
                        borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
                        background: isDragActive ? 'rgba(108,99,255,0.08)' : 'transparent',
                        transition: 'all 0.3s ease',
                    }}
                >
                    <input {...getInputProps()} />
                    <div className="animate-float" style={{ marginBottom: '1rem' }}>
                        <Upload size={48} color="#6c63ff" />
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        {isDragActive ? 'Drop your toy parts here…' : 'Drag & drop toy part images'}
                    </p>
                    <p style={{ color: '#8a8ab0', fontSize: '0.85rem' }}>
                        or <span style={{ color: '#6c63ff', textDecoration: 'underline' }}>browse files</span> · JPG, PNG, WEBP · max 10MB each · up to 5 images
                    </p>
                </div>

                {/* Previews */}
                {previews.length > 0 && (
                    <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                        {previews.map((p, i) => (
                            <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', background: '#0d0e1a', border: '1px solid rgba(108,99,255,0.2)' }}>
                                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => removeFile(i)} style={{
                                    position: 'absolute', top: 4, right: 4, background: 'rgba(255,0,0,0.7)',
                                    border: 'none', borderRadius: '50%', width: 22, height: 22,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                }}>
                                    <X size={12} color="white" />
                                </button>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '0.25rem 0.5rem', fontSize: '0.65rem', color: '#ccc' }}>
                                    {p.file.name.slice(0, 14)}…
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Progress */}
                {loading && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', color: '#8a8ab0' }}>
                            <span>Analyzing parts for 3D assembly…</span><span>{progress}%</span>
                        </div>
                        <div className="conf-bar-bg"><div className="conf-bar-fill" style={{ width: `${progress}%` }} /></div>
                    </div>
                )}

                {/* Action */}
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={handleBuild3D} disabled={loading || !files.length} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                        {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} /> Building in 3D…</> : <><Zap size={18} /> Build Toy in 3D</>}
                    </button>
                    
                    <button 
                        onClick={() => navigate('/real-time-demo')}
                        className="btn-primary"
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem',
                            background: 'linear-gradient(135deg, #ff6584, #6c63ff)',
                            animation: 'glow-pulse 2s ease-in-out infinite'
                        }}
                    >
                        🚀 Try Real-time Demo
                    </button>
                    
                    {files.length > 0 && (
                        <button onClick={() => { setFiles([]); previews.forEach(p => URL.revokeObjectURL(p.url)); setPreviews([]) }}
                            style={{ color: '#8a8ab0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Real-time Webcam Detection Section */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', maxWidth: 760, margin: '0 auto 2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem', color: '#f0f0ff' }}>
                        🎯 Real-time Part Detection
                    </h3>
                    <p style={{ color: '#8a8ab0', fontSize: '0.9rem' }}>
                        Start your webcam for instant toy part detection and guided assembly
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: webcamActive ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
                    {/* Webcam Feed */}
                    <div style={{ position: 'relative' }}>
                        {!webcamActive ? (
                            <div style={{
                                aspectRatio: '4/3', background: 'rgba(108,99,255,0.1)', 
                                border: '2px dashed rgba(108,99,255,0.3)', borderRadius: 12,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                                justifyContent: 'center', gap: '1rem'
                            }}>
                                <Camera size={48} color="#6c63ff" />
                                <p style={{ color: '#8a8ab0', fontSize: '0.9rem', textAlign: 'center' }}>
                                    {cameraError || 'Click to start webcam'}
                                </p>
                            </div>
                        ) : (
                            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                                <video 
                                    ref={videoRef}
                                    autoPlay 
                                    playsInline 
                                    muted
                                    style={{ 
                                        width: '100%', height: 'auto', aspectRatio: '4/3',
                                        background: '#000', objectFit: 'cover',
                                        border: currentDetection?.pieces?.length > 0 
                                            ? '3px solid #43e97b' : '2px solid rgba(108,99,255,0.3)'
                                    }}
                                />
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                
                                {/* Detection Overlay */}
                                {currentDetection?.pieces?.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: 8, left: 8, right: 8,
                                        background: 'rgba(67, 233, 123, 0.9)', 
                                        borderRadius: 8, padding: '0.5rem',
                                        color: 'white', fontSize: '0.8rem', fontWeight: 600
                                    }}>
                                        ✓ {currentDetection.pieces[0]?.class_name} detected 
                                        ({Math.round(currentDetection.pieces[0]?.confidence * 100)}%)
                                    </div>
                                )}

                                {/* No Detection Overlay */}
                                {detectionActive && (!currentDetection?.pieces?.length) && (
                                    <div style={{
                                        position: 'absolute', top: 8, left: 8, right: 8,
                                        background: 'rgba(255, 211, 61, 0.9)', 
                                        borderRadius: 8, padding: '0.5rem',
                                        color: '#333', fontSize: '0.8rem', fontWeight: 600
                                    }}>
                                        🔍 Scanning for toy parts...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Detection Results Panel */}
                    {webcamActive && (
                        <div style={{ 
                            background: 'rgba(108,99,255,0.1)', borderRadius: 12, 
                            padding: '1rem', border: '1px solid rgba(108,99,255,0.2)'
                        }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#f0f0ff' }}>
                                Detection Results
                            </h4>
                            
                            {currentDetection?.pieces?.length > 0 ? (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{
                                        background: 'rgba(67, 233, 123, 0.2)', 
                                        borderRadius: 8, padding: '0.75rem',
                                        border: '1px solid rgba(67, 233, 123, 0.3)'
                                    }}>
                                        <div style={{ fontWeight: 600, color: '#43e97b' }}>
                                            {currentDetection.pieces[0]?.class_name}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#8a8ab0' }}>
                                            Confidence: {Math.round(currentDetection.pieces[0]?.confidence * 100)}%
                                        </div>
                                    </div>
                                </div>
                            ) : detectionActive ? (
                                <div style={{
                                    background: 'rgba(255, 211, 61, 0.2)', 
                                    borderRadius: 8, padding: '0.75rem',
                                    border: '1px solid rgba(255, 211, 61, 0.3)',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ color: '#ffd93d', fontSize: '0.9rem' }}>
                                        No parts detected
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: '#8a8ab0', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    Start detection to see results
                                </div>
                            )}

                            {/* Detection History */}
                            {detectionHistory.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#8a8ab0', marginBottom: '0.5rem' }}>
                                        Recent Detections:
                                    </div>
                                    <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                                        {detectionHistory.slice(0, 5).map((det, i) => (
                                            <div key={i} style={{
                                                fontSize: '0.75rem', color: '#ccc', 
                                                padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                {det.pieces[0]?.class_name || 'No detection'} - {det.timestamp.toLocaleTimeString()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Webcam Controls */}
                <div style={{ 
                    display: 'flex', gap: '1rem', justifyContent: 'center', 
                    marginTop: '1.5rem', flexWrap: 'wrap' 
                }}>
                    {!webcamActive ? (
                        <button 
                            className="btn-primary" 
                            onClick={startWebcam}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Camera size={18} /> Start Webcam
                        </button>
                    ) : (
                        <>
                            <button 
                                className="btn-primary" 
                                onClick={toggleDetection}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: detectionActive ? '#ff6584' : '#6c63ff'
                                }}
                            >
                                {detectionActive ? <Square size={16} /> : <Play size={16} />}
                                {detectionActive ? 'Stop Detection' : 'Start Detection'}
                            </button>
                            <button 
                                onClick={stopWebcam}
                                style={{ 
                                    background: 'transparent', border: '1px solid rgba(255,101,132,0.5)', 
                                    color: '#ff6584', borderRadius: 8, padding: '0.5rem 1rem',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                                }}
                            >
                                <CameraOff size={16} /> Stop Webcam
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Features Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', maxWidth: 1000, margin: '4rem auto 0' }}>
                <FeatureCard icon={<ImgIcon size={22} color="#6c63ff" />} title="3D Part Detection" desc="YOLOv8 identifies toy parts and positions them in 3D space for realistic assembly." />
                <FeatureCard icon={<Layers size={22} color="#43e97b" />} title="Step-by-Step Assembly" desc="Watch parts assemble automatically with smooth animations and interactive controls." />
                <FeatureCard icon={<Sparkles size={22} color="#ffd93d" />} title="Missing Part Detection" desc="Identifies incomplete assemblies and shows what components are needed." />
                <FeatureCard icon={<Shield size={22} color="#ff6584" />} title="Interactive 3D View" desc="Rotate, zoom, and explore your assembled toy from every angle." />
            </div>

            {/* Part color legend */}
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <p style={{ color: '#8a8ab0', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Detection label colors</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {Object.entries(PART_COLORS).map(([part, color]) => (
                        <div key={part} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#8a8ab0' }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />{part}
                        </div>
                    ))}
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes glow-pulse {
                    0%, 100% { 
                        box-shadow: 0 0 20px rgba(255, 101, 132, 0.4), 0 0 40px rgba(108, 99, 255, 0.3);
                    }
                    50% { 
                        box-shadow: 0 0 30px rgba(255, 101, 132, 0.6), 0 0 60px rgba(108, 99, 255, 0.5);
                        transform: translateY(-2px);
                    }
                }
            `}</style>
        </div>
    )
}
