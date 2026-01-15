"use client"

import { useState, useEffect, useCallback } from "react"
import * as XLSX from "xlsx-js-style"
import {
    Trophy,
    ChevronRight,
    Users,
    CheckSquare,
    Square,
    Search,
    BarChart2,
    Loader2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/Toast"
import DashboardShell from "@/components/layout/DashboardShell"
import Skeleton from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"

type SportEvent = {
    id: string
    event_name: string
    category: string
    entrants?: number
    vacancies?: number
}

interface Registration {
    id: string
    full_name: string
    organization: string
    status: string
    function: string
}

export default function SportEntryPage() {
    const supabase = createClient()
    const { showToast } = useToast()
    const [events, setEvents] = useState<SportEvent[]>([])
    const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null)
    const [registrations, setRegistrations] = useState<Registration[]>([])
    const [shortlist, setShortlist] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchShortlist = useCallback(async (eventId: string) => {
        const { data } = await supabase
            .from('shortlists')
            .select('registration_id')
            .eq('event_id', eventId)

        if (data) {
            setShortlist(new Set(data.map(d => d.registration_id)))
        }
    }, [supabase])

    const fetchInitialData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: eventData } = await supabase.from('sport_events').select('*')
            const { data: regData } = await supabase
                .from('registrations')
                .select('id, full_name, organization, status, function')
                .eq('function', '运动员')
                .eq('status', 'Accepted')

            if (eventData) {
                setEvents(eventData)
                setSelectedEvent(eventData[0])
                if (eventData[0]) fetchShortlist(eventData[0].id)
            }
            if (regData) setRegistrations(regData)
        } catch (error) {
            console.error('Error fetching initial data:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, fetchShortlist])

    useEffect(() => {
        fetchInitialData()
    }, [fetchInitialData])

    const toggleSelection = (regId: string) => {
        const newSet = new Set(shortlist)
        if (newSet.has(regId)) newSet.delete(regId)
        else newSet.add(regId)
        setShortlist(newSet)
    }

    const handleSaveShortlist = async () => {
        if (!selectedEvent) return
        setSaving(true)
        try {
            await supabase.from('shortlists').delete().eq('event_id', selectedEvent.id)

            if (shortlist.size > 0) {
                const inserts = Array.from(shortlist).map(rid => ({
                    event_id: selectedEvent.id,
                    registration_id: rid
                }))
                const { error } = await supabase.from('shortlists').insert(inserts)
                if (error) throw error
            }

            showToast("success", "名单保存成功", `已成功更新“${selectedEvent.event_name}”的正式参赛名单。`)
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "未知错误"
            showToast("error", "保存失败", message || "请稍后再试或检查网络状态。")
        } finally {
            setSaving(false)
        }
    }

    const handleExportExcel = () => {
        if (!selectedEvent) return

        try {
            const selectedRegs = registrations.filter(r => shortlist.has(r.id))
            const dataToExport = selectedRegs.map((reg, idx) => ({
                "序号": idx + 1,
                "姓名": reg.full_name,
                "所属单位": reg.organization,
                "项目名称": selectedEvent.event_name,
                "组别": selectedEvent.category,
                "确认状态": "正选"
            }))

            if (dataToExport.length === 0) {
                showToast("warning", "导出失败", "当前项目短名单为空，请先勾选参赛人员。")
                return
            }

            const ws = XLSX.utils.json_to_sheet(dataToExport)
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')

            // Header Styling (Gold theme for Sport Events)
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1"
                if (!ws[address]) continue
                ws[address].s = {
                    fill: { fgColor: { rgb: "D97706" } }, // Amber-600
                    font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "medium", color: { rgb: "000000" } },
                        bottom: { style: "medium", color: { rgb: "000000" } }
                    }
                }
            }

            // Cell Data Styling
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_cell({ r: R, c: C })
                    if (!ws[address]) continue
                    ws[address].s = {
                        alignment: { vertical: "center", horizontal: C === 0 ? "center" : "left" },
                        font: { sz: 10 },
                        border: {
                            bottom: { style: "thin", color: { rgb: "E2E8F0" } }
                        }
                    }
                }
            }

            ws['!cols'] = [
                { wch: 8 },  // 序号
                { wch: 15 }, // 姓名
                { wch: 30 }, // 所属单位
                { wch: 25 }, // 项目名称
                { wch: 15 }, // 组别
                { wch: 12 }  // 确认状态
            ]

            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "参赛确认名单")
            XLSX.writeFile(wb, `CUCC_Entry_List_${selectedEvent.event_name}_${new Date().toISOString().split('T')[0]}.xlsx`)

            showToast("success", "导出成功", `“${selectedEvent.event_name}”的参赛确认表已生成。`)
        } catch (error) {
            console.error("Export error:", error)
            showToast("error", "导出失败", "生成 Excel 报表时出现错误。")
        }
    }

    const filteredRegistrations = registrations.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.organization.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardShell>
            <div className="p-8 animate-fade-in space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">竞赛信息确认</h1>
                        <p className="text-slate-400 text-sm mt-1">从长名单 (Long List) 中勾选各项目的正式参赛短名单 (Short List)</p>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-black transition-all border border-slate-700 w-full md:w-auto"
                    >
                        <BarChart2 className="w-4 h-4" />
                        <span>导出确认名单</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Event List */}
                    <div className="lg:col-span-4 space-y-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">竞赛小项列表 (Events)</h3>
                        <div className="space-y-3">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-24 bg-slate-900 shadow-lg rounded-2xl border border-slate-800/50 p-6 flex flex-col gap-3">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                ))
                            ) : events.map((event) => (
                                <button
                                    key={event.id}
                                    onClick={() => {
                                        setSelectedEvent(event)
                                        fetchShortlist(event.id)
                                    }}
                                    className={cn(
                                        "w-full flex justify-between items-center p-6 rounded-3xl border transition-all duration-500 text-left group relative overflow-hidden shadow-xl",
                                        selectedEvent?.id === event.id
                                            ? "bg-blue-600/10 border-blue-500/30 shadow-blue-500/10"
                                            : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                                    )}
                                >
                                    <div className="relative z-10">
                                        <div className={cn(
                                            "font-black tracking-tight mb-1 transition-colors duration-300",
                                            selectedEvent?.id === event.id ? "text-blue-400" : "text-white"
                                        )}>{event.event_name}</div>
                                        <div className="text-[10px] text-slate-500 flex gap-3 uppercase tracking-widest font-black">
                                            <span className="flex items-center gap-1.5">
                                                <Trophy className="w-3 h-3" />
                                                {event.category}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className={cn(
                                        "w-5 h-5 transition-all duration-300",
                                        selectedEvent?.id === event.id ? "text-blue-400 translate-x-1" : "text-slate-700"
                                    )} />
                                    {selectedEvent?.id === event.id && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16 animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Short List Selection */}
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-950/20">
                                <div>
                                    <h3 className="text-lg font-black text-white tracking-tight">选择参赛短名单 (Short List)</h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">项目：{selectedEvent?.event_name || '请在左侧选择项目'}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="搜索长名单..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="bg-slate-950/50 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all w-full sm:w-56 font-medium placeholder:text-slate-700"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveShortlist}
                                        disabled={saving || !selectedEvent}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                                        保存正式名单
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-950/50 border-b border-slate-800">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-16 text-center">选择</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">运动员姓名</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">所属学校 (University)</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">报名状态</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {loading ? (
                                            Array(6).fill(0).map((_, i) => (
                                                <tr key={i}>
                                                    <td className="px-8 py-5 text-center"><Skeleton className="w-5 h-5 mx-auto rounded" /></td>
                                                    <td className="px-8 py-5"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-8 py-5"><Skeleton className="h-4 w-40" /></td>
                                                    <td className="px-8 py-5 text-right"><Skeleton className="h-6 w-16 rounded-lg ml-auto" /></td>
                                                </tr>
                                            ))
                                        ) : filteredRegistrations.length > 0 ? (
                                            filteredRegistrations.map((person) => (
                                                <tr key={person.id} className="hover:bg-slate-800/40 transition-colors group">
                                                    <td className="px-8 py-5 text-center">
                                                        <button
                                                            onClick={() => toggleSelection(person.id)}
                                                            className="text-slate-700 hover:text-blue-500 transition-all p-2 rounded-xl hover:bg-blue-500/5"
                                                        >
                                                            {shortlist.has(person.id) ? (
                                                                <CheckSquare className="w-6 h-6 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                            ) : (
                                                                <Square className="w-6 h-6" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">{person.full_name}</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-slate-500 text-xs font-bold">{person.organization}</td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Accepted</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20">
                                                    <EmptyState
                                                        icon={Users}
                                                        title="长名单中无匹配人员"
                                                        description="请检查当前筛选条件，或确认是否有已审核通过的运动员。"
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <div className="relative group bg-slate-900/50 border border-slate-800 rounded-3xl p-8 overflow-hidden transition-all duration-500 hover:border-amber-500/30">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
                            <div className="flex gap-6 items-start">
                                <div className="p-4 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                                    <Users className="w-6 h-6 text-amber-500" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">选择规则重要说明 (Selection Rules)</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed font-bold">
                                        系统长名单 (Long List) 仅包含在『报名注册』模块中已被管理员审核通过且状态为 <span className="text-emerald-500">已接受 (Accepted)</span> 的运动员。
                                        保存后的短名单 (Short List) 将作为成绩管理 (Result Management) 及官方出场表的唯一数据核心。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
