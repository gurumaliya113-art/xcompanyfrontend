import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
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
  FileCheck
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
  notes: string
  link: string
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
  confidentiality: 'Restricted'
}

const initialMeetingForm = {
  title: '',
  meeting_date: '',
  meeting_time: '',
  platform: 'Zoom',
  attendees: '',
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
  const [activeDecisionId, setActiveDecisionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const [documentForm, setDocumentForm] = useState(initialDocumentForm)
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null)
  const [meetingForm, setMeetingForm] = useState(initialMeetingForm)
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null)
  const [decisionForm, setDecisionForm] = useState(initialDecisionForm)
  const [editingDecisionId, setEditingDecisionId] = useState<number | null>(null)
  const [auditForm, setAuditForm] = useState(initialAuditForm)
  const [editingAuditId, setEditingAuditId] = useState<number | null>(null)
  const [expenditureForm, setExpenditureForm] = useState(initialExpenditureForm)
  const [editingExpenditureId, setEditingExpenditureId] = useState<number | null>(null)
  const [voteSubmitting, setVoteSubmitting] = useState(false)

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (!selectedBusiness) return
    loadDceData(selectedBusiness.id)
  }, [selectedBusiness])

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
      { label: 'YTD expenditure', value: `$${expenditures.reduce((sum, entry) => sum + entry.amount, 0).toLocaleString()}`, trend: expenditures.length ? '-1.2%' : 'No spend', positive: true },
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
      const votesResult = decisionsData.length
        ? await supabase.from('dce_votes').select('*').in('decision_id', decisionsData.map((item) => item.id))
        : { data: [], error: null }

      if (docsResult.error) throw docsResult.error
      if (meetingsResult.error) throw meetingsResult.error
      if (expendituresResult.error) throw expendituresResult.error
      if (auditsResult.error) throw auditsResult.error
      if (votesResult.error) throw votesResult.error

      setDocuments(docsResult.data ?? [])
      setMeetings((meetingsResult.data ?? []).map((item: any) => ({ ...item, attendees: item.attendees || [] })))
      setDecisions(decisionsData)
      setExpenditures(expendituresResult.data ?? [])
      setAuditEvents(auditsResult.data ?? [])
      setVotes(votesResult.data ?? [])
      if (!activeDecisionId && decisionsData.length) {
        setActiveDecisionId(decisionsData[0].id)
      }
    } catch (err: any) {
      toast.error('Unable to load DCE data: ' + (err.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  async function saveDocument() {
    if (!selectedBusiness) return
    if (!documentForm.title.trim()) {
      toast.error('Document title is required')
      return
    }
    try {
      if (editingDocumentId) {
        const { error } = await supabase.from('dce_documents').update({
          title: documentForm.title,
          doc_type: documentForm.doc_type,
          owner: documentForm.owner,
          status: documentForm.status,
          confidentiality: documentForm.confidentiality,
          updated_at: new Date().toISOString()
        }).eq('id', editingDocumentId)
        if (error) throw error
        toast.success('Document updated')
      } else {
        const { error } = await supabase.from('dce_documents').insert([{ ...documentForm,
          business_id: selectedBusiness.id,
          business_name: selectedBusiness.name,
          updated_at: new Date().toISOString()
        }])
        if (error) throw error
        toast.success('Document added')
      }
      setDocumentForm(initialDocumentForm)
      setEditingDocumentId(null)
      loadDceData(selectedBusiness.id)
    } catch (err: any) {
      toast.error('Save document failed: ' + (err.message ?? err))
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

  function editDocument(document: DocumentRecord) {
    setEditingDocumentId(document.id)
    setDocumentForm({
      title: document.title,
      doc_type: document.doc_type,
      owner: document.owner,
      status: document.status,
      confidentiality: document.confidentiality
    })
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
      link: meeting.link,
      notes: meeting.notes
    })
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

  return (
    <div className="min-h-screen flex bg-[#FDFBF7]">
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#0F172A] z-10">
        <div className="h-16 border-b border-[#1E293B] flex items-center px-4">
          <div className="w-10 h-10 rounded-sm bg-emerald-800 border border-emerald-700/50 flex items-center justify-center mr-3">
            <span className="text-emerald-200 font-serif text-lg font-bold">D</span>
          </div>
          <div className="text-xl font-semibold tracking-wide text-slate-100" style={{ fontFamily: 'Cormorant Garamond' }}>
            DCE Portal
          </div>
        </div>
        <div className="px-4 py-6">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 px-2">Platform</div>
          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Overview' },
              { icon: FileText, label: 'Documents' },
              { icon: Users, label: 'Meetings' },
              { icon: Briefcase, label: 'Finance' },
              { icon: CheckSquare, label: 'Decisions' },
              { icon: Vote, label: 'Voting' },
              { icon: Activity, label: 'Audit Log' },
              { icon: Settings, label: 'Settings' }
            ].map((item) => (
              <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-400 border border-transparent hover:bg-slate-800/50 hover:text-slate-100">
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50 bg-[#0B1121]">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 px-2">Active Entity</div>
          <div className="bg-slate-900 rounded-md border border-slate-800 hover:border-slate-700 p-3 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar initials={(selectedBusiness?.name ?? 'Halcyon Holdings').split(' ').map((n) => n[0]).join('')} size={32} />
                <div>
                  <div className="text-sm font-medium text-slate-100">{selectedBusiness?.name ?? 'Halcyon Holdings'}</div>
                  <div className="text-xs text-slate-500">{businesses.length} businesses</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 ml-72 flex flex-col">
        <header className="h-16 sticky top-0 z-20 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-stone-200 px-8 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type="text" placeholder="Search documents, meetings, decisions..." className="w-full bg-white/80 border border-stone-200 rounded-md pl-10 pr-4 py-2 text-sm shadow-sm placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-emerald-700/50 focus:border-emerald-700/50" />
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-2 shadow-sm text-sm text-stone-600">{selectedBusiness ? selectedBusiness.type : 'Select a business'}</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell className="w-5 h-5 text-stone-500 hover:text-stone-900 cursor-pointer" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#FDFBF7]">3</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">Marcus Patel</div>
                <div className="text-xs text-stone-500">Managing Partner</div>
              </div>
              <Avatar initials="MP" size={36} />
            </div>
          </div>
        </header>
        <div className="p-8 max-w-[1600px] mx-auto space-y-10">
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
              <a href="#audit-log" className="text-emerald-700 hover:text-emerald-800 font-medium text-sm">View audit history →</a>
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
                        <button key={option} disabled={!activeDecision || voteSubmitting} onClick={() => castVote(option)} className="rounded-md px-3 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">{option}</button>
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-medium text-slate-900" style={{ fontFamily: 'Cormorant Garamond' }}>Documents Vault</h2>
                <button onClick={resetDocumentForm} className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm hover:bg-slate-800 flex items-center gap-2"><Plus className="w-4 h-4" />{editingDocumentId ? 'Reset' : 'New'}</button>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-200 grid gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={documentForm.title} onChange={(event) => setDocumentForm({ ...documentForm, title: event.target.value })} placeholder="Title" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
                    <input value={documentForm.owner} onChange={(event) => setDocumentForm({ ...documentForm, owner: event.target.value })} placeholder="Owner" className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select value={documentForm.doc_type} onChange={(event) => setDocumentForm({ ...documentForm, doc_type: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                      <option>Contract</option>
                      <option>Resolution</option>
                      <option>Filing</option>
                      <option>NDA</option>
                      <option>Audit</option>
                    </select>
                    <select value={documentForm.status} onChange={(event) => setDocumentForm({ ...documentForm, status: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                      {statusOptions.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <select value={documentForm.confidentiality} onChange={(event) => setDocumentForm({ ...documentForm, confidentiality: event.target.value })} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900">
                      {confidentialityOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3"><button onClick={saveDocument} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">{editingDocumentId ? 'Update document' : 'Add document'}</button></div>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-stone-500">Title</th>
                      <th className="px-4 py-3 font-medium text-stone-500">Type</th>
                      <th className="px-4 py-3 font-medium text-stone-500">Status</th>
                      <th className="px-4 py-3 font-medium text-stone-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <FileText className="w-4 h-4 text-stone-400" />
                            <div>
                              <div className="font-medium text-slate-900 truncate max-w-[220px]">{doc.title}</div>
                              <div className="text-[10px] text-stone-500">{doc.business_name} • {formatDate(doc.updated_at)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-stone-600">{doc.doc_type}</td>
                        <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                        <td className="px-4 py-3 space-x-2">
                          <button onClick={() => editDocument(doc)} className="text-slate-600 hover:text-slate-900"><Pencil className="w-4 h-4 inline" /></button>
                          <button onClick={() => removeDocument(doc.id)} className="text-rose-600 hover:text-rose-800"><Trash2 className="w-4 h-4 inline" /></button>
                        </td>
                      </tr>
                    ))}
                    {!documents.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-stone-500">No documents yet. Start by adding one above.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-medium text-slate-900" style={{ fontFamily: 'Cormorant Garamond' }}>Meetings & Minutes</h2>
                <button onClick={resetMeetingForm} className="p-2 border border-stone-200 bg-white rounded-md hover:bg-stone-50"><Plus className="w-4 h-4 text-stone-600" /></button>
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
                  <input value={meetingForm.link} onChange={(event) => setMeetingForm({ ...meetingForm, link: event.target.value })} placeholder="Meeting link" className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 w-full" />
                  <textarea value={meetingForm.notes} onChange={(event) => setMeetingForm({ ...meetingForm, notes: event.target.value })} rows={3} placeholder="Notes / agenda" className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 w-full" />
                  <button onClick={saveMeeting} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{editingMeetingId ? 'Update meeting' : 'Add meeting'}</button>
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
                          <button onClick={() => editMeeting(meeting)} className="text-slate-600 hover:text-slate-900"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => removeMeeting(meeting.id)} className="text-rose-600 hover:text-rose-800"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="text-xs text-stone-600 mb-3">{meeting.platform} · {meeting.attendees.join(', ')}</div>
                      <div className="text-sm text-stone-700">{meeting.notes || 'No agenda notes added.'}</div>
                      {meeting.link && <a href={meeting.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-emerald-700 hover:text-emerald-800">Open link</a>}
                    </div>
                  )) : <div className="text-center text-sm text-stone-500">No meetings scheduled yet.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
