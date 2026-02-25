/**
 * Enhanced Home page with 3D preview capabilities
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Upload, Sparkles, Zap, Shield, Layers, ChevronRight, X, Image as ImgIcon, Box, Cpu } from 'lucide-react'
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

    const handleAnalyze = async () => {
        if (files.length === 0) {
            toast.error('Please upload at least one image')
            return
        }

        setLoading(true)
        setProgress(0)

        try {
            const fd = new FormData()
            files.forEach(f => fd.append('images', f))

            const result = await detectToyParts(fd, (p) => setProgress(p))
            
            // Show success message with 3D enhancement
            toast.success(`🎯 Detected ${result.detections?.length || 0} parts! View in 3D →`, { duration: 4000 })
            
            navigate(`/results/${result.result_id}`, { state: { result } })
        } catch (err) {
            console.error('Detection error:', err)
            toast.error('Detection failed. Please try again.')
        } finally {
            setLoading(false)
            setProgress(0)
        }
    }

    const clearAll = () => {
        previews.forEach(p => URL.revokeObjectURL(p.url))
        setFiles([])
        setPreviews([])
    }

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' }}>
            
            {/* Hero Section with 3D mention */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1rem' }}>
                    AI <span style={{ color: '#6c63ff' }}>Toy Builder</span> 
                    <div style={{ fontSize: '1.8rem', color: '#43e97b', marginTop: '0.5rem' }}>3D Assembly System</div>
                </h1>
                <p style={{ color: '#8a8ab0', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
                    Upload toy part images and watch our AI identify components, then{' '}
                    <span style={{ color: '#6c63ff', fontWeight: 600 }}>assemble them into 3D models</span>{' '}
                    with step-by-step animation and missing part detection.
                </p>
            </div>

            {/* Features */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <FeatureCard 
                    icon={<Cpu size={24} color="#6c63ff" />}
                    title="AI Part Detection" 
                    desc="YOLOv8-powered recognition of heads, bodies, arms, wheels, and accessories"
                />
                <FeatureCard 
                    icon={<Box size={24} color="#43e97b" />}
                    title="3D Assembly View" 
                    desc="Watch parts assemble step-by-step in realistic 3D visualization"
                />
                <FeatureCard 
                    icon={<Layers size={24} color="#ffd93d" />}
                    title="Missing Part Detection" 
                    desc="Identifies incomplete assemblies and shows what parts are needed"
                />
                <FeatureCard 
                    icon={<Sparkles size={24} color="#ff6584" />}
                    title="Interactive Controls" 
                    desc="Rotate, zoom, and control assembly animations in real-time"
                />
            </div>

            {/* Upload Area */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div
                    {...getRootProps()}
                    style={{
                        border: `2px dashed ${isDragActive ? '#6c63ff' : 'rgba(108,99,255,0.3)'}`,
                        borderRadius: 16,
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        background: isDragActive ? 'rgba(108,99,255,0.05)' : 'transparent',
                        cursor: 'pointer'
                    }}
                >
                    <input {...getInputProps()} />
                    <div style={{ marginBottom: '1.5rem' }}>
                        {isDragActive ? (
                            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <Upload size={36} color="#6c63ff" />
                            </div>
                        ) : (
                            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <ImgIcon size={36} color="#8a8ab0" />
                            </div>
                        )}
                    </div>
                    
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: isDragActive ? '#6c63ff' : '#f0f0ff' }}>
                        {isDragActive ? 'Drop your toy images here' : 'Upload Toy Part Images'}
                    </h3>
                    <p style={{ color: '#8a8ab0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        Drag & drop or click to select up to 5 images<br />
                        <span style={{ fontSize: '0.8rem' }}>JPG, PNG, WEBP • Max 10MB each</span>
                    </p>
                </div>

                {/* File Previews */}
                {previews.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#8a8ab0' }}>
                                Selected Images ({previews.length}/5)
                            </span>
                            <button onClick={clearAll} style={{ 
                                padding: '0.4rem 0.8rem', fontSize: '0.8rem', 
                                background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', 
                                border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8
                            }}>
                                Clear All
                            </button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                            {previews.map((preview, i) => (
                                <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', background: '#1a1a2e' }}>
                                    <img 
                                        src={preview.url} 
                                        alt={`Preview ${i + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                                        style={{
                                            position: 'absolute', top: 8, right: 8,
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.7)', color: '#fff',
                                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Analyze Button */}
                {(files.length > 0 || loading) && (
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || files.length === 0}
                            className="btn-primary"
                            style={{
                                padding: '1rem 2.5rem',
                                fontSize: '1rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
                                    Processing ({progress}%)...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Analyze & Build in 3D
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>

                        {loading && progress > 0 && (
                            <div style={{ maxWidth: 300, margin: '1rem auto 0', background: 'rgba(108,99,255,0.1)', borderRadius: 10, overflow: 'hidden', height: 6 }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #6c63ff, #43e97b)', transition: 'width 0.3s ease' }} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* How it Works - Updated with 3D steps */}
            <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                    How the 3D Assembly Works
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'left' }}>
                    {[
                        { icon: '📤', title: 'Upload Images', desc: 'Add photos of toy parts (head, body, arms, wheels, accessories)' },
                        { icon: '🎯', title: 'AI Detection', desc: 'YOLOv8 identifies and locates each part with confidence scores' },
                        { icon: '🏗️', title: '3D Assembly', desc: 'Parts are positioned in 3D space and assembled step-by-step' },
                        { icon: '🎮', title: 'Interactive View', desc: 'Rotate, zoom, and control the 3D model with missing part indicators' }
                    ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ fontSize: '2rem', flexShrink: 0 }}>{step.icon}</div>
                            <div>
                                <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>{step.title}</div>
                                <div style={{ color: '#8a8ab0', fontSize: '0.85rem', lineHeight: 1.5 }}>{step.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}