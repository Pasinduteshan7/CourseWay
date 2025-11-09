import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom'
import Home from './Home'
import Login from './Login'
import Signup from './Signup'
import Dashboard from './Dashboard'
import CoursePage from './Course'

// Create the router from explicit <Route> elements and opt-in to the
// v7_startTransition future flag. Passing a component to
// createRoutesFromElements causes the error you saw.
const routesElement = (
  <>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/courses/:slug" element={<CoursePage />} />
  </>
)

const router = createBrowserRouter(
  createRoutesFromElements(routesElement),
  { future: { v7_startTransition: true } }
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
