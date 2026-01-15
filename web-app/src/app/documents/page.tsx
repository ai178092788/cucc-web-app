"use client"

import {
    FileText,
    Upload,
    Search,
    Lock,
    Globe,
    Download,
    Briefcase,
    ShieldCheck,
    Loader2,
    Plus,
    X,
    FolderClosed
} from "lucide-react"
import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/Toast"
import DashboardShell from "@/components/layout/DashboardShell"
import Skeleton from "@/components/ui/Skeleton"
import EmptyState from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"

interface DocumentItem {
    id: string
    title: string
    category: string
    file_url: string
    visible_to_roles: string[]
    created_at: string
}

const ALL_ROLES = [
    { id: "All", name: "所有人公开", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Globe },
    { id: "Leader", name: "参赛单位 (领队)", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: ShieldCheck },
    { id: "TO", name: "技术官员", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Lock },
    { id: "Media", name: "媒体单位", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Lock },
    { id: "Admin", name: "赛事管理员", color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: ShieldCheck },
]

export default function DocumentsPage() {
    const supabase = createClient()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [documents, setDocuments] = useState<DocumentItem[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Form states for new document
    const [newDoc, setNewDoc] = useState<{
        title: string;
        category: string;
        visible_to_roles: string[];
    }>({
        title: "",
        category: "Regulations",
        visible_to_roles: ["Leader", "Admin"]
    })
    const [currentUserRole, setCurrentUserRole] = useState("All")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchDocuments = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setDocuments(data || [])
        } catch (error) {
            console.error('Error fetching documents:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Determine role from metadata or fallback
                setCurrentUserRole(user.user_metadata?.role || "Leader")
            }
        }
        getUser()
        fetchDocuments()
    }, [fetchDocuments, supabase])

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = activeCategory === "All" || doc.category === activeCategory

        // Visibility Check
        const isVisible =
            doc.visible_to_roles.includes("All") ||
            doc.visible_to_roles.includes(currentUserRole) ||
            currentUserRole === "Admin"

        return matchesSearch && matchesCategory && isVisible
    })

    const categories = [
        { id: "Regulations", name: "竞赛规程 (Regulations)" },
        { id: "Manuals", name: "技术手册 (Manuals)" },
        { id: "Forms", name: "资格声明 (Forms)" },
        { id: "Notices", name: "官方通知 (Notices)" },
    ]

    const getCategoryCount = (id: string) => {
        if (id === "All") return documents.length
        return documents.filter(d => d.category === id).length
    }

    async function handleUpload() {
        if (!selectedFile || !newDoc.title) return
        setUploading(true)

        try {
            const { data: compData } = await supabase.from('competitions').select('id').order('created_at', { ascending: false }).limit(1).single()
            if (!compData) throw new Error("No competition found")

            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = `${compData.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('official-documents')
                .upload(filePath, selectedFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('official-documents')
                .getPublicUrl(filePath)

            const { error: insertError } = await supabase
                .from('documents')
                .insert([{
                    competition_id: compData.id,
                    title: newDoc.title,
                    category: newDoc.category,
                    file_url: publicUrl,
                    visible_to_roles: newDoc.visible_to_roles
                }])

            if (insertError) throw insertError

            setShowUploadModal(false)
            setNewDoc({ title: "", category: "Regulations", visible_to_roles: ["Leader", "Admin"] })
            setSelectedFile(null)
            fetchDocuments()
            showToast("success", "文件已发布", `“${newDoc.title}”已成功上传并可见。`)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "未知错误"
            showToast("error", "文件发布失败", message || "请检查文件格式或网络连接。")
        } finally {
            setUploading(false)
        }
    }

    return (
        <DashboardShell>
            <div className="p-8 animate-fade-in space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">文档中心</h1>
                        <p className="text-slate-400 text-sm mt-1">发布竞赛规程、技术手册及各类官方声明文件</p>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 transition-all w-full md:w-auto"
                    >
                        <Upload className="w-4 h-4" />
                        <span>上传官方文件</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Left: Categories Sidebar */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">文件类型 (Types)</h3>
                            <div className="space-y-1.5">
                                <button
                                    onClick={() => setActiveCategory("All")}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 border border-transparent",
                                        activeCategory === "All"
                                            ? 'bg-blue-500/10 text-blue-400 font-black border-blue-500/20'
                                            : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                            activeCategory === "All" ? "bg-blue-500/20" : "bg-slate-800"
                                        )}>
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm">全部文件</span>
                                    </div>
                                    <span className="text-[10px] font-black opacity-40 px-2">{loading ? "..." : getCategoryCount("All")}</span>
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 border border-transparent",
                                            activeCategory === cat.id
                                                ? 'bg-blue-500/10 text-blue-400 font-black border-blue-500/20'
                                                : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                activeCategory === cat.id ? "bg-blue-500/20" : "bg-slate-800"
                                            )}>
                                                <FolderClosed className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm truncate max-w-[120px]">{cat.name.split(' ')[0]}</span>
                                        </div>
                                        <span className="text-[10px] font-black opacity-40 px-2">{loading ? "..." : getCategoryCount(cat.id)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors" />
                            <div className="flex items-center gap-3 text-indigo-400 mb-3">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">权限控制 (ACL)</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-bold">
                                文档访问受严格的角色控制。只有授权角色（如领队、管理员）才能访问特定敏感类目或私有声明文件。
                            </p>
                        </div>
                    </div>

                    {/* Right: Document List */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="搜索文档标题、关键词..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                            />
                        </div>

                        <div className="space-y-4 min-h-[500px]">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-slate-900/30 border border-slate-800/50 rounded-3xl">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-14 h-14 rounded-2xl" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-48" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                        <Skeleton className="w-10 h-10 rounded-xl" />
                                    </div>
                                ))
                            ) : filteredDocuments.length > 0 ? (
                                filteredDocuments.map(doc => (
                                    <div key={doc.id} className="group relative flex items-center justify-between p-5 bg-slate-900/40 border border-slate-800 hover:border-blue-500/30 rounded-3xl transition-all duration-300 hover:bg-slate-900/60 shadow-lg hover:shadow-blue-500/5">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:bg-slate-800 group-hover:border-blue-500/20 transition-all duration-500">
                                                <FileText className="w-7 h-7 text-slate-600 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black group-hover:text-blue-400 transition-colors tracking-tight">{doc.title}</h4>
                                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 mt-1.5 font-black uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950 rounded-lg border border-slate-800">
                                                        <Briefcase className="w-3 h-3 text-blue-500" /> {doc.category}
                                                    </span>
                                                    <span className="opacity-60">更新于 {new Date(doc.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex -space-x-1.5">
                                                {doc.visible_to_roles.includes("All") ? (
                                                    <div title="公开可访问" className="w-8 h-8 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center shadow-lg">
                                                        <Globe className="w-3.5 h-3.5 text-emerald-500" />
                                                    </div>
                                                ) : (
                                                    <div title="角色受限" className="w-8 h-8 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center shadow-lg">
                                                        <Lock className="w-3.5 h-3.5 text-indigo-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <a
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="p-3 bg-slate-950 hover:bg-blue-600 rounded-xl text-slate-600 hover:text-white transition-all border border-slate-800 hover:border-blue-500 shadow-xl"
                                            >
                                                <Download className="w-4.5 h-4.5" />
                                            </a>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={FileText}
                                    title="未找到匹配的相关文档"
                                    description="您可以尝试更换搜索关键词，或者在左侧选择不同的类目来查找所需官方文件。"
                                    className="h-[500px]"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal (Refined) */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
                            <div>
                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                    <Upload className="w-6 h-6 text-blue-500" />
                                    <span>发布官方文档</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 uppercase font-black tracking-widest">Public Official Documents</p>
                            </div>
                            <button onClick={() => setShowUploadModal(false)} className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">文档名称 *</label>
                                <input
                                    type="text"
                                    value={newDoc.title}
                                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                                    placeholder="例如：2025年全国锦标赛补录名单"
                                    className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold placeholder:text-slate-700"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">分类类目 *</label>
                                    <select
                                        value={newDoc.category}
                                        onChange={e => setNewDoc({ ...newDoc, category: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold cursor-pointer"
                                    >
                                        {categories.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name.split(' ')[0]}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">访问权限控制 *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ALL_ROLES.map(role => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => {
                                                    const current = newDoc.visible_to_roles;
                                                    if (role.id === "All") {
                                                        setNewDoc({ ...newDoc, visible_to_roles: ["All"] })
                                                    } else {
                                                        const filtered = current.filter(r => r !== "All")
                                                        if (filtered.includes(role.id)) {
                                                            setNewDoc({ ...newDoc, visible_to_roles: filtered.filter(r => r !== role.id) })
                                                        } else {
                                                            setNewDoc({ ...newDoc, visible_to_roles: [...filtered, role.id] })
                                                        }
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all",
                                                    newDoc.visible_to_roles.includes(role.id)
                                                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                                        : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                                                )}
                                            >
                                                <role.icon className={cn("w-4 h-4", newDoc.visible_to_roles.includes(role.id) ? "text-white" : role.color)} />
                                                {role.name}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-600 italic px-1">
                                        提示：选择“所有人公开”将忽略其它具体角色的设定。
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">文件上传 *</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-3 border-dashed border-slate-800 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 hover:bg-slate-950 hover:border-blue-500/30 transition-all cursor-pointer group"
                                >
                                    {selectedFile ? (
                                        <div className="flex flex-col items-center gap-3 animate-in zoom-in duration-300">
                                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                                <FileText className="w-8 h-8 text-blue-400" />
                                            </div>
                                            <span className="text-sm text-white font-black truncate max-w-xs">{selectedFile.name}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Ready to upload</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform duration-500">
                                                <Plus className="w-8 h-8 text-slate-600 group-hover:text-blue-500" />
                                            </div>
                                            <span className="text-xs text-slate-500 font-black uppercase tracking-widest group-hover:text-slate-300">点击或拖拽上传文书 (PDF/DOCX/XLS)</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-950/40 border-t border-slate-800 flex justify-end gap-5">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors"
                            >
                                取消发布
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !selectedFile || !newDoc.title}
                                className="flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span>立即发布</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardShell>
    )
}
