import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
  delay?: number;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend,
  className,
  iconClassName,
  delay = 0
}: StatsCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={cn(
        "card-glass p-5 sm:p-6 cursor-default",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider truncate">
            {title}
          </p>
          <motion.p 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 tracking-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.4 }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </motion.p>
          {trend && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={cn(
                "text-xs sm:text-sm mt-2 flex items-center gap-1.5 font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              <span className={cn(
                "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]",
                trend.isPositive ? "bg-success/20" : "bg-destructive/20"
              )}>
                {trend.isPositive ? "↑" : "↓"}
              </span>
              <span>{Math.abs(trend.value)}% dari minggu lalu</span>
            </motion.p>
          )}
        </div>
        <motion.div 
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm",
            iconClassName || "bg-primary/10"
          )}
          whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
          style={{
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
          }}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}
