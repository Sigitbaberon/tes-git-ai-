import { useState } from 'react';
import { 
  Plus, 
  Save, 
  X, 
  Loader2,
  Trash2,
  Power,
  PowerOff,
  Info,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useApiActions, ApiAction } from '@/hooks/useApiActions';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

interface ActionFormData {
  action_key: string;
  name: string;
  description: string;
  coin_cost: number;
  category: string;
  is_active: boolean;
  endpoint_config: string;
  input_schema: string;
}

const defaultFormData: ActionFormData = {
  action_key: '',
  name: '',
  description: '',
  coin_cost: 2,
  category: 'general',
  is_active: true,
  endpoint_config: JSON.stringify({
    external_api: "https://api.example.com/endpoint",
    method: "POST",
    request_body_mapping: {},
    response_path: "result"
  }, null, 2),
  input_schema: JSON.stringify([
    {
      name: "url",
      label: "URL",
      type: "url",
      placeholder: "https://example.com/...",
      required: true
    }
  ], null, 2),
};

const endpointConfigHelp = `{
  "external_api": "https://api.example.com/endpoint",
  "method": "POST",
  "request_body_mapping": {
    "api_field_name": "our_field_name"
  },
  "response_path": "data.result",
  "is_array_mapping": false,
  "mapping_key": "text",
  "join_separator": " "
}`;

const inputSchemaHelp = `[
  {
    "name": "url",
    "label": "Video URL",
    "type": "url",
    "placeholder": "https://...",
    "required": true
  },
  {
    "name": "text",
    "label": "Text Input",
    "type": "textarea",
    "placeholder": "Enter text...",
    "required": false
  }
]

Supported types: text, url, textarea, number, email`;

export function ActionManagement() {
  const { actions, loading, refetch } = useApiActions(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ApiAction | null>(null);
  const [formData, setFormData] = useState<ActionFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [jsonErrors, setJsonErrors] = useState<{ endpoint?: string; input?: string }>({});

  const validateJson = (json: string, field: 'endpoint' | 'input'): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (field === 'input' && !Array.isArray(parsed)) {
        setJsonErrors(prev => ({ ...prev, [field]: 'Input schema must be an array' }));
        return false;
      }
      setJsonErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (e) {
      setJsonErrors(prev => ({ ...prev, [field]: 'Invalid JSON format' }));
      return false;
    }
  };

  const openCreateDialog = () => {
    setEditingAction(null);
    setFormData(defaultFormData);
    setJsonErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (action: ApiAction) => {
    setEditingAction(action);
    setFormData({
      action_key: action.action_key,
      name: action.name,
      description: action.description || '',
      coin_cost: action.coin_cost,
      category: action.category || 'general',
      is_active: action.is_active,
      endpoint_config: JSON.stringify(action.endpoint_config, null, 2),
      input_schema: JSON.stringify(action.input_schema || [], null, 2),
    });
    setJsonErrors({});
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.action_key || !formData.name) {
      toast.error('Action key and name are required');
      return;
    }

    const endpointValid = validateJson(formData.endpoint_config, 'endpoint');
    const inputValid = validateJson(formData.input_schema, 'input');

    if (!endpointValid || !inputValid) {
      toast.error('Please fix JSON errors before saving');
      return;
    }

    setSaving(true);
    try {
      const endpointConfig = JSON.parse(formData.endpoint_config);
      const inputSchema = JSON.parse(formData.input_schema);

      const data = {
        action_key: formData.action_key,
        name: formData.name,
        description: formData.description || null,
        coin_cost: formData.coin_cost,
        category: formData.category,
        is_active: formData.is_active,
        endpoint_config: endpointConfig,
        input_schema: inputSchema,
      };

      if (editingAction) {
        const { error } = await supabase
          .from('api_actions')
          .update(data)
          .eq('id', editingAction.id);

        if (error) throw error;
        toast.success('Action updated successfully');
      } else {
        const { error } = await supabase
          .from('api_actions')
          .insert(data);

        if (error) throw error;
        toast.success('Action created successfully');
      }

      setIsDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save action');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (action: ApiAction) => {
    try {
      const { error } = await supabase
        .from('api_actions')
        .update({ is_active: !action.is_active })
        .eq('id', action.id);

      if (error) throw error;
      toast.success(action.is_active ? 'Action disabled' : 'Action enabled');
      refetch();
    } catch (err: any) {
      toast.error('Failed to update action status');
    }
  };

  const deleteAction = async (action: ApiAction) => {
    if (!confirm(`Are you sure you want to delete "${action.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('api_actions')
        .delete()
        .eq('id', action.id);

      if (error) throw error;
      toast.success('Action deleted successfully');
      refetch();
    } catch (err: any) {
      toast.error('Failed to delete action');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">API Actions</h3>
            <p className="text-sm text-muted-foreground">
              Manage available API actions and their configurations
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Action
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAction ? 'Edit Action' : 'Create New Action'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="action_key">Action Key *</Label>
                    <Input
                      id="action_key"
                      placeholder="e.g., sora_watermark_remover"
                      value={formData.action_key}
                      onChange={(e) => setFormData({ ...formData, action_key: e.target.value })}
                      disabled={!!editingAction}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Sora Watermark Remover"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this action does..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coin_cost">Coin Cost</Label>
                    <Input
                      id="coin_cost"
                      type="number"
                      min={0}
                      value={formData.coin_cost}
                      onChange={(e) => setFormData({ ...formData, coin_cost: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
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

                {/* Config Tabs */}
                <Tabs defaultValue="endpoint" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="endpoint">
                      Endpoint Config
                      {jsonErrors.endpoint && <span className="ml-1 text-destructive">!</span>}
                    </TabsTrigger>
                    <TabsTrigger value="input">
                      Input Schema
                      {jsonErrors.input && <span className="ml-1 text-destructive">!</span>}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="endpoint" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="endpoint_config">Endpoint Configuration (JSON)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <HelpCircle className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-md">
                          <pre className="text-xs whitespace-pre-wrap">{endpointConfigHelp}</pre>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Textarea
                      id="endpoint_config"
                      value={formData.endpoint_config}
                      onChange={(e) => {
                        setFormData({ ...formData, endpoint_config: e.target.value });
                        validateJson(e.target.value, 'endpoint');
                      }}
                      rows={8}
                      className={`font-mono text-sm ${jsonErrors.endpoint ? 'border-destructive' : ''}`}
                    />
                    {jsonErrors.endpoint && (
                      <p className="text-sm text-destructive">{jsonErrors.endpoint}</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="input" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="input_schema">Input Schema (JSON Array)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <HelpCircle className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-md">
                          <pre className="text-xs whitespace-pre-wrap">{inputSchemaHelp}</pre>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Textarea
                      id="input_schema"
                      value={formData.input_schema}
                      onChange={(e) => {
                        setFormData({ ...formData, input_schema: e.target.value });
                        validateJson(e.target.value, 'input');
                      }}
                      rows={8}
                      className={`font-mono text-sm ${jsonErrors.input ? 'border-destructive' : ''}`}
                    />
                    {jsonErrors.input && (
                      <p className="text-sm text-destructive">{jsonErrors.input}</p>
                    )}
                  </TabsContent>
                </Tabs>

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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action Key</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Inputs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => (
              <TableRow key={action.id}>
                <TableCell className="font-mono text-sm">{action.action_key}</TableCell>
                <TableCell className="font-medium">{action.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {action.category || 'general'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="coin-badge">{action.coin_cost}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {Array.isArray(action.input_schema) ? action.input_schema.length : 0} fields
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={action.is_active ? 'status-success' : 'status-error'}>
                    {action.is_active ? 'Active' : 'Disabled'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(action)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(action)}
                    >
                      {action.is_active ? (
                        <PowerOff className="w-4 h-4 text-warning" />
                      ) : (
                        <Power className="w-4 h-4 text-success" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAction(action)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {actions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No actions configured yet. Click "Add Action" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
