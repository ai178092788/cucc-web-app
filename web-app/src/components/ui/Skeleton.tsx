"use client"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface SkeletonProps {
    className?: string
    style?: React.CSSProperties
}

export default function Skeleton({ className, style }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse bg-slate-800/50 rounded-md", className)}
            style={style}
        />
    )
}
