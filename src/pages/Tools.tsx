import { useState } from 'react';
import { 
  Loader2, 
  Puzzle, 
  Coins,
  Search,
  Filter
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useApiActions } from '@/hooks/useApiActions';
import { ToolCard } from '@/components/tools/ToolCard';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'video', label: 'Video' },
  { key: 'image', label: 'Image' },
  { key: 'audio', label: 'Audio' },
  { key: 'text', label: 'Text' },
  { key: 'general', label: 'General' },
];

export default function Tools() {
  const { profile, refreshProfile } = useAuth();
  const { actions, loading } = useApiActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredActions = actions.filter(action => {
    const matchesSearch = 
      action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.action_key.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      (action.category || 'general') === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Tools</h1>
            <p className="text-muted-foreground mt-1">
              Pilih dan jalankan AI tools yang tersedia
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/20">
            <Coins className="w-5 h-5 text-warning" />
            <span className="font-semibold">{profile?.coins || 0}</span>
            <span className="text-sm text-muted-foreground">Coins</span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.key)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredActions.length === 0 && (
          <div className="text-center py-12">
            <Puzzle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tools found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'No AI tools are currently available'}
            </p>
          </div>
        )}

        {/* Tools Grid */}
        {!loading && filteredActions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredActions.map((action) => (
              <ToolCard
                key={action.id}
                action={action}
                userCoins={profile?.coins || 0}
                onSuccess={refreshProfile}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
