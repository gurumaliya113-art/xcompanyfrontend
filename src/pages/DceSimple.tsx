import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import {
  Lock,
  ChevronDown,
  Plus,
  Search,
  StickyNote,
  Paperclip,
  FileText,
  Wallet,
  CalendarDays,
  Trash2,
  X,
  Video,
  Flame,
  ScanFace,
  ExternalLink
} from 'lucide-react'

/* =====================================================================
   DCE — Simple Mobile App (WhatsApp-style, dark purple)
   Phone-first, stripped-down version of the DCE dashboard.
   Four tabs: Notes · Money · Files · Meetings.
   Reuses the same Supabase tables, scoped to the selected business.
   ===================================================================== */

type Business = { id: string | number; name: string; type?: string }
type Todo = { id: string; text: string; done: boolean }
type Note = {
  id: number
  title: string
  content: string
  todos: Todo[]
  highlightColor: 'none' | 'yellow' | 'green' | 'blue'
  updated_at?: string
  created_at?: string
}
type FileDoc = { id: number; title: string; doc_type: string; file_url?: string; file_type?: string; updated_at?: string }
type Spend = { id: number; vendor: string; category: string; amount: number; spend_date: string; status: string; note?: string }
type Meeting = { id: number; title: string; meeting_date: string; meeting_time: string; platform: string; link?: string; notes?: string }

type Tab = 'notes' | 'money' | 'files' | 'meetings'
type NoteForm = { title: string; content: string; todos: Todo[]; highlightColor: Note['highlightColor'] }
type SpendForm = { vendor: string; amount: string; category: string; spend_date: string; note: string }
type MeetingForm = { title: string; meeting_date: string; meeting_time: string; platform: string; link: string; notes: string }

const DCE_PASSCODE = (import.meta as any).env?.VITE_DCE_PASSCODE?.trim() || '123456'
// PIN length follows the configured passcode, so 4 or 6 digit codes both work.
const PIN_LENGTH = DCE_PASSCODE.length || 6

// Black + light (matches main site): cream bg, black header/accents, white cards, near-black text
const T = {
  bg: '#faf6ef',
  header: '#161616',
  card: '#ffffff',
  cardBorder: 'rgba(17,17,17,0.10)',
  accent: '#161616',
  bubble: '#f3f3f1',
  text: '#161616',
  sub: '#6b7280',
  input: 'rgba(255,255,255,0.16)',
  nav: '#ffffff'
}

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif"

const spendCategories = ['Operating', 'Material', 'Salary', 'Marketing', 'Rent', 'Legal', 'Tech', 'Other']
const meetingPlatforms = ['Zoom', 'Google Meet', 'Teams', 'In person', 'Phone call']

const noteAccent: Record<Note['highlightColor'], string> = {
  none: '#a99fc4',
  yellow: '#facc15',
  green: '#22c55e',
  blue: '#38bdf8'
}

function timeAgo(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function prettyDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function inr(n: number) {
  return '₹' + (n || 0).toLocaleString('en-IN')
}

function uid() {
  return (crypto as any)?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// ---- WebAuthn (Face ID / Touch ID / fingerprint) helpers ----
const BIO_KEY = 'dce_bio_cred'
function randomBytes(n: number) {
  const a = new Uint8Array(n)
  crypto.getRandomValues(a)
  return a
}
function bufToB64url(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlToBuf(s: string) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : ''
  const bin = atob(s + pad)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

// Pending items stay on top, completed (done) items drop to the bottom. Stable order otherwise.
function sortTodos(todos: Todo[]) {
  return [...todos].sort((a, b) => Number(a.done) - Number(b.done))
}

function normalizeNote(raw: any): Note {
  return {
    id: raw.id,
    title: raw.title ?? '',
    content: raw.content ?? '',
    todos: Array.isArray(raw.todos) ? raw.todos : [],
    highlightColor: raw.highlight_color ?? raw.highlightColor ?? 'yellow',
    updated_at: raw.updated_at,
    created_at: raw.created_at
  }
}

export default function DceSimple() {
  // auth
  const [unlocked, setUnlocked] = useState(false)
  const [pass, setPass] = useState('')
  const [passError, setPassError] = useState('')
  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioRegistered, setBioRegistered] = useState(() => {
    try { return !!localStorage.getItem(BIO_KEY) } catch { return false }
  })
  const [showBioSetup, setShowBioSetup] = useState(false)

  // data
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [bizMenu, setBizMenu] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [files, setFiles] = useState<FileDoc[]>([])
  const [spends, setSpends] = useState<Spend[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(false)

  // ui
  const [tab, setTab] = useState<Tab>('notes')
  const [search, setSearch] = useState('')
  const [noteEditorOpen, setNoteEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [priorityNote, setPriorityNote] = useState<Note | null>(null)
  const [fileUploaderOpen, setFileUploaderOpen] = useState(false)
  const [spendFormOpen, setSpendFormOpen] = useState(false)
  const [meetingFormOpen, setMeetingFormOpen] = useState(false)

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (business && unlocked) loadData(business.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business, unlocked])

  async function loadBusinesses() {
    if (!supabase) return
    const { data, error } = await supabase.from('businesses').select('id,name,type').order('name', { ascending: true })
    if (error) {
      toast.error('Could not load businesses')
      return
    }
    if (data?.length) {
      setBusinesses(data as Business[])
      setBusiness((prev) => prev || (data[0] as Business))
    }
  }

  async function loadData(businessId: string | number) {
    if (!supabase) return
    setLoading(true)
    try {
      const [notesRes, filesRes, spendsRes, meetingsRes] = await Promise.all([
        supabase.from('dce_notes').select('*').eq('business_id', businessId).order('updated_at', { ascending: false }),
        supabase.from('dce_documents').select('*').eq('business_id', businessId).order('updated_at', { ascending: false }),
        supabase.from('dce_expenditures').select('*').eq('business_id', businessId).order('spend_date', { ascending: false }),
        supabase.from('dce_meetings').select('*').eq('business_id', businessId).order('meeting_date', { ascending: false })
      ])
      if (notesRes.error) throw notesRes.error
      setNotes((notesRes.data ?? []).map(normalizeNote))
      setFiles((filesRes.data ?? []).filter((d: any) => d.file_url) as FileDoc[])
      setSpends((spendsRes.data ?? []) as Spend[])
      setMeetings((meetingsRes.data ?? []) as Meeting[])
    } catch (err: any) {
      toast.error('Could not load: ' + (err.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  function tryUnlock(value: string) {
    if (value === DCE_PASSCODE) {
      setUnlocked(true)
      setPassError('')
      // Offer to set up Face ID / fingerprint for next time
      if (bioAvailable && !bioRegistered) setShowBioSetup(true)
    } else {
      setPassError('Wrong passcode')
      setPass('')
    }
  }

  // Detect platform biometric (Face ID / Touch ID / Windows Hello / fingerprint)
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).PublicKeyCredential) return
    ;(window as any).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
      .then((ok: boolean) => setBioAvailable(!!ok))
      .catch(() => {})
  }, [])

  async function enableBiometric() {
    try {
      const cred: any = await navigator.credentials.create({
        publicKey: {
          challenge: randomBytes(32),
          rp: { name: 'X Vault', id: location.hostname },
          user: { id: randomBytes(16), name: 'x-vault', displayName: 'X Vault' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
          attestation: 'none'
        }
      })
      localStorage.setItem(BIO_KEY, bufToB64url(cred.rawId))
      setBioRegistered(true)
      setShowBioSetup(false)
      toast.success('Face ID enabled for next time')
    } catch (e: any) {
      toast.error('Could not enable Face ID')
    }
  }

  async function unlockBiometric() {
    let stored: string | null = null
    try { stored = localStorage.getItem(BIO_KEY) } catch {}
    if (!stored) return
    try {
      await navigator.credentials.get({
        publicKey: {
          challenge: randomBytes(32),
          allowCredentials: [{ type: 'public-key', id: b64urlToBuf(stored), transports: ['internal'] }],
          userVerification: 'required',
          timeout: 60000,
          rpId: location.hostname
        }
      })
      setUnlocked(true)
    } catch (e) {
      toast.error('Face ID failed — use passcode')
    }
  }

  // ---------- notes ----------
  function openNewNote() {
    setEditingNote(null)
    setNoteEditorOpen(true)
  }
  function openEditNote(note: Note) {
    setEditingNote(note)
    setNoteEditorOpen(true)
  }
  async function saveNote(form: NoteForm) {
    if (!business || !supabase) return
    if (!form.title.trim() && !form.content.trim() && !form.todos.length) {
      toast.error('Add a title, text, or checklist item')
      return
    }
    const payload = {
      business_id: String(business.id),
      business_name: business.name,
      title: form.title.trim() || 'Untitled note',
      content: form.content.trim(),
      todos: form.todos,
      highlight_color: form.highlightColor
    }
    try {
      if (editingNote) {
        const { data, error } = await supabase.from('dce_notes').update(payload).eq('id', editingNote.id).select().single()
        if (error) throw error
        setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? normalizeNote(data) : n)))
        toast.success('Note updated')
      } else {
        const { data, error } = await supabase.from('dce_notes').insert([payload]).select().single()
        if (error) throw error
        setNotes((prev) => [normalizeNote(data), ...prev])
        toast.success('Note saved')
      }
      setNoteEditorOpen(false)
      setEditingNote(null)
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message ?? err))
    }
  }
  async function toggleTodo(note: Note, todoId: string) {
    if (!supabase) return
    const updatedTodos = note.todos.map((t) => (t.id === todoId ? { ...t, done: !t.done } : t))
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, todos: updatedTodos } : n)))
    const { error } = await supabase.from('dce_notes').update({ todos: updatedTodos }).eq('id', note.id)
    if (error) {
      toast.error('Could not update')
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)))
    }
  }
  async function deleteNote(note: Note) {
    if (!supabase || !window.confirm('Delete this note?')) return
    const { error } = await supabase.from('dce_notes').delete().eq('id', note.id)
    if (error) return toast.error('Delete failed')
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    toast.success('Note deleted')
  }

  // Flag an existing note "On Priority": save deadline (if any) and email all cofounders.
  async function sendPriority(note: Note, deadlineEnabled: boolean, date: string, time: string) {
    if (!business || !supabase) return
    const tId = toast.loading('Sending to founders…')
    try {
      // 1) store deadline on the note if one was chosen (retry without column if missing)
      if (deadlineEnabled && date) {
        let r = await supabase.from('dce_notes').update({ deadline: date }).eq('id', note.id)
        if (r.error && !/deadline/i.test(r.error.message)) throw r.error
      }
      // 2) email cofounders
      const backendUrl =
        (import.meta as any).env?.VITE_BACKEND_URL ||
        (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:3000' : location.origin)
      const deadlineDisplay = deadlineEnabled && date ? `${prettyDate(date)}${time ? ' at ' + time : ''}` : null
      const resp = await fetch(`${backendUrl}/send-priority-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          todos: note.todos.map((t) => ({ text: t.text, done: t.done })),
          business: business.name,
          deadline: deadlineDisplay
        })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok || !data.ok) throw new Error(data.error || 'Email failed')
      toast.success(`Priority sent to ${data.recipients ?? ''} founder(s)`, { id: tId })
      setPriorityNote(null)
    } catch (err: any) {
      toast.error('Priority failed: ' + (err.message ?? err), { id: tId })
    }
  }

  // ---------- money ----------
  async function saveSpend(form: SpendForm) {
    if (!business || !supabase) return
    if (!form.vendor.trim() || !form.amount.trim()) {
      toast.error('Add what you spent on and the amount')
      return
    }
    const base = {
      business_id: String(business.id),
      business_name: business.name,
      vendor: form.vendor.trim(),
      category: form.category || 'Other',
      amount: Number(form.amount.replace(/[^0-9.-]+/g, '')) || 0,
      spend_date: form.spend_date || new Date().toISOString().slice(0, 10),
      status: 'Cleared'
    }
    try {
      let res = await supabase.from('dce_expenditures').insert([{ ...base, note: form.note.trim() }]).select().single()
      // Fallback if the optional "note" column hasn't been added to the table yet.
      if (res.error && /note/i.test(res.error.message)) {
        res = await supabase.from('dce_expenditures').insert([base]).select().single()
      }
      if (res.error) throw res.error
      setSpends((prev) => [res.data as Spend, ...prev])
      toast.success('Spend added')
      setSpendFormOpen(false)
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message ?? err))
    }
  }
  async function deleteSpend(spend: Spend) {
    if (!supabase || !window.confirm('Delete this spend?')) return
    const { error } = await supabase.from('dce_expenditures').delete().eq('id', spend.id)
    if (error) return toast.error('Delete failed')
    setSpends((prev) => prev.filter((s) => s.id !== spend.id))
    toast.success('Spend deleted')
  }

  // ---------- meetings ----------
  async function saveMeeting(form: MeetingForm) {
    if (!business || !supabase) return
    if (!form.title.trim() || !form.meeting_date) {
      toast.error('Add a meeting title and date')
      return
    }
    const payload = {
      business_id: String(business.id),
      business_name: business.name,
      title: form.title.trim(),
      meeting_date: form.meeting_date,
      meeting_time: form.meeting_time,
      platform: form.platform,
      attendees: [],
      notify_numbers: '',
      link: form.link.trim(),
      notes: form.notes.trim()
    }
    try {
      const { data, error } = await supabase.from('dce_meetings').insert([payload]).select().single()
      if (error) throw error
      setMeetings((prev) => [data as Meeting, ...prev])
      toast.success('Meeting added')
      setMeetingFormOpen(false)
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message ?? err))
    }
  }
  async function deleteMeeting(m: Meeting) {
    if (!supabase || !window.confirm('Delete this meeting?')) return
    const { error } = await supabase.from('dce_meetings').delete().eq('id', m.id)
    if (error) return toast.error('Delete failed')
    setMeetings((prev) => prev.filter((x) => x.id !== m.id))
    toast.success('Meeting deleted')
  }

  // ---------- files ----------
  async function uploadFile(file: File, title: string) {
    if (!business || !supabase) return
    const safeName = file.name.replace(/\s+/g, '_')
    const ext = safeName.split('.').pop()?.toLowerCase() ?? 'bin'
    const fileType =
      file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? 'image' : ext === 'pdf' ? 'pdf' : 'file'
    const path = `documents/${business.id}/${Date.now()}-${safeName}`
    const tId = toast.loading('Uploading…')
    try {
      const { error: upErr } = await supabase.storage.from('dce-media').upload(path, file, { cacheControl: '3600', upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('dce-media').getPublicUrl(path)
      const payload = {
        business_id: String(business.id),
        business_name: business.name,
        title: title.trim() || file.name,
        doc_type: 'Upload',
        owner: 'Mobile',
        status: 'Draft',
        confidentiality: 'Restricted',
        file_url: urlData.publicUrl,
        file_type: fileType,
        updated_at: new Date().toISOString()
      }
      const { data, error } = await supabase.from('dce_documents').insert([payload]).select().single()
      if (error) throw error
      setFiles((prev) => [data as FileDoc, ...prev])
      toast.success('Uploaded', { id: tId })
      setFileUploaderOpen(false)
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.message ?? err), { id: tId })
    }
  }
  async function deleteFile(file: FileDoc) {
    if (!supabase || !window.confirm('Delete this file?')) return
    const { error } = await supabase.from('dce_documents').delete().eq('id', file.id)
    if (error) return toast.error('Delete failed')
    setFiles((prev) => prev.filter((f) => f.id !== file.id))
    toast.success('File deleted')
  }

  function onFabClick() {
    if (tab === 'notes') openNewNote()
    else if (tab === 'money') setSpendFormOpen(true)
    else if (tab === 'files') setFileUploaderOpen(true)
    else setMeetingFormOpen(true)
  }

  // ---------- lock screen ----------
  if (!unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: T.bg, fontFamily: FONT }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: T.accent }}>
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-semibold mb-1 tracking-tight" style={{ color: T.text }}>X Vault</h1>
        <p className="text-sm mb-8" style={{ color: T.sub }}>{bioRegistered ? 'Unlock with Face ID or passcode' : `Enter your ${PIN_LENGTH}-digit passcode`}</p>

        {bioRegistered && bioAvailable && (
          <button
            onClick={unlockBiometric}
            className="mb-7 flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white active:scale-95 transition-transform shadow-lg"
            style={{ background: T.accent }}
          >
            <ScanFace className="w-5 h-5" /> Unlock with Face ID
          </button>
        )}

        <div className="flex gap-3 mb-4">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: T.accent, background: pass.length > i ? T.accent : 'transparent' }} />
          ))}
        </div>
        {passError && <p className="text-rose-400 text-sm mb-3">{passError}</p>}

        <div className="grid grid-cols-3 gap-4 mt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, idx) => {
            if (k === '') return <div key={idx} />
            return (
              <button
                key={idx}
                onClick={() => {
                  if (k === 'del') return setPass((p) => p.slice(0, -1))
                  const next = (pass + k).slice(0, PIN_LENGTH)
                  setPass(next)
                  if (next.length === PIN_LENGTH) setTimeout(() => tryUnlock(next), 120)
                }}
                className="w-16 h-16 rounded-full text-2xl font-light flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                style={{ background: T.card, color: T.text, border: `1px solid ${T.cardBorder}` }}
              >
                {k === 'del' ? '⌫' : k}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------- main ----------
  const q = search.toLowerCase()
  const filteredNotes = notes.filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
  const filteredFiles = files.filter((f) => !q || (f.title ?? '').toLowerCase().includes(q))
  const filteredSpends = spends.filter((s) => !q || s.vendor.toLowerCase().includes(q) || (s.note ?? '').toLowerCase().includes(q))
  const filteredMeetings = meetings.filter((m) => !q || m.title.toLowerCase().includes(q))
  const totalSpend = spends.reduce((sum, s) => sum + Number(s.amount || 0), 0)

  const searchPlaceholder = { notes: 'Search notes', money: 'Search spends', files: 'Search files', meetings: 'Search meetings' }[tab]

  return (
    <div className="min-h-screen mx-auto max-w-md flex flex-col relative" style={{ background: T.bg, fontFamily: FONT, color: T.text, WebkitFontSmoothing: 'antialiased' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 shadow-lg" style={{ background: T.header }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
              {(business?.name ?? 'X').slice(0, 1).toUpperCase()}
            </div>
            <button onClick={() => setBizMenu((v) => !v)} className="flex items-center gap-1 min-w-0">
              <div className="text-left min-w-0">
                <div className="text-white font-bold text-[15px] leading-tight truncate max-w-[180px] tracking-tight">{business?.name ?? 'Select business'}</div>
                <div className="text-[11px] leading-tight" style={{ color: 'rgba(255,255,255,0.6)' }}>X Vault</div>
              </div>
              <ChevronDown className="w-4 h-4 shrink-0 text-white/80" />
            </button>
          </div>
          <button onClick={() => setUnlocked(false)} title="Lock" className="p-2 rounded-full active:bg-white/15">
            <Lock className="w-5 h-5 text-white" />
          </button>
        </div>

        {bizMenu && (
          <div className="absolute left-4 top-16 z-30 w-64 rounded-xl shadow-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
            {businesses.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBusiness(b)
                  setBizMenu(false)
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-100"
                style={{ color: b.id === business?.id ? T.accent : T.text, fontWeight: b.id === business?.id ? 600 : 400 }}
              >
                {b.name}
              </button>
            ))}
            {!businesses.length && <div className="px-4 py-3 text-sm" style={{ color: T.sub }}>No businesses found</div>}
          </div>
        )}

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ background: T.input }}>
            <Search className="w-4 h-4 text-white/70" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-transparent outline-none text-sm w-full text-white placeholder-white/55"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="w-4 h-4 text-white/70" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-3 py-3 pb-28" onClick={() => bizMenu && setBizMenu(false)}>
        {loading && <p className="text-center text-sm py-6" style={{ color: T.sub }}>Loading…</p>}

        {!loading && tab === 'notes' && <NotesList notes={filteredNotes} onEdit={openEditNote} onToggleTodo={toggleTodo} onDelete={deleteNote} onPriority={setPriorityNote} />}
        {!loading && tab === 'money' && <MoneyList spends={filteredSpends} total={totalSpend} businessName={business?.name ?? ''} onDelete={deleteSpend} />}
        {!loading && tab === 'files' && <FilesList files={filteredFiles} onDelete={deleteFile} />}
        {!loading && tab === 'meetings' && <MeetingsList meetings={filteredMeetings} onDelete={deleteMeeting} />}
      </main>

      {/* FAB */}
      <button
        onClick={onFabClick}
        className="fixed bottom-24 z-30 w-14 h-14 rounded-2xl text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ background: T.accent, right: 'max(1rem, calc(50% - 14rem))' }}
        aria-label="Add"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-20 flex" style={{ background: T.nav, borderTop: `1px solid ${T.cardBorder}` }}>
        <TabButton active={tab === 'notes'} onClick={() => setTab('notes')} icon={<StickyNote className="w-5 h-5" />} label="Notes" />
        <TabButton active={tab === 'money'} onClick={() => setTab('money')} icon={<Wallet className="w-5 h-5" />} label="Money" />
        <TabButton active={tab === 'files'} onClick={() => setTab('files')} icon={<Paperclip className="w-5 h-5" />} label="Files" />
        <TabButton active={tab === 'meetings'} onClick={() => setTab('meetings')} icon={<CalendarDays className="w-5 h-5" />} label="Meetings" />
      </nav>

      {noteEditorOpen && (
        <NoteEditor initial={editingNote} onClose={() => { setNoteEditorOpen(false); setEditingNote(null) }} onSave={saveNote} />
      )}
      {priorityNote && (
        <PriorityPopup note={priorityNote} onClose={() => setPriorityNote(null)} onSend={sendPriority} />
      )}
      {showBioSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: FONT }} onClick={() => setShowBioSetup(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-xs rounded-2xl p-5 shadow-2xl text-center" style={{ background: T.card }} onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: T.accent }}>
              <ScanFace className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold mb-1" style={{ color: T.text }}>Enable Face ID?</h3>
            <p className="text-sm mb-4" style={{ color: T.sub }}>Skip the passcode next time — unlock with Face ID, Touch ID or fingerprint.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowBioSetup(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: '#fff', color: T.text, border: `1px solid ${T.cardBorder}` }}>Not now</button>
              <button onClick={enableBiometric} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: T.accent }}>Enable</button>
            </div>
          </div>
        </div>
      )}
      {spendFormOpen && <SpendForm onClose={() => setSpendFormOpen(false)} onSave={saveSpend} />}
      {meetingFormOpen && <MeetingFormSheet onClose={() => setMeetingFormOpen(false)} onSave={saveMeeting} />}
      {fileUploaderOpen && <FileUploader onClose={() => setFileUploaderOpen(false)} onUpload={uploadFile} />}
    </div>
  )
}

/* ============================ sub-components ============================ */

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors" style={{ color: active ? T.accent : T.sub }}>
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center mt-20" style={{ color: T.sub }}>
      <div className="mx-auto mb-3 opacity-50 flex justify-center">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

function Sheet({ title, onClose, onSave, saveLabel = 'Save', saveDisabled, children }: { title: string; onClose: () => void; onSave: () => void; saveLabel?: string; saveDisabled?: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" style={{ background: T.bg, color: T.text, fontFamily: FONT }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: T.header }}>
          <button onClick={onClose}><X className="w-5 h-5 text-white" /></button>
          <span className="font-semibold text-white tracking-tight">{title}</span>
          <button onClick={onSave} disabled={saveDisabled} className="font-semibold text-sm px-3 py-1 rounded-full text-white disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.18)' }}>{saveLabel}</button>
        </div>
        <div className="p-4 space-y-4">{children}</div>
      </div>
    </div>
  )
}

const fieldStyle = { background: '#ffffff', color: T.text, border: `1px solid ${T.cardBorder}` }

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs" style={{ color: T.sub }}>{children}</label>
}

function NotesList({ notes, onEdit, onToggleTodo, onDelete, onPriority }: { notes: Note[]; onEdit: (n: Note) => void; onToggleTodo: (n: Note, id: string) => void; onDelete: (n: Note) => void; onPriority: (n: Note) => void }) {
  if (!notes.length) return <EmptyState icon={<StickyNote className="w-12 h-12" />} text="No notes yet. Tap + to add one." />
  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div key={note.id} className="rounded-xl px-4 py-3 shadow-sm" style={{ background: T.card, borderLeft: `3px solid ${noteAccent[note.highlightColor]}`, border: `1px solid ${T.cardBorder}`, borderLeftWidth: 3, borderLeftColor: noteAccent[note.highlightColor] }}>
          <div className="flex items-start justify-between gap-2">
            <button onClick={() => onEdit(note)} className="flex-1 text-left min-w-0">
              <h3 className="font-semibold truncate" style={{ color: T.text }}>{note.title}</h3>
              {note.content && <p className="text-sm mt-0.5 whitespace-pre-wrap line-clamp-4" style={{ color: T.sub }}>{note.content}</p>}
            </button>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button onClick={() => onDelete(note)} className="p-1.5" style={{ color: T.sub }} title="Delete"><Trash2 className="w-4 h-4" /></button>
              <button
                onClick={() => onPriority(note)}
                title="Send on priority to founders"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold active:scale-95 transition-transform"
                style={{ color: '#ff4d4f', background: 'rgba(255,77,79,0.10)' }}
              >
                <Flame className="w-3 h-3" /> Put on priority
              </button>
            </div>
          </div>
          {note.todos.length > 0 && (
            <div className="mt-2 space-y-1">
              {sortTodos(note.todos).map((todo) => (
                <button key={todo.id} onClick={() => onToggleTodo(note, todo.id)} className="flex items-center gap-2 text-sm w-full text-left">
                  <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0" style={{ background: todo.done ? T.accent : 'transparent', borderColor: todo.done ? T.accent : T.sub }}>
                    {todo.done && <span className="text-white text-[10px] leading-none">✓</span>}
                  </span>
                  <span style={{ color: todo.done ? T.sub : T.text, textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</span>
                </button>
              ))}
            </div>
          )}
          <div className="text-[11px] mt-2" style={{ color: T.sub }}>{timeAgo(note.updated_at || note.created_at)}</div>
        </div>
      ))}
    </div>
  )
}

function MoneyList({ spends, total, businessName, onDelete }: { spends: Spend[]; total: number; businessName: string; onDelete: (s: Spend) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl px-5 py-4 shadow-md" style={{ background: 'linear-gradient(135deg, #2b2b2b, #000000)' }}>
        <div className="text-xs text-white/75">Total spent · {businessName}</div>
        <div className="text-3xl font-bold text-white mt-1 tracking-tight">{inr(total)}</div>
        <div className="text-xs text-white/75 mt-1">{spends.length} {spends.length === 1 ? 'entry' : 'entries'}</div>
      </div>
      {!spends.length ? (
        <EmptyState icon={<Wallet className="w-12 h-12" />} text="No spends yet. Tap + to add one." />
      ) : (
        <div className="space-y-2">
          {spends.map((s) => (
            <div key={s.id} className="rounded-xl px-4 py-3 shadow-sm" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate" style={{ color: T.text }}>{s.vendor}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: T.sub }}>{s.category} · {prettyDate(s.spend_date)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold" style={{ color: '#161616' }}>{inr(Number(s.amount))}</span>
                  <button onClick={() => onDelete(s)} className="p-1" style={{ color: T.sub }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {s.note && <p className="text-sm mt-2 whitespace-pre-wrap rounded-lg px-3 py-2" style={{ background: T.bubble, color: T.sub }}>{s.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilesList({ files, onDelete }: { files: FileDoc[]; onDelete: (f: FileDoc) => void }) {
  if (!files.length) return <EmptyState icon={<Paperclip className="w-12 h-12" />} text="No files yet. Tap + to upload." />
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div key={file.id} className="rounded-xl px-3 py-2.5 flex items-center gap-3 shadow-sm" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
          <a href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
            {file.file_type === 'image' ? (
              <img src={file.file_url} alt={file.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: T.bubble }}>
                <FileText className="w-6 h-6" style={{ color: T.accent }} />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-medium truncate" style={{ color: T.text }}>{file.title}</div>
              <div className="text-[11px]" style={{ color: T.sub }}>{(file.file_type ?? 'file').toUpperCase()} · {timeAgo(file.updated_at)}</div>
            </div>
          </a>
          <button onClick={() => onDelete(file)} className="p-1.5 shrink-0" style={{ color: T.sub }}><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  )
}

function MeetingsList({ meetings, onDelete }: { meetings: Meeting[]; onDelete: (m: Meeting) => void }) {
  if (!meetings.length) return <EmptyState icon={<CalendarDays className="w-12 h-12" />} text="No meetings yet. Tap + to add one." />
  return (
    <div className="space-y-2">
      {meetings.map((m) => (
        <div key={m.id} className="rounded-xl px-4 py-3 shadow-sm" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold truncate" style={{ color: T.text }}>{m.title}</div>
              <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: T.sub }}>
                <CalendarDays className="w-3.5 h-3.5" />
                {prettyDate(m.meeting_date)}{m.meeting_time ? ` · ${m.meeting_time}` : ''}
              </div>
              {m.platform && (
                <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: T.sub }}>
                  <Video className="w-3.5 h-3.5" /> {m.platform}
                </div>
              )}
            </div>
            <button onClick={() => onDelete(m)} className="p-1 shrink-0" style={{ color: T.sub }}><Trash2 className="w-4 h-4" /></button>
          </div>
          {m.notes && <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: T.sub }}>{m.notes}</p>}
          {m.link && (
            <a href={m.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm mt-2 font-medium" style={{ color: T.accent }}>
              <ExternalLink className="w-4 h-4" /> Join link
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

function NoteEditor({ initial, onClose, onSave }: { initial: Note | null; onClose: () => void; onSave: (f: NoteForm) => void }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [todos, setTodos] = useState<Todo[]>(initial?.todos ?? [])
  const [newTodo, setNewTodo] = useState('')
  const [highlightColor, setHighlightColor] = useState<Note['highlightColor']>(initial?.highlightColor ?? 'yellow')

  function addTodo() {
    const t = newTodo.trim()
    if (!t) return
    setTodos((prev) => [...prev, { id: uid(), text: t, done: false }])
    setNewTodo('')
  }

  function handleSave() {
    // Include any checklist text typed but not yet added (Enter not pressed) so it isn't lost.
    const pending = newTodo.trim()
    const finalTodos = pending ? [...todos, { id: uid(), text: pending, done: false }] : todos
    onSave({ title, content, todos: finalTodos, highlightColor })
  }

  return (
    <Sheet title={initial ? 'Edit note' : 'New note'} onClose={onClose} onSave={handleSave}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full text-lg font-semibold outline-none bg-transparent pb-2" style={{ color: T.text, borderBottom: `1px solid ${T.cardBorder}` }} />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write something…" rows={5} className="w-full outline-none resize-none bg-transparent" style={{ color: T.text }} />

      <div className="space-y-2">
        {sortTodos(todos).map((todo) => (
          <div key={todo.id} className="flex items-center gap-2">
            <button onClick={() => setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)))} className="w-5 h-5 rounded border flex items-center justify-center shrink-0" style={{ background: todo.done ? T.accent : 'transparent', borderColor: todo.done ? T.accent : T.sub }}>
              {todo.done && <span className="text-white text-xs leading-none">✓</span>}
            </button>
            <span className="flex-1 text-sm" style={{ color: todo.done ? T.sub : T.text, textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</span>
            <button onClick={() => setTodos((prev) => prev.filter((t) => t.id !== todo.id))} style={{ color: T.sub }}><X className="w-4 h-4" /></button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <button type="button" onClick={addTodo} aria-label="Add checklist item" className="shrink-0 active:scale-90 transition-transform"><Plus className="w-5 h-5" style={{ color: T.accent }} /></button>
          <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTodo() } }} placeholder="Add checklist item" className="flex-1 outline-none text-sm bg-transparent" style={{ color: T.text }} />
          {newTodo.trim() && (
            <button type="button" onClick={addTodo} className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: T.accent, color: '#fff' }}>Add</button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs" style={{ color: T.sub }}>Color</span>
        {(['none', 'yellow', 'green', 'blue'] as Note['highlightColor'][]).map((c) => (
          <button key={c} onClick={() => setHighlightColor(c)} className="w-7 h-7 rounded-full border-2" style={{ background: noteAccent[c], borderColor: highlightColor === c ? T.text : 'transparent' }} />
        ))}
      </div>
    </Sheet>
  )
}

function PriorityPopup({ note, onClose, onSend }: { note: Note; onClose: () => void; onSend: (note: Note, deadlineEnabled: boolean, date: string, time: string) => Promise<void> }) {
  const [dMode, setDMode] = useState<'none' | 'set'>('none')
  const [dDate, setDDate] = useState(new Date().toISOString().slice(0, 10))
  const [dTime, setDTime] = useState('')
  const [sending, setSending] = useState(false)

  async function send() {
    setSending(true)
    try {
      await onSend(note, dMode === 'set', dDate, dTime)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: FONT }} onClick={() => !sending && onClose()}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-xs rounded-2xl p-5 shadow-2xl" style={{ background: T.card }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5" style={{ color: '#ff4d4f' }} />
          <h3 className="font-bold" style={{ color: T.text }}>Send on priority</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: T.sub }}>Founders get an email about “{note.title}” right away.</p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => setDMode('none')} className="py-2 rounded-lg text-sm font-medium" style={dMode === 'none' ? { background: T.accent, color: '#fff' } : { background: '#fff', color: T.text, border: `1px solid ${T.cardBorder}` }}>No deadline</button>
          <button onClick={() => setDMode('set')} className="py-2 rounded-lg text-sm font-medium" style={dMode === 'set' ? { background: T.accent, color: '#fff' } : { background: '#fff', color: T.text, border: `1px solid ${T.cardBorder}` }}>Set deadline</button>
        </div>

        {dMode === 'set' && (
          <div className="grid grid-cols-2 gap-2 mb-1">
            <input type="date" value={dDate} onChange={(e) => setDDate(e.target.value)} className="rounded-lg px-2 py-2 text-sm outline-none" style={fieldStyle} />
            <input type="time" value={dTime} onChange={(e) => setDTime(e.target.value)} className="rounded-lg px-2 py-2 text-sm outline-none" style={fieldStyle} />
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} disabled={sending} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: '#fff', color: T.text, border: `1px solid ${T.cardBorder}` }}>Cancel</button>
          <button onClick={send} disabled={sending} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#ff4d4f' }}>{sending ? 'Sending…' : 'Send'}</button>
        </div>
      </div>
    </div>
  )
}

function SpendForm({ onClose, onSave }: { onClose: () => void; onSave: (f: SpendForm) => void }) {
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Operating')
  const [spend_date, setSpendDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  return (
    <Sheet title="Add spend" onClose={onClose} onSave={() => onSave({ vendor, amount, category, spend_date, note })} saveLabel="Add" saveDisabled={!vendor.trim() || !amount.trim()}>
      <Field>
        <Label>What did you spend on?</Label>
        <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Office rent, Raw material" className="w-full rounded-lg px-3 py-2.5 outline-none" style={fieldStyle} />
      </Field>
      <Field>
        <Label>Amount (₹)</Label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="0" className="w-full rounded-lg px-3 py-2.5 outline-none text-lg font-semibold" style={fieldStyle} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label>Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg px-3 py-2.5 outline-none" style={fieldStyle}>
            {spendCategories.map((c) => <option key={c} value={c} style={{ background: T.card }}>{c}</option>)}
          </select>
        </Field>
        <Field>
          <Label>Date</Label>
          <input type="date" value={spend_date} onChange={(e) => setSpendDate(e.target.value)} className="w-full rounded-lg px-3 py-2.5 outline-none" style={fieldStyle} />
        </Field>
      </div>
      <Field>
        <Label>Note (optional)</Label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Why / details about this spend" className="w-full rounded-lg px-3 py-2.5 outline-none resize-none" style={fieldStyle} />
      </Field>
    </Sheet>
  )
}

function MeetingFormSheet({ onClose, onSave }: { onClose: () => void; onSave: (f: MeetingForm) => void }) {
  const [title, setTitle] = useState('')
  const [meeting_date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [meeting_time, setTime] = useState('')
  const [platform, setPlatform] = useState('Zoom')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <Sheet title="Add meeting" onClose={onClose} onSave={() => onSave({ title, meeting_date, meeting_time, platform, link, notes })} saveLabel="Add" saveDisabled={!title.trim() || !meeting_date}>
      <Field>
        <Label>Meeting title</Label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly review" className="w-full rounded-lg px-3 py-2.5 outline-none" style={fieldStyle} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label>Date</Label>
          <input type="date" value={meeting_date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2.5 outline-none" style={fieldStyle} />
        </Field>
        <Field>
          <Label>Time</Label>
          <input type="time" value={meeting_time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg px-3 py-2.5 outline-none" style={fieldStyle} />
        </Field>
      </div>
      <Field>
        <Label>Platform</Label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-lg px-3 py-2.5 outline-none" style={fieldStyle}>
          {meetingPlatforms.map((p) => <option key={p} value={p} style={{ background: T.card }}>{p}</option>)}
        </select>
      </Field>
      <Field>
        <Label>Join link (optional)</Label>
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="w-full rounded-lg px-3 py-2.5 outline-none" style={fieldStyle} />
      </Field>
      <Field>
        <Label>Notes (optional)</Label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Agenda / details" className="w-full rounded-lg px-3 py-2.5 outline-none resize-none" style={fieldStyle} />
      </Field>
    </Sheet>
  )
}

function FileUploader({ onClose, onUpload }: { onClose: () => void; onUpload: (file: File, title: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')

  return (
    <Sheet title="Upload file" onClose={onClose} onSave={() => file && onUpload(file, title)} saveLabel="Send" saveDisabled={!file}>
      <label className="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer" style={{ borderColor: T.cardBorder }}>
        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!title) setTitle(f.name) } }} />
        <Paperclip className="w-8 h-8 mx-auto mb-2" style={{ color: T.accent }} />
        <p className="text-sm" style={{ color: T.sub }}>{file ? file.name : 'Tap to choose photo or PDF'}</p>
      </label>
      {file && (
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="File name" className="w-full rounded-lg px-3 py-2.5 outline-none" style={fieldStyle} />
      )}
    </Sheet>
  )
}
