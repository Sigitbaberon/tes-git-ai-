import { useState } from 'react';
import { 
  Copy, 
  RefreshCw, 
  Code2, 
  Terminal,
  Check,
  Key,
  Zap,
  AlertTriangle,
  Loader2,
  Coins,
  Table as TableIcon
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useApiActions } from '@/hooks/useApiActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function Developer() {
  const { profile, refreshProfile } = useAuth();
  const { actions, loading: actionsLoading } = useApiActions();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const copyApiKey = () => {
    if (profile?.api_key) {
      navigator.clipboard.writeText(profile.api_key);
      setCopied(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const regenerateApiKey = async () => {
    setRegenerating(true);
    try {
      const newApiKey = crypto.randomUUID();
      const { error } = await supabase
        .from('profiles')
        .update({ api_key: newApiKey })
        .eq('id', profile?.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('API key regenerated successfully');
    } catch (err) {
      toast.error('Failed to regenerate API key');
    } finally {
      setRegenerating(false);
    }
  };

  const endpoint = `${SUPABASE_URL}/functions/v1/process`;

  const codeExamples = {
    curl: `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${profile?.api_key || 'YOUR_API_KEY'}" \\
  -d '{
    "action": "sora_watermark_remover",
    "data": {
      "url": "https://sora.com/share/..."
    }
  }'`,

    python: `import requests

url = "${endpoint}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${profile?.api_key || 'YOUR_API_KEY'}"
}
payload = {
    "action": "sora_watermark_remover",
    "data": {
        "url": "https://sora.com/share/..."
    }
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()

if result["status"] == "success":
    print(f"Video URL: {result['video_link']}")
    print(f"Coins used: {result['coins_used']}")
    print(f"Remaining coins: {result['coins_remaining']}")`,

    php: `<?php
$url = "${endpoint}";
$payload = [
    "action" => "sora_watermark_remover",
    "data" => [
        "url" => "https://sora.com/share/..."
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "x-api-key: ${profile?.api_key || 'YOUR_API_KEY'}"
]);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result);`,

    javascript: `const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${profile?.api_key || 'YOUR_API_KEY'}"
  },
  body: JSON.stringify({
    action: "sora_watermark_remover",
    data: {
      url: "https://sora.com/share/..."
    }
  })
});

const result = await response.json();

if (result.status === "success") {
  console.log("Video URL:", result.video_link);
  console.log("Coins used:", result.coins_used);
  console.log("Remaining coins:", result.coins_remaining);
}`,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Developer API</h1>
          <p className="text-muted-foreground mt-1">
            Unified Multi-Feature API Gateway - Integrate Git44 into your applications
          </p>
        </div>

        {/* API Key Card */}
        <div className="card-elevated p-6">
          <div className="section-header">
            <div className="section-icon bg-primary/10">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Your API Key</h2>
              <p className="text-sm text-muted-foreground">Keep this secret and never share it publicly</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-4 px-4 py-3 rounded-lg bg-muted font-mono text-sm">
              <span className="flex-1 truncate text-muted-foreground">
                {profile?.api_key || '••••••••-••••-••••-••••-••••••••••••'}
              </span>
            </div>
            <Button onClick={copyApiKey} variant="outline">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button onClick={regenerateApiKey} variant="outline" disabled={regenerating}>
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-warning/5 border border-warning/20 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Security Notice</p>
              <p className="text-muted-foreground mt-0.5">
                Regenerating your API key will invalidate the old key immediately. 
                Make sure to update it in all your applications.
              </p>
            </div>
          </div>
        </div>

        {/* Available Actions Table */}
        <div className="card-elevated p-6">
          <div className="section-header">
            <div className="section-icon bg-success/10">
              <TableIcon className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Available Actions</h2>
              <p className="text-sm text-muted-foreground">All available API actions you can use</p>
            </div>
          </div>

          {actionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action Key</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {action.action_key}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{action.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs">
                      {action.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {action.category || 'general'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Coins className="w-3 h-3" />
                        {action.coin_cost}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {actions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No actions available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Endpoint Info */}
        <div className="card-elevated p-6">
          <div className="section-header">
            <div className="section-icon bg-success/10">
              <Zap className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Unified API Endpoint</h2>
              <p className="text-sm text-muted-foreground">Single endpoint for all actions</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Endpoint</p>
              <div className="code-block">
                <span className="text-success font-medium">POST</span> {endpoint}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Headers</p>
                <div className="code-block space-y-1">
                  <p><span className="text-primary">Content-Type:</span> application/json</p>
                  <p><span className="text-primary">x-api-key:</span> YOUR_API_KEY</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Request Body</p>
                <div className="code-block">
                  <p>{"{"}</p>
                  <p className="pl-4"><span className="text-primary">"action"</span>: <span className="text-success">"action_key"</span>,</p>
                  <p className="pl-4"><span className="text-primary">"data"</span>: {"{"}</p>
                  <p className="pl-8"><span className="text-muted-foreground">// action-specific parameters</span></p>
                  <p className="pl-4">{"}"}</p>
                  <p>{"}"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Response (Success)</p>
                <div className="code-block">
                  <p>{"{"}</p>
                  <p className="pl-4"><span className="text-primary">"status"</span>: <span className="text-success">"success"</span>,</p>
                  <p className="pl-4"><span className="text-primary">"action"</span>: <span className="text-success">"action_key"</span>,</p>
                  <p className="pl-4"><span className="text-primary">"coins_used"</span>: <span className="text-warning">2</span>,</p>
                  <p className="pl-4"><span className="text-primary">"coins_remaining"</span>: <span className="text-warning">8</span>,</p>
                  <p className="pl-4"><span className="text-muted-foreground">// action-specific response fields</span></p>
                  <p>{"}"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Response (Error)</p>
                <div className="code-block">
                  <p>{"{"}</p>
                  <p className="pl-4"><span className="text-primary">"status"</span>: <span className="text-destructive">"error"</span>,</p>
                  <p className="pl-4"><span className="text-primary">"message"</span>: <span className="text-destructive">"Error description"</span></p>
                  <p>{"}"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action-Specific Parameters */}
        <div className="card-elevated p-6">
          <div className="section-header">
            <div className="section-icon bg-primary/10">
              <Code2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Action Parameters</h2>
              <p className="text-sm text-muted-foreground">Required parameters for each action</p>
            </div>
          </div>

          <div className="space-y-4">
            {actions.map((action) => (
              <div key={action.id} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm font-mono font-medium text-primary">{action.action_key}</code>
                  <Badge variant="secondary" className="capitalize">{action.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                <div className="code-block text-xs">
                  <p>{"{"}</p>
                  <p className="pl-4"><span className="text-primary">"action"</span>: <span className="text-success">"{action.action_key}"</span>,</p>
                  <p className="pl-4"><span className="text-primary">"data"</span>: {"{"}</p>
                  {action.action_key === 'sora_watermark_remover' && (
                    <p className="pl-8"><span className="text-primary">"url"</span>: <span className="text-success">"https://sora.com/share/..."</span></p>
                  )}
                  <p className="pl-4">{"}"}</p>
                  <p>{"}"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Examples */}
        <div className="card-elevated p-6">
          <div className="section-header">
            <div className="section-icon bg-muted">
              <Terminal className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Code Examples</h2>
              <p className="text-sm text-muted-foreground">Ready-to-use snippets for your language</p>
            </div>
          </div>

          <Tabs defaultValue="curl">
            <TabsList className="mb-4">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>

            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <div className="relative">
                  <pre className="code-block overflow-x-auto text-xs leading-relaxed">
                    {code}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      toast.success('Code copied!');
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Rate Limits */}
        <div className="card-elevated p-6">
          <div className="section-header">
            <div className="section-icon bg-destructive/10">
              <Code2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Rate Limits & Errors</h2>
              <p className="text-sm text-muted-foreground">Usage limits and error codes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-3">Rate Limits</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  100 requests per day per API key
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Coin cost varies per action (see table above)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Max 50MB file size for uploads
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Error Codes</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-3">
                  <span className="status-error">400</span>
                  <span className="text-muted-foreground">Invalid action or parameters</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="status-error">401</span>
                  <span className="text-muted-foreground">Invalid API key</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="status-error">402</span>
                  <span className="text-muted-foreground">Insufficient coins</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="status-error">429</span>
                  <span className="text-muted-foreground">Rate limit exceeded</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="status-error">500</span>
                  <span className="text-muted-foreground">Processing failed</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="status-error">501</span>
                  <span className="text-muted-foreground">Action not implemented</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
