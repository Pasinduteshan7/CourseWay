import Home from './Home'
import Login from './Login'
import Signup from './Signup'
import Dashboard from './Dashboard'
import CoursePage from './Course'
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/courses/:slug" element={<CoursePage />} />
    </Routes>
  )
}

export { App }
