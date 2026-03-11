import { Link, useLocation } from "react-router-dom";
import { Cpu, Clock, Info, Home } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { to: "/", label: "Builder", icon: <Home size={16} /> },
    { to: "/history", label: "History", icon: <Clock size={16} /> },
    { to: "/about", label: "About", icon: <Info size={16} /> },
  ];

  return (
    <>
      <nav className={`modern-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          {/* Logo Section */}
          <Link to="/" className="nav-logo">
            <div className="logo-icon-wrapper">
              <div className="logo-icon-inner">
                <Cpu size={18} color="#f0f0ff" strokeWidth={2.5} />
              </div>
            </div>
            <span className="logo-text">
              AI <span className="logo-highlight">Toy</span> Builder
            </span>
          </Link>

          {/* Links Section */}
          <div className="nav-links">
            {links.map(({ to, label, icon }) => {
              const isActive = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="nav-link-icon">{icon}</span>
                  <span className="nav-link-text">{label}</span>
                  {isActive && <div className="active-indicator" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* CSS purely for the Navbar */}
        <style jsx>{`
          .modern-nav {
            position: fixed;
            top: 1.5rem;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            width: calc(100% - 2rem);
            max-width: 900px;
            background: rgba(13, 14, 26, 0.4);
            backdrop-filter: blur(24px) saturate(150%);
            -webkit-backdrop-filter: blur(24px) saturate(150%);
            border: 1px solid rgba(108, 99, 255, 0.2);
            border-radius: 100px;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          }

          .modern-nav.scrolled {
            top: 1rem;
            background: rgba(13, 14, 26, 0.75);
            border: 1px solid rgba(108, 99, 255, 0.3);
            box-shadow:
              0 10px 40px rgba(0, 0, 0, 0.4),
              0 0 20px rgba(108, 99, 255, 0.1);
            max-width: 1000px;
          }

          .nav-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.6rem 1.2rem;
          }

          /* Logo Styles */
          .nav-logo {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            text-decoration: none;
            padding: 0.2rem;
            border-radius: 50px;
          }

          .logo-icon-wrapper {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6c63ff, #ff6584, #43e97b);
            background-size: 200% 200%;
            animation: gradient-shift 4s ease infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(108, 99, 255, 0.5);
            transition: transform 0.3s ease;
          }

          .nav-logo:hover .logo-icon-wrapper {
            transform: scale(1.05) rotate(5deg);
          }

          .logo-icon-inner {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #0d0e1a;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo-text {
            font-family: "Space Grotesk", sans-serif;
            font-weight: 800;
            font-size: 1.25rem;
            letter-spacing: -0.02em;
            color: #f0f0ff;
            background: linear-gradient(to right, #f0f0ff, #d0d0e0);
            -webkit-background-clip: text;
          }

          .logo-highlight {
            background: linear-gradient(135deg, #6c63ff, #43e97b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          /* Links Styles */
          .nav-links {
            display: flex;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.03);
            padding: 0.3rem;
            border-radius: 50px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }

          .nav-link {
            position: relative;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1.2rem;
            border-radius: 50px;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            color: #8a8ab0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            z-index: 1;
          }

          .nav-link::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50px;
            background: rgba(108, 99, 255, 0);
            z-index: -1;
            transition: background 0.3s ease;
          }

          .nav-link:hover {
            color: #f0f0ff;
          }

          .nav-link:hover::before {
            background: rgba(108, 99, 255, 0.15);
          }

          .nav-link-icon {
            display: flex;
            align-items: center;
            transition:
              transform 0.3s ease,
              color 0.3s ease;
          }

          .nav-link:hover .nav-link-icon {
            transform: scale(1.1);
            color: #6c63ff;
          }

          .nav-link.active {
            color: #f0f0ff;
          }

          .nav-link.active .nav-link-icon {
            color: #43e97b;
          }

          .active-indicator {
            position: absolute;
            inset: 0;
            border-radius: 50px;
            background: rgba(108, 99, 255, 0.2);
            border: 1px solid rgba(108, 99, 255, 0.4);
            z-index: -1;
            box-shadow: inset 0 0 10px rgba(108, 99, 255, 0.1);
          }

          /* Animations */
          @keyframes gradient-shift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}</style>
      </nav>
    </>
  );
}
