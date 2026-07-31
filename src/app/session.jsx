import * as React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ROLES } from './navigation'
import { Spinner } from '@/components/ui/states'

/* =====================================================================
   Session — one place that answers "who is using the console?"

   Before: five independent login mechanisms, each writing a different
   localStorage key, each panel re-deriving the role on its own, and two of
   them disagreeing on whether to match `employees` by id or by email.

   This context unifies identity resolution without changing any of the
   existing login flows, so nothing breaks while the panels migrate:

     1. Supabase Auth session  → look up `admin_users`, then `employees`
     2. PM localStorage key    → PM role
     3. Legacy founder flag    → FOUNDER role

   Note this is still client-side resolution, exactly as the legacy code was.
   It controls *what the UI offers*, not what the database permits. Real
   enforcement has to come from RLS and backend auth (see SRS SEC-12..14).
   Nothing here should be read as a security boundary.
   ===================================================================== */

const SessionContext = React.createContext(null)

const PM_ID_KEY = 'xco_pm_employee_id'
const PM_LABEL_KEY = 'xco_pm_employee_label'
const FOUNDER_FLAG_KEY = 'xco_founder_auth'

function readLocal(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Legacy `employees.role` values are free-form ("CO_FOUNDER- Mukul"), so match loosely. */
function normaliseRole(raw) {
  const value = String(raw ?? '').toUpperCase()
  if (!value) return null
  if (value.includes('FOUNDER')) return ROLES.FOUNDER
  if (value.includes('HR')) return ROLES.HR
  if (value.includes('DATA_ENTRY') || value.includes('DATA ENTRY')) return ROLES.DATA_ENTRY
  if (value.includes('MANAGER') || value.includes('PM')) return ROLES.PM
  if (value.includes('BOARD')) return ROLES.FOUNDER
  return ROLES.EMPLOYEE
}

export function SessionProvider({ children }) {
  const [state, setState] = React.useState({ status: 'loading', user: null, role: null })

  const resolve = React.useCallback(async () => {
    // 1. PM session — no Supabase auth involved, so check it first and cheaply.
    const pmId = readLocal(PM_ID_KEY)
    if (pmId) {
      setState({
        status: 'authenticated',
        role: ROLES.PM,
        user: {
          id: pmId,
          name: readLocal(PM_LABEL_KEY) || 'Primary Manager',
          email: null,
          source: 'pm',
        },
      })
      return
    }

    if (!supabase) {
      setState({ status: 'unauthenticated', user: null, role: null })
      return
    }

    // 2. Supabase Auth session.
    let authUser = null
    try {
      const { data } = await supabase.auth.getUser()
      authUser = data?.user ?? null
    } catch {
      authUser = null
    }

    if (authUser) {
      let role = null
      let name = authUser.user_metadata?.name ?? null

      // Admin membership is the strongest signal we have.
      try {
        const { data: admin } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', authUser.id)
          .maybeSingle()
        if (admin) role = ROLES.ADMIN
      } catch {
        /* table may be locked down; fall through to employees */
      }

      // Employee record refines the role. Match on id first, then email —
      // the legacy code did one or the other depending on which file you were in.
      try {
        const byId = await supabase
          .from('employees')
          .select('id,name,role')
          .eq('id', authUser.id)
          .maybeSingle()
        let emp = byId.data
        if (!emp && authUser.email) {
          const byEmail = await supabase
            .from('employees')
            .select('id,name,role')
            .eq('email', authUser.email)
            .maybeSingle()
          emp = byEmail.data
        }
        if (emp) {
          name = emp.name ?? name
          const mapped = normaliseRole(emp.role)
          // Never downgrade a confirmed admin to EMPLOYEE.
          if (mapped && !(role === ROLES.ADMIN && mapped === ROLES.EMPLOYEE)) role = mapped
        }
      } catch {
        /* non-fatal */
      }

      // Legacy founder flag is a last-resort hint for accounts with no records.
      if (!role && readLocal(FOUNDER_FLAG_KEY) === 'true') role = ROLES.FOUNDER

      setState({
        status: role ? 'authenticated' : 'unauthorised',
        role,
        user: { id: authUser.id, email: authUser.email, name: name ?? authUser.email, source: 'supabase' },
      })
      return
    }

    // 3. Legacy founder flag with no Supabase session — honour it so the
    //    existing founder.html workflow keeps working during migration.
    if (readLocal(FOUNDER_FLAG_KEY) === 'true') {
      setState({
        status: 'authenticated',
        role: ROLES.FOUNDER,
        user: { id: null, email: null, name: 'Founder', source: 'legacy' },
      })
      return
    }

    setState({ status: 'unauthenticated', user: null, role: null })
  }, [])

  React.useEffect(() => {
    resolve()
    if (!supabase) return
    const { data: sub } = supabase.auth.onAuthStateChange(() => resolve())
    return () => sub?.subscription?.unsubscribe()
  }, [resolve])

  const signOut = React.useCallback(async () => {
    try {
      localStorage.removeItem(PM_ID_KEY)
      localStorage.removeItem(PM_LABEL_KEY)
      localStorage.removeItem(FOUNDER_FLAG_KEY)
    } catch {
      /* ignore */
    }
    try {
      await supabase?.auth.signOut()
    } catch {
      /* ignore */
    }
    setState({ status: 'unauthenticated', user: null, role: null })
  }, [])

  const value = React.useMemo(
    () => ({ ...state, refresh: resolve, signOut, isLeadership: state.role === ROLES.FOUNDER || state.role === ROLES.ADMIN }),
    [state, resolve, signOut]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = React.useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}

/** Route guard. Redirects to login and remembers where the user was headed. */
export function RequireSession({ children, roles }) {
  const { status, role } = useSession()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="exflow-app flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading workspace…
      </div>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/admin-login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/app/overview" replace />
  }

  return children
}
