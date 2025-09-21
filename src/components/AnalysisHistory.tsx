import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  StopCircle,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type AnalysisStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface AnalysisRun {
  id: string;
  address: string;
  status: AnalysisStatus;
  created_at: string;
  updated_at: string;
  pdf_url?: string;
  metadata?: {
    error?: string;
  };
}

interface AnalysisHistoryProps {
  runs: AnalysisRun[];
  onViewResults?: (id: string) => void;
  onRetryAnalysis?: (address: string) => void;
}

export function AnalysisHistory({ runs, onViewResults, onRetryAnalysis }: AnalysisHistoryProps) {
  const getStatusIcon = (status: AnalysisStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'processing':
      case 'queued':
        return <Clock className="w-4 h-4 text-primary" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'cancelled':
        return <StopCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: AnalysisStatus) => {
    const variant = status === 'completed' ? 'default' :
                   status === 'failed' ? 'destructive' :
                   status === 'cancelled' ? 'secondary' : 'outline';
    
    return (
      <Badge variant={variant} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (runs.length === 0) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analysis History</h3>
          <p className="text-muted-foreground">
            Your completed roof analyses will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analysis History</h2>
        <Badge variant="outline" className="text-muted-foreground">
          {runs.length} {runs.length === 1 ? 'analysis' : 'analyses'}
        </Badge>
      </div>
      
      <div className="space-y-4">
        {runs.map((run) => (
          <Card key={run.id} className="shadow-elegant hover:shadow-primary transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(run.status)}
                    <h3 className="text-lg font-semibold truncate">{run.address}</h3>
                    {getStatusBadge(run.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>
                      Started {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                    </span>
                    {run.updated_at !== run.created_at && (
                      <span>
                        Updated {formatDistanceToNow(new Date(run.updated_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {run.metadata?.error && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                      {run.metadata.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {run.status === 'completed' && run.pdf_url && (
                    <>
                      <Button variant="professional" size="sm" asChild>
                        <a href={run.pdf_url} download>
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </Button>
                      {onViewResults && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewResults(run.id)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      )}
                    </>
                  )}
                  
                  {(run.status === 'failed' || run.status === 'cancelled') && onRetryAnalysis && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onRetryAnalysis(run.address)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}