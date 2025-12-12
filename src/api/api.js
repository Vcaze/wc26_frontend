export const API_URL = import.meta.env.VITE_API_URL

export async function login(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}

export async function register(email, firstName, password) {
    console.log("fetching ", `${API_URL}/user`)
  const response = await fetch(`${API_URL}/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, firstName, password }),
  })
  return response.json()
}

// get all teams
export async function getTeams() {
    // console.log("Fetching teams from ", `${API_URL}/teams`)
    const response = await fetch(`${API_URL}/teams`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer 1337`
        },
    })
    return response.json()
}

// save user predictions
export async function savePredictions(token, email, predictions) {
    const response = await fetch(`${API_URL}/predictions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, predictions }),
    })
    return response.json()
}

// get user predictions
export async function getUserPredictions(token, email) {
    const response = await fetch(`${API_URL}/predictions/${email}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
    return response.json()
}

// get everyone's predictions
export async function getAllPredictions(token) {
    const response = await fetch(`${API_URL}/predictions`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
    return response.json()
}

// get leaderboard
export async function getLeaderboard(token) {
    const response = await fetch(`${API_URL}/leaderboard`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
    return response.json()
}
