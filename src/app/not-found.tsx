"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-xl shadow-md p-8 max-w-lg mx-auto border border-slate-200">
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">找不到頁面</h2>
        <p className="text-slate-600 mb-8">
          很抱歉，您請求的頁面不存在或已被移除。
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          返回首頁
        </Link>
      </div>
    </motion.div>
  );
} 