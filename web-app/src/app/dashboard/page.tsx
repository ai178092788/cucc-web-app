"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import { Users, Clock, CheckCircle2, XCircle, Megaphone } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type GroupStat = {
    label: string
    total: number
    color: string
    details: { status: string, count: number, key: string }[]
}

type Activity = {
    id: string
    full_name: string
    organization: string
    status: string
    updated_at: string
}

export default function Dashboard() {
    const [stats, setStats] = useState<GroupStat[]>([])
    const [recentActivities, setRecentActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchData = useCallback(async () => {
        setLoading(true)

        // 1. Fetch Stats
        const { data: regData, error: regError } = await supabase
            .from('registrations')
            .select('id, full_name, organization, function, status, updated_at')

        if (regError) {
            console.error(regError)
            setLoading(false)
            return
        }

        const groups = ["运动员", "随队官员", "技术官员"]
        const colors = ["blue", "indigo", "emerald"]
        const statusMap = [
            { label: "已接受", key: "Accepted" },
            { label: "处理中", key: "In process" },
            { label: "数据错误", key: "Wrong data" },
            { label: "已发送", key: "Sent" },
        ]

        const newStats = groups.map((group, idx) => {
            const groupRows = regData.filter(r => r.function === group)
            return {
                label: group,
                total: groupRows.length,
                color: colors[idx],
                details: statusMap.map(s => ({
                    status: s.label,
                    key: s.key,
                    count: groupRows.filter(r => r.status === s.key).length
                })).filter(d => d.count > 0 || group === '运动员')
            }
        })

        // 2. Process Recent Activities (Top 5 updated)
        const activities = [...regData]
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 5) as Activity[]

        setStats(newStats)
        setRecentActivities(activities)
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        const init = async () => {
            await fetchData()
        }
        init()
    }, [fetchData])

    return (
        <DashboardShell>
            <div className="p-8 animate-fade-in space-y-8">
                {/* Header/Announcement */}
                <section>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-2xl border border-blue-500/30">
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-xl">
                            <Megaphone className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-white mb-1">重要公告：报名截止日期延长</h3>
                            <p className="text-blue-100 opacity-90 leading-relaxed">2025年全国大学生自行车锦标赛个人及单位报名截止日期现已统一延长至12月31日 24:00，请各校领队在系统内抓紧提交完成审核。</p>
                        </div>
                        <button className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
                            查看详情
                        </button>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Monitoring Stats */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-white tracking-tight">报名进度</h2>
                            <div className="flex gap-2">
                                <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-64 animate-pulse" />
                                ))
                            ) : stats.map((group) => (
                                <div key={group.label} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 hover:border-blue-500/30 transition-all shadow-xl group hover-lift">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{group.label}</h4>
                                            <span className="text-4xl font-black text-white">{group.total}</span>
                                        </div>
                                        <div className={`p-3 rounded-2xl bg-${group.color}-500/10 text-${group.color}-400`}>
                                            <Users className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {group.details.map((detail) => (
                                            <div key={detail.status} className="flex justify-between items-center group/item">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        detail.key === 'Accepted' ? "bg-emerald-500" :
                                                            detail.key === 'In process' ? "bg-amber-500" :
                                                                detail.key === 'Sent' ? "bg-blue-500" : "bg-red-500"
                                                    )} />
                                                    <span className="text-slate-400 text-xs font-bold">{detail.status}</span>
                                                </div>
                                                <span className="text-white text-sm font-bold">{detail.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Recent Activity Stream */}
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-2xl font-black text-white tracking-tight">最近动态</h2>
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                            {loading ? (
                                [1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-4 animate-pulse">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-800 rounded w-3/4" />
                                            <div className="h-3 bg-slate-800 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))
                            ) : recentActivities.map((act) => (
                                <div key={act.id} className="flex gap-4 items-start group">
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors",
                                        act.status === 'Accepted' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                            act.status === 'Wrong data' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                                "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                    )}>
                                        {act.status === 'Accepted' ? <CheckCircle2 className="w-5 h-5" /> :
                                            act.status === 'Wrong data' ? <XCircle className="w-5 h-5" /> :
                                                <Clock className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h5 className="text-sm font-bold text-white truncate">{act.full_name}</h5>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">
                                                {new Date(act.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{act.organization}</p>
                                        <div className="mt-2 text-[10px]">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded uppercase font-black",
                                                act.status === 'Accepted' ? "bg-emerald-500/10 text-emerald-500" :
                                                    act.status === 'Wrong data' ? "bg-red-500/10 text-red-500" :
                                                        "bg-blue-500/10 text-blue-500"
                                            )}>{act.status === 'Accepted' ? '审核通过' : act.status === 'Wrong data' ? '已驳回' : '更新状态'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-3 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:border-slate-700 transition-all">
                                查看全部活动
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}

