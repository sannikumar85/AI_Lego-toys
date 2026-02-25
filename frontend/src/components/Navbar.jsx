import { Link, useLocation } from 'react-router-dom'
import { Cpu, Clock, Info, Home } from 'lucide-react'

export default function Navbar() {
    const { pathname } = useLocation()

    const links = [
        { to: '/', label: 'Builder', icon: <Home size={16} /> },
        { to: '/history', label: 'History', icon: <Clock size={16} /> },
        { to: '/about', label: 'About', icon: <Info size={16} /> },
    ]

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: 'rgba(13,14,26,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(108,99,255,0.15)',
            padding: '0 2rem',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #6c63ff, #43e97b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(108,99,255,0.4)',
                    }}>
                        <Cpu size={18} color="white" />
                    </div>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#f0f0ff' }}>
                        AI <span style={{ color: '#6c63ff' }}>Toy</span> Builder
                    </span>
                </Link>

                {/* Links */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {links.map(({ to, label, icon }) => (
                        <Link key={to} to={to} style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.5rem 1rem', borderRadius: 10,
                            textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
                            color: pathname === to ? '#6c63ff' : '#8a8ab0',
                            background: pathname === to ? 'rgba(108,99,255,0.12)' : 'transparent',
                            border: pathname === to ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
                            transition: 'all 0.2s ease',
                        }}>
                            {icon}{label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    )
}
