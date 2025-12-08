import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../style/login.css'
import { login } from '../api/api.js'

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const data = await login(email, password)  // already JSON
            // console.log("Login response data: ", data)

            if (!data.jwtToken) {  // check if login succeeded
                setError(data.message || 'Login failed')
                return
            }

            // Save JWT token in localStorage
            localStorage.setItem('jwtToken', data.jwtToken)

            // Update App state
            onLogin()

            // Navigate to home
            navigate('/')
        } catch (err) {
            setError('Network error')
            console.error(err)
        }
    }

    return (
        <div className="login-container">
            <h1>Login</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>
                    Email:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                <button type="submit">Login</button>
            </form>

            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    )
}
