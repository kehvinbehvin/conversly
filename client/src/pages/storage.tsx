import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Cloud, HardDrive, AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StorageStatus {
  provider: 'replit' | 'local' | 'unknown';
  isWorking: boolean;
  fileCount?: number;
  error?: string;
  config?: {
    bucketId?: string;
    bucketName?: string;
  };
}

export default function Storage() {
  const { toast } = useToast();

  const { data: status, isLoading, refetch } = useQuery<StorageStatus>({
    queryKey: ['/api/storage/status'],
    refetchInterval: 10000, // Check every 10 seconds
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'replit':
        return <Cloud className="h-5 w-5" />;
      case 'local':
        return <HardDrive className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'replit':
        return 'Replit Object Storage';
      case 'local':
        return 'Local File System';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Storage Configuration</h1>
            <p className="text-muted-foreground mt-2">
              Configure and monitor your transcript storage
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Storage Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure and monitor your transcript storage
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getProviderIcon(status?.provider || 'unknown')}
              Current Storage Provider
            </CardTitle>
            <CardDescription>
              Active storage configuration for transcript data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{getProviderName(status?.provider || 'unknown')}</p>
                <div className="flex items-center gap-2">
                  {status?.isWorking ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Working properly</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">
                        {status?.error || 'Not working'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge variant={status?.isWorking ? 'default' : 'destructive'}>
                  {status?.provider?.toUpperCase() || 'UNKNOWN'}
                </Badge>
                {status?.fileCount !== undefined && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {status.fileCount} files stored
                  </p>
                )}
              </div>
            </div>

            {status?.config && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium text-sm">Configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {status.config.bucketId && (
                    <div>
                      <span className="text-muted-foreground">Bucket ID:</span>
                      <span className="ml-2 font-mono text-xs">{status.config.bucketId}</span>
                    </div>
                  )}
                  {status.config.bucketName && (
                    <div>
                      <span className="text-muted-foreground">Bucket:</span>
                      <span className="ml-2 font-mono">{status.config.bucketName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Refresh Status
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/storage/test">Test Storage</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Replit Object Storage</CardTitle>
            <CardDescription>
              Your transcripts are automatically stored using Replit's built-in object storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Cloud className="h-4 w-4" />
              <AlertDescription>
                Hybrid storage system: Tries Replit Object Storage first, automatically falls back to local storage if needed.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Hybrid storage: Cloud first, local fallback</li>
                  <li>Automatic backup and redundancy</li>
                  <li>Scalable storage with high availability</li>
                  <li>Integrated with your Replit environment</li>
                  <li>No external configuration needed</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Storage Details</h4>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-mono">Hybrid (Cloud + Local)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Primary:</span>
                      <span className="font-mono">Replit Object Storage</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fallback:</span>
                      <span className="font-mono">Local File System</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Format:</span>
                      <span className="font-mono">JSON</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Local Storage Info */}
        {status?.provider === 'local' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Local Storage
              </CardTitle>
              <CardDescription>
                Currently using local file system storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Local storage works for development but may not persist across deployments. 
                  Consider setting up cloud storage for production use.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}