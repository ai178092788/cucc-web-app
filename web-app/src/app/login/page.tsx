"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [step, setStep] = useState(1) // 1: Email, 2: OTP
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const supabase = createClient()
    const router = useRouter()

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) {
            setMessage(`错误: ${error.message}`)
        } else {
            setStep(2)
            setMessage("验证码已发送至您的邮箱，请查收。")
        }
        setLoading(false)
    }

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        })
        if (error) {
            setMessage(`验证失败: ${error.message}`)
        } else {
            router.push("/dashboard")
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
            <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 backdrop-blur-xl bg-opacity-80">
                <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    CUCC GMS
                </h1>

                {step === 1 ? (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">电子邮箱</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="university@edu.cn"
                            />
                        </div>
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                            {loading ? "发送中..." : "发送验证码"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">六位验证码</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center text-2xl tracking-[0.5em]"
                                placeholder="000000"
                            />
                        </div>
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                            {loading ? "验证中..." : "立即登录"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            返回修改邮箱
                        </button>
                    </form>
                )}

                {message && (
                    <p className={`mt-6 text-center text-sm ${message.startsWith('错误') ? 'text-red-400' : 'text-blue-400'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    )
}
