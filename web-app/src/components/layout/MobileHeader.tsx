"use client"

import { Menu, Trophy } from "lucide-react"

interface MobileHeaderProps {
    onOpenSidebar: () => void
}

export default function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
    return (
        <header className="lg:hidden h-16 bg-slate-950 border-b border-slate-900 flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Trophy className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black tracking-tighter text-white">
                    CUCC<span className="text-blue-500">GMS</span>
                </h2>
            </div>
            <button
                onClick={onOpenSidebar}
                className="p-2 hover:bg-slate-900 rounded-xl transition-colors text-slate-400 hover:text-white"
            >
                <Menu className="w-6 h-6" />
            </button>
        </header>
    )
}
