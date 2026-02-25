import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistory, deleteResult } from '../services/api'
import { Clock, Trash2, ChevronRight, Package, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function History() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    const load = () => {
        getHistory().then(d => setItems(d.results || [])).catch(console.error).finally(() => setLoading(false))
    }

    useEffect(load, [])

    const handleDelete = async (id) => {
        try {
            await deleteResult(id)
            toast.success('Result deleted')
            setItems(prev => prev.filter(i => i._id !== id))
        } catch {
            toast.error('Failed to delete')
        }
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                <Clock size={24} color="#6c63ff" />
                <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.8rem', fontWeight: 700 }}>Detection History</h1>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {[1, 2, 3].map(i => <div key={i} className="glass-card shimmer" style={{ height: 90 }} />)}
                </div>
            ) : items.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: '#8a8ab0' }}>
                    <Package size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No detections yet</p>
                    <p style={{ fontSize: '0.85rem' }}>Upload your first toy part image to get started.</p>
                    <Link to="/" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
                        <button className="btn-primary">Start Building</button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {items.map(item => (
                        <div key={item._id} className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                                {item.annotated_images?.[0] ? (
                                    <img src={`/api/image/${item.annotated_images[0]}`} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(108,99,255,0.2)' }} />
                                ) : (
                                    <div style={{ width: 64, height: 64, borderRadius: 10, background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Package size={24} color="#6c63ff" />
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.2rem' }}>
                                        {item.predicted_toy?.name || 'Unknown Toy'}
                                    </div>
                                    <div style={{ color: '#8a8ab0', fontSize: '0.78rem' }}>
                                        {item.detections?.length || 0} parts detected · {new Date(item.createdAt).toLocaleString()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                        {[...new Set(item.detections?.map(d => d.label) || [])].slice(0, 4).map(l => (
                                            <span key={l} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: 50, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)', color: '#a8a4ff' }}>{l}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <Link to={`/results/${item._id}`}>
                                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 10, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', color: '#a8a4ff', cursor: 'pointer', fontSize: '0.82rem' }}>
                                        View <ChevronRight size={14} />
                                    </button>
                                </Link>
                                <button onClick={() => handleDelete(item._id)} style={{ padding: '0.5rem', borderRadius: 10, background: 'rgba(255,101,132,0.08)', border: '1px solid rgba(255,101,132,0.2)', color: '#ff6584', cursor: 'pointer' }}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
