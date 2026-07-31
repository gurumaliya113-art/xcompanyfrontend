import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* useQuery — a tiny async-data hook.

   Why not react-query: adding a dependency to a project with no test suite is
   a bigger change than this file. This covers what the console actually needs:
   loading/error/data, manual refetch, stale-response guarding, and an
   `enabled` flag for dependent queries (e.g. load reports only after a
   business is selected).

   `fn` must be stable or listed in `deps`, exactly like useEffect.
*/
export function useQuery(fn, deps = [], { enabled = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const runIdRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const run = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    const runId = ++runIdRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      // Ignore responses from superseded runs so fast tab switching cannot
      // paint stale data.
      if (runId !== runIdRef.current || !mountedRef.current) return
      setData(result)
    } catch (e) {
      if (runId !== runIdRef.current || !mountedRef.current) return
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      if (runId === runIdRef.current && mountedRef.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  useEffect(() => {
    run()
  }, [run])

  return useMemo(
    () => ({ data, error, loading, refetch: run, setData }),
    [data, error, loading, run]
  )
}

/* useMutation — for writes. Gives you `run`, `busy` and `error`, and keeps
   double-submits from firing while a request is in flight. */
export function useMutation(fn, { onSuccess, onError } = {}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const inFlight = useRef(false)

  const run = useCallback(
    async (...args) => {
      if (inFlight.current) return { ok: false, skipped: true }
      inFlight.current = true
      setBusy(true)
      setError(null)
      try {
        const result = await fn(...args)
        onSuccess?.(result)
        return { ok: true, data: result }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        setError(err)
        onError?.(err)
        return { ok: false, error: err }
      } finally {
        inFlight.current = false
        setBusy(false)
      }
    },
    [fn, onSuccess, onError]
  )

  return { run, busy, error }
}

/** Debounced value — for search inputs that filter server-side. */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Persisted state — replaces the ad-hoc localStorage reads scattered in app.js. */
export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw == null ? initial : JSON.parse(raw)
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota or private mode — non-fatal */
    }
  }, [key, value])
  return [value, setValue]
}
