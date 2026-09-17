"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Users,
  ShoppingBag,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  {
    section: "Main",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/production", icon: Factory, label: "Production" },
      { href: "/karigars", icon: Users, label: "Karigars" },
    ],
  },
  {
    section: "Management",
    items: [
      { href: "/orders", icon: ShoppingBag, label: "Orders" },
      { href: "/reports", icon: BarChart2, label: "Reports" },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* RKD Logo Image */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              padding: 2,
            }}
          >
            <Image
              src="https://static.wixstatic.com/media/68b92a_d71e34133826499983234774dea1945b~mv2.png/v1/fill/w_186,h_156,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/RKD-Logo.png"
              alt="RKD Furnishings Logo"
              width={40}
              height={34}
              style={{ objectFit: "contain", width: "100%", height: "100%" }}
              priority
              unoptimized
            />
          </div>
          {/* Company name */}
          <div>
            <div
              style={{
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 13.5,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              RKD Furnishings
            </div>
            <div
              style={{
                color: "#64748b",
                fontSize: 10,
                fontWeight: 500,
                marginTop: 2,
                lineHeight: 1.2,
              }}
            >
              Private Limited
            </div>
          </div>
        </div>

        {/* Divider with subtitle */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 6px rgba(16,185,129,0.6)",
            }}
          />
          <span style={{ color: "#475569", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em" }}>
            Production Dashboard
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <div className="sidebar-section">{group.section}</div>
            {group.items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-item ${active ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={15} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {active && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="sidebar-item" style={{ margin: 0, borderRadius: 8, padding: "8px 12px" }}>
          <LogOut size={14} />
          <span style={{ fontSize: 13 }}>Logout</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        id="mobile-menu-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mobile-hamburger"
        style={{
          display: "none",
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 200,
          background: "var(--sidebar-bg)",
          border: "none",
          borderRadius: 8,
          padding: 8,
          cursor: "pointer",
          color: "#fff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>{content}</aside>
    </>
  );
}
