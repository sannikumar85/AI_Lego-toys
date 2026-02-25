const express = require('express')
const router = express.Router()
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

// Get all history (latest 50)
router.get('/history', async (req, res) => {
    try {
        const Storage = getStorage()
        const results = await Storage.find({ status: 'done' })
            .sort({ createdAt: -1 })
            .limit(50)
            .select('result_id detections predicted_toy annotated_images createdAt processing_time')
        res.json({ results })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// Get single result
router.get('/result/:id', async (req, res) => {
    try {
        const Storage = getStorage()
        let result
        
        // Try to find by result_id first, then by _id
        result = await Storage.findOne({ result_id: req.params.id })
        if (!result && req.params.id.length === 24) {
            result = await Storage.findOne({ _id: req.params.id })
        }
        
        if (!result) return res.status(404).json({ error: 'Result not found' })
        res.json(result)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// Delete result
router.delete('/result/:id', async (req, res) => {
    try {
        const Storage = getStorage()
        await Storage.findOneAndDelete({ result_id: req.params.id })
        res.json({ success: true })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

module.exports = router
