import { motion, AnimatePresence } from 'framer-motion';
import { Video, Download, CheckCircle, Clock, AlertCircle, Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoHistoryItem {
  id: string;
  original_url: string;
  processed_url: string | null;
  status: string;
  created_at: string;
}

interface RecentActivityProps {
  history: VideoHistoryItem[];
  loading: boolean;
  onDownload: (url: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24
    }
  }
};

export function RecentActivity({ history, loading, onDownload }: RecentActivityProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <motion.span 
            className="status-success"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <CheckCircle className="w-3 h-3" /> Sukses
          </motion.span>
        );
      case 'pending':
        return (
          <motion.span 
            className="status-pending"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <Clock className="w-3 h-3 animate-pulse" /> Pending
          </motion.span>
        );
      case 'error':
        return (
          <motion.span 
            className="status-error"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <AlertCircle className="w-3 h-3" /> Gagal
          </motion.span>
        );
      default:
        return <span className="status-pending">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded-lg w-3/4" />
              <div className="h-3 bg-muted rounded-lg w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div 
        className="empty-state py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="empty-state-icon mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        >
          <Sparkles className="w-10 h-10 text-muted-foreground/40" />
        </motion.div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Ready to start your first process?</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Enter a video URL above and click "Process" to begin. Your history will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence mode="popLayout">
        {history.map((historyItem, index) => (
          <motion.div
            key={historyItem.id}
            variants={item}
            layout
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            whileHover={{ 
              x: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              transition: { duration: 0.2 }
            }}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl",
              "bg-white/[0.02] border border-border/30 backdrop-blur-sm",
              "transition-all duration-200 group"
            )}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <motion.div 
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/5 border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary/20 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                {historyItem.status === 'success' ? (
                  <Play className="w-4 h-4 text-primary" />
                ) : (
                  <Video className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground/90">{historyItem.original_url}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(historyItem.created_at).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-15 sm:ml-0">
              {getStatusBadge(historyItem.status)}
              {historyItem.processed_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDownload(historyItem.processed_url!)}
                    className="h-8 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
