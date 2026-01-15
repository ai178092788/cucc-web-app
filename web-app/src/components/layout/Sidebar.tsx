"use client"

// Unused import removed
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    UserPlus,
    Plane,
    Trophy,
    CreditCard,
    FileText,
    LogOut,
    X
} from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const navItems = [
    { name: "仪表盘", href: "/dashboard", icon: LayoutDashboard },
    { name: "报名注册", href: "/registrations", icon: UserPlus },
    { name: "差旅后勤", href: "/logistics", icon: Plane },
    { name: "竞赛信息", href: "/sport-entry", icon: Trophy },
    { name: "证件管理", href: "/accreditation", icon: CreditCard },
    { name: "文档中心", href: "/documents", icon: FileText },
]

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-screen z-50 transition-transform duration-300 lg:sticky lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-black tracking-tighter text-white">
                                CUCC<span className="text-blue-500">GMS</span>
                            </h2>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Championship Management</div>
                    </div>

                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1.5">
                    {navItems.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                pathname === item.href
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95"
                            )}
                        >
                            {pathname === item.href && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                            )}
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                pathname === item.href ? "text-white" : "group-hover:text-blue-400"
                            )} />
                            <span className="text-sm font-medium">{item.name}</span>
                        </a>
                    ))}
                </nav>

                <div className="p-6">
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">System Status: OK</span>
                        </div>
                        <button className="flex items-center gap-3 px-3 py-2 w-full text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors bg-slate-950/50 rounded-lg border border-slate-800 hover:border-red-500/30">
                            <LogOut className="w-4 h-4" />
                            <span>退出系统</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
