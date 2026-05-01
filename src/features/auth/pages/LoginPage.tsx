import { Input } from 'antd'
import { LoaderCircle, Lock, LogIn, Sparkles, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { loginWithApi } from '../auth.api'
import { useAuthStore } from '../auth.store'

export const LoginPage = () => {
  const navigate = useNavigate()
  const authLogin = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const result = await loginWithApi({ username, password })
      authLogin(result.token, result.user)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to login. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="brand-line">
          <div>
            <p className="brand">jiffit</p>
            <p className="brand-hint">Dashboard login</p>
          </div>
          <div className="brand-pill">
            <Sparkles size={16} />
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-description">Sign in with your username and password.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span className="field-label">Username</span>
            <Input
              className="auth-ant-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              prefix={<UserRound size={16} />}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </label>

          <label>
            <span className="field-label">Password</span>
            <Input.Password
              className="auth-ant-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              prefix={<Lock size={16} />}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button className="submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle size={16} className="spin" /> : <LogIn size={16} />}
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>
    </div>
  )
}
