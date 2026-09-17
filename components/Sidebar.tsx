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
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            }}
          >
            <Factory size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
              RKD Tufting
            </div>
            <div style={{ color: "#8892b0", fontSize: 10, fontWeight: 500 }}>
              Production Dashboard
            </div>
          </div>
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
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {active && <ChevronRight size={13} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="sidebar-item" style={{ borderRadius: 8, padding: "8px 12px" }}>
          <LogOut size={15} />
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
        }}
        className="mobile-hamburger"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
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
