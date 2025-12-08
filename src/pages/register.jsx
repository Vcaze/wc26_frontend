import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../style/login.css' // reuse same CSS
import { register } from '../api/api.js' // central API helper

export default function Register() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const data = await register(email, firstName, password)  // already parsed JSON

            if (!data.success) {
            setError(data.message || 'Registration failed')  // red text
            setSuccess('')
            return
            }

            setSuccess(data.message)  // green text: "User registered successfully"
            setError('')              // clear any previous errors

            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            setError('Network error')  // red text
            setSuccess('')
            console.error(err)
        }
    }

  return (
    <div className="login-container">
      <h1>Register</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

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
          First Name:
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
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

        <button type="submit">Register</button>
      </form>
    </div>
  )
}
