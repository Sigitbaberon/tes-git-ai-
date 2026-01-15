import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PieChart } from 'lucide-react';

interface VideoStatusData {
  status: string;
  count: number;
  fill: string;
  gradient: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
        <p className="text-lg font-bold" style={{ color: payload[0].payload.fill }}>
          {payload[0].value} <span className="text-xs text-muted-foreground font-normal">videos</span>
        </p>
      </div>
    );
  }
  return null;
};

export function VideoHistoryChart() {
  const [data, setData] = useState<VideoStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideoStats();
  }, []);

  const fetchVideoStats = async () => {
    try {
      const { data: historyData } = await supabase
        .from('video_history')
        .select('status');

      if (historyData && historyData.length > 0) {
        const statusCounts = historyData.reduce((acc: Record<string, number>, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});

        const formattedData: VideoStatusData[] = [
          { 
            status: 'Sukses', 
            count: statusCounts['success'] || 0, 
            fill: 'hsl(160, 84%, 39%)',
            gradient: 'url(#successGradient)'
          },
          { 
            status: 'Pending', 
            count: statusCounts['pending'] || 0, 
            fill: 'hsl(38, 92%, 50%)',
            gradient: 'url(#pendingGradient)'
          },
          { 
            status: 'Gagal', 
            count: statusCounts['error'] || 0, 
            fill: 'hsl(0, 72%, 51%)',
            gradient: 'url(#errorGradient)'
          },
        ];
        setData(formattedData);
      } else {
        setData([
          { status: 'Sukses', count: 12, fill: 'hsl(160, 84%, 39%)', gradient: 'url(#successGradient)' },
          { status: 'Pending', count: 3, fill: 'hsl(38, 92%, 50%)', gradient: 'url(#pendingGradient)' },
          { status: 'Gagal', count: 2, fill: 'hsl(0, 72%, 51%)', gradient: 'url(#errorGradient)' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching video stats:', error);
      setData([
        { status: 'Sukses', count: 12, fill: 'hsl(160, 84%, 39%)', gradient: 'url(#successGradient)' },
        { status: 'Pending', count: 3, fill: 'hsl(38, 92%, 50%)', gradient: 'url(#pendingGradient)' },
        { status: 'Gagal', count: 2, fill: 'hsl(0, 72%, 51%)', gradient: 'url(#errorGradient)' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[220px] sm:h-[280px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const successRate = total > 0 ? Math.round((data[0].count / total) * 100) : 0;

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Quick Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-muted-foreground">Success Rate:</span>
          <span className="font-semibold text-success">{successRate}%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[180px] sm:h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160, 84%, 45%)" />
                <stop offset="100%" stopColor="hsl(160, 84%, 35%)" />
              </linearGradient>
              <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38, 92%, 55%)" />
                <stop offset="100%" stopColor="hsl(38, 92%, 45%)" />
              </linearGradient>
              <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 72%, 56%)" />
                <stop offset="100%" stopColor="hsl(0, 72%, 46%)" />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.3}
              vertical={false} 
            />
            <XAxis 
              dataKey="status" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              radius={[8, 8, 0, 0]} 
              name="Jumlah"
              maxBarSize={60}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.gradient}
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))'
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6">
        {data.map((item, index) => (
          <motion.div 
            key={item.status}
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-xs text-muted-foreground">{item.status}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
