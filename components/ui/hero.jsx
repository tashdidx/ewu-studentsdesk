"use client"
import { cn } from "@/lib/utils"

export const Hero = ({ children }) => {
  return (
    <div className={cn("relative min-h-screen")}>
      <div className="fixed inset-0 -z-10 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
      {children}
    </div>
  )
}
