import { useState } from 'react';
import { AddressInput } from '@/components/AddressInput';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { ReportResults } from '@/components/ReportResults';
import { AnalysisHistory } from '@/components/AnalysisHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, History, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import heroImage from '@/assets/hero-roof-satellite.jpg';
import { 
  createAnalysisRun, 
  startAnalysisPipeline, 
  getAnalysisRun, 
  cancelAnalysisRun,
  getAnalysisHistory,
  type AnalysisRun
} from '@/lib/api';

type ViewMode = 'input' | 'processing' | 'results';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewMode>('input');
  const [activeTab, setActiveTab] = useState('new');
  const [currentAddress, setCurrentAddress] = useState('');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<AnalysisRun | null>(null);
  const [processingStep, setProcessingStep] = useState<'imagery' | 'analysis' | 'calculate' | 'report'>('imagery');
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'completed' | 'failed' | 'cancelled'>('processing');
  const [historyData, setHistoryData] = useState<AnalysisRun[]>([]);
  const { toast } = useToast();

  // Polling function to check run status
  const startPolling = (runId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const run = await getAnalysisRun(runId);
        if (run) {
          setCurrentRun(run);
          
          // Update UI based on current step
          if (run.current_step === 'imagery' || run.current_step === 'imagery_complete') {
            setProcessingStep('imagery');
          } else if (run.current_step === 'ai_analysis') {
            setProcessingStep('analysis');
          } else if (run.current_step === 'analysis_complete') {
            setProcessingStep('calculate');
          } else if (run.current_step === 'generating_pdf') {
            setProcessingStep('report');
          }
          
          // Check if processing is complete
          if (run.status === 'completed') {
            setProcessingStatus('completed');
            setCurrentView('results');
            clearInterval(pollInterval);
          } else if (run.status === 'failed') {
            setProcessingStatus('failed');
            clearInterval(pollInterval);
            toast({
              title: "Analysis Failed",
              description: run.error_message || "An error occurred during processing",
              variant: "destructive",
            });
          } else if (run.status === 'cancelled') {
            setProcessingStatus('cancelled');
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error polling run status:', error);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds
    
    // Clean up after 5 minutes to prevent infinite polling
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const handleAddressSubmit = async (address: string) => {
    try {
      setCurrentAddress(address);
      setCurrentView('processing');
      setProcessingStep('imagery');
      setProcessingStatus('processing');
      
      // Create analysis run
      const run = await createAnalysisRun(address);
      setCurrentRunId(run.id);
      setCurrentRun(run);
      
      // Start the analysis pipeline
      await startAnalysisPipeline(run.id, address);
      
      // Start polling for updates
      startPolling(run.id);
    } catch (error) {
      console.error('Error starting analysis:', error);
      setProcessingStatus('failed');
      toast({
        title: "Error Starting Analysis",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (currentRunId) {
      try {
        await cancelAnalysisRun(currentRunId);
        setProcessingStatus('cancelled');
        setTimeout(() => setCurrentView('input'), 1000);
      } catch (error) {
        console.error('Error cancelling run:', error);
        toast({
          title: "Error Cancelling",
          description: "Failed to cancel the analysis",
          variant: "destructive",
        });
      }
    }
  };

  const handleRetry = () => {
    setCurrentView('input');
    setCurrentRunId(null);
    setCurrentRun(null);
  };

  const handleNewAnalysis = () => {
    setCurrentView('input');
    setActiveTab('new');
    setCurrentRunId(null);
    setCurrentRun(null);
  };

  // Load history when switching to history tab
  const loadHistory = async () => {
    try {
      const history = await getAnalysisHistory();
      setHistoryData(history);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: "Error Loading History",
        description: "Failed to load analysis history",
        variant: "destructive",
      });
    }
  };

  const getProgress = () => {
    const stepProgress = {
      'imagery': 25,
      'analysis': 50,
      'calculate': 75,
      'report': 100
    };
    return stepProgress[processingStep] || 0;
  };

  if (currentView === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-subtle py-12 px-4">
        <ProcessingStatus
          currentStep={processingStep}
          stepStatus={processingStatus}
          address={currentAddress}
          onCancel={handleCancel}
          canCancel={processingStatus === 'processing'}
          progress={getProgress()}
        />
      </div>
    );
  }

  if (currentView === 'results' && currentRun?.analysis) {
    return (
      <div className="min-h-screen bg-gradient-subtle py-12 px-4">
        <ReportResults
          analysis={currentRun.analysis}
          pdfUrl={currentRun.pdf_url || "#"}
          onRetry={handleRetry}
          onNewAnalysis={handleNewAnalysis}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative bg-gradient-primary/90 text-white">
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Roof Dynamics
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                Professional roof inspection reports powered by satellite imagery and AI analysis
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <span>Satellite Imagery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <span>AI-Powered Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <span>Professional Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Analysis
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="mt-8">
            <AddressInput onSubmit={handleAddressSubmit} />
          </TabsContent>
          
          <TabsContent value="history" className="mt-8">
            <AnalysisHistory 
              runs={historyData}
              onRetryAnalysis={(address) => {
                setCurrentAddress(address);
                handleAddressSubmit(address);
              }}
            />
            {historyData.length === 0 && (
              <div className="text-center py-8">
                <Button onClick={loadHistory} variant="outline">
                  Load Analysis History
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="text-center shadow-elegant">
            <CardHeader>
              <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Satellite Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                High-resolution satellite imagery provides accurate roof measurements and structural analysis
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center shadow-elegant">
            <CardHeader>
              <Building2 className="w-12 h-12 text-construction mx-auto mb-4" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                GPT-5 analyzes roof conditions, materials, and provides professional recommendations
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center shadow-elegant">
            <CardHeader>
              <Building2 className="w-12 h-12 text-success mx-auto mb-4" />
              <CardTitle>Professional Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Comprehensive PDF reports with measurements, costs, risks, and maintenance recommendations
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}