import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Results from './pages/Results'
import History from './pages/History'
import About from './pages/About'
import RealTimeDemo from './pages/RealTimeDemo'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#13142b',
            color: '#f0f0ff',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: '12px',
          },
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/real-time-demo" element={<RealTimeDemo />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/history" element={<History />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}
