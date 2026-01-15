"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
    Plane,
    Train,
    Bus,
    Clock,
    Bike,
    Plus,
    Table as TableIcon,
    BarChart3,
    LucideIcon
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import DashboardShell from "@/components/layout/DashboardShell"
import Skeleton from "@/components/ui/Skeleton"

interface TravelInfo {
    arrival_method: string | null
    arrival_time: string | null
    arrival_point: string | null
    departure_time: string | null
    departure_point: string | null
    luggage_info: string | null
}

export default function LogisticsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [chartData, setChartData] = useState<{ day: string, arrival: number, departure: number }[]>([])
    const [methodStats, setMethodStats] = useState<{ icon: LucideIcon, label: string, count: number }[]>([])
    const [luggageCount, setLuggageCount] = useState(0)

    const fetchTravelData = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('travel_info')
                .select('arrival_method, arrival_time, arrival_point, departure_time, departure_point, luggage_info')

            if (error) throw error
            if (data) {
                processStats(data)
            }
        } catch (error) {
            console.error('Error fetching travel data:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchTravelData()
    }, [fetchTravelData])

    function processStats(data: TravelInfo[]) {
        const dateMap: Record<string, { day: string, arrival: number, departure: number }> = {}

        data.forEach(item => {
            if (item.arrival_time) {
                const date = new Date(item.arrival_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
                if (!dateMap[date]) dateMap[date] = { day: date, arrival: 0, departure: 0 }
                dateMap[date].arrival++
            }
            if (item.departure_time) {
                const date = new Date(item.departure_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
                if (!dateMap[date]) dateMap[date] = { day: date, arrival: 0, departure: 0 }
                dateMap[date].departure++
            }
        })

        const sortedChartData = Object.values(dateMap).sort((a, b) => {
            const [mA, dA] = a.day.split('/').map(Number)
            const [mB, dB] = b.day.split('/').map(Number)
            if (mA !== mB) return mA - mB
            return dA - dB
        })
        setChartData(sortedChartData)

        const methods = {
            '飞机': 0,
            '火车/高铁': 0,
            '组委会包车': 0,
            '自行抵达': 0,
            '其他': 0
        }

        data.forEach(item => {
            const method = item.arrival_method || '其他'
            if (method.includes('机')) methods['飞机']++
            else if (method.includes('火') || method.includes('高铁')) methods['火车/高铁']++
            else if (method.includes('包')) methods['组委会包车']++
            else if (method.includes('自')) methods['自行抵达']++
            else methods['其他']++
        })

        setMethodStats([
            { icon: Plane, label: "飞机", count: methods['飞机'] },
            { icon: Train, label: "火车/高铁", count: methods['火车/高铁'] },
            { icon: Bus, label: "组委会包车", count: methods['组委会包车'] },
            { icon: Bike, label: "自行抵达", count: methods['自行抵达'] },
        ])

        let totalBikes = 0
        data.forEach(item => {
            const info = item.luggage_info?.toLowerCase() || ''
            if (info.includes('车') || info.includes('箱') || info.includes('bike') || info.includes('box')) {
                const match = info.match(/\d+/)
                totalBikes += match ? parseInt(match[0]) : 1
            }
        })
        setLuggageCount(totalBikes)
    }

    return (
        <DashboardShell>
            <div className="p-8 animate-fade-in space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">差旅与后勤管理</h1>
                        <p className="text-slate-400 text-sm mt-1">各参赛队抵达/离开信息汇总及交通调度视图</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-white text-sm font-black shadow-lg shadow-blue-500/20">
                            <Plus className="w-4 h-4" />
                            <span>提交/修改差旅信息</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart Section */}
                    <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative min-h-[450px]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                </div>
                                <h3 className="font-black text-white text-lg">人流高峰分布预警</h3>
                            </div>
                            {!loading && chartData.length > 0 && (
                                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        <span className="text-slate-400">抵达</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                                        <span className="text-slate-400">离开</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                <div className="flex items-end gap-4 h-64">
                                    {Array(8).fill(0).map((_, i) => (
                                        <div key={i} className="flex-1 flex flex-col gap-2 h-full justify-end">
                                            <Skeleton className="w-full rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                                            <Skeleton className="h-4 w-full rounded-md" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : chartData.length > 0 ? (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="day" stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickMargin={15} />
                                        <YAxis stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #1e293b',
                                                borderRadius: '16px',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
                                            }}
                                            itemStyle={{ fontSize: '12px', fontWeight: '900' }}
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                        />
                                        <Bar dataKey="arrival" name="抵达人数" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="departure" name="离开人数" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 italic text-sm">
                                <Clock className="w-12 h-12 text-slate-800 mb-4" />
                                暂无差旅计划数据
                            </div>
                        )}

                        <div className="mt-8 p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">系统分析</h4>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                根据目前的报名数据，流峰值集中在 10月12日 与 10月15日。建议提前与车队确认在这两个时间段的接驳保障量，特别是在早高峰时段（08:00 - 11:00）。
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Panel */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">交通方式分布</h4>
                            <div className="space-y-5">
                                {loading ? (
                                    Array(4).fill(0).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="w-10 h-10 rounded-xl" />
                                                <Skeleton className="h-4 w-20" />
                                            </div>
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                    ))
                                ) : methodStats.map((item) => (
                                    <div key={item.label} className="group flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-950 flex items-center justify-center rounded-xl border border-slate-800 group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all">
                                                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                                            </div>
                                            <span className="text-sm font-black text-white">{item.label}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm text-blue-400 font-black">{item.count}</span>
                                            <span className="text-[10px] font-black text-slate-600 ml-1 uppercase">Pax</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative group overflow-hidden bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-700" />
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">行李总量监控 (Bikes/Equipment)</h4>
                            <div className="flex items-end gap-3 mb-2">
                                <span className="text-4xl font-black text-white tracking-tighter">{loading ? <Skeleton className="h-10 w-12 inline-block" /> : luggageCount}</span>
                                <span className="text-slate-500 text-xs font-black uppercase mb-1.5 ml-1">Units</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed font-bold">
                                {luggageCount > 50
                                    ? `⚠️ 大宗行李较多，建议安排至少 ${Math.ceil(luggageCount / 50)} 辆大型载货车辆。`
                                    : "行李总量在常规承载范围内，普通接驳巴士即可覆盖。"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Detailed Table Access */}
                <section className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[2rem] p-12 text-center group hover:bg-slate-900/60 hover:border-blue-500/30 transition-all duration-500">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                            <TableIcon className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <h3 className="text-white font-black text-xl mb-3 tracking-tight">详细差旅名册管理</h3>
                        <p className="text-slate-500 text-sm mb-10 font-medium px-4">查看具体到每一名运动员的离到港信息、航班具体车次以及行李托运详情，支持实时导出调度表。</p>
                        <button className="w-full py-4 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all text-white text-xs font-black uppercase tracking-widest shadow-2xl">
                            进入详细调度视图
                        </button>
                    </div>
                </section>
            </div>
        </DashboardShell>
    )
}
