import { useState, useEffect } from 'react';
import { 
  Video, 
  Download, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Link as LinkIcon,
  Coins,
  History,
  TrendingUp,
  BarChart3,
  Puzzle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ApiUsageChart } from '@/components/dashboard/ApiUsageChart';
import { VideoHistoryChart } from '@/components/dashboard/VideoHistoryChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AvailableTools } from '@/components/dashboard/AvailableTools';

const urlSchema = z.string().url('Please enter a valid URL');

interface VideoHistoryItem {
  id: string;
  original_url: string;
  processed_url: string | null;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { profile, session, refreshProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processedVideo, setProcessedVideo] = useState<string | null>(null);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();

    const channel = supabase
      .channel('video-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_history',
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('video_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setHistory(data as VideoHistoryItem[]);
    }
    setLoadingHistory(false);
  };

  const handleProcess = async () => {
    const validation = urlSchema.safeParse(videoUrl);
    if (!validation.success) {
      toast.error('Masukkan URL yang valid');
      return;
    }

    if (!profile || profile.coins < 2) {
      toast.error('Koin tidak cukup. Anda membutuhkan minimal 2 koin.');
      return;
    }

    setProcessing(true);
    setProcessedVideo(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: { shareLink: videoUrl },
      });

      if (error) throw error;

      if (data.status === 'success') {
        setProcessedVideo(data.video_link);
        toast.success('Video berhasil diproses!');
        await refreshProfile();
        await fetchHistory();
      } else {
        throw new Error(data.message || 'Pemrosesan gagal');
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      if (err.message?.includes('402')) {
        toast.error('Koin tidak cukup');
      } else if (err.message?.includes('429')) {
        toast.error('Batas penggunaan tercapai. Coba lagi nanti.');
      } else {
        toast.error(err.message || 'Gagal memproses video');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (url: string) => {
    window.open(url, '_blank');
  };

  const successCount = history.filter(h => h.status === 'success').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Proses video Sora dan hapus watermark
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Koin Tersedia"
            value={profile?.coins || 0}
            icon={<Coins className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />}
            iconClassName="bg-warning/10"
          />
          <StatsCard
            title="Total Diproses"
            value={profile?.total_processed || 0}
            icon={<Video className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />}
            iconClassName="bg-primary/10"
          />
          <StatsCard
            title="Berhasil"
            value={successCount}
            icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success" />}
            iconClassName="bg-success/10"
          />
          <StatsCard
            title="Riwayat"
            value={history.length}
            icon={<History className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />}
            iconClassName="bg-muted"
          />
        </div>

        {/* Process Video Section */}
        <div className="card-elevated p-4 sm:p-6">
          <div className="section-header">
            <div className="section-icon bg-primary/10">
              <LinkIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold">Proses Video</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Masukkan link share video Sora</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="url"
              placeholder="https://sora.com/share/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-1"
              disabled={processing}
            />
            <Button
              onClick={handleProcess}
              disabled={processing || !videoUrl || (profile?.coins || 0) < 2}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="ml-2">Memproses...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span className="ml-2">Proses (2 Koin)</span>
                </>
              )}
            </Button>
          </div>

          {profile && profile.coins < 2 && (
            <p className="text-destructive text-xs sm:text-sm mt-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Anda membutuhkan minimal 2 koin untuk memproses video</span>
            </p>
          )}
        </div>

        {/* Video Player */}
        {processedVideo && (
          <div className="card-elevated p-4 sm:p-6 animate-scale-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="section-header mb-0">
                <div className="section-icon bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold">Video Hasil</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Video Anda siap!</p>
                </div>
              </div>
              <Button onClick={() => handleDownload(processedVideo)} className="w-full sm:w-auto">
                <Download className="w-4 h-4" />
                <span className="ml-2">Unduh MP4</span>
              </Button>
            </div>

            <div className="rounded-lg overflow-hidden bg-muted aspect-video">
              <video
                src={processedVideo}
                controls
                className="w-full h-full"
              >
                Browser Anda tidak mendukung tag video.
              </video>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* API Usage Chart */}
          <div className="card-elevated p-4 sm:p-6">
            <div className="section-header">
              <div className="section-icon bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold">Penggunaan API</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Statistik 7 hari terakhir</p>
              </div>
            </div>
            <ApiUsageChart />
          </div>

          {/* Video Status Chart */}
          <div className="card-elevated p-4 sm:p-6">
            <div className="section-header">
              <div className="section-icon bg-success/10">
                <BarChart3 className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold">Status Video</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Distribusi status pemrosesan</p>
              </div>
            </div>
            <VideoHistoryChart />
          </div>
        </div>

        {/* Available Tools Section */}
        <div className="card-elevated p-4 sm:p-6">
          <div className="section-header">
            <div className="section-icon bg-primary/10">
              <Puzzle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold">AI Modules</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Tools yang tersedia untuk digunakan via API</p>
            </div>
          </div>

          <AvailableTools />
        </div>

        {/* Recent Activity */}
        <div className="card-elevated p-4 sm:p-6">
          <div className="section-header">
            <div className="section-icon bg-muted">
              <History className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold">Aktivitas Terbaru</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Video yang telah diproses</p>
            </div>
          </div>

          <RecentActivity
            history={history}
            loading={loadingHistory}
            onDownload={handleDownload}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
