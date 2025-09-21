import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Satellite, 
  Brain, 
  Calculator, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  StopCircle
} from 'lucide-react';

type ProcessingStep = 'imagery' | 'analysis' | 'calculate' | 'report';
type StepStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface ProcessingStatusProps {
  currentStep: ProcessingStep;
  stepStatus: StepStatus;
  address: string;
  onCancel?: () => void;
  canCancel?: boolean;
  progress?: number;
}

const steps = [
  {
    id: 'imagery' as ProcessingStep,
    title: 'Fetching Satellite Imagery',
    description: 'Acquiring high-resolution aerial views',
    icon: Satellite,
  },
  {
    id: 'analysis' as ProcessingStep,
    title: 'AI Roof Analysis',
    description: 'GPT-5 analyzing roof structure and materials',
    icon: Brain,
  },
  {
    id: 'calculate' as ProcessingStep,
    title: 'Calculating Measurements',
    description: 'Computing areas, materials, and costs',
    icon: Calculator,
  },
  {
    id: 'report' as ProcessingStep,
    title: 'Generating PDF Report',
    description: 'Creating comprehensive inspection document',
    icon: FileText,
  },
];

export function ProcessingStatus({ 
  currentStep, 
  stepStatus, 
  address, 
  onCancel, 
  canCancel = false,
  progress = 0
}: ProcessingStatusProps) {
  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepIndex: number): StepStatus => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return stepStatus;
    return 'pending';
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'cancelled':
        return <StopCircle className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-success border-success">Complete</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-primary border-primary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Processing Roof Analysis</CardTitle>
          <CardDescription>{address}</CardDescription>
          <div className="pt-2">
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      status === 'completed' ? 'bg-success/10' :
                      status === 'processing' ? 'bg-primary/10' :
                      status === 'failed' ? 'bg-destructive/10' :
                      'bg-muted'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        status === 'completed' ? 'text-success' :
                        status === 'processing' ? 'text-primary' :
                        status === 'failed' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-foreground">
                        {step.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(status)}
                        {getStatusIcon(status)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {canCancel && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Cancel Analysis
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}