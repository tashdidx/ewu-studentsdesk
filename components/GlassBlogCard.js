"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"
import Link from "next/link"

export function GlassBlogCard({ title, description, href, icon: Icon, colorClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Link href={href} className="block">
        <Card className="group relative h-full overflow-hidden rounded-2xl border-white/10 bg-[#161616] backdrop-blur-md transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer pt-0">
          {/* Image Section */}
          <div className="relative aspect-[16/9] overflow-hidden">
            <motion.img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80"
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

            {/* Hover Overlay Action */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25"
              >
                <BookOpen className="h-4 w-4" />
                Open
              </motion.div>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-5">
            <div className="flex items-center gap-2 mb-2">
              
              <h3 className={`text-xl text-white font-semibold leading-tight tracking-tight ${colorClass} transition-colors`}>
                {title}
              </h3>
            </div>
            <p className="line-clamp-2 text-sm text-gray-400">
              {description}
            </p>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
