import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Cloud, HardDrive, AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StorageStatus {
  provider: 'aws' | 'local' | 'unknown';
  isWorking: boolean;
  fileCount?: number;
  error?: string;
  config?: {
    region?: string;
    bucketName?: string;
    hasCredentials?: boolean;
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
      case 'aws':
        return <Cloud className="h-5 w-5" />;
      case 'local':
        return <HardDrive className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'aws':
        return 'Amazon S3';
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
                  {status.config.region && (
                    <div>
                      <span className="text-muted-foreground">Region:</span>
                      <span className="ml-2 font-mono">{status.config.region}</span>
                    </div>
                  )}
                  {status.config.bucketName && (
                    <div>
                      <span className="text-muted-foreground">Bucket:</span>
                      <span className="ml-2 font-mono">{status.config.bucketName}</span>
                    </div>
                  )}
                  {status.config.hasCredentials !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Credentials:</span>
                      <span className={`ml-2 ${status.config.hasCredentials ? 'text-green-600' : 'text-orange-600'}`}>
                        {status.config.hasCredentials ? 'Configured' : 'Using default'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Cloud Storage</CardTitle>
            <CardDescription>
              Configure AWS S3 for scalable transcript storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Cloud className="h-4 w-4" />
              <AlertDescription>
                To use AWS S3 storage, you'll need to set up environment variables in your Replit secrets.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Required Environment Variables</h4>
                <div className="space-y-2">
                  {[
                    { key: 'STORAGE_PROVIDER', value: 'aws', description: 'Set storage provider to AWS S3' },
                    { key: 'AWS_S3_BUCKET_NAME', value: 'your-bucket-name', description: 'Your S3 bucket name' },
                    { key: 'AWS_REGION', value: 'us-east-1', description: 'AWS region (optional, defaults to us-east-1)' },
                    { key: 'AWS_ACCESS_KEY_ID', value: 'your-access-key', description: 'AWS access key (optional if using IAM roles)' },
                    { key: 'AWS_SECRET_ACCESS_KEY', value: 'your-secret-key', description: 'AWS secret key (optional if using IAM roles)' },
                  ].map((env) => (
                    <div key={env.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {env.key}
                        </code>
                        <p className="text-xs text-muted-foreground">{env.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs text-muted-foreground">
                          {env.value}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(env.key, 'Environment variable name')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Setup Steps</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Create an AWS S3 bucket in your preferred region</li>
                  <li>Create IAM credentials with S3 read/write permissions</li>
                  <li>Add the environment variables to your Replit secrets</li>
                  <li>Restart your application to apply the changes</li>
                  <li>Check the status above to verify the connection</li>
                </ol>
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