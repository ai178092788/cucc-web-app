"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    ArrowLeft,
    Save,
    Send,
    X,
    Camera,
    Loader2,
    Info,
    CheckCircle2,
    AlertCircle,
    User,
    Phone
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/Toast"
import DashboardShell from "@/components/layout/DashboardShell"
import { cn } from "@/lib/utils"

// Validation Schema
const registrationSchema = z.object({
    full_name: z.string().min(2, "姓名至少需要 2 个字符"),
    gender: z.enum(["male", "female"]),
    birth_date: z.string().min(1, "请选择出生日期"),
    id_number: z.string().regex(/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, "请输入有效的 15 位或 18 位身份证号码"),
    organization: z.string().min(1, "所属高校不能为空"),
    function: z.string().min(1, "请选择系统职能"),
    phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的 11 位手机号码").or(z.literal("")),
    email: z.string().email("请输入有效的电子邮箱地址").or(z.literal("")),
})

type RegistrationFormValues = z.infer<typeof registrationSchema>

export default function NewRegistrationPage() {
    const router = useRouter()
    const supabase = createClient()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [compID, setCompID] = useState<string | null>(null)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields, isValid },
    } = useForm<RegistrationFormValues>({
        resolver: zodResolver(registrationSchema),
        mode: "onChange",
        defaultValues: {
            full_name: "",
            gender: "male",
            birth_date: "",
            id_number: "",
            organization: "北京大学",
            function: "运动员",
            phone: "",
            email: ""
        }
    })

    const fetchComp = useCallback(async () => {
        const { data } = await supabase.from('competitions').select('id').order('created_at', { ascending: false }).limit(1).single()
        if (data) setCompID(data.id)
    }, [supabase])

    useEffect(() => {
        fetchComp()
    }, [fetchComp])

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast("error", "文件过大", "照片文件不能超过 2MB")
                return
            }
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setPhotoPreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const onFormSubmit = async (data: RegistrationFormValues, status: 'Sent' | 'In process') => {
        if (!compID) {
            showToast("error", "系统错误", "未找到当前竞赛项目 ID，请刷新页面。")
            return
        }

        setLoading(true)
        let photoUrl = null

        try {
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
                const filePath = `${compID}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('photos')
                    .upload(filePath, photoFile)

                if (uploadError) throw new Error(`照片上传失败: ${uploadError.message}`)

                const { data: { publicUrl } } = supabase.storage
                    .from('photos')
                    .getPublicUrl(filePath)

                photoUrl = publicUrl
            }

            const { error: insertError } = await supabase
                .from('registrations')
                .insert([{
                    competition_id: compID,
                    full_name: data.full_name,
                    gender: data.gender,
                    birth_date: data.birth_date,
                    id_number: data.id_number,
                    organization: data.organization,
                    function: data.function,
                    contact_phone: data.phone,
                    contact_email: data.email,
                    photo_url: photoUrl,
                    status: status
                }])

            if (insertError) throw new Error(`数据保存失败: ${insertError.message}`)

            showToast("success",
                status === 'Sent' ? "报名已提交" : "草稿已保存",
                status === 'Sent' ? "信息已锁定，等待审核人员处理。" : "您可以稍后继续编辑。"
            )
            router.push('/registrations')
            router.refresh()
        } catch (error: unknown) {
            console.error('Registration error:', error)
            const message = error instanceof Error ? error.message : "未知错误"
            showToast("error", "提交失败", message || "请检查网络或资料格式后重试。")
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardShell>
            <div className="p-8 animate-fade-in space-y-8">
                <header className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 flex items-center justify-center bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all border border-slate-800 text-slate-400 hover:text-white shadow-xl"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">新增参赛成员</h1>
                        <p className="text-slate-400 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">Add New Delegation Member</p>
                    </div>
                </header>

                <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Form Area */}
                    <div className="lg:col-span-8 space-y-8">
                        <form className="space-y-8">
                            <section className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
                                <div className="flex items-center gap-3 border-b border-slate-800/50 pb-6">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                        <User className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-white tracking-tight">基础信息 (Basic Info)</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            真实姓名 <span className="text-red-500 text-lg">*</span>
                                        </label>
                                        <div className="relative group">
                                            <input
                                                {...register("full_name")}
                                                className={cn(
                                                    "w-full px-5 py-3.5 bg-slate-950 border rounded-2xl focus:ring-2 outline-none transition-all font-bold",
                                                    errors.full_name ? "border-red-500/50 focus:ring-red-500/20" : "border-slate-800 focus:ring-blue-500/50 group-hover:border-slate-700"
                                                )}
                                                placeholder="请输入姓名"
                                            />
                                            {touchedFields.full_name && !errors.full_name && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
                                        </div>
                                        {errors.full_name && <p className="text-[10px] font-black text-red-500 uppercase mt-1.5 ml-1 animate-in slide-in-from-top-1">{errors.full_name.message}</p>}
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            性别 <span className="text-red-500 text-lg">*</span>
                                        </label>
                                        <select
                                            {...register("gender")}
                                            className="w-full px-5 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold cursor-pointer"
                                        >
                                            <option value="male">男 (Male)</option>
                                            <option value="female">女 (Female)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            出生日期 <span className="text-red-500 text-lg">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            {...register("birth_date")}
                                            className={cn(
                                                "w-full px-5 py-3.5 bg-slate-950 border rounded-2xl focus:ring-2 outline-none transition-all font-bold",
                                                errors.birth_date ? "border-red-500/50 focus:ring-red-500/20" : "border-slate-800 focus:ring-blue-500/50"
                                            )}
                                        />
                                        {errors.birth_date && <p className="text-[10px] font-black text-red-500 uppercase mt-1.5 ml-1">{errors.birth_date.message}</p>}
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            证件号码 <span className="text-red-500 text-lg">*</span>
                                        </label>
                                        <div className="relative group">
                                            <input
                                                {...register("id_number")}
                                                placeholder="18位身份证号"
                                                className={cn(
                                                    "w-full px-5 py-3.5 bg-slate-950 border rounded-2xl focus:ring-2 outline-none transition-all font-bold tracking-tight",
                                                    errors.id_number ? "border-red-500/50 focus:ring-red-500/20" : "border-slate-800 focus:ring-blue-500/50 group-hover:border-slate-700"
                                                )}
                                            />
                                            {touchedFields.id_number && !errors.id_number && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
                                        </div>
                                        {errors.id_number && <p className="text-[10px] font-black text-red-500 uppercase mt-1.5 ml-1">{errors.id_number.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">所属高校 (Organization)</label>
                                        <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 font-bold opacity-80 select-none">
                                            <span>北京大学</span>
                                            <div className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] uppercase">Default</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            系统职能 <span className="text-red-500 text-lg">*</span>
                                        </label>
                                        <select
                                            {...register("function")}
                                            className="w-full px-5 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold cursor-pointer"
                                        >
                                            <option value="运动员">运动员 (Athlete)</option>
                                            <option value="教练员">教练员 (Coach)</option>
                                            <option value="随队官员">随队官员 (Official)</option>
                                            <option value="队医">队医 (Medical)</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl overflow-hidden">
                                <div className="flex items-center gap-3 border-b border-slate-800/50 pb-6">
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                        <Phone className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-white tracking-tight">联系方式 (Contact)</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">手机号码 (Phone)</label>
                                        <div className="relative group">
                                            <input
                                                type="tel"
                                                {...register("phone")}
                                                placeholder="11位手机号"
                                                className={cn(
                                                    "w-full px-5 py-3.5 bg-slate-950 border rounded-2xl focus:ring-2 outline-none transition-all font-bold",
                                                    errors.phone ? "border-red-500/50 focus:ring-red-500/20" : "border-slate-800 focus:ring-blue-500/50 group-hover:border-slate-700"
                                                )}
                                            />
                                        </div>
                                        {errors.phone && <p className="text-[10px] font-black text-red-500 uppercase mt-1.5 ml-1">{errors.phone.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">电子邮箱 (Email)</label>
                                        <div className="relative group">
                                            <input
                                                type="email"
                                                {...register("email")}
                                                placeholder="example@mail.com"
                                                className={cn(
                                                    "w-full px-5 py-3.5 bg-slate-950 border rounded-2xl focus:ring-2 outline-none transition-all font-bold",
                                                    errors.email ? "border-red-500/50 focus:ring-red-500/20" : "border-slate-800 focus:ring-blue-500/50 group-hover:border-slate-700"
                                                )}
                                            />
                                        </div>
                                        {errors.email && <p className="text-[10px] font-black text-red-500 uppercase mt-1.5 ml-1">{errors.email.message}</p>}
                                    </div>
                                </div>
                            </section>
                        </form>
                    </div>

                    {/* Sidebar / Photo & Actions */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <h3 className="text-[10px] font-black text-slate-500 mb-6 uppercase tracking-widest">证件照上传 (Portrait)</h3>

                            <div className="relative mx-auto w-44 h-56 bg-slate-950 border-3 border-dashed border-slate-800 rounded-[2rem] overflow-hidden flex flex-col items-center justify-center transition-all duration-500 group-hover:border-blue-500/30 group-hover:bg-slate-900 group-hover:scale-[1.02] shadow-inner">
                                {photoPreview ? (
                                    <div className="relative w-full h-full animate-in fade-in zoom-in-95 duration-500">
                                        <Image
                                            src={photoPreview}
                                            alt="Preview"
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="w-8 h-8 text-white/50" />
                                        </div>
                                        <button
                                            onClick={() => {
                                                setPhotoPreview(null);
                                                setPhotoFile(null);
                                            }}
                                            className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 rounded-xl text-white shadow-xl transition-all active:scale-90"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-slate-900/50 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:scale-110 group-hover:border-blue-500/30 transition-all duration-500 mb-4">
                                            <Camera className="w-7 h-7 text-slate-700 group-hover:text-blue-500" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-600 px-6 uppercase tracking-widest leading-relaxed">
                                            点击或拖拽上传<br />480 x 640 PX
                                        </span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>

                            <div className="mt-8 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 border-dashed">
                                <div className="flex items-center gap-2 text-blue-400 mb-1 justify-center">
                                    <Info className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">照片规格说明</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed px-2">
                                    白色或纯色背景，免冠正面照。将用于正式参赛证件制作，通过审核后不可更改。
                                </p>
                            </div>
                        </section>

                        <div className="space-y-4">
                            <button
                                onClick={handleSubmit((data) => onFormSubmit(data, 'In process'))}
                                disabled={loading}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all border border-slate-700 shadow-xl active:scale-95"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>存为草稿 (Draft)</span>
                            </button>
                            <button
                                onClick={handleSubmit((data) => onFormSubmit(data, 'Sent'))}
                                disabled={loading || !isValid}
                                className={cn(
                                    "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95",
                                    isValid && !loading
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                                        : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                                )}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                <span>正式提交 (Submit)</span>
                            </button>
                            {!isValid && (
                                <div className="flex items-center justify-center gap-2 text-red-500/70">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">请补全必填项以解锁提交</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
