import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
  className?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  bgColor, 
  iconColor,
  className = '' 
}: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`flex flex-col items-center ${bgColor} rounded-lg p-3 sm:p-4 shadow-sm ${className}`}
    >
      <div className={`${iconColor} mb-2`}>{icon}</div>
      <span className="text-xs text-slate-600 mb-1">{title}</span>
      <span className="font-bold text-slate-800 text-sm sm:text-base">{value}</span>
    </motion.div>
  );
} 