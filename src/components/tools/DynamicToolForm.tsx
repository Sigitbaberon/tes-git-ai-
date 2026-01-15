import { useState } from 'react';
import { Loader2, Send, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ApiAction, InputField } from '@/hooks/useApiActions';

interface DynamicToolFormProps {
  action: ApiAction;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  loading: boolean;
  disabled?: boolean;
}

export function DynamicToolForm({ action, onSubmit, loading, disabled }: DynamicToolFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // Parse input_schema from action
  const inputSchema: InputField[] = Array.isArray(action.input_schema) 
    ? action.input_schema
    : [];

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = inputSchema
    .filter(field => field.required)
    .every(field => formData[field.name]?.toString().trim());

  if (inputSchema.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No input fields configured for this action.</p>
        <p className="text-sm mt-1">Admin needs to configure input_schema.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {inputSchema.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          
          {field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={loading || disabled}
              rows={4}
            />
          ) : (
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
              disabled={loading || disabled}
            />
          )}
        </div>
      ))}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || disabled || !isFormValid}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Run Action
            <span className="ml-2 flex items-center gap-1 opacity-80">
              <Coins className="w-3 h-3" />
              {action.coin_cost}
            </span>
          </>
        )}
      </Button>
    </form>
  );
}
