"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import MobileHeader from "./MobileHeader"

interface DashboardShellProps {
    children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
            {/* Sidebar - handles its own desktop vs mobile visibility */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <MobileHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-auto relative">
                    {children}
                </main>
            </div>
        </div>
    )
}
