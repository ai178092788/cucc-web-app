"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import {
    ArrowLeft,
    FileArchive,
    CheckCircle2,
    FileSpreadsheet
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export default function RegistrationImportPage() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
    const [logs, setLogs] = useState<{ type: 'info' | 'success' | 'error', message: string }[]>([])
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile && selectedFile.name.endsWith('.zip')) {
            setFile(selectedFile)
            setLogs([{ type: 'info', message: `准备上传: ${selectedFile.name}` }])
        } else {
            alert("请上传 .zip 格式的文件")
        }
    }

    const handleStartImport = async () => {
        if (!file) return
        setImportStatus('processing')
        setLogs(prev => [...prev, { type: 'info', message: "正在读取并转换文件..." }])

        try {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1]
                setLogs(prev => [...prev, { type: 'info', message: "正在向服务器发送请求..." }])

                const { data, error } = await supabase.functions.invoke('batch-import-registrations', {
                    body: { zipBase64: base64, competitionId: 'default' }
                })

                if (error) throw error

                const successCount = data.results.filter((r: { status: string }) => r.status === 'Success').length
                const errorCount = data.results.filter((r: { status: string }) => r.status === 'Error').length

                setLogs(prev => [...prev, { type: 'success', message: `导入结束。成功: ${successCount}，失败: ${errorCount}` }])
                setImportStatus('success')
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "未知错误"
            setLogs(prev => [...prev, { type: 'error', message: `导入失败: ${message}` }])
            setImportStatus('error')
        }
    }

    return (
        <div className="flex bg-slate-950 min-h-screen text-slate-200">
            <Sidebar />
            <main className="flex-1 p-8 overflow-auto">
                <header className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">批量导入报名信息</h1>
                        <p className="text-slate-400 text-sm">通过 ZIP 包批量上传 Excel 表格及运动员照片</p>
                    </div>
                </header>

                <div className="max-w-4xl space-y-8">
                    {/* Step 1: Download Template */}
                    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <FileSpreadsheet className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">下载导入模板</h3>
                                <p className="text-slate-400 text-sm">请按照模板格式填写人员信息，严禁修改表头</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
                            立即下载模板
                        </button>
                    </section>

                    {/* Step 2: Upload ZIP */}
                    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center">
                            <FileArchive className="w-10 h-10 text-slate-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">选择 ZIP 压缩包</h3>
                            <p className="text-slate-400 mt-2">压缩包应包含：一个 Excel 文件及所有人员的照片文件</p>
                        </div>

                        <div className="relative inline-block group">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".zip"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20">
                                {file ? "重新选择文件" : "选择本地文件"}
                            </button>
                        </div>

                        {file && (
                            <div className="flex items-center justify-center gap-2 text-blue-400 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                        )}
                    </section>

                    {/* Step 3: Action & Logs */}
                    {file && (
                        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="font-semibold text-white">导入日志 (Import Logs)</h3>
                                <button
                                    onClick={handleStartImport}
                                    disabled={importStatus === 'processing'}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all"
                                >
                                    {importStatus === 'processing' ? "处理中..." : "开始执行导入"}
                                </button>
                            </div>
                            <div className="p-4 bg-black h-48 overflow-y-auto font-mono text-sm space-y-1">
                                {logs.length === 0 ? (
                                    <p className="text-slate-700 flex items-center gap-2 italic">等待操作...</p>
                                ) : (
                                    logs.map((log, i) => (
                                        <p key={i} className={cn(
                                            "flex items-center gap-2",
                                            log.type === 'error' ? "text-red-400" :
                                                log.type === 'success' ? "text-emerald-400" : "text-slate-400"
                                        )}>
                                            <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                                            {log.message}
                                        </p>
                                    ))
                                )}
                            </div>
                            {importStatus === 'success' && (
                                <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="text-emerald-400 text-sm">批量导入任务已圆满完成！返回管理页面查看数据。</span>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>
        </div>
    )
}

