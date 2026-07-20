import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, ArrowRight, X as XIcon, Check, Twitter, Instagram, Linkedin, Quote } from 'lucide-react';

const OwlLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="50" cy="62" rx="30" ry="32" fill="#1a1a1a"/>
    {/* Head */}
    <ellipse cx="50" cy="35" rx="26" ry="24" fill="#1a1a1a"/>
    {/* Ear tufts */}
    <polygon points="30,16 24,4 36,12" fill="#1a1a1a"/>
    <polygon points="70,16 76,4 64,12" fill="#1a1a1a"/>
    {/* Face circle */}
    <ellipse cx="50" cy="37" rx="18" ry="16" fill="#f5f0e8"/>
    {/* Left eye */}
    <circle cx="41" cy="34" r="8" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <circle cx="41" cy="34" r="5" fill="#1a1a1a"/>
    <circle cx="43" cy="32" r="1.5" fill="white"/>
    {/* Right eye */}
    <circle cx="59" cy="34" r="8" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <circle cx="59" cy="34" r="5" fill="#1a1a1a"/>
    <circle cx="61" cy="32" r="1.5" fill="white"/>
    {/* Beak */}
    <polygon points="50,40 45,47 55,47" fill="#F97316"/>
    {/* Wings */}
    <ellipse cx="23" cy="70" rx="10" ry="20" fill="#1a1a1a" transform="rotate(-10 23 70)"/>
    <ellipse cx="77" cy="70" rx="10" ry="20" fill="#1a1a1a" transform="rotate(10 77 70)"/>
    {/* Chest pattern */}
    <ellipse cx="50" cy="68" rx="16" ry="18" fill="#333"/>
    {/* Feet */}
    <path d="M38 92 Q34 96 30 94 M38 92 Q38 97 34 98 M38 92 Q42 97 40 99" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M62 92 Q66 96 70 94 M62 92 Q62 97 66 98 M62 92 Q58 97 60 99" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const SITE_CONTENT = {
  header: {
    logo: "EXCOMPANY",
    navLinks: [
      { name: "Ventures", href: "#ventures" },
      { name: "Our Model", href: "#model" },
      { name: "Why Us", href: "#why-us" },
      { name: "Connect", href: "#connect" },
    ],
    cta: { text: "Start a Conversation", href: "mailto:hello@excompany.in" }
  },
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
    ],
    tech8Projects: [
      {
        id: "scrapco",
        title: "Scrapco",
        description: "A smart scrap management app that makes doorstep scrap collection simple, fast, and hassle-free. Users schedule pickups, manage waste efficiently, and promote sustainable recycling.",
        tag: "Sustainability",
        image: "/projects/scrapco.png"
      },
      {
        id: "gtc",
        title: "GTC",
        description: "A smart GTC management platform that centralizes data from vendors, godowns, and operations into one unified system for enterprise-scale coordination.",
        tag: "Enterprise",
        image: "/projects/gtc.png"
      },
      {
        id: "ezdry",
        title: "EzDry",
        description: "A smart laundry management app that makes doorstep pickup and laundry services seamless. Users schedule, track, and receive clean clothes with zero hassle.",
        tag: "On-Demand",
        image: "/projects/ezdry.png"
      },
      {
        id: "fogg",
        title: "Fogg Road Safety & Alert System",
        description: "An intelligent road safety system designed to reduce accidents in foggy conditions. It alerts nearby vehicles and infrastructure in real time using smart sensors.",
        tag: "Safety & IoT",
        image: "/projects/fogg.png"
      },
      {
        id: "gurtron",
        title: "GurTron",
        description: "A smart school management platform where teachers can create papers, manage academic tasks, and track student real-time performance with detailed analytics.",
        tag: "Education",
        image: "/projects/gurtron.png"
      },
      {
        id: "fleet",
        title: "Fleet Management & Transportation",
        description: "An advanced fleet management platform that provides real-time vehicle tracking, fuel efficiency monitoring, and zonal route optimisation for logistics businesses.",
        tag: "Logistics",
        image: "/projects/fleet.png"
      },
      {
        id: "restaurant",
        title: "Restaurant Management App",
        description: "A smart food tokenization system where customers scan a QR code to order directly from their table. Orders are managed through live token numbers for frictionless service.",
        tag: "Food & Hospitality",
        image: "/projects/restaurant.png"
      },
      {
        id: "policylens",
        title: "PolicyLens",
        description: "A full-featured insurance broker portal that helps agents manage clients, track policies, renewals, premiums, and commissions — all in one place. Built-in AI Assistant surfaces coverage gaps and upsell opportunities, while real-time analytics give brokers a clear view of their entire book of business.",
        tag: "InsurTech",
        image: "/projects/policylens.png"
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
  testimonials: {
    heading: "From the Founders",
    list: [
      {
        quote: "Building with EXCOMPANY means you're never building alone. They bring the structure, the energy, and the willingness to get their hands dirty alongside you.",
        name: "Founder, EXFLOW"
      },
      {
        quote: "MOMO REHDI wouldn't exist the way it does without EXCOMPANY's belief in the model and their push to make every detail right.",
        name: "Founder, MOMO REHDI"
      }
    ]
  },
  inTheField: {
    heading: "In the Field",
    subtext: "EXCOMPANY and its ventures are active in tech, food, and the business of building.",
    cards: [
      {
        tag: "Technology",
        title: "Simplifying the complex",
        text: "How EXFLOW is rethinking the way teams manage knowledge and daily workflows without the enterprise bloat."
      },
      {
        tag: "Street Food",
        title: "The honest food model",
        text: "Scaling a high-volume, low-margin business requires operations that border on obsession."
      },
      {
        tag: "Venture Building",
        title: "Why we don't just invest",
        text: "Capital is a commodity. Execution is not. A look into our model for building practical companies."
      }
    ]
  },
  connect: {
    heading: "Let's Make the Next Move Worth Making.",
    subtext: "Tell us what you're building, what's missing, or what should exist in your market.",
    email: "hello@excompany.in"
  },
  footer: {
    tagline: "Built for useful businesses.",
    copyright: "© 2026 EXCOMPANY · Built for useful businesses.",
    ventures: ["EXFLOW", "MOMO REHDI", "Your Business"],
    company: ["Our Model", "Why Us", "Connect"],
    contact: ["hello@excompany.in", "New Delhi & Beyond"]
  }
};

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md border-b border-border py-4 shadow-sm" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <OwlLogo size={44} />
          <span style={{ fontFamily: "'Nunito', sans-serif" }} className="font-extrabold text-2xl text-[#F97316] lowercase tracking-tight">
            excompany
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {SITE_CONTENT.header.navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-sm font-bold text-gray-600 hover:text-black transition-colors uppercase tracking-wider"
            >
              {link.name}
            </a>
          ))}
          <Link to="/admin-login" className="text-sm font-bold text-gray-600 hover:text-black transition-colors uppercase tracking-wider">
            Admin
          </Link>
          <Link to="/dce" className="text-sm font-bold text-primary hover:text-orange-600 transition-colors uppercase tracking-wider">
            DCE
          </Link>
        </nav>

        <a 
          href={SITE_CONTENT.header.cta.href}
          className="hidden md:inline-flex px-6 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-full hover:bg-orange-600 transition-colors shadow-sm"
        >
          {SITE_CONTENT.header.cta.text}
        </a>

        <button 
          className="md:hidden p-2 text-black"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <XIcon size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-border p-6 flex flex-col gap-6 shadow-xl">
          {SITE_CONTENT.header.navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-lg font-bold uppercase tracking-wide"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <Link
            to="/admin-login"
            className="text-lg font-bold uppercase tracking-wide"
            onClick={() => setMobileMenuOpen(false)}
          >
            Admin
          </Link>
          <Link
            to="/dce"
            className="text-lg font-bold uppercase tracking-wide text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            DCE
          </Link>
          <a 
            href={SITE_CONTENT.header.cta.href}
            className="px-6 py-4 bg-primary text-primary-foreground text-center font-bold rounded-full"
            onClick={() => setMobileMenuOpen(false)}
          >
            {SITE_CONTENT.header.cta.text}
          </a>
        </div>
      )}
    </header>
  );
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
    <section id="ventures" className="py-24 bg-white">
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
              <a href="#" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all text-lg border-b-2 border-transparent hover:border-primary pb-1">
                View Venture <ArrowRight size={20} />
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

          {/* ===================== TECH PORTFOLIO (horizontal smooth scroll) ===================== */}
          <div className="bg-white border border-border rounded-3xl p-6 md:p-12">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h4 className="text-2xl md:text-3xl font-display font-bold text-black mb-2">Tech Portfolio</h4>
                <p className="text-muted-foreground">Products built and shipped by EXFLOW — swipe to explore</p>
              </div>
              <span className="hidden md:inline-flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider border-b-2 border-primary pb-1">
                {SITE_CONTENT.ventures.tech8Projects.length} Projects
              </span>
            </div>

            <div className="momentum-scroll flex gap-5 overflow-x-auto pb-5 snap-x snap-mandatory scroll-smooth -mx-6 px-6 md:-mx-12 md:px-12">
              {SITE_CONTENT.ventures.tech8Projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="group snap-start shrink-0 w-[82%] sm:w-[360px] border border-border rounded-2xl overflow-hidden bg-[#FAFAF8] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
                >
                  {/* Project preview area — full image, no crop */}
                  <div className="aspect-[16/10] bg-white relative overflow-hidden flex items-center justify-center border-b border-border">
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary shadow-sm border border-white/50">
                        {project.tag}
                      </span>
                    </div>
                  </div>
                  {/* Project info */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h5 className="font-display font-bold text-black text-base mb-2">{project.title}</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-grow">{project.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{project.tag}</span>
                      <span className="text-primary font-bold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        View <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const WhyUsSection = () => {
  return (
    <section id="why-us" className="py-24 bg-[#111111] text-white">
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
    <section id="model" className="py-24 bg-background">
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

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-white border-y border-border">
      <div className="container mx-auto px-6 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-16 text-center text-black">
          {SITE_CONTENT.testimonials.heading}
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {SITE_CONTENT.testimonials.list.map((t, i) => (
            <div key={i} className="bg-background border border-border rounded-3xl p-8 md:p-12 flex flex-col">
              <Quote className="text-primary mb-8" size={40} fill="currentColor" fillOpacity={0.2} />
              <p className="text-xl md:text-2xl font-medium leading-relaxed mb-12 flex-grow text-black">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center border border-border">
                  <span className="text-gray-500 font-bold font-display text-xl">F</span>
                </div>
                <span className="font-bold font-display text-lg text-black">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const InTheFieldSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mb-16 md:flex justify-between items-end gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-black">
              {SITE_CONTENT.inTheField.heading}
            </h2>
            <p className="text-xl text-muted-foreground">
              {SITE_CONTENT.inTheField.subtext}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {SITE_CONTENT.inTheField.cards.map((card, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="aspect-[4/3] bg-gray-100 rounded-2xl mb-6 overflow-hidden relative border border-border">
                <div className="absolute inset-0 bg-gray-200 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full text-primary shadow-sm">
                  {card.tag}
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors text-black">
                {card.title}
              </h3>
              <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                {card.text}
              </p>
              <span className="text-primary font-bold inline-flex items-center gap-2 group-hover:gap-4 transition-all">
                Read more <ArrowRight size={16} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ConnectSection = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="connect" className="py-24 bg-white border-t border-border">
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
              <form 
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-bold mb-2 text-black uppercase tracking-wider">Name</label>
                  <input type="text" required className="w-full bg-white border border-border rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-lg" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-black uppercase tracking-wider">Email</label>
                  <input type="email" required className="w-full bg-white border border-border rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-lg" placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-black uppercase tracking-wider">What are you building?</label>
                  <textarea required className="w-full bg-white border border-border rounded-2xl px-6 py-4 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-lg" placeholder="Tell us about your venture..."></textarea>
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-xl rounded-full py-5 mt-4 hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20">
                  Submit Details
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#111111] text-white py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <OwlLogo size={38} />
              <span style={{ fontFamily: "'Nunito', sans-serif" }} className="font-extrabold text-xl text-[#F97316] lowercase tracking-tight">
                excompany
              </span>
            </div>
            <p className="text-gray-400 font-medium text-lg max-w-[200px]">
              {SITE_CONTENT.footer.tagline}
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-xl mb-6 text-white">Ventures</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              {SITE_CONTENT.footer.ventures.map(link => (
                <li key={link}><a href="#ventures" className="hover:text-primary transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-xl mb-6 text-white">Company</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              {SITE_CONTENT.footer.company.map((link, i) => {
                const hrefs = ["#model", "#why-us", "#connect"];
                return (
                  <li key={link}><a href={hrefs[i]} className="hover:text-primary transition-colors">{link}</a></li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-xl mb-6 text-white">Contact</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              <li><a href={`mailto:${SITE_CONTENT.footer.contact[0]}`} className="hover:text-primary transition-colors">{SITE_CONTENT.footer.contact[0]}</a></li>
              <li>{SITE_CONTENT.footer.contact[1]}</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#333] flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 font-medium">{SITE_CONTENT.footer.copyright}</p>
          <div className="flex items-center gap-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors p-2 bg-[#222] rounded-full hover:bg-primary"><Twitter size={20} /></a>
            <a href="#" className="hover:text-white transition-colors p-2 bg-[#222] rounded-full hover:bg-primary"><Instagram size={20} /></a>
            <a href="#" className="hover:text-white transition-colors p-2 bg-[#222] rounded-full hover:bg-primary"><Linkedin size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function ExflowHome() {
  return (
    <div className="exflow-site min-h-screen bg-background text-foreground selection:bg-primary selection:text-white font-sans">
      <Header />
      <main>
        <HeroSection />
        <Marquee />
        <VenturesSection />
        <WhyUsSection />
        <ConnectSection />
      </main>
      <Footer />
    </div>
  );
}
