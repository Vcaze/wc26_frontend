import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/home.jsx'
import Predictions from './pages/predictions.jsx'
import Login from './pages/login.jsx'
import Register from './pages/register.jsx'
import './style/App.css'
import './style/nav.css'

function App() {
    const navigate = useNavigate()
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('jwtToken')
        if (token) setIsLoggedIn(true)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('jwtToken')
        setIsLoggedIn(false)
        navigate("/")
    }

    return (
        <div>
            <nav>
                <Link to="/">Home</Link>{" "}
                <Link to="/predictions">Predictions</Link>{" "}
                {!isLoggedIn && <Link to="/login">Login</Link>}
                {isLoggedIn && (
                    <>
                        {" "}<span onClick={handleLogout} >Logout</span>
                    </>
                )}
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route
                    path="/login"
                    element={<Login onLogin={() => setIsLoggedIn(true)} />}
                />
                <Route path="/register" element={<Register />} />
            </Routes>
        </div>
    )
}

export default App
