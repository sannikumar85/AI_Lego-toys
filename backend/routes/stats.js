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

router.get('/stats', async (req, res) => {
    try {
        const Storage = getStorage()
        const totalDetections = await Storage.countDocuments({ status: 'done' })
        const allResults = await Storage.find({ status: 'done' }).select('detections predicted_toy processing_time')

        const partCounts = {}
        const toyCounts = {}
        let totalParts = 0
        let totalTime = 0

        allResults.forEach(r => {
            r.detections?.forEach(d => {
                partCounts[d.label] = (partCounts[d.label] || 0) + 1
                totalParts++
            })
            if (r.predicted_toy?.name) {
                toyCounts[r.predicted_toy.name] = (toyCounts[r.predicted_toy.name] || 0) + 1
            }
            totalTime += r.processing_time || 0
        })

        res.json({
            totalDetections,
            totalParts,
            avgProcessingTime: totalDetections > 0 ? (totalTime / totalDetections).toFixed(2) : 0,
            topParts: Object.entries(partCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
            topToys: Object.entries(toyCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

module.exports = router
