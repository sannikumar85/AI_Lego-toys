import { Cpu, Github, BookOpen, Layers, Code2, Zap } from 'lucide-react'

const STACK = [
    { label: 'React + Vite', desc: 'Frontend SPA with fast HMR', color: '#61dafb', icon: <Code2 size={20} /> },
    { label: 'Node.js + Express', desc: 'REST API backend', color: '#43e97b', icon: <Layers size={20} /> },
    { label: 'Python FastAPI', desc: 'AI model inference server', color: '#ffcc02', icon: <Zap size={20} /> },
    { label: 'YOLOv8', desc: 'Object detection model', color: '#ff6584', icon: <Cpu size={20} /> },
    { label: 'MongoDB', desc: 'Results persistence layer', color: '#4ecdc4', icon: <BookOpen size={20} /> },
]

export default function About() {
    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
                    About <span style={{ color: '#6c63ff' }}>AI Toy Builder</span>
                </h1>
                <p style={{ color: '#8a8ab0', maxWidth: 620, margin: '0 auto', lineHeight: 1.8 }}>
                    An end-to-end AI-powered system that reconstructs full toy designs from individual component images using YOLOv8 computer vision, a Node.js API layer, and a React frontend.
                </p>
            </div>

            {/* Flow diagram */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <h2 style={{ fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>System Flow</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['Upload Image', 'React Frontend', 'Node.js Backend', 'FastAPI AI Server', 'YOLOv8 Detection', 'Toy Reconstruction', 'Result Display'].map((step, i, arr) => (
                        <>
                            <div key={step} style={{ padding: '0.6rem 1rem', borderRadius: 10, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', fontSize: '0.82rem', fontWeight: 600, color: '#a8a4ff' }}>
                                {step}
                            </div>
                            {i < arr.length - 1 && <span key={`arrow-${i}`} style={{ color: '#6c63ff', fontSize: '1.2rem' }}>→</span>}
                        </>
                    ))}
                </div>
            </div>

            {/* Tech Stack */}
            <h2 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.3rem' }}>Technology Stack</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                {STACK.map(({ label, desc, color, icon }) => (
                    <div key={label} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                            {icon}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
                            <div style={{ color: '#8a8ab0', fontSize: '0.82rem' }}>{desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dataset */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Dataset Structure</h2>
                <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#a8a4ff', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 10, overflowX: 'auto', lineHeight: 1.8 }}>
                    {`dataset/
├── head/          # Toy head images
├── arm/           # Toy arm images
├── wheel/         # Toy wheel images
├── body/          # Toy body images
└── full_toys/     # Complete toy images

labels:  head | arm | wheel | body | accessory`}
                </pre>
            </div>
        </div>
    )
}
