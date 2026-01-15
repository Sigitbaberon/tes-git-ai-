import { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Play, 
  FileText,
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SmartResultProps {
  result: any;
  action: string;
}

const isVideoUrl = (str: string): boolean => {
  if (typeof str !== 'string') return false;
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
  const lowerStr = str.toLowerCase();
  return videoExtensions.some(ext => lowerStr.includes(ext)) || 
         lowerStr.includes('video') ||
         (lowerStr.startsWith('http') && (lowerStr.includes('/video') || lowerStr.includes('stream')));
};

const isImageUrl = (str: string): boolean => {
  if (typeof str !== 'string') return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerStr = str.toLowerCase();
  return imageExtensions.some(ext => lowerStr.includes(ext));
};

const isUrl = (str: string): boolean => {
  if (typeof str !== 'string') return false;
  try {
    new URL(str);
    return str.startsWith('http');
  } catch {
    return false;
  }
};

export function SmartResult({ result, action }: SmartResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  // Convert result to string if needed
  const resultString = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

  // Video Result
  if (typeof result === 'string' && isVideoUrl(result)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-success">
          <Play className="w-5 h-5" />
          <span className="font-medium">Video Result</span>
        </div>
        <div className="rounded-lg overflow-hidden bg-muted aspect-video">
          <video
            src={result}
            controls
            className="w-full h-full"
          >
            Browser Anda tidak mendukung tag video.
          </video>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleDownload(result)} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download Video
          </Button>
          <Button variant="outline" onClick={() => handleCopy(result)}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // Image Result
  if (typeof result === 'string' && isImageUrl(result)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="w-5 h-5" />
          <span className="font-medium">Image Result</span>
        </div>
        <div className="rounded-lg overflow-hidden bg-muted">
          <img
            src={result}
            alt="Result"
            className="w-full h-auto max-h-96 object-contain"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleDownload(result)} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download Image
          </Button>
          <Button variant="outline" onClick={() => handleCopy(result)}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // URL Result (not video/image)
  if (typeof result === 'string' && isUrl(result)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <ExternalLink className="w-5 h-5" />
          <span className="font-medium">URL Result</span>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <a 
            href={result} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
          >
            {result}
          </a>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.open(result, '_blank')} className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Link
          </Button>
          <Button variant="outline" onClick={() => handleCopy(result)}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // Text Result (long text or short)
  const isLongText = resultString.length > 200;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <FileText className="w-5 h-5" />
        <span className="font-medium">Text Result</span>
      </div>
      <div className="relative">
        <div 
          className={`p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap break-words ${
            isLongText ? 'max-h-96 overflow-y-auto' : ''
          }`}
        >
          {resultString}
        </div>
      </div>
      <Button 
        variant="outline" 
        onClick={() => handleCopy(resultString)}
        className="w-full"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </>
        )}
      </Button>
    </div>
  );
}
