"use client";

import { motion } from "framer-motion";
import { Eye } from "lucide-react";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
        <Eye size={28} className="text-zinc-500" />
      </div>
      <h3 className="text-zinc-100 text-lg font-semibold mb-1">
        No alerts yet
      </h3>
      <p className="text-zinc-500 text-sm max-w-xs">
        Your agent is watching. New listings that match your criteria will appear
        here.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-zinc-600">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Agent active — scanning 4× daily
      </div>
    </motion.div>
  );
}
