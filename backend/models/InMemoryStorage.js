/**
 * In-Memory Storage Alternative to MongoDB
 * A simple file-based storage system for demo purposes
 */

const fs = require('fs')
const path = require('path')

class InMemoryStorage {
    constructor() {
        this.dataFile = path.join(__dirname, '..', '..', 'data', 'toy_results.json')
        this.data = this.loadData()
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const content = fs.readFileSync(this.dataFile, 'utf8')
                return JSON.parse(content)
            }
        } catch (error) {
            console.error('Error loading data:', error.message)
        }
        return { results: [] }
    }

    saveData() {
        try {
            const dir = path.dirname(this.dataFile)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2))
        } catch (error) {
            console.error('Error saving data:', error.message)
        }
    }

    // Create a new result
    create(toyResult) {
        const result = {
            _id: this.generateId(),
            ...toyResult,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        this.data.results.push(result)
        this.saveData()
        return result
    }

    // Find results with optional query
    find(query = {}, options = {}) {
        let results = [...this.data.results]
        
        // Apply query filters
        if (query.status) {
            results = results.filter(r => r.status === query.status)
        }
        if (query.result_id) {
            results = results.filter(r => r.result_id === query.result_id)
        }
        if (query._id) {
            results = results.filter(r => r._id === query._id)
        }

        // Apply sorting
        if (options.sort) {
            results.sort((a, b) => {
                if (options.sort.createdAt === -1) {
                    return new Date(b.createdAt) - new Date(a.createdAt)
                }
                return new Date(a.createdAt) - new Date(b.createdAt)
            })
        }

        // Apply limit
        if (options.limit) {
            results = results.slice(0, options.limit)
        }

        // Apply select (projection)
        if (options.select) {
            const fields = options.select.split(' ')
            results = results.map(r => {
                const selected = {}
                fields.forEach(field => {
                    if (r[field] !== undefined) {
                        selected[field] = r[field]
                    }
                })
                return { ...selected, _id: r._id } // Always include _id
            })
        }

        return Promise.resolve(results)
    }

    // Find one result
    findOne(query) {
        return this.find(query).then(results => results[0] || null)
    }

    // Find and delete
    findOneAndDelete(query) {
        const index = this.data.results.findIndex(r => {
            if (query.result_id) return r.result_id === query.result_id
            if (query._id) return r._id === query._id
            return false
        })
        
        if (index !== -1) {
            const deleted = this.data.results.splice(index, 1)[0]
            this.saveData()
            return Promise.resolve(deleted)
        }
        return Promise.resolve(null)
    }

    // Count documents
    countDocuments(query = {}) {
        return this.find(query).then(results => results.length)
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
}

// Create ToyResult-compatible interface
class ToyResultMock {
    constructor() {
        this.storage = new InMemoryStorage()
    }

    async create(data) {
        return this.storage.create(data)
    }

    find(query = {}) {
        const result = this.storage.find(query)
        
        // Add mongoose-like chaining methods
        const chain = {
            sort: (sortQuery) => {
                return {
                    ...chain,
                    _sortQuery: sortQuery,
                    limit: (limitNum) => {
                        return {
                            ...chain,
                            _limitNum: limitNum,
                            select: (fields) => {
                                return this.storage.find(query, {
                                    sort: sortQuery,
                                    limit: limitNum,
                                    select: fields
                                })
                            },
                            exec: () => this.storage.find(query, {
                                sort: sortQuery,
                                limit: limitNum
                            })
                        }
                    },
                    select: (fields) => {
                        return this.storage.find(query, {
                            sort: sortQuery,
                            select: fields
                        })
                    },
                    exec: () => this.storage.find(query, { sort: sortQuery })
                }
            },
            limit: (limitNum) => ({
                ...chain,
                select: (fields) => this.storage.find(query, { limit: limitNum, select: fields })
            }),
            select: (fields) => this.storage.find(query, { select: fields })
        }
        
        return chain
    }

    findOne(query) {
        return this.storage.findOne(query)
    }

    findOneAndDelete(query) {
        return this.storage.findOneAndDelete(query)
    }

    countDocuments(query) {
        return this.storage.countDocuments(query)
    }
}

module.exports = new ToyResultMock()