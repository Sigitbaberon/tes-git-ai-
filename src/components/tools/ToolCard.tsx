import { useState } from 'react';
import { 
  Video, 
  Image, 
  Music, 
  FileText, 
  Puzzle,
  Coins,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApiAction } from '@/hooks/useApiActions';
import { DynamicToolForm } from './DynamicToolForm';
import { SmartResult } from './SmartResult';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ToolCardProps {
  action: ApiAction;
  userCoins: number;
  onSuccess: () => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  video: Video,
  image: Image,
  audio: Music,
  text: FileText,
  general: Puzzle,
};

const categoryColors: Record<string, string> = {
  video: 'bg-red-500/10 text-red-500',
  image: 'bg-blue-500/10 text-blue-500',
  audio: 'bg-purple-500/10 text-purple-500',
  text: 'bg-green-500/10 text-green-500',
  general: 'bg-gray-500/10 text-gray-500',
};

interface ApiResult {
  status: 'success' | 'error';
  action: string;
  result?: any;
  coins_used?: number;
  message?: string;
}

export function ToolCard({ action, userCoins, onSuccess }: ToolCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  
  const category = action.category || 'general';
  const Icon = categoryIcons[category] || Puzzle;
  const colorClass = categoryColors[category] || categoryColors.general;
  
  const hasEnoughCoins = userCoins >= action.coin_cost;

  const handleSubmit = async (data: Record<string, any>) => {
    if (!hasEnoughCoins) {
      toast.error(`Koin tidak cukup. Anda membutuhkan ${action.coin_cost} koin.`);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: responseData, error } = await supabase.functions.invoke('process', {
        body: {
          action: action.action_key,
          data: data,
        },
      });

      if (error) {
        throw error;
      }

      setResult(responseData as ApiResult);

      if (responseData.status === 'success') {
        toast.success(`${action.name} berhasil! ${responseData.coins_used} koin digunakan.`);
        onSuccess();
      } else {
        toast.error(responseData.message || 'Action failed');
      }
    } catch (err: any) {
      console.error('Tool execution error:', err);
      
      // Handle specific error codes
      const errorMessage = err.message || 'An error occurred';
      
      if (errorMessage.includes('402') || errorMessage.includes('Insufficient coins')) {
        setResult({
          status: 'error',
          action: action.action_key,
          message: 'Koin tidak cukup untuk menjalankan action ini.',
        });
        toast.error('Koin tidak cukup');
      } else if (errorMessage.includes('429')) {
        setResult({
          status: 'error',
          action: action.action_key,
          message: 'Batas penggunaan harian tercapai. Coba lagi besok.',
        });
        toast.error('Rate limit exceeded');
      } else if (errorMessage.includes('500') || errorMessage.includes('External API')) {
        setResult({
          status: 'error',
          action: action.action_key,
          message: 'Layanan sedang tidak tersedia. Coba lagi nanti.',
        });
        toast.error('External service unavailable');
      } else {
        setResult({
          status: 'error',
          action: action.action_key,
          message: errorMessage,
        });
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{action.name}</CardTitle>
              <CardDescription className="mt-1">
                {action.description || 'No description'}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Coins className="w-3 h-3" />
            {action.coin_cost}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!hasEnoughCoins && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Koin tidak cukup. Anda membutuhkan {action.coin_cost} koin.</span>
          </div>
        )}

        <DynamicToolForm
          action={action}
          onSubmit={handleSubmit}
          loading={loading}
          disabled={!hasEnoughCoins}
        />

        {/* Result Display */}
        {result && (
          <div className={`mt-4 p-4 rounded-lg border ${
            result.status === 'success' 
              ? 'bg-success/5 border-success/20' 
              : 'bg-destructive/5 border-destructive/20'
          }`}>
            {result.status === 'success' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Success</span>
                  {result.coins_used && (
                    <Badge variant="secondary" className="ml-auto">
                      -{result.coins_used} coins
                    </Badge>
                  )}
                </div>
                <SmartResult result={result.result} action={result.action} />
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Error</p>
                  <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
