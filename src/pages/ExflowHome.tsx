import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { emailLeadToOwner } from '@/lib/notify';

/* ExFlow is a business under ExCompany with its own site. Point this at that
   site once it is live; changing it here updates the homepage venture link. */
const EXFLOW_URL = 'https://exflow.dpdns.org/';

/* Header and footer come from the shared SiteLayout. The homepage owns only
   the content sections below. */
const SITE_CONTENT = {
  hero: {
    label: "Venture Building Studio",
    headline: "Businesses Built to Last. Not Just to Launch.",
    subtext: "EXCOMPANY launches, operates, and owns stakes in practical businesses — from technology to street food. We don't just fund ideas. We build them.",
    button1: { text: "See Our Ventures", href: "#ventures" },
    button2: { text: "How We Work", href: "#model" },
    stats: [
      { value: "3", label: "Ventures" },
      { value: "2", label: "Cities" },
      { value: "1", label: "Shared Mission" },
      { value: "Long-term", label: "Owners" },
    ]
  },
  marquee: "EXFLOW · MANUFACTURING NOTEBOOKS · FOOD & BEVERAGE · TRANSPORT · WE BUILD · WE OPERATE · WE OWN · USEFUL BUSINESSES · LONG-TERM STAKES · ",
  ventures: {
    heading: "Small Starts. Serious Intent.",
    subtext: "We back businesses that solve real problems and earn their place in people's routines.",
    list: [
      {
        id: "tech8",
        title: "EXFLOW",
        description: "A focused technology company turning complicated work into simple, useful tools. From sustainability platforms to enterprise management systems — EXFLOW builds software that actually gets used.",
        tag: "Technology"
      },
      {
        id: "momo-rehdi",
        title: "MOMO REHDI",
        description: "A quick, honest food concept made for busy streets and repeat customers.",
        tag: "Food & Beverage"
      },
      {
        id: "your-business",
        title: "YOUR BUSINESS",
        description: "If the model is clear and the execution matters, there may be a place for it here.",
        tag: "Open"
      }
    ]
  },
  whyUs: {
    heading: "Why would you build with anyone else?",
    subtext: "We don't just wire money. We show up. EXCOMPANY puts skin in the game and stays in the room where decisions are made.",
    others: [
      "Take equity, stay distant",
      "No help with day-to-day operations",
      "Board meetings, not real work",
      "Exit-focused, not builder-focused"
    ],
    us: [
      "Equity AND real involvement",
      "On the ground with you",
      "Execution over governance",
      "Long-term owners, not flippers"
    ]
  },
  model: {
    heading: "We don't just invest. We get involved.",
    subtext: "EXCOMPANY is built for businesses where ownership and execution belong in the same room.",
    principles: [
      {
        num: "01",
        title: "Choose Useful",
        description: "Real demand beats shiny ideas. Every venture starts with a clear reason to exist."
      },
      {
        num: "02",
        title: "Build Together",
        description: "We work alongside the people closest to the problem, not from a distance."
      },
      {
        num: "03",
        title: "Own the Outcome",
        description: "Our share means accountability. We stay close to the details that create durable value."
      }
    ]
  },
  connect: {
    heading: "Let's Make the Next Move Worth Making.",
    subtext: "Tell us what you're building, what's missing, or what should exist in your market.",
    email: "hello@excompany.in"
  }
};

const HeroAbstractArt = () => {
  return (
    <div className="relative w-full aspect-square bg-[#F4F4F0] rounded-[2rem] border-2 border-border overflow-hidden shadow-sm group">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      
      {/* Forest Green Shape */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-[#064E3B] rounded-[40px] rotate-12 group-hover:rotate-6 transition-transform duration-700" 
      />
      
      {/* Orange Circle */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
        className="absolute top-[10%] right-[10%] w-[45%] aspect-square bg-primary rounded-full group-hover:scale-110 transition-transform duration-700 mix-blend-multiply" 
      />
      
      {/* Off-white / light gray shape */}
      <motion.div 
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="absolute top-[30%] left-[20%] w-[60%] h-[40%] bg-white rounded-2xl border border-gray-200 shadow-xl -rotate-6 group-hover:rotate-0 transition-transform duration-700 flex items-center justify-center overflow-hidden" 
      >
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
        <div className="w-16 h-16 border-4 border-gray-100 rounded-full relative z-10" />
        <div className="absolute w-full h-[2px] bg-gray-100 top-1/2 left-0 z-10" />
        <div className="absolute h-full w-[2px] bg-gray-100 left-1/2 top-0 z-10" />
      </motion.div>
    </div>
  );
};

const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 container mx-auto max-w-7xl min-h-[90vh] flex flex-col justify-center">
      <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <div className="inline-block px-4 py-2 bg-gray-200 rounded-full text-sm font-bold text-gray-700 mb-8 uppercase tracking-wider">
            {SITE_CONTENT.hero.label}
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05] mb-8 text-black tracking-tight">
            {SITE_CONTENT.hero.headline}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-xl">
            {SITE_CONTENT.hero.subtext}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-16">
            <a 
              href={SITE_CONTENT.hero.button1.href}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-full hover:bg-orange-600 transition-colors text-center shadow-lg shadow-primary/20"
            >
              {SITE_CONTENT.hero.button1.text}
            </a>
            <a 
              href={SITE_CONTENT.hero.button2.href}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-black text-black text-lg font-bold rounded-full hover:bg-black hover:text-white transition-colors text-center"
            >
              {SITE_CONTENT.hero.button2.text}
            </a>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-border">
            {SITE_CONTENT.hero.stats.map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-display font-bold text-black mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:ml-auto w-full max-w-lg"
        >
          <HeroAbstractArt />
        </motion.div>
      </div>
    </section>
  );
};

const Marquee = () => {
  return (
    <div className="w-full bg-[#111111] py-5 md:py-6 overflow-hidden flex whitespace-nowrap text-white font-display text-xl md:text-2xl font-bold tracking-wide uppercase border-y border-[#222]">
      <div className="flex animate-marquee gap-8 items-center pr-8">
        <span>{SITE_CONTENT.marquee}</span>
        <span>{SITE_CONTENT.marquee}</span>
        <span>{SITE_CONTENT.marquee}</span>
        <span>{SITE_CONTENT.marquee}</span>
      </div>
    </div>
  );
};

const VenturesSection = () => {
  return (
    <section id="ventures" className="scroll-mt-24 py-24 bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Our Portfolio</h2>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 text-black">
            {SITE_CONTENT.ventures.heading}
          </h3>
          <p className="text-xl text-muted-foreground">
            {SITE_CONTENT.ventures.subtext}
          </p>
        </div>

        <div className="space-y-8">
          {/* ===================== VENTURE PORTFOLIO (box) ===================== */}
          <div className="bg-white border border-border rounded-3xl p-6 md:p-12">
            <div className="mb-10">
              <h4 className="text-2xl md:text-3xl font-display font-bold text-black mb-2">Venture Portfolio</h4>
              <p className="text-muted-foreground">Businesses we build, operate, and own.</p>
            </div>

            <div className="space-y-8">
          {/* EXFLOW - Featured Block */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#FAFAF8] border border-border rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 group hover:shadow-xl transition-shadow"
          >
            <div className="w-full md:w-1/2 flex-shrink-0 relative aspect-[4/3] bg-white rounded-2xl border border-border flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[#F97316]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-5xl md:text-7xl font-display font-black text-black tracking-tighter">EXFLOW</div>
            </div>
            <div className="w-full md:w-1/2">
              <h4 className="text-3xl md:text-5xl font-display font-bold mb-6 text-black">{SITE_CONTENT.ventures.list[0].title}</h4>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                {SITE_CONTENT.ventures.list[0].description}
              </p>
              <a
                href={EXFLOW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all text-lg border-b-2 border-transparent hover:border-primary pb-1"
              >
                Visit ExFlow <ArrowRight size={20} />
              </a>
            </div>
          </motion.div>

          {/* Upcoming Ventures Grid */}
          <div className="grid md:grid-cols-3 gap-6">

            {/* Food & Beverage — Coming Soon */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              viewport={{ once: true }}
              className="relative bg-[#FAFAF8] border border-border rounded-3xl p-8 flex flex-col h-full overflow-hidden opacity-75"
            >
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-3xl z-10" />
              <div className="relative z-20 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <span className="inline-flex px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider">
                    Food & Beverage
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-500 rounded-full text-xs font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                    Coming Soon
                  </span>
                </div>
                <h4 className="text-3xl font-display font-bold mb-3 text-gray-400">Street Food Venture</h4>
                <p className="text-base text-gray-400 flex-grow">A street food concept built around honest ingredients, fast service, and repeat customers. Launching soon.</p>
              </div>
            </motion.div>

            {/* Transport — Coming Soon */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="relative bg-[#FAFAF8] border border-border rounded-3xl p-8 flex flex-col h-full overflow-hidden opacity-75"
            >
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-3xl z-10" />
              <div className="relative z-20 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <span className="inline-flex px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider">
                    Transport
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-500 rounded-full text-xs font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                    Coming Soon
                  </span>
                </div>
                <h4 className="text-3xl font-display font-bold mb-3 text-gray-400">Transport Venture</h4>
                <p className="text-base text-gray-400 flex-grow">A logistics and transport venture focused on last-mile reliability, route efficiency, and real-time operations.</p>
              </div>
            </motion.div>

            {/* Manufacturing Notebooks — In Progress */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              viewport={{ once: true }}
              className="relative bg-amber-50 border border-amber-200 rounded-3xl p-8 flex flex-col h-full overflow-hidden"
            >
              <div className="relative z-20 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <span className="inline-flex px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider">
                    Manufacturing
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-200 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                    In Progress
                  </span>
                </div>
                <h4 className="text-3xl font-display font-bold mb-3 text-amber-900">Manufacturing Notebooks</h4>
                <p className="text-base text-amber-800/70 flex-grow">High-quality notebooks designed for makers, engineers, and builders. A physical product line in active development.</p>
              </div>
            </motion.div>

          </div>

          {/* Pitch Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-transparent border-2 border-dashed border-gray-300 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row md:items-center gap-8 hover:border-primary transition-colors hover:bg-primary/5 group"
          >
            <div className="flex-grow">
              <span className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
                Open
              </span>
              <h4 className="text-3xl md:text-4xl font-display font-bold mb-3 text-gray-500">YOUR BUSINESS</h4>
              <p className="text-lg text-muted-foreground">If the model is clear and the execution matters, there may be a place for it here.</p>
            </div>
            <a href="#connect" className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-400 text-gray-500 font-bold rounded-full group-hover:border-primary group-hover:text-primary transition-all group-hover:gap-4">
              Pitch us <ArrowRight size={20} />
            </a>
          </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const WhyUsSection = () => {
  return (
    <section id="why-us" className="scroll-mt-24 py-24 bg-[#111111] text-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-20 text-center max-w-3xl mx-auto leading-tight">
          {SITE_CONTENT.whyUs.heading}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Other Firms */}
          <div className="border border-[#333] rounded-3xl p-8 md:p-12 bg-[#1A1A1A]">
            <h3 className="text-2xl font-display font-bold mb-10 text-[#888] pb-6 border-b border-[#333]">Other Investors/Firms</h3>
            <ul className="space-y-8">
              {SITE_CONTENT.whyUs.others.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="mt-1 flex-shrink-0 bg-red-500/20 text-red-500 p-1.5 rounded-full"><XIcon size={16} strokeWidth={3} /></span>
                  <span className="text-xl text-gray-300 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* EXCOMPANY */}
          <div className="border-2 border-primary rounded-3xl p-8 md:p-12 bg-[#1A1A1A] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <h3 className="text-2xl font-display font-bold mb-10 flex items-center gap-3 text-white pb-6 border-b border-[#333] relative z-10">
              <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold text-xs rounded-sm">EX</div>
              EXCOMPANY
            </h3>
            <ul className="space-y-8 relative z-10">
              {SITE_CONTENT.whyUs.us.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="mt-1 flex-shrink-0 bg-primary/20 text-primary p-1.5 rounded-full"><Check size={16} strokeWidth={3} /></span>
                  <span className="text-xl font-bold text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-20 text-center text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto font-medium leading-relaxed">
          {SITE_CONTENT.whyUs.subtext}
        </p>
      </div>
    </section>
  );
};

const ModelSection = () => {
  return (
    <section id="model" className="scroll-mt-24 py-24 bg-background">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mb-20">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">How We Work</h2>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold max-w-3xl mb-6 text-black leading-tight">
            {SITE_CONTENT.model.heading}
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl">
            {SITE_CONTENT.model.subtext}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {SITE_CONTENT.model.principles.map((p, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white border border-border p-8 md:p-10 rounded-3xl flex flex-col h-full hover:shadow-xl transition-all hover:-translate-y-2 group"
            >
              <span className="text-7xl font-display font-bold text-gray-200 mb-8 group-hover:text-primary transition-colors">{p.num}</span>
              <h4 className="text-2xl font-display font-bold mb-4 text-black">{p.title}</h4>
              <p className="text-muted-foreground leading-relaxed text-lg flex-grow">{p.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ConnectSection — the homepage contact form.

   This form used to be a lie. Its handler was:

     onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}

   It showed a green tick and "Message Sent — thanks, we'll be in touch soon"
   without sending anything anywhere. Every visitor who filled it in believed
   they had contacted the company, and the lead was silently discarded. On a
   homepage, that is the most expensive bug on the site.

   It now writes to the same `enquiries` table as the enquiry modal, reports
   real failures, and only claims success once the insert has actually
   returned. */
const ConnectSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', details: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setError('');
    setSending(true);
    try {
      if (!supabase) throw new Error('Cannot reach the server right now.');
      const row = {
        name: form.name.trim(),
        email: form.email.trim(),
        project_details: form.details.trim(),
        // The table requires these, and the homepage form deliberately stays
        // short — the enquiry modal collects the rest.
        company: '',
        phone: '',
        budget: '',
        timeline: '',
      };
      const { error: insertError } = await supabase.from('enquiries').insert([row]);
      if (insertError) throw new Error(insertError.message);
      await emailLeadToOwner('New ExCompany enquiry (homepage)', row);
      setSubmitted(true);
      setForm({ name: '', email: '', details: '' });
      toast.success('Message sent. We will be in touch.');
    } catch (err: any) {
      const message = err?.message || 'Could not send your message.';
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="connect" className="scroll-mt-24 py-24 bg-white border-t border-border">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold mb-8 leading-tight text-black">
              {SITE_CONTENT.connect.heading}
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
              {SITE_CONTENT.connect.subtext}
            </p>
            <a href={`mailto:${SITE_CONTENT.connect.email}`} className="text-2xl md:text-3xl font-display font-bold border-b-4 border-primary text-primary hover:text-black hover:border-black transition-colors inline-block pb-2">
              {SITE_CONTENT.connect.email}
            </a>
          </div>

          <div className="bg-background p-8 md:p-12 rounded-[2.5rem] border border-border shadow-sm">
            {submitted ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Check size={40} strokeWidth={3} />
                </div>
                <h3 className="text-3xl font-display font-bold mb-4 text-black">Message Sent</h3>
                <p className="text-xl text-muted-foreground">Thanks, we'll be in touch soon.</p>
                <button onClick={() => setSubmitted(false)} className="mt-10 text-primary font-bold hover:underline text-lg">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="home-name" className="block text-sm font-bold mb-2 text-black uppercase tracking-wider">Name</label>
                  <input
                    id="home-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    autoComplete="name"
                    className="w-full bg-white border border-border rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-lg"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label htmlFor="home-email" className="block text-sm font-bold mb-2 text-black uppercase tracking-wider">Email</label>
                  <input
                    id="home-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                    className="w-full bg-white border border-border rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-lg"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="home-details" className="block text-sm font-bold mb-2 text-black uppercase tracking-wider">What are you building?</label>
                  <textarea
                    id="home-details"
                    required
                    value={form.details}
                    onChange={(e) => setForm({ ...form, details: e.target.value })}
                    className="w-full bg-white border border-border rounded-2xl px-6 py-4 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-lg"
                    placeholder="Tell us about your venture..."
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-2xl bg-red-50 border border-red-200 px-5 py-3 text-base font-medium text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-primary text-primary-foreground font-bold text-xl rounded-full py-5 mt-4 hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20 disabled:opacity-70"
                >
                  {sending ? 'Sending…' : 'Submit Details'}
                </button>
                <p className="text-center text-sm text-muted-foreground">
                  Prefer more detail? <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-enquire'))} className="font-bold text-primary hover:underline">Use the full enquiry form</button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* The header and footer now come from SiteLayout, shared with every other
   marketing page. This component renders only the homepage's own sections. */
export default function ExflowHome() {
  return (
    <div className="text-foreground selection:bg-primary selection:text-white font-sans">
      <HeroSection />
      <Marquee />
      <VenturesSection />
      <ModelSection />
      <WhyUsSection />
      <ConnectSection />
    </div>
  );
}
