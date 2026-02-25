const mongoose = require('mongoose')

const detectionSchema = new mongoose.Schema({
    label: { type: String, required: true },
    confidence: { type: Number, required: true },
    bbox: [Number],
})

const toyResultSchema = new mongoose.Schema({
    result_id: { type: String, required: true, unique: true, index: true },
    original_images: [String],
    annotated_images: [String],
    detections: [detectionSchema],
    confidence_summary: { type: Map, of: Number, default: {} },
    predicted_toy: {
        name: String,
        confidence: Number,
        description: String,
        assembly_complexity: String,
        assembly_time: Number,
        expected_parts: [String],
        part_positions: { type: Map, of: [Number] }
    },
    assembly_3d: {
        missing_parts: {
            missing_parts: [String],
            detected_counts: { type: Map, of: Number },
            expected_counts: { type: Map, of: Number },
            assembly_completeness: Number,
            total_expected: Number,
            total_detected: Number
        },
        positions: { type: Map, of: [Number] },
        sequence: [{
            step: Number,
            part: String,
            action: String,
            delay: Number
        }],
        total_steps: Number,
        estimated_assembly_time: Number
    },
    generated_image_url: String,
    processing_time: Number,
    status: { type: String, enum: ['processing', 'done', 'failed'], default: 'processing' },
}, { timestamps: true })

toyResultSchema.index({ createdAt: -1 })

module.exports = mongoose.model('ToyResult', toyResultSchema)
