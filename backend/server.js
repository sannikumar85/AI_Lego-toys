require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 5000

// ── Ensure upload dir exists ──────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }))
app.use(express.json())
app.use(morgan('dev'))

// Serve uploaded/annotated images
app.use('/api/image', express.static(UPLOAD_DIR))

// ── Routes ────────────────────────────────────────────────────
app.use('/api', require('./routes/detect'))
app.use('/api', require('./routes/history'))
app.use('/api', require('./routes/stats'))
app.use('/api', require('./routes/assembly')) // New: Assembly validation routes

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// ── MongoDB ───────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_toy_builder')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(e => {
        console.warn('⚠️  MongoDB not available:', e.message)
        console.log('📄 Using in-memory storage for demo')
    })

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`))
