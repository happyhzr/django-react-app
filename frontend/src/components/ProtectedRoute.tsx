import { Navigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import react, { useState, useEffect } from "react"
import api from "../api"
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants"

function ProtectedRoute({ children }: { children: react.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    useEffect(() => {
        async function f() {
            try {
                await auth()
            } catch (error) {
                setIsAuthenticated(false)
            }
        }
        f()
    })
    async function refreshToken() {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN)
        try {
            const res = await api.post("/api/token/refresh", {
                refresh: refreshToken,
            })
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access)
                setIsAuthenticated(true)
            } else {
                setIsAuthenticated(false)
            }
        } catch (error) {
            console.log(error)
            setIsAuthenticated(false)
        }
    }
    async function auth() {
        const token = localStorage.getItem(ACCESS_TOKEN)
        if (!token) {
            setIsAuthenticated(false)
            return
        }
        const decoded = jwtDecode(token)
        const tokenExpiration = decoded.exp
        const now = Date.now() / 1000
        if (tokenExpiration! < now) {
            await refreshToken()
        } else {
            setIsAuthenticated(true)
        }
    }
    if (isAuthenticated === null) {
        return (
            <div>
                Loading...
            </div>
        )
    }
    return isAuthenticated ? children : <Navigate to="/login" />
}

export default ProtectedRoute
