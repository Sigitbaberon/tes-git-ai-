import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, Zap, Code2, ArrowRight, Coins, Check, Shield, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Git44</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fitur
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Harga
            </a>
            <a href="#api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              API
            </a>
          </nav>
          <Link to="/auth">
            <Button className="btn-premium rounded-xl px-5">
              Mulai Gratis
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Platform Pemrosesan Video #1</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 text-balance">
              Hapus Watermark
              <br />
              <span className="text-gradient">Sora AI</span> Secara Instan
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
              Proses video Sora AI Anda dan unduh file MP4 bersih tanpa watermark. 
              Interface web sederhana atau API developer yang powerful.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/auth">
                <Button size="lg" className="btn-premium rounded-xl px-8 py-6 text-base">
                  Mulai Memproses
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="rounded-xl px-8 py-6 text-base border-border/50 hover:bg-muted">
                  <Code2 className="w-5 h-5 mr-2" />
                  Lihat Dokumentasi API
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                10 koin gratis
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Tanpa kartu kredit
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Akses API included
              </span>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-3xl" />
            <div className="relative card-glass p-2 rounded-3xl shadow-premium mx-auto max-w-5xl">
              <div className="bg-background rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                  <span className="ml-4 text-sm text-muted-foreground font-mono">git44.com/dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Video Diproses', value: '12,847', color: 'primary' },
                    { label: 'Pengguna Aktif', value: '3,291', color: 'success' },
                    { label: 'Uptime', value: '99.9%', color: 'warning' },
                  ].map((stat, i) => (
                    <div key={i} className="card-hover p-4 sm:p-6 text-center">
                      <p className={`text-2xl sm:text-3xl font-bold text-${stat.color}`}>{stat.value}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Fitur Unggulan</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Semua yang Anda butuhkan untuk memproses video Sora dengan cepat dan mudah
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Video,
                  title: 'Pemrosesan Cepat',
                  description: 'Tempelkan link share Sora dan dapatkan video MP4 bersih tanpa watermark dalam hitungan detik.',
                  color: 'primary',
                },
                {
                  icon: Coins,
                  title: 'Sistem Koin Transparan',
                  description: 'Mulai dengan 10 koin gratis. Setiap video hanya 2 koin. Harga sederhana dan transparan.',
                  color: 'warning',
                },
                {
                  icon: Code2,
                  title: 'API Developer',
                  description: 'Integrasikan pemrosesan video ke aplikasi Anda dengan REST API yang mudah digunakan.',
                  color: 'success',
                },
                {
                  icon: Shield,
                  title: 'Aman & Terenkripsi',
                  description: 'Semua data Anda dilindungi dengan enkripsi end-to-end dan keamanan tingkat enterprise.',
                  color: 'primary',
                },
                {
                  icon: Clock,
                  title: 'Riwayat Lengkap',
                  description: 'Akses semua video yang telah Anda proses kapan saja dengan riwayat tak terbatas.',
                  color: 'warning',
                },
                {
                  icon: Zap,
                  title: 'Performa Tinggi',
                  description: 'Infrastruktur cloud yang dapat diskalakan untuk memastikan pemrosesan cepat setiap saat.',
                  color: 'success',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="card-hover p-6 sm:p-8 group animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-${feature.color}/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '10', label: 'Koin Gratis', suffix: '' },
                { value: '100', label: 'API Calls/Hari', suffix: '+' },
                { value: '99.9', label: 'Uptime', suffix: '%' },
                { value: '∞', label: 'Riwayat Video', suffix: '' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-4xl sm:text-5xl font-bold text-gradient mb-2">
                    {stat.value}{stat.suffix}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Section */}
        <section id="api" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 mb-6">
                  <Code2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-success font-medium">Developer API</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  API yang Mudah Diintegrasikan
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Integrasikan pemrosesan video langsung ke aplikasi Anda dengan beberapa baris kode. 
                  Dokumentasi lengkap dan contoh kode tersedia.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    'REST API dengan autentikasi sederhana',
                    'Contoh kode untuk berbagai bahasa',
                    'Rate limit 100 requests/hari',
                    'Webhook untuk notifikasi real-time',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="btn-premium rounded-xl px-6">
                    Dapatkan API Key
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="card-elevated p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                  <span className="ml-2 text-xs text-muted-foreground font-mono">api-example.js</span>
                </div>
                <pre className="code-block text-sm overflow-x-auto">
                  <code>{`const response = await fetch(
  "https://api.git44.com/v1/process",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "YOUR_API_KEY"
    },
    body: JSON.stringify({
      shareLink: "https://sora.com/share/..."
    })
  }
);

const { video_link, coins_remaining } = 
  await response.json();

console.log("Video URL:", video_link);`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="pricing" className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card-glass p-8 sm:p-12 rounded-3xl text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Siap untuk Memulai?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Buat akun gratis Anda dan mulai memproses video hari ini. 
                  Tidak perlu kartu kredit.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-8">
                  <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                    <Check className="w-4 h-4 text-success" />
                    10 koin gratis
                  </span>
                  <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                    <Check className="w-4 h-4 text-success" />
                    Akses API penuh
                  </span>
                  <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                    <Check className="w-4 h-4 text-success" />
                    Riwayat tak terbatas
                  </span>
                </div>
                <Link to="/auth">
                  <Button size="lg" className="btn-premium rounded-xl px-10 py-6 text-base">
                    Buat Akun Gratis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Video className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Git44</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Git44. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
