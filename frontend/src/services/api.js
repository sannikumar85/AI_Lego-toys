import axios from 'axios'

const API = axios.create({
    baseURL: '/api',
    timeout: 120000,
})

export const detectToyParts = async (formData, onProgress) => {
    const res = await API.post('/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
            if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
        },
    })
    return res.data
}

export const getHistory = async () => {
    const res = await API.get('/history')
    return res.data
}

export const getResult = async (id) => {
    const res = await API.get(`/result/${id}`)
    return res.data
}

export const deleteResult = async (id) => {
    const res = await API.delete(`/result/${id}`)
    return res.data
}

export const getStats = async () => {
    const res = await API.get('/stats')
    return res.data
}

// New Assembly API Methods
export const validateStep = async (detectedPiece, currentStep, sessionId = null, confidence = 0) => {
    const res = await API.post('/validate-step', {
        detectedPiece,
        currentStep,
        sessionId,
        confidence
    })
    return res.data
}

export const startAssemblySession = async (setId = 'demo_set', playerName = 'Anonymous') => {
    const res = await API.post('/session/start', {
        setId,
        playerName
    })
    return res.data
}

export const completeAssemblySession = async (sessionId) => {
    const res = await API.post('/session/complete', {
        sessionId
    })
    return res.data
}

export const getAssemblySteps = async (setId = 'demo_set') => {
    const res = await API.get(`/steps/${setId}`)
    return res.data
}

export const getSessionDetails = async (sessionId) => {
    const res = await API.get(`/session/${sessionId}`)
    return res.data
}

export default API
