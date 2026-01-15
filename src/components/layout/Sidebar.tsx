import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Code2, 
  User, 
  LogOut, 
  Shield,
  Coins,
  Video,
  ChevronLeft,
  ChevronRight,
  Puzzle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Puzzle, label: 'AI Tools', href: '/tools', badge: 'New' },
  { icon: Coins, label: 'Buy Coins', href: '/buy-coins' },
  { icon: Code2, label: 'Developer API', href: '/developer' },
  { icon: User, label: 'Profile', href: '/profile' },
];

const adminItems = [
  { icon: Shield, label: 'Admin Panel', href: '/admin' },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, isAdmin, signOut } = useAuth();
  const { isOpen, toggle, close } = useSidebar();

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      close();
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside 
        id="mobile-sidebar"
        initial={false}
        animate={{ x: isOpen ? 0 : (window.innerWidth >= 1024 ? 0 : '-100%') }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col",
          "bg-gradient-to-b from-sidebar to-background",
          "border-r border-sidebar-border/50 backdrop-blur-xl",
          "w-[280px] sm:w-64",
          isOpen ? "lg:w-64" : "lg:w-[72px]",
          !isOpen && "max-lg:-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "flex items-center gap-3 py-6 border-b border-sidebar-border/30 transition-all duration-300",
          isOpen ? "px-6" : "lg:px-4 lg:justify-center"
        )}>
          <motion.div 
            className="relative flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-sidebar flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-white" />
            </div>
          </motion.div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="text-xl font-bold text-foreground tracking-tight">Git44</h1>
                <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">Video Processor</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Coin Balance */}
        {profile && (
          <div className={cn(
            "py-4 border-b border-sidebar-border/30 transition-all duration-300",
            isOpen ? "px-4" : "lg:px-2"
          )}>
            {isOpen ? (
              <motion.div 
                className="relative overflow-hidden rounded-xl p-3.5"
                initial={false}
                whileHover={{ scale: 1.02 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider">Balance</p>
                    <p className="text-xl font-bold text-amber-200 tracking-tight">{profile.coins.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden lg:flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-default">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-bold text-amber-200">{profile.coins}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {profile.coins.toLocaleString()} Coins
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className={cn(
          "flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin transition-all duration-300",
          isOpen ? "px-3" : "lg:px-2"
        )}>
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const linkContent = (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className="block"
              >
                <motion.div
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-200",
                    !isOpen && "lg:justify-center lg:px-2.5",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  )}
                  whileHover={{ x: isActive ? 0 : 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {/* Active Indicator Background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(258, 90%, 60%) 100%)',
                        boxShadow: '0 4px 20px -4px hsl(var(--primary) / 0.4)',
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  
                  <item.icon className={cn("w-5 h-5 flex-shrink-0 relative z-10", isActive && "text-white")} />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className={cn("text-sm font-medium relative z-10 whitespace-nowrap", isActive && "text-white")}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {/* Badge */}
                  {item.badge && isOpen && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-auto relative z-10 badge-new"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );

            return !isOpen ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium hidden lg:block">
                  <div className="flex items-center gap-2">
                    {item.label}
                    {item.badge && <span className="badge-new">{item.badge}</span>}
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.href}>{linkContent}</div>
            );
          })}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className={cn("pt-6 pb-2", !isOpen && "lg:hidden")}>
                <p className="px-4 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
                  Admin
                </p>
              </div>
              {!isOpen && <div className="hidden lg:block h-px bg-sidebar-border/50 my-3 mx-2" />}
              {adminItems.map((item) => {
                const isActive = location.pathname === item.href;
                const linkContent = (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={handleNavClick}
                    className="block"
                  >
                    <motion.div
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-200",
                        !isOpen && "lg:justify-center lg:px-2.5",
                        isActive
                          ? "text-destructive-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                      )}
                      whileHover={{ x: isActive ? 0 : 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeAdminNav"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-destructive to-red-600"
                          style={{
                            boxShadow: '0 4px 20px -4px hsl(var(--destructive) / 0.4)',
                          }}
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      <item.icon className={cn("w-5 h-5 flex-shrink-0 relative z-10", isActive && "text-white")} />
                      <AnimatePresence>
                        {isOpen && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className={cn("text-sm font-medium relative z-10 whitespace-nowrap", isActive && "text-white")}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                );

                return !isOpen ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium hidden lg:block">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={item.href}>{linkContent}</div>
                );
              })}
            </>
          )}
        </nav>

        {/* Toggle Button */}
        <div className="hidden lg:block px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              "w-full flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.03] rounded-xl transition-all duration-200",
              isOpen ? "justify-start px-4" : "justify-center px-2"
            )}
          >
            <motion.div
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* User & Logout */}
        <div className={cn(
          "p-4 border-t border-sidebar-border/30 transition-all duration-300",
          isOpen ? "px-4" : "lg:px-2"
        )}>
          {profile && (
            <motion.div 
              className={cn(
                "flex items-center gap-3 mb-3 transition-all duration-300",
                isOpen ? "px-2" : "lg:justify-center"
              )}
              whileHover={{ scale: isOpen ? 1.01 : 1 }}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/20 flex items-center justify-center border border-primary/20">
                  <span className="text-primary font-bold text-sm">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-sidebar" />
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-semibold truncate">{profile.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          
          {isOpen ? (
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Logout
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
