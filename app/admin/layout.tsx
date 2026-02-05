"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import "../admin.css"

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: "📋" },
    { href: "/admin/extensions", label: "Extensions", icon: "📦" },
    { href: "/admin/providers", label: "Providers", icon: "🔌" },
    { href: "/admin/monitoring", label: "Monitoring", icon: "📊" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  ]

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ZombieCoder Admin Panel</title>
      </head>
      <body>
        <header className="admin-header">
          <div className="header-content">
            <h1>ZombieCoder Admin Panel</h1>
            <button className="menu-toggle" id="menuToggle">
              ☰
            </button>
          </div>
        </header>

        <nav className="admin-sidebar">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar-link ${pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)) ? "active" : ""}`}
                >
                  <span className="sidebar-icon">{item.icon}</span> {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="admin-main-content">
          <div className="admin-container">{children}</div>
        </main>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('DOMContentLoaded', function() {
                const menuToggle = document.getElementById('menuToggle');
                const sidebar = document.querySelector('.admin-sidebar');
                
                if (menuToggle) {
                  menuToggle.addEventListener('click', function() {
                    sidebar.classList.toggle('active');
                  });
                }
              });
            `,
          }}
        />
      </body>
    </html>
  )
}

export default AdminLayout
