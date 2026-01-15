import { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardContent({ children }: DashboardLayoutProps) {
  const { isOpen, toggle, close } = useSidebar();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (window.innerWidth < 1024 && isOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        const menuButton = document.getElementById('menu-toggle');
        if (
          sidebar && 
          !sidebar.contains(e.target as Node) && 
          menuButton &&
          !menuButton.contains(e.target as Node)
        ) {
          close();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
          onClick={close}
        />
      )}
      
      <Sidebar />
      
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        // Desktop: adjust margin based on sidebar state
        "lg:ml-20",
        isOpen && "lg:ml-64"
      )}>
        {/* Mobile Header with Menu Toggle */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-background/95 backdrop-blur-sm border-b border-border lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              id="menu-toggle"
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="h-9 w-9"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="text-lg font-semibold">Git44</h1>
          </div>
        </header>
        
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
