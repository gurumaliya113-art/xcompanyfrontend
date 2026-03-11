import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, LogOut, Users, FileText, DollarSign, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function AdminPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ enquiries: 0, partners: 0 })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/admin-login'); return }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!adminUser) { navigate('/admin-login'); return }
      setUser({ ...user, ...adminUser })

      // Load stats
      const [enquiries, partners] = await Promise.all([
        supabase.from('enquiries').select('*', { count: 'exact', head: true }),
        supabase.from('partners').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        enquiries: enquiries.count || 0,
        partners: partners.count || 0,
      })
    } catch (err) {
      navigate('/admin-login')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out')
    navigate('/admin-login')
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-12">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
            <Shield className="h-4 w-4" /> Admin Dashboard
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: FileText, label: 'Enquiries', value: stats.enquiries, color: 'bg-sky-500' },
          { icon: Users, label: 'Partners', value: stats.partners, color: 'bg-emerald-500' },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${stat.color}`}>
              <stat.icon className="h-5 w-5 text-white" />
            </span>
            <div className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <h2 className="text-lg font-semibold text-slate-900">Quick Links</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Founder Panel', href: '/founder-login.html' },
            { label: 'Data Entries', href: '/data-entries.html' },
            { label: 'PM Panel', href: '/pm.html' },
          ].map((link) => (
            <a key={link.label} href={link.href} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50">
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
