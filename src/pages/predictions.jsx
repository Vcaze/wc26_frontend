import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Predictions() {
    const navigate = useNavigate()

    
    useEffect(() => {
        const token = localStorage.getItem('jwtToken')
        if (!token) {
            // Not logged in, redirect to login page
            navigate('/login')
        }
    }, [navigate])

    const testTxt = "Test textyyy";

    
    return (
        <>
            <h1>Predictions page</h1>
            <p>Test text: {testTxt}</p>
        </>
    )
}
