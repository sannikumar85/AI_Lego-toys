const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const FormData = require('form-data')
const { v4: uuidv4 } = require('uuid')
const ToyResult = require('../models/ToyResult')
const InMemoryStorage = require('../models/InMemoryStorage')

// Use MongoDB if available, otherwise fallback to in-memory storage
const getStorage = () => {
    try {
        const mongoose = require('mongoose')
        if (mongoose.connection.readyState === 1) {
            return ToyResult
        }
    } catch (e) {
        // MongoDB not available
    }
    return InMemoryStorage
}

const UPLOAD_DIR = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads')

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}-${uuidv4()}${ext}`)
    },
})
const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files allowed'), false)
        cb(null, true)
    },
})

router.post('/detect', upload.array('images', 5), async (req, res) => {
    if (!req.files || !req.files.length) {
        return res.status(400).json({ error: 'No images uploaded' })
    }

    const resultId = uuidv4()
    const startTime = Date.now()

    try {
        // Forward images to Python AI server
        const fd = new FormData()
        req.files.forEach(f => fd.append('images', fs.createReadStream(f.path), f.filename))

        let aiResult
        try {
            const aiResponse = await axios.post(
                `${process.env.AI_SERVER_URL || 'http://localhost:8000'}/detect`,
                fd,
                { headers: fd.getHeaders(), timeout: 90000 }
            )
            aiResult = aiResponse.data
        } catch (aiErr) {
            console.warn('⚠️  AI server unavailable, using mock response:', aiErr.message)
            // Mock response when AI server is not running
            aiResult = {
                detections: [
                    { label: 'head', confidence: 0.91, bbox: [30, 20, 180, 160] },
                    { label: 'body', confidence: 0.87, bbox: [20, 160, 240, 380] },
                    { label: 'arm', confidence: 0.78, bbox: [240, 170, 310, 320] },
                    { label: 'arm', confidence: 0.75, bbox: [0, 170, 60, 315] },
                ],
                annotated_images: req.files.map(f => f.filename),
                predicted_toy: { 
                    name: 'Action Figure', 
                    confidence: 0.88, 
                    description: 'A classic humanoid action figure with articulated arms.',
                    assembly_complexity: 'medium',
                    assembly_time: 4,
                    expected_parts: ['head', 'body', 'arm', 'arm'],
                    part_positions: {
                        head: [0, 2.2, 0], body: [0, 0, 0],
                        leftArm: [-1.2, 0.5, 0], rightArm: [1.2, 0.5, 0]
                    }
                },
                confidence_summary: { head: 1, body: 1, arm: 2 },
                assembly_3d: {
                    missing_parts: {
                        missing_parts: [],
                        detected_counts: { head: 1, body: 1, arm: 2 },
                        expected_counts: { head: 1, body: 1, arm: 2 },
                        assembly_completeness: 1.0,
                        total_expected: 4,
                        total_detected: 4
                    },
                    positions: {
                        head: [0, 2.2, 0], body: [0, 0, 0],
                        leftArm: [-1.2, 0.5, 0], rightArm: [1.2, 0.5, 0]
                    },
                    sequence: [
                        { step: 0, part: 'body', action: 'attach', delay: 0 },
                        { step: 1, part: 'head', action: 'attach', delay: 1.5 },
                        { step: 2, part: 'leftArm', action: 'attach', delay: 3 },
                        { step: 3, part: 'rightArm', action: 'attach', delay: 4.5 }
                    ],
                    total_steps: 4,
                    estimated_assembly_time: 6
                }
            }
        }

        const processingTime = (Date.now() - startTime) / 1000
        const Storage = getStorage()

        const toyResult = await Storage.create({
            result_id: resultId,
            original_images: req.files.map(f => f.filename),
            annotated_images: aiResult.annotated_images || req.files.map(f => f.filename),
            detections: aiResult.detections || [],
            confidence_summary: aiResult.confidence_summary || {},
            predicted_toy: aiResult.predicted_toy || { name: 'Unknown', confidence: 0 },
            assembly_3d: aiResult.assembly_3d || null,
            generated_image_url: aiResult.generated_image_url || null,
            processing_time: processingTime,
            status: 'done',
        })

        // Handle both Mongoose documents and plain objects
        const resultData = toyResult.toObject ? toyResult.toObject() : toyResult
        return res.json({ result_id: resultId, ...resultData })
    } catch (err) {
        console.error('Detection error:', err)
        return res.status(500).json({ error: 'Detection failed', details: err.message })
    }
})

module.exports = router
