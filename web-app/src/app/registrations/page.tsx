"use client"

import { useState, useEffect, useCallback } from "react"
import * as XLSX from "xlsx-js-style"
import {
    Search,
    Download,
    Plus,
    Settings2,
    CheckCircle2,
    XCircle,
    CreditCard,
    Calendar,
    UserCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useToast } from "@/components/ui/Toast"
import DashboardShell from "@/components/layout/DashboardShell"
import Skeleton from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"

interface Registration {
    id: string
    full_name: string
    gender: string
    birth_date: string
    id_number: string
    organization: string
    function: string
    contact_phone?: string
    contact_email?: string
    photo_url?: string
    status: string
    remarks?: string
    created_at: string
    client_group?: string
    id_card?: string
}

export default function RegistrationsPage() {
    const router = useRouter()
    const [registrations, setRegistrations] = useState<Registration[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [functionFilter, setFunctionFilter] = useState("all")
    const supabase = createClient()
    const { showToast } = useToast()

    const [selectedPerson, setSelectedPerson] = useState<Registration | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [auditRemarks, setAuditRemarks] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchRegistrations = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
        } else {
            setRegistrations(data || [])
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchRegistrations()
    }, [fetchRegistrations])

    async function handleAudit(status: 'Accepted' | 'Wrong data') {
        if (!selectedPerson) return
        if (status === 'Wrong data' && !auditRemarks.trim()) {
            showToast("warning", "驳回原因必填", "请填写具体驳回理由以告知申请人。")
            return
        }

        setIsSubmitting(true)
        try {
            const { error: updateError } = await supabase
                .from('registrations')
                .update({
                    status,
                    remarks: status === 'Wrong data' ? auditRemarks : null
                })
                .eq('id', selectedPerson.id)

            if (updateError) throw updateError

            await supabase
                .from('notifications')
                .insert([{
                    registration_id: selectedPerson.id,
                    type: 'system',
                    title: status === 'Accepted' ? '报名审核已通过' : '报名资料需要修正',
                    content: status === 'Accepted'
                        ? `恭喜，您的参赛报名已审核通过。`
                        : `您的报名申请被驳回，原因：${auditRemarks}`,
                    status: 'sent',
                    recipient: selectedPerson.full_name
                }])

            showToast("success", status === 'Accepted' ? "审核已通过" : "驳回已生效", `${selectedPerson.full_name} 的状态已更新。`)
            setIsSheetOpen(false)
            setAuditRemarks("")
            fetchRegistrations()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "未知错误"
            showToast("error", "操作失败", message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleExportExcel = () => {
        try {
            const dataToExport = registrations.map(reg => ({
                "姓名": reg.full_name,
                "性别": reg.gender,
                "出生日期": reg.birth_date,
                "证件号码": reg.id_number,
                "所属单位": reg.organization,
                "人员职能": reg.function,
                "客户群组": reg.client_group || "未分配",
                "审核状态": reg.status === 'Accepted' ? '已接受' : reg.status === 'Wrong data' ? '数据错误' : '处理中',
                "联系电话": reg.contact_phone || "N/A",
                "联系邮箱": reg.contact_email || "N/A",
                "备注": reg.remarks || ""
            }))

            const ws = XLSX.utils.json_to_sheet(dataToExport)

            // Apply Professional Styling
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')

            // Header Styling
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1"
                if (!ws[address]) continue
                ws[address].s = {
                    fill: { fgColor: { rgb: "2563EB" } }, // Blue-600
                    font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } }
                    }
                }
            }

            // Cell Data Styling
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_cell({ r: R, c: C })
                    if (!ws[address]) continue
                    ws[address].s = {
                        alignment: { vertical: "center" },
                        font: { sz: 10 }
                    }

                    // Status specific styling
                    if (C === 7) { // 审核状态 column
                        const val = ws[address].v
                        if (val === '已接受') {
                            ws[address].s.font.color = { rgb: "10B981" } // Emerald-500
                        } else if (val === '数据错误') {
                            ws[address].s.font.color = { rgb: "EF4444" } // Red-500
                        }
                    }
                }
            }

            // Set Column Widths
            ws['!cols'] = [
                { wch: 15 }, // 姓名
                { wch: 6 },  // 性别
                { wch: 12 }, // 出生日期
                { wch: 22 }, // 证件号码
                { wch: 25 }, // 所属单位
                { wch: 12 }, // 人员职能
                { wch: 12 }, // 客户群组
                { wch: 12 }, // 审核状态
                { wch: 15 }, // 联系电话
                { wch: 25 }, // 联系邮箱
                { wch: 30 }  // 备注
            ]

            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "报名表 (Registrations)")
            XLSX.writeFile(wb, `CUCC_Registration_Export_${new Date().toISOString().split('T')[0]}.xlsx`)

            showToast("success", "导出成功", "Excel 报表已生成并开始下载。")
        } catch (error) {
            console.error("Export error:", error)
            showToast("error", "导出失败", "生成 Excel 报表时出现错误。")
        }
    }

    const filteredData = registrations.filter(item => {
        const matchesSearch = (item.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.organization?.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter
        const matchesFunction = functionFilter === 'all' || item.function === functionFilter
        return matchesSearch && matchesStatus && matchesFunction
    })

    return (
        <DashboardShell>
            <div className="p-8 animate-fade-in space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">报名与注册管理</h1>
                        <p className="text-slate-400 text-sm mt-1">查看、过滤并审核所有参赛人员信息</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleExportExcel}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 text-sm font-bold"
                        >
                            <Download className="w-4 h-4" />
                            <span>导出数据</span>
                        </button>
                        <button
                            onClick={() => router.push('/registrations/new')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-white text-sm font-black shadow-lg shadow-blue-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>新增成员</span>
                        </button>
                    </div>
                </header>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="搜索姓名、单位机构..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <select
                                className="flex-1 lg:flex-none bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">所有状态</option>
                                <option value="Accepted">已接受 (Accepted)</option>
                                <option value="In process">处理中 (In process)</option>
                                <option value="Sent">已发送 (Sent)</option>
                                <option value="Wrong data">数据错误 (Wrong data)</option>
                            </select>
                            <select
                                className="flex-1 lg:flex-none bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer"
                                value={functionFilter}
                                onChange={(e) => setFunctionFilter(e.target.value)}
                            >
                                <option value="all">所有职能</option>
                                <option value="运动员">运动员</option>
                                <option value="教练员">教练员</option>
                                <option value="随队官员">随队官员</option>
                            </select>
                            <button className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-400">
                                <Settings2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800">
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">姓名</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">单位</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">职能</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">状态</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i}>
                                            <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-4 w-40" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-6 w-16 rounded-lg" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-4 w-20" /></td>
                                            <td className="px-8 py-6 text-right"><Skeleton className="h-8 w-24 rounded-xl ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16">
                                            <EmptyState
                                                icon={UserCircle}
                                                title="暂无匹配的报名记录"
                                                description="请检查您的筛选条件或搜索关键词是否正确。"
                                            />
                                        </td>
                                    </tr>
                                ) : filteredData.map((person) => (
                                    <tr key={person.id} className="hover:bg-slate-800/40 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{person.full_name}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{person.gender === 'male' ? '男' : '女'}</div>
                                        </td>
                                        <td className="px-8 py-6 text-slate-400 text-sm font-medium">{person.organization}</td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-slate-950/50 rounded-lg text-xs font-bold border border-slate-800 text-slate-300">{person.function}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    person.status === "Accepted" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                                        person.status === "In process" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                                                            person.status === "Wrong data" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                                )} />
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    person.status === "Accepted" ? "text-emerald-500" :
                                                        person.status === "In process" ? "text-amber-500" :
                                                            person.status === "Wrong data" ? "text-red-500" : "text-blue-500"
                                                )}>{person.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedPerson(person);
                                                    setAuditRemarks(person.remarks || "");
                                                    setIsSheetOpen(true);
                                                }}
                                                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-black transition-all border border-slate-800 hover:border-slate-700 flex items-center gap-2 ml-auto"
                                            >
                                                <Settings2 className="w-3.5 h-3.5" />
                                                审核详情
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <span>Showing 1 to {filteredData.length} of {filteredData.length} records</span>
                        <div className="flex gap-2">
                            <button disabled className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 opacity-50 cursor-not-allowed">Previous</button>
                            <button className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 hover:bg-slate-800 hover:text-white transition-all">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {isSheetOpen && selectedPerson && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSheetOpen(false)} />
                    <div className="relative w-full max-w-xl bg-slate-900 h-full shadow-2xl border-l border-slate-800 p-8 flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter">审核详情</h2>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">UID: {selectedPerson.id.split('-')[0].toUpperCase()}</p>
                            </div>
                            <button onClick={() => setIsSheetOpen(false)} className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto space-y-10 pr-4 custom-scrollbar">
                            <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                                <div className="w-36 h-48 bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 flex-shrink-0 relative group shadow-2xl">
                                    {selectedPerson.photo_url ? (
                                        <Image
                                            src={selectedPerson.photo_url}
                                            alt="Profile"
                                            fill
                                            unoptimized
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3">
                                            <UserCircle className="w-12 h-12" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-6 flex-1 w-full">
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">姓名</label>
                                            <div className="text-white text-lg font-black">{selectedPerson.full_name}</div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">性别</label>
                                            <div className="text-slate-300 font-bold">{selectedPerson.gender === 'male' ? '男' : '女'}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">单位</label>
                                            <div className="text-blue-400 font-black">{selectedPerson.organization}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black uppercase border border-blue-500/20">{selectedPerson.function}</span>
                                        <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase border border-slate-700">{selectedPerson.client_group || 'Regular'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800/50" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard className="w-3 h-3" /> 证件号
                                    </label>
                                    <div className="text-slate-300 font-mono text-sm tracking-tighter">{selectedPerson.id_card || '未填写'}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> 出生日期
                                    </label>
                                    <div className="text-slate-300 font-bold text-sm tracking-tighter">{selectedPerson.birth_date || '未填写'}</div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800/50" />

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    审核决策
                                </h3>
                                <div className="bg-slate-950/40 rounded-3xl border border-slate-800 p-6 space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">驳回理由 (仅驳回时呈现给申请人)</label>
                                    <textarea
                                        value={auditRemarks}
                                        onChange={(e) => setAuditRemarks(e.target.value)}
                                        placeholder="请准确描述资料缺失或错误项..."
                                        className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all resize-none placeholder:text-slate-700 font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleAudit('Wrong data')}
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-3 py-4 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-2xl transition-all border border-slate-800 hover:border-red-500/30 font-black text-xs uppercase tracking-widest disabled:opacity-50"
                            >
                                <XCircle className="w-5 h-5" />
                                驳回修正
                            </button>
                            <button
                                onClick={() => handleAudit('Accepted')}
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-xl shadow-blue-500/20 font-black text-xs uppercase tracking-widest disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                审核通过
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardShell>
    )
}
