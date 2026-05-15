import { useState } from "react";
import { Link } from "react-router-dom";
import scrapcoImg from "@/assets/portfolio/scrapco.png";
import gtcImg from "@/assets/portfolio/gtc.png";
import ezdryImg from "@/assets/portfolio/ezdry.png";
import foggImg from "@/assets/portfolio/fogg.png";
import gurtronImg from "@/assets/portfolio/gurtron.png";
import fleetImg from "@/assets/portfolio/fleet.png";
import restaurantImg from "@/assets/portfolio/restaurant.png";

interface Project {
  name: string;
  description: string;
  image: string;
  gradient: string;
  tag: string;
  tagColor: string;
  link?: string;
}

const allProjects: Project[] = [
  {
    name: "Scrapco",
    description:
      "We built a smart scrap management app that makes doorstep scrap collection simple, fast, and hassle-free. It helps users schedule pickups, manage waste efficiently, and promote sustainable recycling — all through an easy-to-use digital platform designed by our software company.",
    image: scrapcoImg,
    gradient: "linear-gradient(135deg, #1565C0 0%, #1976D2 45%, #2196F3 100%)",
    tag: "Sustainability",
    tagColor: "#4CAF50",
    link: "https://www.scrapco.app/",
  },
  {
    name: "GTC",
    description:
      "We developed a smart GTC management platform that centralizes data from vendors, godowns, and operations into one dashboard. It enables real-time tracking, better decision-making, streamlined workflows, and efficient management — helping scrap businesses improve visibility, control, and overall operational performance.",
    image: gtcImg,
    gradient: "linear-gradient(135deg, #4E342E 0%, #6D4C41 45%, #8D6E63 100%)",
    tag: "Enterprise",
    tagColor: "#795548",
    link: "https://www.scrapco.app/partner-portal",
  },
  {
    name: "EzDry",
    description:
      "We built a smart laundry management app that makes doorstep pickup and laundry services seamless. Users can schedule pickups, track orders in real time, and enjoy hassle-free service — while businesses manage operations efficiently through one powerful, easy-to-use platform.",
    image: ezdryImg,
    gradient: "linear-gradient(135deg, #0D47A1 0%, #1565C0 45%, #1976D2 100%)",
    tag: "On-Demand",
    tagColor: "#2196F3",
    link: "https://www.ezdry.in/",
  },
  {
    name: "Fogg Road Safety And Alert System",
    description:
      "We developed an intelligent road safety system designed to reduce accidents in foggy conditions. It alerts nearby vehicles in low visibility and uses eye-tracking sensors to detect driver drowsiness, instantly warning the driver to stay awake and drive safely.",
    image: foggImg,
    gradient: "linear-gradient(135deg, #1A237E 0%, #283593 45%, #3949AB 100%)",
    tag: "Safety & IoT",
    tagColor: "#F44336",
    link: "https://saferaahia.netlify.app/",
  },
  {
    name: "GurTron",
    description:
      "We developed a smart school management platform where teachers can create papers, manage academic tasks, and track students' real-time performance. Schools get detailed analytics, progress reports, and insights to monitor learning outcomes and improve educational efficiency.",
    image: gurtronImg,
    gradient: "linear-gradient(135deg, #BF360C 0%, #D84315 45%, #E64A19 100%)",
    tag: "Education",
    tagColor: "#FF9800",
    link: "https://guru-frontend-two.vercel.app/",
  },
  {
    name: "Fleet Management & Transportation at Ease",
    description:
      "We built an advanced fleet management platform that provides real-time vehicle tracking, fuel efficiency monitoring, zonal insights, driver performance, and operational analytics — all in one dashboard. It helps businesses optimize fleet operations, reduce costs, and improve overall efficiency.",
    image: fleetImg,
    gradient: "linear-gradient(135deg, #004D40 0%, #00695C 45%, #00796B 100%)",
    tag: "Logistics",
    tagColor: "#1976D2",
  },
  {
    name: "Restaurant Management App",
    description:
      "We developed a smart food tokenization system where customers scan a QR code to order directly from their table. Orders are managed through live token numbers displayed on LED screens, enabling faster pickups, reducing confusion, and improving restaurant operations efficiently.",
    image: restaurantImg,
    gradient: "linear-gradient(135deg, #4A148C 0%, #6A1B9A 45%, #7B1FA2 100%)",
    tag: "Food & Hospitality",
    tagColor: "#9C27B0",
  },
];

const openEnquire = () => window.dispatchEvent(new CustomEvent("open-enquire"));

export default function Portfolio() {
  const [current, setCurrent] = useState(0);

  const prev = () =>
    setCurrent((c) => (c - 1 + allProjects.length) % allProjects.length);
  const next = () => setCurrent((c) => (c + 1) % allProjects.length);

  const project = allProjects[current];

  return (
    <div className="bge-site min-h-screen" style={{ backgroundColor: "#f3f4f6" }}>
      {/* Header */}
      <header
        style={{ backgroundColor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-4 md:px-8 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                backgroundColor: "#1976D2",
                borderRadius: "50%",
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>S</span>
            </div>
            <span style={{ fontWeight: 700, color: "#111", fontSize: 18 }}>Our Work</span>
          </Link>
          <nav
            className="hidden md:flex items-center gap-8"
            style={{ fontSize: 14, fontWeight: 500, color: "#555" }}
          >
            <Link to="/" style={{ color: "#555", textDecoration: "none" }}>
              Home
            </Link>
            <Link to="/portfolio" style={{ color: "#1976D2", textDecoration: "none", fontWeight: 600 }}>
              Our Work
            </Link>
            <a
              href="#"
              style={{ color: "#555", textDecoration: "none" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#1976D2")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#555")}
            >
              Solutions
            </a>
            <a
              href="#"
              style={{ color: "#555", textDecoration: "none" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#1976D2")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#555")}
            >
              About
            </a>
            <a
              href="#"
              style={{ color: "#555", textDecoration: "none" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#1976D2")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#555")}
            >
              Contact
            </a>
            <Link
              to="/admin-login"
              style={{ color: "#555", textDecoration: "none" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#1976D2")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#555")}
            >
              Admin
            </Link>
          </nav>
          <button
            type="button"
            onClick={openEnquire}
            className="shrink-0 rounded-md border-0 bg-[#f97316] px-3 py-2 text-[12px] font-semibold text-white sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Request A Quote
          </button>
        </div>
      </header>

      {/* Slider section */}
      <section
        style={{
          background: project.gradient,
          position: "relative",
          transition: "background 0.6s ease",
        }}
      >
        <div className="mx-auto flex max-w-[1280px] flex-col items-stretch gap-8 px-5 pb-16 pt-12 sm:px-8 md:flex-row md:items-center md:gap-12 md:px-12 md:pb-[100px] md:pt-[72px]">
          {/* Left */}
          <div className="min-w-0 flex-1 text-white">
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
                marginBottom: 12,
              }}
            >
              {project.tag}
            </p>
            <h2 className="mb-4 text-2xl font-bold leading-tight sm:text-3xl md:mb-5 md:text-[36px] md:leading-[1.25]">
              {project.name}
            </h2>
            <p
              className="mb-6 max-w-none text-[15px] leading-[1.7] md:mb-8 md:max-w-[440px]"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {project.description}
            </p>
            {project.link ? (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  backgroundColor: "#f97316",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "12px 28px",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                View Project →
              </a>
            ) : (
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                  padding: "12px 28px",
                  borderRadius: 6,
                  fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                Coming Soon
              </span>
            )}
          </div>

          {/* Right */}
          <div className="flex min-w-0 flex-1 justify-center">
            <div
              className="w-full max-w-full md:max-w-[560px]"
              style={{
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <img
                src={project.image}
                alt={project.name}
                style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>

        {/* Prev button — side-center on md+, hidden on mobile (mobile uses bottom arrows below) */}
        <button
          onClick={prev}
          aria-label="Previous"
          className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 text-[22px] text-white md:flex"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          ‹
        </button>

        {/* Next button */}
        <button
          onClick={next}
          aria-label="Next"
          className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 text-[22px] text-white md:flex"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          ›
        </button>

        {/* Bottom controls (mobile arrows + shared dots) */}
        <div className="flex items-center justify-center gap-4 pb-6">
          <button
            onClick={prev}
            aria-label="Previous"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 text-[20px] leading-none text-white md:hidden"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            ‹
          </button>

          <div className="flex items-center gap-2">
            {allProjects.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width: i === current ? 24 : 10,
                  height: 10,
                  borderRadius: 5,
                  background: i === current ? "#fff" : "rgba(255,255,255,0.4)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Next"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 text-[20px] leading-none text-white md:hidden"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            ›
          </button>
        </div>

        {/* Curved bottom wave */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg
            viewBox="0 0 1440 64"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ width: "100%", height: 56, display: "block" }}
          >
            <path d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z" fill="#f3f4f6" />
          </svg>
        </div>
      </section>

      {/* Grid section — all 7 */}
      <section className="px-4 pb-16 pt-5 sm:px-8 md:pb-20" style={{ backgroundColor: "#f3f4f6" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {allProjects.map((p, i) => (
              <div
                key={p.name}
                onClick={() => setCurrent(i)}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow:
                    current === i
                      ? "0 0 0 3px #1976D2, 0 8px 24px rgba(0,0,0,0.12)"
                      : "0 2px 12px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  transform: current === i ? "translateY(-4px)" : "none",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ height: 180, overflow: "hidden" }}>
                  <img
                    src={p.image}
                    alt={p.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: "16px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#111",
                      marginBottom: 6,
                      lineHeight: 1.3,
                    }}
                  >
                    {p.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#777",
                      lineHeight: 1.6,
                      flex: 1,
                      marginBottom: 12,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {p.description}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: p.tagColor,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {p.tag}
                    </span>
                    <span style={{ fontSize: 12, color: "#1976D2", fontWeight: 500 }}>
                      View →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Book A Call fixed */}
      <button
        type="button"
        onClick={openEnquire}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          backgroundColor: "#f97316",
          color: "#fff",
          fontWeight: 600,
          fontSize: 14,
          padding: "12px 22px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          zIndex: 100,
        }}
      >
        Book A Call
      </button>
    </div>
  );
}
