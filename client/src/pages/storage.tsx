import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Cloud, HardDrive, AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StorageStatus {
  provider: 'local' | 'unknown';
  isWorking: boolean;
  fileCount?: number;
  error?: string;
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
            <CardTitle>Database Storage</CardTitle>
            <CardDescription>
              Your transcripts and conversation data are stored in PostgreSQL database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All conversation data is persisted in a PostgreSQL database with full CRUD operations.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Persistent PostgreSQL database storage</li>
                  <li>Complete data relationships and referential integrity</li>
                  <li>Character-level positioning for inline highlighting</li>
                  <li>Comprehensive transcript and improvement tracking</li>
                  <li>Automatic data persistence across deployments</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Storage Details</h4>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-mono">PostgreSQL Database</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Backup:</span>
                      <span className="font-mono">File System Fallback</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Format:</span>
                      <span className="font-mono">Structured Tables</span>
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
                File System Backup
              </CardTitle>
              <CardDescription>
                Legacy transcript files stored locally as backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This shows legacy file storage. Primary data is now stored in the database 
                  which persists across deployments.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}