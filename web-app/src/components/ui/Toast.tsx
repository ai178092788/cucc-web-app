"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, type, title, message }])

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 5000)
    }, [])

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto w-80 p-4 rounded-xl border shadow-2xl flex gap-3 items-start
                            animate-in slide-in-from-right-full duration-300
                            ${toast.type === "success" ? "bg-slate-900 border-emerald-500/50 text-emerald-400" :
                                toast.type === "error" ? "bg-slate-900 border-red-500/50 text-red-400" :
                                    toast.type === "warning" ? "bg-slate-900 border-amber-500/50 text-amber-400" :
                                        "bg-slate-900 border-blue-500/50 text-blue-400"}
                        `}
                    >
                        <div className="mt-0.5">
                            {toast.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                            {toast.type === "error" && <XCircle className="w-5 h-5" />}
                            {toast.type === "warning" && <AlertCircle className="w-5 h-5" />}
                            {toast.type === "info" && <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm leading-tight text-white mb-1">{toast.title}</div>
                            {toast.message && <div className="text-xs text-slate-400 leading-relaxed">{toast.message}</div>}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
