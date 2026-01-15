"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null })
        window.location.reload()
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800 p-12 rounded-[3.5rem] max-w-lg w-full text-center shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-700">
                        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>

                        <h1 className="text-3xl font-black text-white mb-4 tracking-tight uppercase italic">系统遇到异常</h1>
                        <p className="text-slate-400 mb-10 leading-relaxed font-medium">
                            非常抱歉，应用程序在运行过程中遇到了未预期的错误。这可能是由网络波动或系统临时故障引起的。
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 group"
                            >
                                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                <span>尝试修复并重载</span>
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl font-black transition-all border border-slate-700"
                            >
                                <Home className="w-5 h-5" />
                                <span>回到主页</span>
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-12 p-6 bg-slate-950/50 rounded-3xl border border-slate-800 text-left overflow-auto max-h-40">
                                <p className="text-[10px] font-mono text-red-400 whitespace-pre-wrap">{this.state.error?.stack}</p>
                            </div>
                        )}

                        <div className="mt-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            CUCC Management System - Resilience Layer
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
