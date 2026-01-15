import { motion } from 'framer-motion';
import { Loader2, Coins, Zap, Video, Wand2, Sparkles } from 'lucide-react';
import { useApiActions } from '@/hooks/useApiActions';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ReactNode> = {
  video: <Video className="w-5 h-5" />,
  image: <Wand2 className="w-5 h-5" />,
  general: <Zap className="w-5 h-5" />,
};

const categoryGradients: Record<string, string> = {
  video: 'from-primary/20 to-violet-500/10 border-primary/20',
  image: 'from-success/20 to-emerald-500/10 border-success/20',
  general: 'from-muted to-muted/50 border-border/50',
};

const categoryIconBg: Record<string, string> = {
  video: 'bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/25',
  image: 'bg-gradient-to-br from-success to-emerald-500 text-white shadow-lg shadow-success/25',
  general: 'bg-gradient-to-br from-muted-foreground/20 to-muted text-muted-foreground',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24
    }
  }
};

export function AvailableTools() {
  const { actions, loading } = useApiActions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading modules...</p>
        </div>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Sparkles className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Ready to start your first process?</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          No AI modules available yet. Contact admin to configure API actions.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {actions.map((action, index) => (
        <motion.div
          key={action.id}
          variants={item}
          whileHover={{ 
            scale: 1.03, 
            y: -4,
            transition: { duration: 0.2 }
          }}
          className={cn(
            "relative p-5 rounded-2xl border cursor-pointer overflow-hidden group",
            "bg-gradient-to-br transition-all duration-300",
            categoryGradients[action.category || 'general']
          )}
          style={{
            boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
          </div>

          {/* Active Badge */}
          {action.is_active && (
            <div className="absolute top-3 right-3">
              <span className="badge-active">Active</span>
            </div>
          )}

          <div className="flex items-start gap-4 relative z-10">
            <motion.div 
              className={cn(
                "p-3 rounded-xl flex-shrink-0",
                categoryIconBg[action.category || 'general']
              )}
              whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
            >
              {categoryIcons[action.category || 'general']}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground truncate">{action.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {action.description || 'No description available'}
              </p>
              <div className="flex items-center justify-between">
                <code className="text-xs bg-background/50 px-2.5 py-1 rounded-lg font-mono text-muted-foreground border border-border/50">
                  {action.action_key}
                </code>
                <Badge 
                  variant="secondary" 
                  className="flex-shrink-0 bg-warning/10 text-warning border-warning/20 hover:bg-warning/20"
                >
                  <Coins className="w-3 h-3 mr-1" />
                  {action.coin_cost}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
