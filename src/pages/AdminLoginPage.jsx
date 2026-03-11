import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Shield, ArrowRight, Eye, EyeOff, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('admin') // 'admin' | 'pm'
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', invite_code: '' })
  const [pmUsername, setPmUsername] = useState('')
  const [pmPassword, setPmPassword] = useState('')
  const [pmLoading, setPmLoading] = useState(false)
  const [pmMsg, setPmMsg] = useState('')
  const [showPmPass, setShowPmPass] = useState(false)

  async function _hashPw(pw) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function handlePMLogin() {
    if (!pmUsername.trim() || !pmPassword.trim()) {
      toast.error('Username aur Password daalo')
      return
    }
    setPmLoading(true)
    setPmMsg('')
    try {
      const hash = await _hashPw(pmPassword.trim())
      const { data, error } = await supabase
        .from('pm_login_users')
        .select('id,name,username')
        .eq('username', pmUsername.trim())
        .eq('password_hash', hash)
        .maybeSingle()
      if (error) throw error
      if (!data) {
        setPmMsg('Invalid username or password')
        toast.error('Invalid username or password')
        return
      }
      localStorage.setItem('xco_pm_employee_id', data.id)
      localStorage.setItem('xco_pm_employee_label', data.name)
      toast.success('PM login successful!')
      window.location.href = '/pm.html'
    } catch (err) {
      setPmMsg(err.message || 'Login failed')
      toast.error(err.message || 'Login failed')
    } finally {
      setPmLoading(false)
    }
  }

  function handlePMLogout() {
    localStorage.removeItem('xco_pm_employee_id')
    localStorage.removeItem('xco_pm_employee_label')
    setPmUsername('')
    setPmPassword('')
    toast.success('PM logged out')
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Email and password required')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) throw error

      // Check if user is in admin_users table
      const { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (adminErr || !adminUser) {
        await supabase.auth.signOut()
        toast.error('Not authorized as admin')
        return
      }

      toast.success('Logged in successfully!')
      navigate('/admin')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    if (!form.email || !form.password || !form.invite_code) {
      toast.error('All fields required for sign up')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (error) throw error

      // Claim admin using invite code
      const { error: claimError } = await supabase.rpc('claim_admin', {
        invite_code_input: form.invite_code,
      })
      if (claimError) {
        toast.error('Invalid invite code: ' + claimError.message)
        return
      }

      toast.success('Account created! You can now log in.')
      setTab('admin')
    } catch (err) {
      toast.error(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8 py-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">
            <Shield className="h-7 w-7 text-white" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Admin Login</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to access the admin dashboard</p>
        </div>
      </motion.div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button type="button" onClick={() => setTab('admin')} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${tab === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            Sign In
          </button>
          <button type="button" onClick={() => setTab('signup')} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${tab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            Sign Up (Invite)
          </button>
        </div>

        {tab === 'admin' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="Password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'} <LogIn className="h-4 w-4" />
            </button>
          </form>
        ) : tab === 'signup' ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="Create a password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Invite Code</label>
              <input name="invite_code" value={form.invite_code} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="Enter invite code" />
            </div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Creating...' : 'Sign Up'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : null}
      </div>

      {/* PM Login Section */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <button type="button" onClick={() => setTab(tab === 'pmlogin' ? 'admin' : 'pmlogin')} className="flex w-full items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
              <UserCheck className="h-5 w-5 text-sky-600" />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">Are you a PM? Login Here</div>
              <div className="text-xs text-slate-500">Primary Manager Panel Access</div>
            </div>
          </div>
          <ArrowRight className={`h-4 w-4 text-slate-400 transition ${tab === 'pmlogin' ? 'rotate-90' : ''}`} />
        </button>

        {tab === 'pmlogin' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.25 }} className="mt-6 space-y-4 overflow-hidden">
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input type="text" value={pmUsername} onChange={e => setPmUsername(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100" placeholder="Enter username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input type={showPmPass ? 'text' : 'password'} value={pmPassword} onChange={e => setPmPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100" placeholder="Enter password" />
                <button type="button" onClick={() => setShowPmPass(!showPmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handlePMLogin} disabled={pmLoading} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50">
                {pmLoading ? 'Logging in...' : 'Login to PM Panel'} <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={handlePMLogout} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Logout
              </button>
            </div>
            {pmMsg && <p className="text-xs text-red-500">{pmMsg}</p>}
          </motion.div>
        )}
      </div>
    </div>
  )
}
