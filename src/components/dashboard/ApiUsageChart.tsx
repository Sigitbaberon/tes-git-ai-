import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp } from 'lucide-react';

interface ApiUsageData {
  date: string;
  requests: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
        <p className="text-lg font-bold text-foreground">
          {payload[0].value} <span className="text-xs text-muted-foreground font-normal">requests</span>
        </p>
      </div>
    );
  }
  return null;
};

export function ApiUsageChart() {
  const [data, setData] = useState<ApiUsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiUsage();
  }, []);

  const fetchApiUsage = async () => {
    try {
      const { data: usageData } = await supabase
        .from('api_usage')
        .select('date, request_count')
        .order('date', { ascending: true })
        .limit(14);

      if (usageData && usageData.length > 0) {
        const formattedData = usageData.map(item => ({
          date: new Date(item.date).toLocaleDateString('id-ID', { 
            day: '2-digit',
            month: 'short'
          }),
          requests: item.request_count
        }));
        setData(formattedData);
      } else {
        const sampleData = generateSampleData();
        setData(sampleData);
      }
    } catch (error) {
      console.error('Error fetching API usage:', error);
      setData(generateSampleData());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = (): ApiUsageData[] => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    return days.map((day, i) => ({
      date: day,
      requests: Math.floor(Math.random() * 50) + 10
    }));
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

  const totalRequests = data.reduce((sum, d) => sum + d.requests, 0);
  const avgRequests = Math.round(totalRequests / data.length);

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Quick Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-foreground">{totalRequests.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-muted-foreground">Avg:</span>
          <span className="font-semibold text-foreground">{avgRequests}/day</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[180px] sm:h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRequestsPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4}/>
                <stop offset="50%" stopColor="hsl(258, 90%, 66%)" stopOpacity={0.15}/>
                <stop offset="100%" stopColor="hsl(258, 90%, 66%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)"/>
                <stop offset="100%" stopColor="hsl(258, 90%, 66%)"/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.3}
              vertical={false} 
            />
            <XAxis 
              dataKey="date" 
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
            <Area
              type="monotone"
              dataKey="requests"
              stroke="url(#strokeGradient)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorRequestsPremium)"
              dot={false}
              activeDot={{
                r: 6,
                fill: 'hsl(217, 91%, 60%)',
                stroke: 'hsl(var(--background))',
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
