"use client"

import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    className?: string
}

export default function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] bg-slate-900/20 border border-slate-800/50 group hover:bg-slate-900/40 transition-all duration-500",
            className
        )}>
            <div className="w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-700">
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className="w-10 h-10 text-slate-700 group-hover:text-blue-500 transition-colors duration-500 relative z-10" />
            </div>
            <h3 className="text-lg font-black text-white mb-2 tracking-tight group-hover:text-blue-400 transition-colors uppercase">{title}</h3>
            <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed font-medium">{description}</p>
        </div>
    )
}
