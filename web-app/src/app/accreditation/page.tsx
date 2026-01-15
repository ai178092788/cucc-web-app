"use client"

import { useState, useEffect, useCallback } from "react"
import {
    CreditCard,
    Printer,
    Layout,
    CheckCircle2,
    QrCode,
    UserCircle
} from "lucide-react"
import { PDFDownloadLink } from '@react-pdf/renderer'
import { AccreditationDocument } from "@/components/pdf/AccreditationTemplate"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import DashboardShell from "@/components/layout/DashboardShell"
import Skeleton from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"

const categories = [
    { id: '运动员', label: "运动员 (Athlete)", color: "blue", bg: "bg-blue-600", role_code: 'ATH', hex: '#2563eb' },
    { id: '教练员', label: "教练员 (Coach/Official)", color: "indigo", bg: "bg-indigo-600", role_code: 'OFF', hex: '#4f46e5' },
    { id: 'ITO', label: "技术官员 (ITO/NTO)", color: "emerald", bg: "bg-emerald-600", role_code: 'ITO', hex: '#059669' },
    { id: 'Media', label: "媒体 (Media)", color: "amber", bg: "bg-amber-600", role_code: 'MED', hex: '#d97706' },
]

interface Person {
    id: string
    full_name: string
    organization: string
    function: string
    photo_url?: string
    status: string
}

export default function AccreditationPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [allPeople, setAllPeople] = useState<Person[]>([])
    const [selectedCategory, setSelectedCategory] = useState(categories[0])

    const fetchPeople = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .eq('status', 'Accepted')

            if (error) throw error
            setAllPeople(data || [])
        } catch (error) {
            console.error('Error fetching people:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchPeople()
    }, [fetchPeople])

    const filteredPeople = allPeople.filter(p => {
        if (selectedCategory.id === '运动员') return p.function === '运动员'
        if (selectedCategory.id === '教练员') return p.function === '教练员' || p.function === '随队官员' || p.function === '队医'
        return p.function === selectedCategory.id
    })

    const getRoleMeta = (item: Person) => {
        const cat = categories.find(c => {
            if (c.id === '运动员') return item.function === '运动员'
            if (c.id === '教练员') return item.function === '教练员' || item.function === '随队官员' || item.function === '队医'
            return item.function === c.id
        }) || categories[1]
        return cat
    }

    const pdfData = filteredPeople.map(p => {
        const meta = getRoleMeta(p)
        return {
            full_name: p.full_name,
            organization: p.organization,
            function: p.function,
            photo_url: p.photo_url,
            role_code: meta.role_code,
            color: meta.hex
        }
    })

    return (
        <DashboardShell>
            <div className="p-8 animate-fade-in space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">证件与身份认证管理</h1>
                        <p className="text-slate-400 text-sm mt-1">管理已接受人员的证件发放、预览及批量打印导出</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 text-sm font-bold text-slate-300">
                            <Layout className="w-4 h-4" />
                            <span>设计模板</span>
                        </button>

                        {pdfData.length > 0 && (
                            <PDFDownloadLink
                                document={<AccreditationDocument people={pdfData} />}
                                fileName={`accreditation_${selectedCategory.id}.pdf`}
                            >
                                {({ loading: pdfLoading }: { loading: boolean }) => (
                                    <button
                                        disabled={pdfLoading}
                                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-sm font-black shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>{pdfLoading ? "生成 PDF 中..." : `批打 ${selectedCategory.id} `}</span>
                                    </button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Preview Section */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">证件实时预览</h3>
                            <div className="flex gap-1.5">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                                            selectedCategory.id === cat.id ? "scale-125 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 " + cat.bg : "bg-slate-800 hover:bg-slate-700"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="relative group">
                            {/* Card Container */}
                            <div className="mx-auto w-64 aspect-[3/4.6] bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden text-slate-900 border-[8px] border-slate-100 flex flex-col items-center">
                                {/* Header */}
                                <div className={cn("w-full h-16 flex items-center justify-center text-white px-6 text-center leading-tight transition-colors duration-500", selectedCategory.bg)}>
                                    <span className="text-[8px] font-black uppercase tracking-[0.1em]">
                                        2025 National University<br />Cycling Championship
                                    </span>
                                </div>

                                {/* Main Content */}
                                <div className="p-6 flex flex-col items-center w-full">
                                    <div className="w-28 h-36 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center border-2 border-slate-100 overflow-hidden shadow-inner shrink-0 scale-100 group-hover:scale-105 transition-transform duration-500">
                                        {loading ? (
                                            <Skeleton className="w-full h-full" />
                                        ) : filteredPeople[0]?.photo_url ? (
                                            <Image
                                                src={filteredPeople[0].photo_url}
                                                alt="Photo"
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                        ) : (
                                            <UserCircle className="w-10 h-10 text-slate-200" />
                                        )}
                                    </div>

                                    {loading ? (
                                        <div className="space-y-2 flex flex-col items-center">
                                            <Skeleton className="h-6 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-xl font-black mb-0.5 tracking-tight text-center">{filteredPeople[0]?.full_name || "预览姓名"}</h2>
                                            <p className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest text-center">{filteredPeople[0]?.organization || "PRC UNIVERSITY"}</p>
                                        </>
                                    )}

                                    <div className="w-full grid grid-cols-2 gap-4 border-t border-b border-slate-50 py-4 mb-4">
                                        <div className="text-center group-hover:translate-x-1 transition-transform">
                                            <p className="text-[7px] text-slate-300 font-black uppercase tracking-widest">Role</p>
                                            <p className="text-[10px] font-black">{loading ? "-" : (filteredPeople[0]?.function || selectedCategory.id)}</p>
                                        </div>
                                        <div className="text-center group-hover:-translate-x-1 transition-transform">
                                            <p className="text-[7px] text-slate-300 font-black uppercase tracking-widest">Zone</p>
                                            <p className="text-[10px] font-black">ALL / ACCESS</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-auto">
                                        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                            <QrCode className="w-10 h-10 text-slate-800" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[7px] font-black text-slate-300 uppercase">Valid Until: 2025-10-30</p>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">UID: {loading ? "..." : (filteredPeople[0]?.id.substring(0, 8).toUpperCase() || "SAMPLE-001")}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Badge */}
                                <div className={cn("absolute bottom-0 inset-x-0 h-10 text-white flex items-center justify-center font-black text-lg tracking-[0.4em] uppercase transition-colors duration-500", selectedCategory.bg)}>
                                    {selectedCategory.role_code}
                                </div>
                            </div>

                            {/* Decorative Background Blur */}
                            <div className={cn("absolute -z-10 inset-0 blur-3xl opacity-10 transition-colors duration-500 scale-110", selectedCategory.bg)} />
                        </div>
                    </div>

                    {/* Right: Data Management Section */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Stats Banner */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-5 group hover:border-blue-500/30 transition-all">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                    <Printer className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">待打印证件总额</p>
                                    <p className="text-2xl font-black text-white">{loading ? <Skeleton className="h-8 w-16" /> : `${allPeople.length} 人`}</p>
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-5 group hover:border-emerald-500/30 transition-all">
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">资料审核通过</p>
                                    <p className="text-2xl font-black text-white">{loading ? <Skeleton className="h-8 w-16" /> : `${allPeople.length} 人`}</p>
                                </div>
                            </div>
                        </div>

                        {/* Data List Container */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h4 className="text-white font-black text-sm tracking-tight">人员名册 (Registry)</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Category: {selectedCategory.label}</p>
                                </div>
                                <div className="px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-black text-slate-400">
                                    COUNT: {loading ? "..." : filteredPeople.length}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-950/50 border-b border-slate-800">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">#</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">姓名 (Full Name)</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">单位 (Org)</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">状态</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {loading ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <tr key={i}>
                                                    <td className="px-8 py-4"><Skeleton className="h-3 w-4" /></td>
                                                    <td className="px-8 py-4"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-8 py-4"><Skeleton className="h-4 w-40" /></td>
                                                    <td className="px-8 py-4 text-right"><Skeleton className="h-6 w-16 rounded-lg ml-auto" /></td>
                                                </tr>
                                            ))
                                        ) : filteredPeople.length > 0 ? (
                                            filteredPeople.map((person, i) => (
                                                <tr key={person.id} className="hover:bg-slate-800/40 transition-colors group">
                                                    <td className="px-8 py-4 text-[10px] text-slate-600 font-black">{i + 1}</td>
                                                    <td className="px-8 py-4 font-black text-white group-hover:text-blue-400 transition-colors">{person.full_name}</td>
                                                    <td className="px-8 py-4 text-xs font-bold text-slate-400">{person.organization}</td>
                                                    <td className="px-8 py-4 text-right">
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                                            <span className="text-[10px] font-black text-emerald-500 uppercase">Ready</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20">
                                                    <EmptyState
                                                        icon={CreditCard}
                                                        title="暂无制证名单"
                                                        description="当前分类下暂无已审核通过且准备好制证的人员信息。"
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
