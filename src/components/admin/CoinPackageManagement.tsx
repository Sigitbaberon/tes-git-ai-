import { useState, useEffect } from 'react';
import { 
  Plus, 
  Save, 
  X, 
  Loader2,
  Trash2,
  Coins,
  GripVertical,
  Power,
  PowerOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CoinPackage {
  id: string;
  name: string;
  coin_amount: number;
  price: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

interface PackageFormData {
  name: string;
  coin_amount: number;
  price: number;
  description: string;
  is_active: boolean;
  sort_order: number;
}

const defaultFormData: PackageFormData = {
  name: '',
  coin_amount: 100,
  price: 50000,
  description: '',
  is_active: true,
  sort_order: 0,
};

export function CoinPackageManagement() {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CoinPackage | null>(null);
  const [formData, setFormData] = useState<PackageFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coin_packages')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      toast.error('Failed to load packages');
    } else if (data) {
      setPackages(data);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingPackage(null);
    setFormData({
      ...defaultFormData,
      sort_order: packages.length + 1,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (pkg: CoinPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      coin_amount: pkg.coin_amount,
      price: pkg.price,
      description: pkg.description || '',
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Package name is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name,
        coin_amount: formData.coin_amount,
        price: formData.price,
        description: formData.description || null,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from('coin_packages')
          .update(data)
          .eq('id', editingPackage.id);

        if (error) throw error;
        toast.success('Package updated successfully');
      } else {
        const { error } = await supabase
          .from('coin_packages')
          .insert(data);

        if (error) throw error;
        toast.success('Package created successfully');
      }

      setIsDialogOpen(false);
      fetchPackages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pkg: CoinPackage) => {
    try {
      const { error } = await supabase
        .from('coin_packages')
        .update({ is_active: !pkg.is_active })
        .eq('id', pkg.id);

      if (error) throw error;
      toast.success(pkg.is_active ? 'Package disabled' : 'Package enabled');
      fetchPackages();
    } catch (err) {
      toast.error('Failed to update package status');
    }
  };

  const deletePackage = async (pkg: CoinPackage) => {
    if (!confirm(`Are you sure you want to delete "${pkg.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('coin_packages')
        .delete()
        .eq('id', pkg.id);

      if (error) throw error;
      toast.success('Package deleted successfully');
      fetchPackages();
    } catch (err) {
      toast.error('Failed to delete package');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Coin Packages
            </CardTitle>
            <CardDescription>
              Manage coin packages available for purchase
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPackage ? 'Edit Package' : 'Create New Package'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Starter Pack"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coin_amount">Coin Amount</Label>
                    <Input
                      id="coin_amount"
                      type="number"
                      min={1}
                      value={formData.coin_amount}
                      onChange={(e) => setFormData({ ...formData, coin_amount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (IDR)</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Package description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      min={0}
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active" className="text-sm">
                        {formData.is_active ? 'Active' : 'Disabled'}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Coins</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="text-muted-foreground">
                  {pkg.sort_order}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-xs text-muted-foreground">{pkg.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="coin-badge">{pkg.coin_amount}</span>
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(pkg.price)}
                </TableCell>
                <TableCell>
                  <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                    {pkg.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(pkg)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(pkg)}
                    >
                      {pkg.is_active ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deletePackage(pkg)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
