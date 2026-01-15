import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Video, Mail, Lock, User, ArrowRight, Loader2, ArrowLeft, Sparkles, Check, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const signInSchema = z.object({
  email: z.string().email('Masukkan email yang valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const signUpSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(20),
  email: z.string().email('Masukkan email yang valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email atau password salah');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Selamat datang kembali!');
          navigate('/dashboard');
        }
      } else {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.username);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Email sudah terdaftar');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Akun berhasil dibuat! Selamat datang di Git44');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast.error('Terjadi kesalahan yang tidak terduga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12">
        <div className="max-w-md w-full mx-auto animate-fade-in">
          {/* Back to Home */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke beranda
          </Link>

          {/* Logo */}
          <div className="mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-glow">
              <Video className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? 'Selamat Datang' : 'Buat Akun'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Masuk ke akun Anda untuk melanjutkan' 
                : 'Daftar untuk memulai pemrosesan video'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="pl-12 h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary focus:bg-background transition-all"
                  />
                </div>
                {errors.username && (
                  <p className="text-destructive text-xs mt-2">{errors.username}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="anda@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-12 h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary focus:bg-background transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs mt-2">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-12 h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary focus:bg-background transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-2">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-premium rounded-xl text-base"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Masuk' : 'Buat Akun'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <span className="text-primary font-semibold hover:underline">
                {isLogin ? 'Daftar' : 'Masuk'}
              </span>
            </button>
          </div>

          {/* Features */}
          <div className="mt-10 pt-8 border-t border-border/50">
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Sparkles, label: '10 Koin', sublabel: 'Gratis' },
                { icon: Zap, label: 'API', sublabel: 'Akses' },
                { icon: Shield, label: '∞', sublabel: 'Riwayat' },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-muted/30 border border-border/50">
                  <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex w-1/2 bg-muted/30 relative overflow-hidden items-center justify-center p-12">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 max-w-lg text-center animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-8 shadow-glow float">
            <Video className="w-12 h-12 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Git44 Video Processor</h2>
          <p className="text-muted-foreground text-lg mb-10">
            Platform terpercaya untuk menghapus watermark video Sora AI dengan kualitas terbaik
          </p>
          
          <div className="space-y-4">
            {[
              'Proses video dalam hitungan detik',
              'API developer yang powerful',
              'Keamanan tingkat enterprise',
              'Support 24/7',
            ].map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 text-left p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
