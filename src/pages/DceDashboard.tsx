import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { createWorker } from 'tesseract.js'
import { jsPDF } from 'jspdf'
import {
  LayoutDashboard,
  FileText,
  Users,
  Briefcase,
  CheckSquare,
  Vote,
  Activity,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Plus,
  Pencil,
  Trash2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  FileCheck,
  Heart,
  MessageCircle,
  Share2,
  Download
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'

type Business = { id: string | number; name: string; type: string }
type DocumentRecord = {
  id: number
  title: string
  doc_type: string
  business_name: string
  owner: string
  updated_at: string
  status: string
  confidentiality: string
  description?: string
  file_url?: string
  file_type?: string
}
type DocumentComment = {
  id: number
  document_id: number
  commenter: string
  comment_text: string
  inserted_at: string
}
type DecisionRecord = {
  id: number
  title: string
  business_name: string
  amount: number
  proposer: string
  due_date: string
  risk: string
  stage: string
}
type VoteRecord = {
  id: number
  decision_id: number
  voter: string
  vote_option: string
}
type MeetingRecord = {
  id: number
  business_name: string
  title: string
  meeting_date: string
  meeting_time: string
  platform: string
  attendees: string[]
  notify_numbers?: string
  notes: string
  link: string
}
type NoteTodoItem = {
  id: string
  text: string
  done: boolean
}
type NoteRecord = {
  id: number
  business_id: string
  business_name: string
  title: string
  content: string
  todos: NoteTodoItem[]
  reminder: string
  deadline: string
  highlightColor: 'none' | 'yellow' | 'green' | 'blue'
  created_at: string
  updated_at: string
}
type NoteForm = {
  title: string
  content: string
  newTodo: string
  todos: NoteTodoItem[]
  reminder: string
  deadline: string
  highlightColor: NoteRecord['highlightColor']
}
type ExpenditureRecord = {
  id: number
  business_name: string
  vendor: string
  category: string
  amount: number
  spend_date: string
  status: string
}
type AuditRecord = {
  id: number
  business_name: string
  event_text: string
  category: string
  actor: string
  inserted_at: string
}

type DceTab = 'Overview' | 'Inside X' | 'Documents' | 'Notes' | 'Meetings' | 'Finance' | 'Decisions' | 'Voting' | 'Audit Log' | 'Settings'

const statusOptions = ['Signed', 'Awaiting signature', 'Draft', 'Expired'] as const
const confidentialityOptions = ['Public', 'Restricted', 'Confidential', 'Privileged'] as const
const voteOptions = ['For', 'Against', 'Abstain'] as const
const stageOptions = ['Proposed', 'Under review', 'Board Approved'] as const
const categories = ['Operating', 'Capex', 'Compensation', 'Legal', 'Tech'] as const
const platforms = ['Zoom', 'Teams', 'In person'] as const

const initialDocumentForm = {
  title: '',
  doc_type: 'Contract',
  owner: '',
  status: 'Draft',
  confidentiality: 'Restricted',
  description: '',
  file_url: '',
  file_type: 'image'
}

const initialMeetingForm = {
  title: '',
  meeting_date: '',
  meeting_time: '',
  platform: 'Zoom',
  attendees: '',
  notify_numbers: '',
  notify_members: false,
  link: '',
  notes: ''
}

const initialDecisionForm = {
  title: '',
  amount: '',
  proposer: '',
  due_date: '',
  risk: 'Medium',
  stage: 'Proposed'
}

const initialAuditForm = {
  event_text: '',
  category: 'Governance',
  actor: ''
}

const initialExpenditureForm = {
  vendor: '',
  category: 'Operating',
  amount: '',
  spend_date: '',
  status: 'Pending'
}

const initialNoteForm: NoteForm = {
  title: '',
  content: '',
  newTodo: '',
  todos: [],
  reminder: '',
  deadline: '',
  highlightColor: 'yellow'
}

const initialBusinessForm = {
  name: '',
  type: ''
}

const DCE_PASSCODE = import.meta.env.VITE_DCE_PASSCODE?.trim() || '1234'

function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}


function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; border: string }> = {
    Signed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Awaiting signature': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Draft: { bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-200' },
    Expired: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    Cleared: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Processing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Pending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Failed: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
  }
  const config = configs[status] ?? configs.Draft
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase border ${config.bg} ${config.text} ${config.border}`}>{status}</span>
}

function RiskBadge({ risk }: { risk: string }) {
  const configs: Record<string, { bg: string; text: string; border: string }> = {
    High: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
  }
  const config = configs[risk] || configs.Medium
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}>{risk}</span>
}

function Avatar({ initials, size = 24 }: { initials: string; size?: number }) {
  return (
    <div className="rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-medium text-emerald-700" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

export default function DceDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [expenditures, setExpenditures] = useState<ExpenditureRecord[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditRecord[]>([])
  const [votes, setVotes] = useState<VoteRecord[]>([])
  const [documentComments, setDocumentComments] = useState<DocumentComment[]>([])
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [activeDecisionId, setActiveDecisionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState<Set<string | number>>(new Set())
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [notificationModalOpen, setNotificationModalOpen] = useState(false)
  const [selectedDecisionForNotif, setSelectedDecisionForNotif] = useState<DecisionRecord | null>(null)
  const [notificationEmails, setNotificationEmails] = useState('')
  const [sendingNotification, setSendingNotification] = useState(false)

  const [documentForm, setDocumentForm] = useState(initialDocumentForm)
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [meetingForm, setMeetingForm] = useState(initialMeetingForm)
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null)
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const [noteForm, setNoteForm] = useState<NoteForm>(initialNoteForm)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [smsSending, setSmsSending] = useState(false)
  const [decisionForm, setDecisionForm] = useState(initialDecisionForm)
  const [editingDecisionId, setEditingDecisionId] = useState<number | null>(null)
  const [auditForm, setAuditForm] = useState(initialAuditForm)
  const [editingAuditId, setEditingAuditId] = useState<number | null>(null)
  const [expenditureForm, setExpenditureForm] = useState(initialExpenditureForm)
  const [editingExpenditureId, setEditingExpenditureId] = useState<number | null>(null)
  const [voteSubmitting, setVoteSubmitting] = useState(false)
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [businessForm, setBusinessForm] = useState(initialBusinessForm)
  const [editingBusinessId, setEditingBusinessId] = useState<string | number | null>(null)
  const [activeTab, setActiveTab] = useState<DceTab>('Overview')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showDceIntro, setShowDceIntro] = useState(true)
  const [passcodeVerified, setPasscodeVerified] = useState(false)
  const [passcodeInput, setPasscodeInput] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [handwrittenImage, setHandwrittenImage] = useState<File | null>(null)
  const [pendingHandwrittenPdfBlob, setPendingHandwrittenPdfBlob] = useState<Blob | null>(null)
  const [handwrittenPdfUrl, setHandwrittenPdfUrl] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState<string>('')
  const [ocrPercent, setOcrPercent] = useState<number | null>(null)
  const [ocrResultText, setOcrResultText] = useState<string>('')
  const [ocrProcessing, setOcrProcessing] = useState<boolean>(false)
  const [ocrFileInput, setOcrFileInput] = useState<File | null>(null)
  const [meetingScores, setMeetingScores] = useState<Record<number, any>>({})
  const [submittingMeetingScore, setSubmittingMeetingScore] = useState<Set<number>>(new Set())
  const [expandedMeetingScores, setExpandedMeetingScores] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    const introTimer = window.setTimeout(() => setShowDceIntro(false), 2200)
    return () => window.clearTimeout(introTimer)
  }, [])

  useEffect(() => {
    if (!selectedBusiness) return
    loadDceData(selectedBusiness.id)
  }, [selectedBusiness])

  useEffect(() => {
    if (!selectedBusiness) {
      setNotes([])
      setNoteForm(initialNoteForm)
      setEditingNoteId(null)
    }
  }, [selectedBusiness])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const activeDecision = useMemo(() => {
    if (!decisions.length) return null
    const chosen = decisions.find((item) => item.id === activeDecisionId)
    return chosen ?? decisions[0]
  }, [decisions, activeDecisionId])

  const voteSummary = useMemo(() => {
    const initial = { For: 0, Against: 0, Abstain: 0 }
    if (!activeDecision) return initial
    return votes.filter((vote) => vote.decision_id === activeDecision.id).reduce((acc, vote) => {
      const key = vote.vote_option as keyof typeof initial
      acc[key] += 1
      return acc
    }, initial)
  }, [votes, activeDecision])

  const totalVotes = voteSummary.For + voteSummary.Against + voteSummary.Abstain

  const kpis = useMemo(
    () => [
      { label: 'Documents under management', value: `${documents.length}`, trend: `${meetings.length} updates`, positive: true },
      { label: 'Open decisions', value: `${decisions.length}`, trend: `${meetings.length} meetings`, positive: true },
      { label: 'Pending votes', value: `${Math.max(0, decisions.length - (totalVotes ? 1 : 0))}`, trend: totalVotes ? `+${totalVotes} cast` : 'No votes', positive: totalVotes > 0 },
      { label: 'YTD expenditure', value: `₹${expenditures.reduce((sum, entry) => sum + entry.amount, 0).toLocaleString()}`, trend: expenditures.length ? '-1.2%' : 'No spend', positive: true },
      { label: 'Upcoming meetings', value: `${meetings.filter((item) => item.meeting_date && new Date(item.meeting_date) >= new Date()).length}`, trend: meetings.length ? `Next: ${meetings[0]?.meeting_date ?? 'none'}` : 'No meetings', positive: true }
    ],
    [documents.length, decisions.length, expenditures, meetings.length, totalVotes, meetings]
  )

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {}
    expenditures.forEach((item) => {
      totals[item.category] = (totals[item.category] || 0) + Number(item.amount)
    })
    return categories.map((name, index) => ({
      name,
      value: totals[name] ?? 0,
      color: ['#0f172a', '#334155', '#64748b', '#94a3b8', '#475569'][index]
    }))
  }, [expenditures])

  const spendTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const totals: Record<string, number> = {}
    expenditures.forEach((item) => {
      const date = new Date(item.spend_date || '')
      if (Number.isNaN(date.getTime())) return
      const month = months[date.getMonth()]
      totals[month] = (totals[month] || 0) + Number(item.amount) / 1_000_000
    })
    return months.map((name) => ({ name, amount: Number((totals[name] || 0).toFixed(1)) }))
  }, [expenditures])

  async function loadBusinesses() {
    try {
      const { data, error } = await supabase.from('businesses').select('id,name,type').order('name', { ascending: true })
      if (error) throw error
      if (data?.length) {
        setBusinesses(data)
        setSelectedBusiness((prev) => prev || data[0])
      }
    } catch (err: any) {
      toast.error('Unable to load businesses: ' + (err.message ?? err))
    }
  }

  function handleLogout() {
    setPasscodeVerified(false)
    setPasscodeInput('')
    setPasscodeError('')
  }

  function handleToggleLike(postId: string | number) {
    setLikedPostIds((current) => {
      const updated = new Set(current)
      if (updated.has(postId)) {
        updated.delete(postId)
      } else {
        updated.add(postId)
      }
      return updated
    })
  }

  async function handleSharePost(post: DocumentRecord) {
    const url = `${window.location.origin}${window.location.pathname}?post=${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard')
    } catch (err) {
      toast.error('Unable to copy share link')
    }
  }

  function handleCommentAction(postId: string | number) {
    setSelectedPostId(postId)
    setTimeout(() => commentInputRef.current?.focus(), 120)
  }

  async function sendDecisionNotification() {
    if (!selectedDecisionForNotif || !notificationEmails.trim()) {
      toast.error('Please select a decision and enter email addresses')
      return
    }
    setSendingNotification(true)
    try {
      const emails = notificationEmails.split(',').map((e) => e.trim()).filter((e) => e)
      if (!emails.length) throw new Error('No valid email addresses')
      
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: selectedDecisionForNotif,
          emails: emails,
          business: selectedBusiness
        })
      })
      
      if (!response.ok) throw new Error('Failed to send notification')
      
      toast.success(`Notification sent to ${emails.length} recipient(s)`)
      setNotificationEmails('')
      setNotificationModalOpen(false)
      setSelectedDecisionForNotif(null)
    } catch (err: any) {
      toast.error('Send notification failed: ' + (err.message ?? err))
    } finally {
      setSendingNotification(false)
    }
  }

  function handlePasscodeInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setPasscodeInput(digits)
    if (digits.length === 4) {
      verifyPasscode(digits)
    }
  }

  function verifyPasscode(value: string = passcodeInput) {
    if (value === DCE_PASSCODE) {
      setPasscodeVerified(true)
      setPasscodeError('')
      if (!selectedBusiness && businesses.length) {
        setSelectedBusiness(businesses[0])
      }
      return true
    }
    setPasscodeError('Incorrect passcode. Try again.')
    return false
  }

  async function loadDceData(businessId: string | number) {
    if (!selectedBusiness) return
    setLoading(true)
    try {
      const decisionsResult = await supabase.from('dce_financial_decisions').select('*').eq('business_id', businessId).order('due_date', { ascending: false })
      if (decisionsResult.error) throw decisionsResult.error
      const decisionsData = decisionsResult.data ?? []

      const docsResult = await supabase.from('dce_documents').select('*').eq('business_id', businessId).order('updated_at', { ascending: false })
      const meetingsResult = await supabase.from('dce_meetings').select('*').eq('business_id', businessId).order('meeting_date', { ascending: false })
      const expendituresResult = await supabase.from('dce_expenditures').select('*').eq('business_id', businessId).order('spend_date', { ascending: false })
      const auditsResult = await supabase.from('dce_audit_logs').select('*').eq('business_id', businessId).order('inserted_at', { ascending: false })
      const notesResult = await supabase.from('dce_notes').select('*').eq('business_id', businessId).order('updated_at', { ascending: false })
      const commentsResult = docsResult.data?.length
        ? await supabase.from('dce_document_comments').select('*').in('document_id', docsResult.data.map((item) => item.id))
        : { data: [], error: null }
      const votesResult = decisionsData.length
        ? await supabase.from('dce_votes').select('*').in('decision_id', decisionsData.map((item) => item.id))
        : { data: [], error: null }

      if (docsResult.error) throw docsResult.error
      if (meetingsResult.error) throw meetingsResult.error
      if (expendituresResult.error) throw expendituresResult.error
      if (auditsResult.error) throw auditsResult.error
      if (notesResult.error) throw notesResult.error
      if (commentsResult.error) throw commentsResult.error
      if (votesResult.error) throw votesResult.error

      const docsData = docsResult.data ?? []
      setDocuments(docsData)
      setMeetings((meetingsResult.data ?? []).map((item: any) => ({ ...item, attendees: item.attendees || [] })))
      setDecisions(decisionsData)
      setExpenditures(expendituresResult.data ?? [])
      setAuditEvents(auditsResult.data ?? [])
      setNotes(notesResult.data as NoteRecord[] ?? [])
      setDocumentComments(commentsResult.data ?? [])
      setVotes(votesResult.data ?? [])
      if (!activeDecisionId && decisionsData.length) {
        setActiveDecisionId(decisionsData[0].id)
      }
      if (!selectedPostId) {
        const firstMedia = docsData.find((item) => item.file_url)
        if (firstMedia) setSelectedPostId(firstMedia.id)
      }
    } catch (err: any) {
      toast.error('Unable to load DCE data: ' + (err.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  async function createPdfBlobFromText(text: string) {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 40
    const lineHeight = 16
    const lines = pdf.splitTextToSize(text || 'No text extracted from the handwritten note.', pageWidth - margin * 2)

    let cursorY = margin
    pdf.setFontSize(12)
    pdf.text('Handwritten Note OCR Output', margin, cursorY)
    cursorY += lineHeight * 2

    for (const line of lines) {
      if (cursorY > pageHeight - margin) {
        pdf.addPage()
        cursorY = margin
      }
      pdf.text(line, margin, cursorY)
      cursorY += lineHeight
    }

    return pdf.output('blob')
  }

  function updateOcrStatus(m: any) {
    const progressValue = typeof m.progress === 'number' ? Math.min(100, Math.max(0, Math.round(m.progress * 100))) : null
    const status = typeof m.status === 'string'
      ? `${m.status.charAt(0).toUpperCase()}${m.status.slice(1)}`
      : typeof m.task === 'string'
        ? `${m.task.charAt(0).toUpperCase()}${m.task.slice(1)}`
        : 'OCR'
    const progressLabel = progressValue != null ? ` (${progressValue}%)` : '...'

    setOcrProgress(`${status}${progressLabel}`)
    if (progressValue != null && progressValue > 0) {
      setOcrPercent(progressValue)
    }
  }

  async function addFromOcr(file: File) {
    const startTime = performance.now()
    setOcrProcessing(true)
    setOcrProgress('Initializing OCR...')
    setOcrPercent(0)
    setOcrResultText('')
    let fallbackInterval: number | null = null
    let worker: any = null

    try {
      fallbackInterval = window.setInterval(() => {
        setOcrPercent((prev) => {
          const next = (prev ?? 0) + Math.random() * 5 + 1
          return Math.min(95, next)
        })
      }, 1000)

      worker = await createWorker({
        logger: (m) => {
          console.log('Tesseract:', m)
          updateOcrStatus(m)
        }
      })

      await worker.load()
      await worker.loadLanguage('eng')
      await worker.initialize('eng')

      const { data: { text } } = await worker.recognize(file, {
        tessedit_pageseg_mode: '6',
        tessedit_ocr_engine_mode: '1'
      })

      const extractedText = text.trim() || 'No text extracted from the image.'
      console.log('✅ Text extracted:', extractedText.length, 'chars')
      setOcrResultText(extractedText)

      setOcrProgress('Generating PDF...')
      setOcrPercent(70)
      const pdfBlob = await createPdfBlobFromText(extractedText)

      // Upload the PDF
      const bucketName = 'dce-media'
      const safeName = `ocr-${Date.now()}.pdf`
      const filePath = `documents/${selectedBusiness?.id ?? 'unknown'}/${safeName}`

      setOcrProgress('Uploading to storage...')
      setOcrPercent(80)
      const { data, error } = await supabase.storage.from(bucketName).upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      })

      if (error) throw new Error(`Upload failed: ${error.message}`)
      console.log('✅ PDF uploaded')

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      // Save to database
      setOcrProgress('Saving to database...')
      setOcrPercent(90)
      const documentPayload = {
        business_id: selectedBusiness?.id,
        title: `OCR Document - ${file.name}`,
        doc_type: 'OCR Document',
        owner: 'System',
        status: 'Draft',
        confidentiality: 'Restricted',
        description: extractedText,
        file_url: publicUrlData.publicUrl,
        file_type: 'pdf'
      }

      const { error: insertError } = await supabase.from('dce_documents').insert([documentPayload])

      if (insertError) throw new Error(`Database insert failed: ${insertError.message}`)
      console.log('✅ Document saved to DB')

      // Refresh documents (non-blocking)
      console.log('✅ Refreshing documents in background...')
      if (selectedBusiness) {
        loadDceData(selectedBusiness.id).catch((err) => console.error('Background refresh failed:', err))
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime
      console.log('✅ OCR COMPLETED in', (totalTime / 1000).toFixed(1), 's')

      setOcrProgress(`Completed (${Math.round(totalTime / 1000)}s)`)
      setOcrPercent(100)
      toast.success(`OCR document added in ${(totalTime / 1000).toFixed(1)}s.`)
    } catch (error: any) {
      console.error('❌ OCR add failed:', error)
      setOcrProgress('Failed')
      setOcrPercent(0)
      setOcrResultText('')
      toast.error('Failed to add OCR document: ' + (error?.message ?? JSON.stringify(error) ?? error))
    } finally {
      if (fallbackInterval !== null) {
        window.clearInterval(fallbackInterval)
        fallbackInterval = null
      }
      if (worker) {
        try {
          await worker.terminate()
        } catch (cleanupError) {
          console.warn('Failed to terminate OCR worker:', cleanupError)
        }
        worker = null
      }
      setTimeout(() => {
        setOcrProcessing(false)
        setOcrProgress('')
        setOcrPercent(null)
      }, 700)
      setOcrFileInput(null)
    }
  }

  async function processHandwrittenImage(file: File) {
    const startTime = performance.now()
    setOcrProcessing(true)
    setOcrProgress('Initializing OCR...')
    setOcrPercent(0)
    setOcrResultText('')
    console.log('Starting OCR processing...')
    let fallbackInterval: number | null = null
    let timeoutId: number | null = null
    let worker: any = null

    if (handwrittenPdfUrl) {
      URL.revokeObjectURL(handwrittenPdfUrl)
      setHandwrittenPdfUrl(null)
    }

    try {
      fallbackInterval = window.setInterval(() => {
        setOcrPercent((prev) => {
          const next = (prev ?? 0) + Math.random() * 8 + 2
          return Math.min(95, next)
        })
      }, 800)

      timeoutId = window.setTimeout(() => {
        console.warn('⏱️ OCR timeout - 30s exceeded')
        if (fallbackInterval !== null) {
          window.clearInterval(fallbackInterval)
        }
        setOcrProgress('Timeout - check console')
        setOcrPercent(100)
      }, 30000) // 30 seconds timeout

      setOcrProgress('Creating Tesseract worker...')
      worker = await createWorker({
        logger: (m) => {
          console.log('Tesseract:', m)
          updateOcrStatus(m)
        }
      })

      setOcrProgress('Loading worker...')
      await worker.load()

      setOcrProgress('Loading language data...')
      await worker.loadLanguage('eng')

      setOcrProgress('Initializing engine...')
      await worker.initialize('eng')

      setOcrProgress('Recognizing text...')
      const { data: { text } } = await worker.recognize(file, {
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_ocr_engine_mode: '1' // Neural nets LSTM engine
      })

      const extractedText = text.trim() || 'No text extracted from the handwritten note.'
      setOcrResultText(extractedText)
      console.log('Extracted text length:', extractedText.length)

      setOcrProgress('Generating PDF...')
      const pdfBlob = await createPdfBlobFromText(extractedText)
      const pdfUrl = URL.createObjectURL(pdfBlob)

      setDocumentForm({ ...documentForm, description: extractedText, file_type: 'pdf' })
      setPendingHandwrittenPdfBlob(pdfBlob)
      setHandwrittenPdfUrl(pdfUrl)

      const endTime = performance.now()
      const totalTime = endTime - startTime
      console.log(`Total OCR processing time: ${(totalTime / 1000).toFixed(2)} seconds`)

      setOcrProgress(`Completed (${Math.round(totalTime / 1000)}s)`)
      setOcrPercent(100)
      toast.success(`OCR complete in ${(totalTime / 1000).toFixed(1)}s. Preview generated PDF before uploading.`)
    } catch (error: any) {
      const endTime = performance.now()
      const totalTime = endTime - startTime
      console.error('OCR failed after', totalTime.toFixed(2), 'ms:', error)
      setOcrProgress('Failed')
      setOcrPercent(0)
      setOcrResultText('')
      toast.error('Failed to extract text from image: ' + (error?.message ?? JSON.stringify(error) ?? error))
    } finally {
      if (fallbackInterval !== null) {
        window.clearInterval(fallbackInterval)
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
        timeoutId = null
      }
      if (worker) {
        try {
          await worker.terminate()
        } catch (cleanupError) {
          console.warn('Failed to terminate OCR worker:', cleanupError)
        }
        worker = null
      }
      setTimeout(() => {
        setOcrProcessing(false)
        setOcrProgress('')
        setOcrPercent(null)
      }, 700)
    }
  }

  async function uploadDocumentMedia(file: File) {
    const bucketName = 'dce-media'
    const safeName = file.name.replace(/\s+/g, '_')
    const fileExt = safeName.split('.').pop()?.toLowerCase() ?? 'bin'
    const fileType = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt) ? 'image' : fileExt === 'pdf' ? 'pdf' : 'image'
    const filePath = `documents/${selectedBusiness?.id ?? 'unknown'}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })
    if (uploadError) {
      console.error('DCE media upload failed', uploadError)
      throw uploadError
    }

    const { data: urlData, error: urlError } = supabase.storage.from(bucketName).getPublicUrl(filePath)
    if (urlError) {
      console.error('DCE media public URL generation failed', urlError)
      throw urlError
    }
    return { publicUrl: urlData.publicUrl, fileType: fileType as 'image' | 'pdf' }
  }

  async function saveDocument() {
    if (!selectedBusiness) return
    if (!documentForm.title.trim()) {
      toast.error('Document title is required')
      return
    }

    setUploadingDocument(true)
    try {
      let fileUrl = documentForm.file_url
      let fileType = documentForm.file_type

      if (documentForm.doc_type === 'Handwritten Note') {
        if (pendingHandwrittenPdfBlob) {
          const pdfFile = new File([pendingHandwrittenPdfBlob], `handwritten-note-${Date.now()}.pdf`, { type: 'application/pdf' })
          const uploadResult = await uploadDocumentMedia(pdfFile)
          fileUrl = uploadResult.publicUrl
          fileType = 'pdf'
        } else if (documentForm.file_url) {
          fileUrl = documentForm.file_url
          fileType = 'pdf'
        } else {
          throw new Error('Please upload a handwritten note image and preview the generated PDF before saving.')
        }
      } else if (mediaFile) {
        const uploadResult = await uploadDocumentMedia(mediaFile)
        fileUrl = uploadResult.publicUrl
        fileType = uploadResult.fileType
      }

      const documentPayload = {
        title: documentForm.title,
        doc_type: documentForm.doc_type,
        owner: documentForm.owner,
        status: documentForm.status,
        confidentiality: documentForm.confidentiality,
        description: documentForm.description,
        file_url: fileUrl,
        file_type: fileType,
        updated_at: new Date().toISOString()
      }

      if (editingDocumentId) {
        const { error } = await supabase.from('dce_documents').update(documentPayload).eq('id', editingDocumentId)
        if (error) throw error
        toast.success('Document updated')
      } else {
        const { error } = await supabase.from('dce_documents').insert([{
          ...documentPayload,
          business_id: String(selectedBusiness.id),
          business_name: selectedBusiness.name
        }])
        if (error) throw error
        toast.success('Document added')
      }

      setDocumentForm(initialDocumentForm)
      setMediaFile(null)
      setHandwrittenImage(null)
      setPendingHandwrittenPdfBlob(null)
      if (handwrittenPdfUrl) {
        URL.revokeObjectURL(handwrittenPdfUrl)
        setHandwrittenPdfUrl(null)
      }
      setEditingDocumentId(null)
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      console.error('Save document failed', err)
      toast.error('Save document failed: ' + (err?.message ?? JSON.stringify(err) ?? err))
    } finally {
      setUploadingDocument(false)
    }
  }

  async function removeDocument(id: number) {
    if (!selectedBusiness) return
    try {
      const { error } = await supabase.from('dce_documents').delete().eq('id', id)
      if (error) throw error
      toast.success('Document removed')
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message ?? err))
    }
  }

  async function saveDocumentComment() {
    if (!selectedBusiness || !selectedPostId || !commentText.trim()) return
    try {
      const { error } = await supabase.from('dce_document_comments').insert([{ document_id: selectedPostId, commenter: 'Portal user', comment_text: commentText.trim() }])
      if (error) throw error
      toast.success('Comment added')
      setCommentText('')
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Unable to add comment: ' + (err.message ?? err))
    }
  }

  function editDocument(document: DocumentRecord) {
    setEditingDocumentId(document.id)
    setDocumentForm({
      title: document.title,
      doc_type: document.doc_type,
      owner: document.owner,
      status: document.status,
      confidentiality: document.confidentiality,
      description: document.description ?? '',
      file_url: document.file_url ?? '',
      file_type: document.file_type ?? 'image'
    })
    setMediaFile(null)
    setHandwrittenImage(null)
  }

  async function saveMeeting() {
    if (!selectedBusiness) return
    if (!meetingForm.title.trim() || !meetingForm.meeting_date.trim()) {
      toast.error('Meeting title and date are required')
      return
    }
    try {
      const payload = {
        business_id: selectedBusiness.id,
        business_name: selectedBusiness.name,
        title: meetingForm.title,
        meeting_date: meetingForm.meeting_date,
        meeting_time: meetingForm.meeting_time,
        platform: meetingForm.platform,
        attendees: meetingForm.attendees.split(',').map((item) => item.trim()).filter(Boolean),
        notify_numbers: meetingForm.notify_numbers,
        link: meetingForm.link,
        notes: meetingForm.notes
      }
      if (editingMeetingId) {
        const { error } = await supabase.from('dce_meetings').update(payload).eq('id', editingMeetingId)
        if (error) throw error
        toast.success('Meeting updated')
      } else {
        const { error } = await supabase.from('dce_meetings').insert([payload])
        if (error) throw error
        toast.success('Meeting added')
      }

      const shouldSendEmail = meetingForm.notify_members && meetingForm.notify_numbers.trim()
      if (shouldSendEmail) {
        const emailList = String(meetingForm.notify_numbers)
          .split(/[\s,;]+/)
          .map((item) => item.trim())
          .filter(Boolean)

        if (!emailList.length) {
          toast.error('Please enter valid notify emails separated by commas or semicolons.')
        } else {
          setSmsSending(true)
          try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : window.location.origin)
            const emailPayload = {
              emails: emailList,
              title: meetingForm.title,
              meeting_date: meetingForm.meeting_date,
              meeting_time: meetingForm.meeting_time,
              platform: meetingForm.platform,
              link: meetingForm.link,
              notes: meetingForm.notes
            }
            const emailResponse = await fetch(`${backendUrl}/send-meeting-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(emailPayload)
            })
            const emailData = await emailResponse.json()
            if (!emailResponse.ok || !emailData.ok) {
              const details = emailData.error || emailData.details?.message || emailData.details || 'Email send failed'
              throw new Error(String(details))
            }
            toast.success('Meeting email sent to notified members')
          } catch (emailError: any) {
            console.error('Send meeting email error', emailError)
            toast.error('Meeting saved, but email failed: ' + (emailError?.message ?? emailError))
          } finally {
            setSmsSending(false)
          }
        }
      }

      setMeetingForm(initialMeetingForm)
      setEditingMeetingId(null)
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Save meeting failed: ' + (err.message ?? err))
    }
  }

  async function removeMeeting(id: number) {
    if (!selectedBusiness) return
    try {
      const { error } = await supabase.from('dce_meetings').delete().eq('id', id)
      if (error) throw error
      toast.success('Meeting removed')
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message ?? err))
    }
  }

  function editMeeting(meeting: MeetingRecord) {
    setEditingMeetingId(meeting.id)
    setMeetingForm({
      title: meeting.title,
      meeting_date: meeting.meeting_date,
      meeting_time: meeting.meeting_time,
      platform: meeting.platform,
      attendees: meeting.attendees.join(', '),
      notify_numbers: meeting.notify_numbers ?? '',
      notify_members: false,
      link: meeting.link,
      notes: meeting.notes
    })
  }

  async function loadMeetingScores(meetingId: number) {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : window.location.origin)
      const response = await fetch(`${backendUrl}/api/meeting-scores/${meetingId}`)
      const data = await response.json()
      
      if (data.ok) {
        setMeetingScores(prev => ({
          ...prev,
          [meetingId]: data
        }))
      }
    } catch (err) {
      console.error('Failed to load meeting scores:', err)
    }
  }

  async function submitMeetingScore(meetingId: number, score: string) {
    try {
      setSubmittingMeetingScore(prev => new Set([...prev, meetingId]))
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : window.location.origin)
      const response = await fetch(`${backendUrl}/api/meeting-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          score: score
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit score')
      }
      
      toast.success('Score submitted anonymously ✓')
      
      // Reload scores to show updated stats
      await loadMeetingScores(meetingId)
    } catch (err: any) {
      toast.error('Failed to submit score: ' + (err.message ?? err))
    } finally {
      setSubmittingMeetingScore(prev => {
        const updated = new Set(prev)
        updated.delete(meetingId)
        return updated
      })
    }
  }

  function toggleMeetingScores(meetingId: number) {
    if (expandedMeetingScores.has(meetingId)) {
      setExpandedMeetingScores(prev => {
        const updated = new Set(prev)
        updated.delete(meetingId)
        return updated
      })
    } else {
      setExpandedMeetingScores(prev => new Set([...prev, meetingId]))
      // Load scores when expanding
      if (!meetingScores[meetingId]) {
        loadMeetingScores(meetingId)
      }
    }
  }

  async function saveDecision() {
    if (!selectedBusiness) return
    if (!decisionForm.title.trim() || !decisionForm.amount.trim()) {
      toast.error('Decision title and amount are required')
      return
    }
    try {
      const payload = {
        business_id: selectedBusiness.id,
        business_name: selectedBusiness.name,
        title: decisionForm.title,
        amount: Number(decisionForm.amount.replace(/[^0-9.-]+/g, '')) || 0,
        proposer: decisionForm.proposer,
        due_date: decisionForm.due_date,
        risk: decisionForm.risk,
        stage: decisionForm.stage
      }
      if (editingDecisionId) {
        const { error } = await supabase.from('dce_financial_decisions').update(payload).eq('id', editingDecisionId)
        if (error) throw error
        toast.success('Decision updated')
      } else {
        const { error } = await supabase.from('dce_financial_decisions').insert([payload])
        if (error) throw error
        toast.success('Decision added')
      }
      setDecisionForm(initialDecisionForm)
      setEditingDecisionId(null)
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Save decision failed: ' + (err.message ?? err))
    }
  }

  async function removeDecision(id: number) {
    if (!selectedBusiness) return
    try {
      const { error } = await supabase.from('dce_financial_decisions').delete().eq('id', id)
      if (error) throw error
      toast.success('Decision removed')
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message ?? err))
    }
  }

  function editDecision(decision: DecisionRecord) {
    setEditingDecisionId(decision.id)
    setDecisionForm({
      title: decision.title,
      amount: decision.amount.toString(),
      proposer: decision.proposer,
      due_date: decision.due_date,
      risk: decision.risk,
      stage: decision.stage
    })
  }

  async function saveExpenditure() {
    if (!selectedBusiness) return
    if (!expenditureForm.vendor.trim() || !expenditureForm.amount.trim() || !expenditureForm.spend_date.trim()) {
      toast.error('Vendor, amount, and date are required')
      return
    }
    try {
      const payload = {
        business_id: selectedBusiness.id,
        business_name: selectedBusiness.name,
        vendor: expenditureForm.vendor,
        category: expenditureForm.category,
        amount: Number(expenditureForm.amount.replace(/[^0-9.-]+/g, '')) || 0,
        spend_date: expenditureForm.spend_date,
        status: expenditureForm.status
      }
      if (editingExpenditureId) {
        const { error } = await supabase.from('dce_expenditures').update(payload).eq('id', editingExpenditureId)
        if (error) throw error
        toast.success('Expenditure updated')
      } else {
        const { error } = await supabase.from('dce_expenditures').insert([payload])
        if (error) throw error
        toast.success('Expenditure added')
      }
      setExpenditureForm(initialExpenditureForm)
      setEditingExpenditureId(null)
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Save expenditure failed: ' + (err.message ?? err))
    }
  }

  async function removeExpenditure(id: number) {
    if (!selectedBusiness) return
    try {
      const { error } = await supabase.from('dce_expenditures').delete().eq('id', id)
      if (error) throw error
      toast.success('Expenditure removed')
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message ?? err))
    }
  }

  function editExpenditure(entry: ExpenditureRecord) {
    setEditingExpenditureId(entry.id)
    setExpenditureForm({
      vendor: entry.vendor,
      category: entry.category,
      amount: entry.amount.toString(),
      spend_date: entry.spend_date,
      status: entry.status
    })
  }

  async function saveAudit() {
    if (!selectedBusiness) return
    if (!auditForm.event_text.trim()) {
      toast.error('Event description is required')
      return
    }
    try {
      const payload = {
        business_id: selectedBusiness.id,
        business_name: selectedBusiness.name,
        event_text: auditForm.event_text,
        category: auditForm.category,
        actor: auditForm.actor
      }
      if (editingAuditId) {
        const { error } = await supabase.from('dce_audit_logs').update(payload).eq('id', editingAuditId)
        if (error) throw error
        toast.success('Audit event updated')
      } else {
        const { error } = await supabase.from('dce_audit_logs').insert([payload])
        if (error) throw error
        toast.success('Audit event added')
      }
      setAuditForm(initialAuditForm)
      setEditingAuditId(null)
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Save audit event failed: ' + (err.message ?? err))
    }
  }

  async function removeAudit(id: number) {
    if (!selectedBusiness) return
    try {
      const { error } = await supabase.from('dce_audit_logs').delete().eq('id', id)
      if (error) throw error
      toast.success('Audit event removed')
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message ?? err))
    }
  }

  async function castVote(option: string) {
    if (!selectedBusiness || !activeDecision) return
    setVoteSubmitting(true)
    try {
      const { error } = await supabase.from('dce_votes').insert([{ decision_id: activeDecision.id, voter: 'Portal user', vote_option: option }])
      if (error) throw error
      toast.success(`${option} vote recorded`)
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Vote failed: ' + (err.message ?? err))
    } finally {
      setVoteSubmitting(false)
    }
  }

  function resetDocumentForm() {
    setDocumentForm(initialDocumentForm)
    setEditingDocumentId(null)
    setMediaFile(null)
    setHandwrittenImage(null)
    setPendingHandwrittenPdfBlob(null)
    setOcrProgress('')
    if (handwrittenPdfUrl) {
      URL.revokeObjectURL(handwrittenPdfUrl)
      setHandwrittenPdfUrl(null)
    }
  }

  function resetMeetingForm() {
    setMeetingForm(initialMeetingForm)
    setEditingMeetingId(null)
  }

  function resetDecisionForm() {
    setDecisionForm(initialDecisionForm)
    setEditingDecisionId(null)
  }

  function resetExpenditureForm() {
    setExpenditureForm(initialExpenditureForm)
    setEditingExpenditureId(null)
  }

  function resetAuditForm() {
    setAuditForm(initialAuditForm)
    setEditingAuditId(null)
  }

  function resetBusinessForm() {
    setBusinessForm(initialBusinessForm)
    setEditingBusinessId(null)
  }

  async function saveBusiness() {
    if (!businessForm.name.trim()) {
      toast.error('Business name is required')
      return
    }
    if (!businessForm.type.trim()) {
      toast.error('Business type is required')
      return
    }
    try {
      if (editingBusinessId) {
        const { error } = await supabase.from('businesses').update({ name: businessForm.name, type: businessForm.type }).eq('id', editingBusinessId)
        if (error) throw error
        toast.success('Business updated')
      } else {
        const { error } = await supabase.from('businesses').insert([{ name: businessForm.name, type: businessForm.type }])
        if (error) throw error
        toast.success('Business added')
      }
      resetBusinessForm()
      loadBusinesses()
    } catch (err: any) {
      toast.error('Save business failed: ' + (err.message ?? err))
    }
  }

  async function deleteBusiness(businessId: string | number) {
    if (!confirm('Are you sure you want to delete this business?')) return
    try {
      const { error } = await supabase.from('businesses').delete().eq('id', businessId)
      if (error) throw error
      toast.success('Business deleted')
      if (selectedBusiness?.id === businessId) {
        setSelectedBusiness(null)
      }
      loadBusinesses()
    } catch (err: any) {
      toast.error('Delete business failed: ' + (err.message ?? err))
    }
  }

  function editBusiness(business: Business) {
    setEditingBusinessId(business.id)
    setBusinessForm({ name: business.name, type: business.type })
  }

  function resetNoteForm() {
    setNoteForm(initialNoteForm)
    setEditingNoteId(null)
  }

  function addTodoItem() {
    const nextText = noteForm.newTodo.trim()
    if (!nextText) return
    setNoteForm({
      ...noteForm,
      todos: [...noteForm.todos, { id: crypto.randomUUID?.() ?? `todo-${Date.now()}`, text: nextText, done: false }],
      newTodo: ''
    })
  }

  function toggleTodoDone(noteId: number, todoId: string) {
    setNotes((prev) => prev.map((note) => {
      if (note.id !== noteId) return note
      return {
        ...note,
        todos: note.todos.map((todo) => todo.id === todoId ? { ...todo, done: !todo.done } : todo)
      }
    }))
  }

  async function saveNote() {
    if (!selectedBusiness) {
      toast.error('Please select a business first')
      return
    }

    const hasContent = noteForm.title.trim() || noteForm.content.trim() || noteForm.todos.length
    if (!hasContent) {
      toast.error('Please add a note title, content, or todo item')
      return
    }

    const title = noteForm.title.trim() || 'Untitled note'
    const content = noteForm.content.trim()
    const payload = {
      business_id: String(selectedBusiness.id),
      business_name: selectedBusiness.name,
      title,
      content,
      todos: noteForm.todos,
      reminder: noteForm.reminder,
      deadline: noteForm.deadline,
      highlight_color: noteForm.highlightColor
    }

    try {
      setLoading(true)
      if (editingNoteId) {
        const { data, error } = await supabase.from('dce_notes').update(payload).eq('id', editingNoteId).select().single()
        if (error) throw error

        setNotes((prev) => prev.map((item) => item.id === editingNoteId ? { ...item, ...(data as NoteRecord) } : item))
        toast.success('Note updated')
      } else {
        const { data, error } = await supabase.from('dce_notes').insert([payload]).select().single()
        if (error) throw error

        setNotes((prev) => [{ ...(data as NoteRecord) }, ...prev])
        toast.success('Note saved')
      }
      resetNoteForm()
    } catch (err: any) {
      toast.error('Unable to save note: ' + (err.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  function editNote(note: NoteRecord) {
    setEditingNoteId(note.id)
    setNoteForm({
      title: note.title,
      content: note.content,
      newTodo: '',
      todos: note.todos,
      reminder: note.reminder,
      deadline: note.deadline,
      highlightColor: note.highlightColor
    })
  }

  async function removeNote(noteId: number) {
    try {
      setLoading(true)
      const { error } = await supabase.from('dce_notes').delete().eq('id', noteId)
      if (error) throw error
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
      if (editingNoteId === noteId) {
        resetNoteForm()
      }
      toast.success('Note removed')
    } catch (err: any) {
      toast.error('Unable to remove note: ' + (err.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  const noteHighlightStyles: Record<NoteRecord['highlightColor'], string> = {
    none: 'bg-white border-stone-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-emerald-50 border-emerald-200',
    blue: 'bg-sky-50 border-sky-200'
  }

  const noteColorLabels: Record<NoteRecord['highlightColor'], string> = {
    none: 'None',
    yellow: 'Yellow',
    green: 'Green',
    blue: 'Blue'
  }

  const noteHighlightOptions: Array<NoteRecord['highlightColor']> = ['none', 'yellow', 'green', 'blue']

  const tabItems = [
    { icon: LayoutDashboard, label: 'Overview' as const },
    { icon: FileText, label: 'Inside X' as const },
    { icon: FileText, label: 'Documents' as const },
    { icon: MessageCircle, label: 'Notes' as const },
    { icon: Users, label: 'Meetings' as const },
    { icon: Briefcase, label: 'Finance' as const },
    { icon: CheckSquare, label: 'Decisions' as const },
    { icon: Vote, label: 'Voting' as const },
    { icon: Activity, label: 'Audit Log' as const },
    { icon: Settings, label: 'Settings' as const }
  ]

  function renderInsideXTab() {
    const feedPosts = documents && documents.length > 0 ? documents.filter((doc) => doc.file_url) : []
    const selectedPost = feedPosts.find((post) => post.id === selectedPostId) ?? feedPosts[0]

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Inside X</h2>
            <p className="text-sm text-stone-500">Swipe through document images and PDFs with title, description and comments.</p>
          </div>
          <button type="button" onClick={() => setSelectedPostId(feedPosts[0]?.id ?? null)} className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800">Refresh feed</button>
        </div>

        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:px-0">
          <div className="inline-grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-4">
            {feedPosts.length ? feedPosts.map((post) => (
              <div key={post.id} role="button" tabIndex={0} onClick={() => setSelectedPostId(post.id)} onKeyDown={(event) => { if (event.key === 'Enter') setSelectedPostId(post.id) }} className={`min-w-[220px] rounded-3xl border ${selectedPostId === post.id ? 'border-emerald-700 bg-emerald-50' : 'border-stone-200 bg-white'} overflow-hidden text-left shadow-sm hover:shadow-lg transition cursor-pointer`}>
                <div className="h-44 sm:h-52 w-full overflow-hidden bg-stone-100">
                  {post.file_type === 'pdf' ? (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-stone-600">PDF</div>
                  ) : (
                    <img src={post.file_url} alt={post.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <div className="font-semibold text-slate-900 mb-2 truncate">{post.title}</div>
                  <div className="text-sm text-stone-600 line-clamp-3">{post.description || 'No description added yet.'}</div>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 pb-4">
                  <button type="button" onClick={(event) => { event.stopPropagation(); handleToggleLike(post.id) }} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${likedPostIds.has(post.id) ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                    <Heart className="w-4 h-4" />
                    Like
                  </button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); handleCommentAction(post.id) }} className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200 transition">
                    <MessageCircle className="w-4 h-4" />
                    Comment
                  </button>
                  <a href={post.file_url} download className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200 transition" onClick={(event) => event.stopPropagation()}>
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button type="button" onClick={(event) => { event.stopPropagation(); handleSharePost(post) }} className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200 transition">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            )) : (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500 min-w-[280px]">Add document items with media URLs to populate Inside X.</div>
            )}
          </div>
        </div>

        {selectedPost && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
              <div className="h-[300px] sm:h-[360px] lg:h-[420px] bg-stone-100 flex items-center justify-center overflow-hidden">
                {selectedPost.file_type === 'pdf' ? (
                  <div className="flex flex-col items-center gap-4">
                    <a href={selectedPost.file_url} target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold">Open PDF in new tab</a>
                    <a href={selectedPost.file_url} download className="text-emerald-700 font-semibold">Download PDF</a>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <img src={selectedPost.file_url} alt={selectedPost.title} className="h-full w-full object-cover" />
                    <a href={selectedPost.file_url} download className="absolute top-4 right-4 bg-white/80 rounded-full p-2 text-stone-700 hover:bg-white transition">
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="text-sm text-stone-500 uppercase tracking-[0.2em] mb-2">{selectedPost.doc_type}</div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-3">{selectedPost.title}</h3>
                <p className="text-sm text-stone-600 mb-4">{selectedPost.description || 'No description added yet for this post.'}</p>
                <div className="text-xs text-stone-500">Uploaded: {formatDate(selectedPost.updated_at)}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <MessageCircle className="w-5 h-5 text-slate-700" />
                    Comments
                  </div>
                  <p className="text-sm text-stone-500">Add thoughts on this item.</p>
                </div>
                <span className="text-xs text-stone-500">{documentComments.filter((comment) => comment.document_id === selectedPost.id).length} comments</span>
              </div>
              <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-2">
                {documentComments.filter((comment) => comment.document_id === selectedPost.id).map((comment) => (
                  <div key={comment.id} className="rounded-2xl bg-stone-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">{comment.commenter}</div>
                    <div className="text-sm text-stone-600">{comment.comment_text}</div>
                    <div className="text-xs text-stone-400 mt-2">{formatDate(comment.inserted_at)}</div>
                  </div>
                ))}
                {!documentComments.filter((comment) => comment.document_id === selectedPost.id).length && (
                  <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">Be the first to comment on this piece of content.</div>
                )}
              </div>
              <div className="space-y-3">
                <textarea ref={commentInputRef} value={commentText} onChange={(event) => setCommentText(event.target.value)} rows={3} placeholder="Write a comment..." className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"></textarea>
                <button type="button" onClick={saveDocumentComment} className="w-full rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Post comment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderOverview() {
    return (
      <>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-medium tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'Cormorant Garamond' }}>Platform Overview</h1>
            <p className="text-sm text-stone-500">Managing critical records across your portfolio businesses.</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-3">
            <select value={selectedBusiness?.id ?? ''} onChange={(event) => { const id = event.target.value; const business = businesses.find((item) => item.id.toString() === id); if (business) setSelectedBusiness(business) }} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none">
              <option value="">Select business</option>
              {businesses.map((business) => <option key={business.id} value={business.id.toString()}>{business.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-100 to-transparent" />
              <div className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-3">{kpi.label}</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl text-slate-900 tnum" style={{ fontFamily: 'Cormorant Garamond' }}>{kpi.value}</div>
                <div className={`text-xs font-medium tnum flex items-center gap-1 ${kpi.positive ? 'text-emerald-700' : 'text-stone-600'}`}>
                  {kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-medium text-slate-900" style={{ fontFamily: 'Cormorant Garamond' }}>Active Resolution</h2>
            <button type="button" className="text-emerald-700 hover:text-emerald-800 font-medium text-sm" onClick={() => setActiveTab('Audit Log')}>View audit history →</button>
          </div>
          <div className="bg-white border border-emerald-900/10 rounded-xl shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-700" />
            <div className="p-6 pl-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-200/50">Requires Vote</span>
                    <span className="text-stone-500 text-sm">Decision tracker</span>
                  </div>
                  <h3 className="text-xl font-medium text-slate-900 mb-4">Capital approval workflow for portfolio investments</h3>
                  <p className="text-sm text-stone-600 leading-relaxed mb-4 max-w-3xl">Live voting support combined with document and audit tracking to keep board governance and treasury aligned.</p>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <Avatar initials="SC" />
                    <span>Proposed by Chief Strategy</span>
                    <Clock className="w-3 h-3" />
                    <span>Real-time updates</span>
                  </div>
                </div>
                <div className="lg:w-80 lg:border-l border-stone-100 lg:pl-8">
                  <div className="text-sm text-stone-600 mb-4">{activeDecision ? `Decision #${activeDecision.id}` : 'No active decision selected'}</div>
                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex border border-stone-200/50 mb-6">
                    <div className="bg-emerald-600" style={{ width: `${totalVotes ? (voteSummary.For / totalVotes) * 100 : 0}%` }} />
                    <div className="bg-rose-500" style={{ width: `${totalVotes ? (voteSummary.Against / totalVotes) * 100 : 0}%` }} />
                    <div className="bg-stone-400" style={{ width: `${totalVotes ? (voteSummary.Abstain / totalVotes) * 100 : 0}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-stone-600">
                    <div className="rounded-lg bg-emerald-50 p-3"><div className="font-semibold text-emerald-700">For</div><div>{voteSummary.For}</div></div>
                    <div className="rounded-lg bg-rose-50 p-3"><div className="font-semibold text-rose-700">Against</div><div>{voteSummary.Against}</div></div>
                    <div className="rounded-lg bg-stone-50 p-3"><div className="font-semibold text-stone-700">Abstain</div><div>{voteSummary.Abstain}</div></div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {voteOptions.map((option) => (
                      <button key={option} type="button" disabled={!activeDecision || voteSubmitting} onClick={() => castVote(option)} className="rounded-md px-3 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">{option}</button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Active decision</label>
                    <select value={activeDecision?.id ?? ''} onChange={(event) => setActiveDecisionId(Number(event.target.value))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-slate-900">
                      {decisions.map((decision) => <option key={decision.id} value={decision.id}>{decision.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  function renderDocumentsTab() {
    console.log('Rendering Documents tab, documents:', documents)
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-medium text-slate-900">Documents Vault</h1>
          <div className="flex gap-3">
            <button type="button" onClick={() => document.getElementById('ocr-file-input')?.click()} disabled={ocrProcessing} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {ocrProcessing ? `Processing... ${ocrProgress}` : 'Add from OCR'}
            </button>
            <input
              id="ocr-file-input"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  addFromOcr(file)
                }
                event.currentTarget.value = ''
              }}
              className="hidden"
            />
            <button type="button" onClick={resetDocumentForm} className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm hover:bg-slate-800 flex items-center gap-2"><Plus className="w-4 h-4" />{editingDocumentId ? 'Reset' : 'New'}</button>
          </div>
          {ocrProcessing && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 mt-3">
              <div className="flex items-center justify-between text-sm text-slate-700 mb-2">
                <span>{ocrProgress}</span>
                {ocrPercent != null && <span>{ocrPercent}%</span>}
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${ocrPercent ?? 0}%` }} />
              </div>
            </div>
          )}
          {!ocrProcessing && ocrResultText && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 mt-3">
              <div className="text-sm font-semibold text-slate-900">OCR result preview</div>
              <div className="mt-2 text-sm text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">{ocrResultText}</div>
            </div>
          )}
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-200 grid gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={documentForm.title} onChange={(event) => setDocumentForm({ ...documentForm, title: event.target.value })} placeholder="Title" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
              <input value={documentForm.owner} onChange={(event) => setDocumentForm({ ...documentForm, owner: event.target.value })} placeholder="Owner" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={documentForm.doc_type} onChange={(event) => {
                const nextType = event.target.value
                setDocumentForm({ ...documentForm, doc_type: nextType })
                if (nextType !== 'Handwritten Note') {
                  setPendingHandwrittenPdfBlob(null)
                  setOcrProgress('')
                  setOcrPercent(null)
                  if (handwrittenPdfUrl) {
                    URL.revokeObjectURL(handwrittenPdfUrl)
                    setHandwrittenPdfUrl(null)
                  }
                }
              }} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                <option>Contract</option>
                <option>Resolution</option>
                <option>Filing</option>
                <option>NDA</option>
                <option>Audit</option>
                <option>Handwritten Note</option>
              </select>
              <select value={documentForm.status} onChange={(event) => setDocumentForm({ ...documentForm, status: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
              <select value={documentForm.confidentiality} onChange={(event) => setDocumentForm({ ...documentForm, confidentiality: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                {confidentialityOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {documentForm.doc_type === 'Handwritten Note' ? (
                <div className="space-y-3">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-slate-700 font-medium">Upload handwritten image</span>
                    <input type="file" accept="image/*" onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        setHandwrittenImage(file)
                        processHandwrittenImage(file)
                      }
                      event.currentTarget.value = ''
                    }} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 file:rounded-full file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-white file:font-medium file:cursor-pointer" />
                    {handwrittenImage && (
                      <div className="text-xs text-stone-500">
                        Selected: {handwrittenImage.name}
                        {ocrProcessing && (
                          <span className="ml-2 text-blue-600">
                            {ocrProgress || 'Processing OCR...'}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-stone-400">Upload an image of your handwritten notes. OCR will extract the text and generate a PDF for preview before uploading.</div>
                  </label>
                  {handwrittenPdfUrl && (
                    <div className="rounded-2xl border border-stone-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-800">OCR PDF preview ready</div>
                          <div className="text-xs text-stone-500">Open the generated PDF to verify the OCR result before saving.</div>
                        </div>
                        <button type="button" onClick={() => window.open(handwrittenPdfUrl, '_blank')} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Open PDF</button>
                      </div>
                      <div className="mt-3">
                        <iframe src={handwrittenPdfUrl} className="w-full h-[280px] rounded-xl border border-stone-200" title="Handwritten OCR Preview"></iframe>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-slate-700 font-medium">Upload media</span>
                  <input type="file" accept="image/*,application/pdf" onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 file:rounded-full file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-white file:font-medium file:cursor-pointer" />
                  {(mediaFile || documentForm.file_url) && (
                    <div className="text-xs text-stone-500">
                      {mediaFile ? `Selected file: ${mediaFile.name}` : `Using existing media from previous upload`}
                    </div>
                  )}
                  <div className="text-xs text-stone-400">Use Supabase storage for image/PDF upload. If no file is selected, the existing media remains unchanged.</div>
                </label>
              )}
              {documentForm.doc_type === 'Handwritten Note' ? (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-700">Output type: PDF</div>
              ) : (
                <select value={documentForm.file_type} onChange={(event) => setDocumentForm({ ...documentForm, file_type: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                  <option value="image">Image</option>
                  <option value="pdf">PDF</option>
                </select>
              )}
            </div>
            <textarea value={documentForm.description} onChange={(event) => setDocumentForm({ ...documentForm, description: event.target.value })} rows={2} placeholder="Description for Inside X" className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 w-full"></textarea>
            <div className="flex gap-3">
              <button type="button" onClick={saveDocument} disabled={uploadingDocument || ocrProcessing} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">{uploadingDocument ? (editingDocumentId ? 'Updating...' : 'Adding...') : ocrProcessing ? 'Processing...' : editingDocumentId ? 'Update document' : 'Add document'}</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-stone-500">Title</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Type</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Status</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {Array.isArray(documents) && documents.length > 0 ? documents.map((doc) => {
                  if (!doc || typeof doc !== 'object') return null
                  return (
                    <tr key={doc.id || Math.random()} className="hover:bg-stone-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <FileText className="w-4 h-4 text-stone-400" />
                          <div>
                            <div className="font-medium text-slate-900 truncate max-w-[220px]">{doc.title || 'Untitled'}</div>
                            <div className="text-[10px] text-stone-500">{doc.business_name || ''} • {doc.updated_at ? formatDate(doc.updated_at) : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{doc.doc_type || 'Unknown'}</td>
                      <td className="px-4 py-3"><StatusBadge status={doc.status || 'Draft'} /></td>
                      <td className="px-4 py-3 space-x-2">
                        <button type="button" onClick={() => editDocument(doc)} className="text-slate-600 hover:text-slate-900"><Pencil className="w-4 h-4 inline" /></button>
                        <button type="button" onClick={() => removeDocument(doc.id)} className="text-rose-600 hover:text-rose-800"><Trash2 className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-stone-500">No documents yet. Start by adding one above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderMeetingsTab() {
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-medium text-slate-900">Meetings & Minutes</h1>
          <button type="button" onClick={resetMeetingForm} className="p-2 border border-stone-200 bg-white rounded-md hover:bg-stone-50"><Plus className="w-4 h-4 text-stone-600" /></button>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-200">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={meetingForm.title} onChange={(event) => setMeetingForm({ ...meetingForm, title: event.target.value })} placeholder="Meeting title" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
              <input type="date" value={meetingForm.meeting_date} onChange={(event) => setMeetingForm({ ...meetingForm, meeting_date: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <select value={meetingForm.platform} onChange={(event) => setMeetingForm({ ...meetingForm, platform: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                {platforms.map((platform) => <option key={platform}>{platform}</option>)}
              </select>
              <input value={meetingForm.meeting_time} onChange={(event) => setMeetingForm({ ...meetingForm, meeting_time: event.target.value })} placeholder="Time" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            </div>
            <input value={meetingForm.attendees} onChange={(event) => setMeetingForm({ ...meetingForm, attendees: event.target.value })} placeholder="Attendees (comma separated)" className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 w-full" />
            <input value={meetingForm.notify_numbers} onChange={(event) => setMeetingForm({ ...meetingForm, notify_numbers: event.target.value })} placeholder="Notify emails (comma separated)" className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 w-full" />
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={meetingForm.notify_members} onChange={(event) => setMeetingForm({ ...meetingForm, notify_members: event.target.checked })} className="h-4 w-4 rounded border-stone-300 text-slate-900 focus:ring-slate-900" />
              Notify members by email when saving
            </label>
            <input value={meetingForm.link} onChange={(event) => setMeetingForm({ ...meetingForm, link: event.target.value })} placeholder="Meeting link" className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 w-full" />
            <textarea value={meetingForm.notes} onChange={(event) => setMeetingForm({ ...meetingForm, notes: event.target.value })} rows={3} placeholder="Notes / agenda" className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 w-full"></textarea>
            <button type="button" onClick={saveMeeting} disabled={smsSending} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{smsSending ? 'Sending email...' : editingMeetingId ? 'Update meeting' : 'Add meeting'}</button>
          </div>
          <div className="p-5 space-y-4">
            {meetings.length ? meetings.map((meeting) => (
              <div key={meeting.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="font-medium text-slate-900">{meeting.title}</div>
                    <div className="text-xs text-stone-500">{formatDate(meeting.meeting_date)} • {meeting.meeting_time}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => editMeeting(meeting)} className="text-slate-600 hover:text-slate-900"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => removeMeeting(meeting.id)} className="text-rose-600 hover:text-rose-800"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="text-xs text-stone-600 mb-3">{meeting.platform} · {meeting.attendees.join(', ')}</div>
                {meeting.notify_numbers ? <div className="text-xs text-stone-500 mb-2">Notified: {meeting.notify_numbers}</div> : null}
                <div className="text-sm text-stone-700 mb-3">{meeting.notes || 'No agenda notes added.'}</div>
                <div className="space-y-3">
                  {meeting.link && <a href={meeting.link} target="_blank" rel="noreferrer" className="inline-block text-sm text-emerald-700 hover:text-emerald-800">Open link</a>}
                  
                  {/* Meeting Score Section */}
                  <div className="pt-3 border-t border-stone-200">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-600">Meeting Score</span>
                      <button 
                        type="button"
                        onClick={() => toggleMeetingScores(meeting.id)}
                        className="text-xs text-slate-600 hover:text-slate-900 underline"
                      >
                        {expandedMeetingScores.has(meeting.id) ? 'Hide scores' : 'View scores'}
                      </button>
                    </div>
                    
                    {/* Score Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => submitMeetingScore(meeting.id, 'poor')}
                        disabled={submittingMeetingScore.has(meeting.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition"
                      >
                        Poor
                      </button>
                      <button
                        type="button"
                        onClick={() => submitMeetingScore(meeting.id, 'bad')}
                        disabled={submittingMeetingScore.has(meeting.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition"
                      >
                        Bad
                      </button>
                      <button
                        type="button"
                        onClick={() => submitMeetingScore(meeting.id, 'good')}
                        disabled={submittingMeetingScore.has(meeting.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition"
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        onClick={() => submitMeetingScore(meeting.id, 'excellent')}
                        disabled={submittingMeetingScore.has(meeting.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition"
                      >
                        Excellent
                      </button>
                    </div>
                    
                    {/* Score Statistics - Shown when expanded */}
                    {expandedMeetingScores.has(meeting.id) && meetingScores[meeting.id] && (
                      <div className="mt-3 pt-3 border-t border-stone-200 space-y-2">
                        <div className="text-xs text-stone-600 font-medium">Response: {meetingScores[meeting.id].total_responses} participant{meetingScores[meeting.id].total_responses !== 1 ? 's' : ''}</div>
                        {meetingScores[meeting.id].total_responses > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-stone-600">Excellent</span>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 bg-stone-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{width: `${meetingScores[meeting.id].percentages.excellent}%`}}></div>
                                </div>
                                <span className="font-medium text-stone-700 w-8 text-right">{meetingScores[meeting.id].percentages.excellent}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-stone-600">Good</span>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 bg-stone-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{width: `${meetingScores[meeting.id].percentages.good}%`}}></div>
                                </div>
                                <span className="font-medium text-stone-700 w-8 text-right">{meetingScores[meeting.id].percentages.good}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-stone-600">Bad</span>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 bg-stone-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500" style={{width: `${meetingScores[meeting.id].percentages.bad}%`}}></div>
                                </div>
                                <span className="font-medium text-stone-700 w-8 text-right">{meetingScores[meeting.id].percentages.bad}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-stone-600">Poor</span>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 bg-stone-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500" style={{width: `${meetingScores[meeting.id].percentages.poor}%`}}></div>
                                </div>
                                <span className="font-medium text-stone-700 w-8 text-right">{meetingScores[meeting.id].percentages.poor}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-stone-500 italic mt-2">Scores are completely anonymous • No personal data stored</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) : <div className="text-center text-sm text-stone-500">No meetings scheduled yet.</div>}
          </div>
        </div>
      </div>
    )
  }

  function renderNotesTab() {
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-medium text-slate-900">Notes</h1>
            <p className="text-sm text-stone-500">Quick notes, to-dos, reminders and deadlines for your DCE workflow.</p>
          </div>
          <button type="button" onClick={resetNoteForm} className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800">{editingNoteId ? 'Reset' : 'New note'}</button>
        </div>

        <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={noteForm.title} onChange={(event) => setNoteForm({ ...noteForm, title: event.target.value })} placeholder="Note title" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Reminder</label>
                  <input type="datetime-local" value={noteForm.reminder} onChange={(event) => setNoteForm({ ...noteForm, reminder: event.target.value })} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Deadline</label>
                  <input type="date" value={noteForm.deadline} onChange={(event) => setNoteForm({ ...noteForm, deadline: event.target.value })} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
                </div>
              </div>
            </div>
            <textarea value={noteForm.content} onChange={(event) => setNoteForm({ ...noteForm, content: event.target.value })} rows={4} placeholder="Write your note here..." className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-slate-900 resize-none" />

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
              <div className="grid gap-3 sm:grid-cols-[3fr_1fr]">
                <input value={noteForm.newTodo} onChange={(event) => setNoteForm({ ...noteForm, newTodo: event.target.value })} placeholder="Add todo item" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
                <button type="button" onClick={addTodoItem} className="rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800">Add todo</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {noteHighlightOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNoteForm({ ...noteForm, highlightColor: color })}
                    className={`h-10 rounded-2xl border ${noteForm.highlightColor === color ? 'border-slate-900 shadow-sm' : 'border-stone-200'} ${color === 'yellow' ? 'bg-amber-100' : color === 'green' ? 'bg-emerald-100' : color === 'blue' ? 'bg-sky-100' : 'bg-white'}`}
                    title={`Highlight ${noteColorLabels[color]}`}>
                    {color === noteForm.highlightColor ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>

            {noteForm.todos.length > 0 && (
              <div className="space-y-2">
                {noteForm.todos.map((todo) => (
                  <label key={todo.id} className="inline-flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 w-full">
                    <input type="checkbox" checked={todo.done} onChange={() => setNoteForm({ ...noteForm, todos: noteForm.todos.map((item) => item.id === todo.id ? { ...item, done: !item.done } : item) })} className="h-4 w-4 rounded border-stone-300 text-slate-900" />
                    <span className={`text-sm ${todo.done ? 'line-through text-stone-400' : 'text-slate-900'}`}>{todo.text}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={saveNote} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">{editingNoteId ? 'Update note' : 'Save note'}</button>
              <button type="button" onClick={resetNoteForm} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">Clear</button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.length ? notes.map((note) => (
            <article key={note.id} className={`rounded-3xl border ${noteHighlightStyles[note.highlightColor]} p-5 shadow-sm`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{note.title}</h2>
                  <div className="text-xs text-stone-500">{note.updated_at ? formatDate(note.updated_at) : ''}</div>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <button type="button" onClick={() => editNote(note)} className="rounded-full p-2 hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => removeNote(note.id)} className="rounded-full p-2 hover:bg-slate-100"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {(note.reminder || note.deadline) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {note.reminder && <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-[11px] font-semibold">Remind: {formatDate(note.reminder)}</span>}
                  {note.deadline && <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-[11px] font-semibold">Due: {formatDate(note.deadline)}</span>}
                </div>
              )}

              <div className="text-sm text-slate-900 whitespace-pre-wrap mb-4">{note.content || 'No additional details.'}</div>

              {note.todos.length > 0 && (
                <div className="space-y-2">
                  {note.todos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2">
                      <input type="checkbox" checked={todo.done} onChange={() => toggleTodoDone(note.id, todo.id)} className="h-4 w-4 rounded border-stone-300 text-slate-900" />
                      <span className={`text-sm ${todo.done ? 'line-through text-stone-400' : 'text-slate-900'}`}>{todo.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )) : (
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-500">No notes yet. Add your first note to keep meetings and documents in one place.</div>
          )}
        </div>
      </div>
    )
  }

  function renderFinanceTab() {
    return (
      <div className="space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-medium text-slate-900">Finance</h1>
            <p className="text-sm text-stone-500">Track spending, vendor payments and operating capital.</p>
          </div>
          <button type="button" onClick={resetExpenditureForm} className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800">{editingExpenditureId ? 'Reset form' : 'New expense'}</button>
        </div>
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Add / edit expenditure</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={expenditureForm.vendor} onChange={(event) => setExpenditureForm({ ...expenditureForm, vendor: event.target.value })} placeholder="Vendor" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
              <select value={expenditureForm.category} onChange={(event) => setExpenditureForm({ ...expenditureForm, category: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <input value={expenditureForm.amount} onChange={(event) => setExpenditureForm({ ...expenditureForm, amount: event.target.value })} placeholder="Amount" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
              <input type="date" value={expenditureForm.spend_date} onChange={(event) => setExpenditureForm({ ...expenditureForm, spend_date: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
              <select value={expenditureForm.status} onChange={(event) => setExpenditureForm({ ...expenditureForm, status: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 md:col-span-2">
                <option>Pending</option>
                <option>Processing</option>
                <option>Cleared</option>
                <option>Failed</option>
              </select>
            </div>
            <div className="mt-4"><button type="button" onClick={saveExpenditure} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">{editingExpenditureId ? 'Update expenditure' : 'Add expenditure'}</button></div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Spend by category</h2>
              <PieChart width={320} height={240}>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={4}>
                  {categoryData.map((entry, index) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Trend</h2>
              <LineChart width={340} height={220} data={spendTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="amount" stroke="#0f172a" strokeWidth={3} dot={false} />
              </LineChart>
            </div>
            {ocrProcessing && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 mt-3">
                <div className="flex items-center justify-between text-sm text-slate-700 mb-2">
                  <span>{ocrProgress}</span>
                  {ocrPercent != null && <span>{ocrPercent}%</span>}
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${ocrPercent ?? 0}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-200">
            <h2 className="text-xl font-medium text-slate-900">Recent expenditures</h2>
          </div>
          <div className="p-6 space-y-4">
            {expenditures.length ? expenditures.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div>
                    <div className="font-medium text-slate-900">{entry.vendor}</div>
                    <div className="text-xs text-stone-500">{entry.category} • {formatDate(entry.spend_date)}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">₹{Number(entry.amount).toLocaleString()}</div>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                  <span>{entry.status}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editExpenditure(entry)} className="text-slate-600 hover:text-slate-900"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => removeExpenditure(entry.id)} className="text-rose-600 hover:text-rose-800"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            )) : <div className="text-center text-sm text-stone-500">No expenditures recorded yet.</div>}
          </div>
        </div>
      </div>
    )
  }

  function renderDecisionsTab() {
    return (
      <div className="space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-medium text-slate-900">Decisions</h1>
            <p className="text-sm text-stone-500">Review approvals, budgets, risk, and stages for your business.</p>
          </div>
          <button type="button" onClick={resetDecisionForm} className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800">{editingDecisionId ? 'Reset form' : 'New decision'}</button>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={decisionForm.title} onChange={(event) => setDecisionForm({ ...decisionForm, title: event.target.value })} placeholder="Decision title" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            <input value={decisionForm.amount} onChange={(event) => setDecisionForm({ ...decisionForm, amount: event.target.value })} placeholder="Amount" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            <input value={decisionForm.proposer} onChange={(event) => setDecisionForm({ ...decisionForm, proposer: event.target.value })} placeholder="Proposer" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            <input type="date" value={decisionForm.due_date} onChange={(event) => setDecisionForm({ ...decisionForm, due_date: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            <select value={decisionForm.risk} onChange={(event) => setDecisionForm({ ...decisionForm, risk: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <select value={decisionForm.stage} onChange={(event) => setDecisionForm({ ...decisionForm, stage: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
              {stageOptions.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
          </div>
          <div className="mt-4">
            <button type="button" onClick={saveDecision} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">{editingDecisionId ? 'Update decision' : 'Add decision'}</button>
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-stone-500">Title</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Amount</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Proposer</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Stage</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {decisions.map((decision) => (
                  <tr key={decision.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-4 py-3">{decision.title}</td>
                    <td className="px-4 py-3">₹{Number(decision.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">{decision.proposer}</td>
                    <td className="px-4 py-3"><RiskBadge risk={decision.risk} /></td>
                    <td className="px-4 py-3 space-x-3">
                      <button type="button" onClick={() => { setSelectedDecisionForNotif(decision); setNotificationModalOpen(true) }} className="text-sky-600 hover:text-sky-800 font-semibold text-xs">Notify</button>
                      <button type="button" onClick={() => editDecision(decision)} className="text-slate-600 hover:text-slate-900"><Pencil className="w-4 h-4 inline" /></button>
                      <button type="button" onClick={() => removeDecision(decision.id)} className="text-rose-600 hover:text-rose-800"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {!decisions.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-stone-500">No decisions yet. Add one above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderVotingTab() {
    return (
      <div className="space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-medium text-slate-900">Voting</h1>
            <p className="text-sm text-stone-500">Cast votes on active decisions and track the vote outcome.</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
            Active decision: {activeDecision?.title ?? 'None selected'}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Current decision</h2>
              <p className="text-sm text-stone-600 mb-4">{activeDecision?.title ?? 'Select a decision and cast a vote.'}</p>
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Select decision</label>
                <select value={activeDecision?.id ?? ''} onChange={(event) => setActiveDecisionId(Number(event.target.value))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                  <option value="">Select decision</option>
                  {decisions.map((decision) => <option key={decision.id} value={decision.id}>{decision.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {voteOptions.map((option) => (
                  <button key={option} type="button" disabled={!activeDecision || voteSubmitting} onClick={() => castVote(option)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">{option}</button>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <div className="text-xs uppercase tracking-widest text-stone-500 mb-3">Vote summary</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-700">For</div>
                  <div className="text-2xl font-bold text-slate-900">{voteSummary.For}</div>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4">
                  <div className="text-sm font-semibold text-rose-700">Against</div>
                  <div className="text-2xl font-bold text-slate-900">{voteSummary.Against}</div>
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-sm font-semibold text-stone-700">Abstain</div>
                  <div className="text-2xl font-bold text-slate-900">{voteSummary.Abstain}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent votes</h2>
          <div className="space-y-3">
            {votes.length ? votes.map((vote) => (
              <div key={vote.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-slate-900">{vote.voter}</div>
                  <div className="text-xs text-stone-500">Decision #{vote.decision_id}</div>
                </div>
                <div className="rounded-full bg-white border border-stone-200 px-4 py-2 text-sm font-semibold text-slate-900">{vote.vote_option}</div>
              </div>
            )) : <div className="text-center text-sm text-stone-500">No votes cast yet.</div>}
          </div>
        </div>
      </div>
    )
  }

  function renderAuditLogTab() {
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-medium text-slate-900">Audit Log</h1>
            <p className="text-sm text-stone-500">Record and review important platform events.</p>
          </div>
          <button type="button" onClick={resetAuditForm} className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800">{editingAuditId ? 'Reset form' : 'New event'}</button>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <input value={auditForm.event_text} onChange={(event) => setAuditForm({ ...auditForm, event_text: event.target.value })} placeholder="Event description" className="md:col-span-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            <select value={auditForm.category} onChange={(event) => setAuditForm({ ...auditForm, category: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
              <option>Governance</option>
              <option>Finance</option>
              <option>Compliance</option>
              <option>Operations</option>
            </select>
            <input value={auditForm.actor} onChange={(event) => setAuditForm({ ...auditForm, actor: event.target.value })} placeholder="Actor" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
          </div>
          <div className="mt-4">
            <button type="button" onClick={saveAudit} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">{editingAuditId ? 'Update audit event' : 'Add audit event'}</button>
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-stone-500">Event</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Category</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Actor</th>
                  <th className="px-4 py-3 font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-4 py-3">{event.event_text}</td>
                    <td className="px-4 py-3">{event.category}</td>
                    <td className="px-4 py-3">{event.actor}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAuditId(event.id)
                          setAuditForm({
                            event_text: event.event_text,
                            category: event.category || 'Governance',
                            actor: event.actor || ''
                          })
                        }}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => removeAudit(event.id)} className="text-rose-600 hover:text-rose-800"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {!auditEvents.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-stone-500">No audit events recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderSettingsTab() {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-medium text-slate-900">Settings</h1>
          <p className="text-sm text-stone-500">Manage businesses and platform information.</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Current business</h2>
          {selectedBusiness ? (
            <div className="space-y-3 text-sm text-stone-700">
              <div><span className="font-semibold">Name:</span> {selectedBusiness.name}</div>
              <div><span className="font-semibold">Type:</span> {selectedBusiness.type}</div>
              <div><span className="font-semibold">Total documents:</span> {documents.length}</div>
              <div><span className="font-semibold">Total meetings:</span> {meetings.length}</div>
            </div>
          ) : (
            <div className="text-sm text-stone-500">Select a business to view settings.</div>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Manage businesses</h2>
            <button type="button" onClick={resetBusinessForm} className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">{editingBusinessId ? 'Reset' : 'New business'}</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Business name</label>
              <input value={businessForm.name} onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })} placeholder="e.g., BURGER, DROPSHIPPING" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Business type</label>
              <input value={businessForm.type} onChange={(e) => setBusinessForm({ ...businessForm, type: e.target.value })} placeholder="e.g., REHDI, PRODUCTS WITH ADS" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
            </div>
          </div>
          <button type="button" onClick={saveBusiness} className="rounded-full bg-emerald-700 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-800">{editingBusinessId ? 'Update business' : 'Add business'}</button>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="text-xl font-semibold text-slate-900">All businesses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3 font-medium text-stone-500">Name</th>
                  <th className="px-6 py-3 font-medium text-stone-500">Type</th>
                  <th className="px-6 py-3 font-medium text-stone-500">Documents</th>
                  <th className="px-6 py-3 font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
              {businesses.map((business) => {
                const bizDocs = documents.filter((doc) => doc.business_name === business.name)
                return (
                  <tr key={business.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{business.name}</td>
                    <td className="px-6 py-3 text-stone-600">{business.type}</td>
                    <td className="px-6 py-3 text-stone-600">{bizDocs.length}</td>
                    <td className="px-6 py-3 space-x-2">
                      <button type="button" onClick={() => editBusiness(business)} className="text-slate-600 hover:text-slate-900"><Pencil className="w-4 h-4 inline" /></button>
                      <button type="button" onClick={() => deleteBusiness(business.id)} className="text-rose-600 hover:text-rose-800"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                )
              })}
              {!businesses.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-sm text-stone-500">No businesses yet. Add one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    )
  }

  function renderActiveTab() {
    console.log('Rendering active tab:', activeTab)
    switch (activeTab) {
      case 'Inside X':
        return renderInsideXTab()
      case 'Documents':
        console.log('Rendering Documents tab')
        return renderDocumentsTab()
      case 'Notes':
        return renderNotesTab()
      case 'Meetings':
        return renderMeetingsTab()
      case 'Finance':
        return renderFinanceTab()
      case 'Decisions':
        return renderDecisionsTab()
      case 'Voting':
        return renderVotingTab()
      case 'Audit Log':
        return renderAuditLogTab()
      case 'Settings':
        return renderSettingsTab()
      case 'Overview':
      default:
        return renderOverview()
    }
  }

  if (showDceIntro) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <style>{`
          @keyframes slideDown {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-down {
            animation: slideDown 1s ease-out 0.5s forwards;
          }
          .animate-slide-up {
            animation: slideUp 1s ease-out 1s forwards;
          }
        `}</style>
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-slide-down">DCE</h1>
          <p className="text-lg md:text-xl text-gray-300 animate-slide-up">- Where Data Meets Intelligence</p>
          <div className="mt-8">
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!passcodeVerified) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
        <style>{`
          @keyframes slideDown {
            from { transform: translateY(-30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-3 px-4">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.35em] leading-tight animate-slideDown">This is a Highly Encrypted Area</h1>
            <p className="text-sm uppercase text-slate-400 tracking-[0.35em] animate-slideIn">Enter passcode to sign in</p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-[#07080d]/95 p-6 shadow-[0_0_80px_rgba(0,0,0,0.45)]">
            <div className="relative" onClick={() => document.getElementById('dce-passcode-input')?.focus()}>
              <input
                id="dce-passcode-input"
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={passcodeInput}
                onChange={(event) => handlePasscodeInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    verifyPasscode()
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 text-transparent caret-white"
              />
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="h-16 rounded-3xl border border-slate-700 bg-[#0c1221] flex items-center justify-center text-3xl font-semibold tracking-[0.25em] text-white shadow-inner shadow-black/25">
                    {passcodeInput[index] || '•'}
                  </div>
                ))}
              </div>
            </div>

            {passcodeError ? <div className="mt-4 text-sm text-rose-400">{passcodeError}</div> : null}
            <button
              type="button"
              onClick={() => verifyPasscode()}
              className="mt-5 w-full rounded-full border border-slate-700 bg-[#111827] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_15px_35px_rgba(0,0,0,0.35)] transition hover:bg-[#161f2f]"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-[#0F172A] z-20">
        <div className="h-16 border-b border-[#1E293B] flex items-center px-4">
          <div className="w-10 h-10 rounded-sm bg-emerald-800 border border-emerald-700/50 flex items-center justify-center mr-3">
            <span className="text-emerald-200 font-serif text-lg font-bold">D</span>
          </div>
          <div className="text-xl font-semibold tracking-wide text-slate-100" style={{ fontFamily: 'Cormorant Garamond' }}>
            DCE Portal
          </div>
        </div>
        <div className="px-4 py-6 pb-32 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 px-2">Platform</div>
          <nav className="space-y-1">
            {tabItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  console.log('Setting active tab to:', item.label)
                  setActiveTab(item.label)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm border border-transparent transition-colors ${activeTab === item.label ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50 bg-[#0B1121]">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 px-2">Active Entity</div>
          <div>
            <button type="button" onClick={() => setBusinessMenuOpen((open) => !open)} className="w-full bg-slate-900 rounded-md border border-slate-800 hover:border-slate-700 p-3 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar initials={(selectedBusiness?.name ?? 'Halcyon Holdings').split(' ').map((n) => n[0]).join('')} size={32} />
                  <div>
                    <div className="text-sm font-medium text-slate-100">{selectedBusiness?.name ?? 'Halcyon Holdings'}</div>
                    <div className="text-xs text-slate-500">{businesses.length} businesses</div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${businessMenuOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {businessMenuOpen && businesses.length > 1 && (
              <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden">
                {businesses.map((business) => (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => {
                      setSelectedBusiness(business)
                      setBusinessMenuOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-800 last:border-b-0 ${selectedBusiness?.id === business.id ? 'bg-slate-900 text-white' : 'bg-slate-950 text-slate-200 hover:bg-slate-900'}`}>
                    <div className="flex items-center justify-between">
                      <div>{business.name}</div>
                      <div className="text-[11px] text-slate-500">{business.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={`fixed inset-0 z-40 md:hidden transition-transform ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileNavOpen(false)} />
        <div className="relative h-full w-80 bg-[#0F172A] shadow-2xl">
          <div className="h-16 border-b border-[#1E293B] flex items-center px-4">
            <div className="w-10 h-10 rounded-sm bg-emerald-800 border border-emerald-700/50 flex items-center justify-center mr-3">
              <span className="text-emerald-200 font-serif text-lg font-bold">D</span>
            </div>
            <div className="text-xl font-semibold tracking-wide text-slate-100" style={{ fontFamily: 'Cormorant Garamond' }}>
              DCE Portal
            </div>
          </div>
          <div className="px-4 py-6 pb-32 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 px-2">Platform</div>
            <nav className="space-y-1">
              {tabItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.label)
                    setMobileNavOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm border border-transparent transition-colors ${activeTab === item.label ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50 bg-[#0B1121]">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 px-2">Active Entity</div>
            <div className="bg-slate-900 rounded-md p-3 text-slate-100">
              <div className="text-sm font-medium">{selectedBusiness?.name ?? 'Halcyon Holdings'}</div>
              <div className="text-xs text-slate-500">{selectedBusiness?.type ?? 'Business type'}</div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 md:ml-72">
        <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-stone-200 px-4 md:px-8 py-3 md:py-0 flex items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-3">
            <button type="button" className="md:hidden rounded-lg border border-stone-200 bg-white p-2 text-stone-700 shadow-sm" onClick={() => setMobileNavOpen((open) => !open)}>
              <span className="sr-only">Open navigation</span>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <div className="text-lg font-semibold text-slate-900">DCE Portal</div>
              <div className="text-xs text-stone-500">{selectedBusiness?.name ?? 'Select a business'}</div>
            </div>
          </div>
          <div className="hidden md:flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type="text" placeholder="Search documents, meetings, decisions..." className="w-full bg-white/80 border border-stone-200 rounded-md pl-10 pr-4 py-2 text-sm shadow-sm placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-emerald-700/50 focus:border-emerald-700/50" />
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-2 shadow-sm text-sm text-stone-600">{selectedBusiness ? selectedBusiness.type : 'Select a business'}</div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleLogout} className="rounded-full border border-stone-200 bg-slate-950/80 text-sm font-semibold text-white px-3 py-2 hover:bg-slate-900 transition-colors">
              Log out
            </button>
            <div className="relative hidden md:block">
              <Bell className="w-5 h-5 text-stone-500 hover:text-stone-900 cursor-pointer" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#FDFBF7]">3</div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">Marcus Patel</div>
                <div className="text-xs text-stone-500">Managing Partner</div>
              </div>
              <Avatar initials="MP" size={36} />
            </div>
          </div>
        </header>
        <div className="md:hidden border-b border-stone-200 bg-white/95">
          <div className="overflow-x-auto">
            <div className="inline-flex gap-2 px-4 py-3">
              {tabItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    console.log('Mobile: Setting active tab to:', item.label)
                    setActiveTab(item.label)
                  }}
                  className={`rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap ${activeTab === item.label ? 'bg-slate-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-10">
          {(() => {
            try {
              return renderActiveTab()
            } catch (error) {
              console.error('Error rendering active tab:', error)
              return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <div className="text-red-800 font-medium mb-2">Error loading tab content</div>
                  <div className="text-red-600 text-sm">Please refresh the page or try selecting a different tab.</div>
                  <div className="text-red-500 text-xs mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</div>
                </div>
              )
            }
          })()}
        </div>
      </main>

      {notificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Send Email Notification</h2>
              <p className="text-sm text-stone-600">
                Notify stakeholders about "{selectedDecisionForNotif?.title}"
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 text-sm">
              <div className="font-semibold text-slate-900">{selectedDecisionForNotif?.title}</div>
              <div className="text-stone-600">Amount: ₹{selectedDecisionForNotif ? Number(selectedDecisionForNotif.amount).toLocaleString() : 0}</div>
              <div className="text-stone-600">Proposer: {selectedDecisionForNotif?.proposer}</div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">Email addresses (comma-separated)</label>
              <textarea
                value={notificationEmails}
                onChange={(event) => setNotificationEmails(event.target.value)}
                placeholder="email1@example.com, email2@example.com"
                rows={3}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setNotificationModalOpen(false)
                  setSelectedDecisionForNotif(null)
                  setNotificationEmails('')
                }}
                className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendDecisionNotification}
                disabled={sendingNotification}
                className="flex-1 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {sendingNotification ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
