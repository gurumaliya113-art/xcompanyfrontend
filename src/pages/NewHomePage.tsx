import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GiOwl } from "react-icons/gi";
import { SiGoogle } from "react-icons/si";
import { FaAmazon } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Menu, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

const openEnquire = () => window.dispatchEvent(new CustomEvent("open-enquire"));

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="bge-site flex flex-col min-h-screen">
      {/* 1. Sticky Navbar */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-sm py-3" : "bg-white py-5 border-b border-gray-100"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <GiOwl className="w-8 h-8 text-black group-hover:text-primary transition-colors" />
            <span className="text-xl font-bold text-primary">excompany</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-7">
            <Link to="/portfolio" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Our Work</Link>
            <Link to="/solutions" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Solutions</Link>
            <Link to="/industries" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Industries</Link>
            <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">About</Link>
            <Link to="/blogs" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Blogs</Link>
            <Link to="/contact" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Contact</Link>
            <Link to="/admin-login" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Admin</Link>
            <Link to="/dce/dashboard" className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity">DCE</Link>
          </nav>

          <Button onClick={openEnquire} className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-white rounded-full px-6 font-bold">
            Request A Quote
          </Button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="md:hidden border-t border-gray-100 bg-white px-4 pb-5 pt-2 shadow-lg"
            >
              <nav className="flex flex-col">
                <Link to="/portfolio" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors">Our Work</Link>
                <Link to="/solutions" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors">Solutions</Link>
                <Link to="/industries" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors">Industries</Link>
                <Link to="/about" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors">About</Link>
                <Link to="/blogs" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors">Blogs</Link>
                <Link to="/contact" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors">Contact</Link>
                <Link to="/admin-login" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors">Admin</Link>
                <Link to="/dce/dashboard" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-base font-semibold text-primary hover:bg-gray-50 transition-colors">DCE</Link>
                <Button
                  onClick={() => { setMobileOpen(false); openEnquire(); }}
                  className="mt-3 bg-primary hover:bg-primary/90 text-white rounded-full py-5 font-bold"
                >
                  Request A Quote
                </Button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Floating CTA */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button onClick={openEnquire} className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 shadow-xl font-bold text-lg">
              Book A Call
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-24">
        {/* 2. Hero Section */}
        <section className="bg-warm-cream bg-grid-pattern py-24 md:py-32 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-5xl">
            <motion.h1 
              initial="hidden" animate="visible" variants={fadeIn}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-black tracking-tight leading-[1.1] mb-8"
            >
              Websites & Software That Actually Grow Your Business — Not Just Sit There Looking Pretty.
            </motion.h1>
            
            <motion.p 
              initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              We build software that runs your business smoothly — so every task doesn't end with "Sir dekhte hain."
            </motion.p>
            
            <motion.div 
              initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12"
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <SiGoogle className="w-8 h-8 text-[#4285F4]" />
                  <span className="font-bold text-xl">Google</span>
                </div>
                <span className="text-gray-600 font-medium">4.8 Star Ratings</span>
              </div>
              <div className="hidden sm:block w-px h-12 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="font-bold text-2xl mb-2 text-black tracking-tight">Software & Co</div>
                <span className="text-gray-600 font-medium">4.9/5.0 <span className="text-yellow-400">★★★★★</span></span>
              </div>
            </motion.div>
            
            <motion.div 
              initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/portfolio">
                <Button variant="outline" className="w-full sm:w-auto bg-white border-2 border-gray-200 hover:bg-gray-50 text-black rounded-full px-8 py-6 font-bold text-lg">
                  View Portfolio
                </Button>
              </Link>
              <Button onClick={openEnquire} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 font-bold text-lg shadow-lg shadow-primary/30">
                Book A Call
              </Button>
            </motion.div>
          </div>
        </section>

        {/* 3. Trusted By B2B Businesses Worldwide Section */}
        <section className="bg-white py-16 border-b border-gray-100">
          <div className="container mx-auto px-4 md:px-6">
            <p className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-10">
              Trusted By B2B Businesses Worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-70 hover:opacity-100 transition-all duration-500">
              <FaAmazon className="w-24 h-8 text-[#FF9900]" />
              <span className="font-extrabold text-2xl tracking-tight text-[#0F4C81]">RK <span className="text-[#E63946]">Travels</span></span>
              <span className="font-bold text-xl text-center leading-tight text-[#1B3A6B]">Adarsh<br/>School</span>
              <span className="font-extrabold text-xl text-center leading-tight tracking-tight text-[#0D47A1]">Shree Krishna<br/><span className="text-[#1976D2] font-bold">Drycleaners</span></span>
            </div>
            <div className="flex justify-center gap-2 mt-12">
              {[1, 2, 3, 4].map((dot) => (
                <div key={dot} className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-primary' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        </section>

        {/* 4. Stats Section */}
        <section className="bg-white py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { number: "35", label: "Projects Delivered" },
                { number: "3", label: "Countries Served" },
                { number: "3", label: "Years of Industry Experience" },
                { number: "15", label: "Tech Stack Mastered" }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="flex flex-col"
                >
                  <div className="text-5xl md:text-7xl font-extrabold text-black mb-4">
                    {stat.number}<span className="text-primary">+</span>
                  </div>
                  <div className="text-gray-500 font-medium text-lg uppercase tracking-wide">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Services Section */}
        <section className="bg-gray-50 py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
              <h2 className="text-4xl md:text-5xl font-extrabold text-black max-w-2xl leading-tight">
                Custom Digital Solutions, Designed For Growth.
              </h2>
              <Button onClick={openEnquire} className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 font-bold text-lg">
                Contact Us
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Website Design & Development", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" },
                { title: "Web Application Development", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" },
                { title: "Search Engine Optimisation", img: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=800" }
              ].map((service, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="group cursor-pointer"
                >
                  <Card className="overflow-hidden border-0 shadow-lg rounded-2xl transition-transform duration-300 group-hover:-translate-y-2">
                    <div className="aspect-[4/3] overflow-hidden bg-gray-200">
                      <img 
                        src={service.img} 
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-8 bg-white">
                      <h3 className="text-2xl font-bold text-black mb-4 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-primary font-bold flex items-center gap-2">
                        Learn More <span className="text-xl">→</span>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Why Would You Settle For Less? */}
        <section className="bg-[#0F0F0F] py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white text-center mb-20">
              Why would you want to settle for less?
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Other Agencies */}
              <Card className="bg-[#1A1A1A] border-gray-800 rounded-3xl p-8 md:p-12">
                <h3 className="text-2xl font-bold text-gray-400 mb-8">Other Agencies</h3>
                <ul className="space-y-6">
                  {[
                    "Poor Collaboration",
                    "No Support After Delivery",
                    "Generic, Template-Based Solutions",
                    "Slow, Unstructured Process",
                    "Limited Understanding of Your Business"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-gray-300 text-lg">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* excompany */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-3xl"></div>
                <Card className="relative bg-gradient-to-br from-[#2a1405] to-[#1a0a02] border-primary/30 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(249,115,22,0.15)]">
                  <h3 className="text-3xl font-extrabold text-primary mb-8 flex items-center gap-3">
                    <GiOwl className="w-8 h-8" />
                    excompany
                  </h3>
                  <ul className="space-y-6">
                    {[
                      "Quick & Clear Communication",
                      "Free Post-Launch Maintenance",
                      "Custom-Built Digital Solutions",
                      "Transparent Process & Timelines",
                      "Deep Industry, Brand and UX Research"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-white text-lg font-medium">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Process / Development Section */}
        <section className="bg-black py-24 md:py-32 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <p className="text-xl md:text-2xl text-gray-400 text-center max-w-4xl mx-auto mb-24 leading-relaxed">
              Unlike most agencies, we don't cut corners. We deep dive into understanding your business, crafting user experiences that engage, and execute those with precision.
            </p>

            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Editor Mockup */}
                <div className="rounded-xl overflow-hidden bg-[#1E1E1E] border border-gray-800 shadow-2xl shadow-primary/10">
                  <div className="h-8 bg-[#2D2D2D] flex items-center px-4 gap-2 border-b border-gray-800">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto text-gray-300">
                    <div className="text-purple-400">export default function <span className="text-blue-400">Software</span>() {'{'}</div>
                    <div className="pl-4 text-gray-400">// Building digital experiences</div>
                    <div className="pl-4 text-purple-400">return (</div>
                    <div className="pl-8 text-blue-300">&lt;ExCompany</div>
                    <div className="pl-12 text-blue-200">performance=<span className="text-green-300">"optimal"</span></div>
                    <div className="pl-12 text-blue-200">design=<span className="text-green-300">"pixel-perfect"</span></div>
                    <div className="pl-12 text-blue-200">growth=<span className="text-yellow-300">{'{'}true{'}'}</span></div>
                    <div className="pl-8 text-blue-300">/&gt;</div>
                    <div className="pl-4 text-purple-400">);</div>
                    <div className="text-purple-400">{'}'}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-primary font-bold tracking-widest uppercase mb-4 text-sm">Step 03</div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Development</h2>
                <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
                  With designs and content finalized, our development team translates them into a fully functional website. We focus on clean coding, responsiveness, and ensure that the site works flawlessly across all devices.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 8. Testimonials Section */}
        <section className="bg-white py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-black text-center max-w-4xl mx-auto mb-20 leading-tight">
              What It's Like to Work With Us, Straight From Our Clients
            </h2>

            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
              <div className="relative aspect-video bg-gray-100 rounded-3xl overflow-hidden group cursor-pointer border border-gray-200 shadow-xl">
                <img 
                  src="/manoj-sir.jpg" 
                  alt="Manoj Sir — Senior Faculty Physics, Gurukul Institute" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-primary ml-1" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center px-4 md:px-8">
                <blockquote className="text-2xl md:text-3xl font-medium text-black mb-10 leading-snug">
                  “Gurtron completely transformed Gurukul Institute’s online presence. The website looks professional, works smoothly, and has helped us build more trust with students and parents. We’re extremely happy with the quality and support provided.”
                </blockquote>
                <div>
                  <div className="font-bold text-xl text-black">Manoj Sir</div>
                  <a href="#" className="text-primary font-medium hover:underline text-lg">Senior Faculty Physics, Gurukul Institute</a>
                </div>
                
                <div className="flex gap-4 mt-12">
                  <Button variant="outline" size="icon" className="w-14 h-14 rounded-full border-2 border-gray-200 text-gray-500 hover:text-black hover:border-black">
                    ←
                  </Button>
                  <Button variant="outline" size="icon" className="w-14 h-14 rounded-full border-2 border-gray-200 text-gray-500 hover:text-black hover:border-black">
                    →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. In the Media */}
        <section className="bg-gray-50 py-24">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-extrabold text-black text-center mb-16">In the Media</h2>
            {/* Placeholder for media logos or articles */}
            <div className="h-32 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100/50 max-w-4xl mx-auto">
              <span className="text-gray-400 font-medium">Media highlights coming soon</span>
            </div>
          </div>
        </section>

        {/* 10. Contact / CTA Section */}
        <section className="bg-warm-cream bg-grid-pattern py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <h2 className="text-4xl md:text-6xl font-extrabold text-black text-center mb-16">
              Let's Talk About Your Next Big Move.
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Calendar Card */}
              <Card className="bg-white border-0 shadow-xl rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-black mb-8">Schedule Your Discovery Call</h3>
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="mx-auto w-full max-w-[400px]"
                    classNames={{
                      head_cell: "text-gray-500 font-bold w-10 uppercase text-xs",
                      cell: "h-12 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                      day: "h-10 w-10 p-0 font-medium hover:bg-gray-100 rounded-full mx-auto",
                      day_selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white rounded-full",
                      day_today: "bg-gray-100 text-black",
                    }}
                  />
                </div>
              </Card>

              {/* Form Card */}
              <Card className="bg-white border-0 shadow-xl rounded-3xl p-8 md:p-12">
                <h3 className="text-2xl font-bold text-black mb-8">Request A Quote</h3>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-semibold">Full Name*</Label>
                    <Input id="name" placeholder="John Doe" className="h-14 rounded-xl bg-gray-50 border-gray-200 text-lg px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-gray-700 font-semibold">Company Name*</Label>
                    <Input id="company" placeholder="Acme Inc." className="h-14 rounded-xl bg-gray-50 border-gray-200 text-lg px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-semibold">Email*</Label>
                    <Input id="email" type="email" placeholder="john@example.com" className="h-14 rounded-xl bg-gray-50 border-gray-200 text-lg px-4" />
                  </div>
                  <Button type="button" onClick={openEnquire} className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg mt-8 shadow-lg shadow-primary/20">
                    Book A Call
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* 11. Footer */}
      <footer className="bg-[#0F0F0F] text-white pt-24 pb-12 border-t border-gray-800">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
            
            {/* Brand Col */}
            <div className="md:col-span-1 pr-4">
              <div className="flex items-center gap-3 mb-6">
                <GiOwl className="w-8 h-8 text-white" />
                <span className="text-2xl font-bold">excompany</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-8">
                At excompany, we architect digital experiences that breathe life into your brand's most ambitious vision. Transforming pixels into possibilities, one breakthrough at a time.
              </p>
              <Button onClick={openEnquire} className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 font-bold">
                Book A Call
              </Button>
            </div>

            {/* Services Col */}
            <div>
              <h4 className="font-bold text-lg mb-6">Services</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Website Design & Development</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Web Application Development</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Search Engine Optimisation</a></li>
              </ul>
            </div>

            {/* Quick Links Col */}
            <div>
              <h4 className="font-bold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Work</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Contact Col */}
            <div>
              <h4 className="font-bold text-lg mb-6">Office</h4>
              <p className="text-gray-400 leading-relaxed mb-8">
                Kailash Nagar, Narnaul
              </p>
              
              <h4 className="font-bold text-lg mb-2">Call Us</h4>
              <a href="tel:+918053317489" className="block text-gray-400 hover:text-primary transition-colors mb-6">
                +91 80533 17489
              </a>
              
              <h4 className="font-bold text-lg mb-2">Email</h4>
              <a href="mailto:business.gurutron@gmail.com" className="block text-gray-400 hover:text-primary transition-colors">
                business.gurutron@gmail.com
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Software & Co. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}