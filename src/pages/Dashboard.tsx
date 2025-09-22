import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthRequired } from '@/components/AuthRequired';
import { AddressInput } from '@/components/AddressInput';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { ReportResults } from '@/components/ReportResults';
import { AnalysisHistory } from '@/components/AnalysisHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, History, Plus, LogOut, User } from 'lucide-react';
import { getAnalysisRuns, createAnalysisRun, AnalysisRun } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import heroImage from '@/assets/hero-roof-satellite.jpg';

type ViewMode = 'input' | 'processing' | 'results';

// Mock analysis result for completed reports
const mockAnalysisResult = {
  summary: {
    address: "123 Main Street, Anytown, USA 12345",
    overall_risk: "medium" as const,
    notes: "Well-maintained asphalt shingle roof with minor wear indicators typical for age. Recommended preventive maintenance within 6 months."
  },
  measurements: {
    total_area_sqft: 2847,
    avg_pitch: "6/12",
    ridge_length_ft: 184,
    valley_length_ft: 67,
    eaves_length_ft: 312
  },
  materials: {
    shingles_bundles: 96,
    underlayment_sq: 29,
    drip_edge_ft: 312,
    flashing_ft: 251,
    vents_count: 8
  },
  cost_breakdown: {
    labor_usd: 8500,
    materials_usd: 4200,
    disposal_usd: 800,
    contingency_usd: 1350,
    total_usd: 14850
  },
  risks: [
    "Minor granule loss on south-facing slopes",
    "Flashing around chimney requires inspection",
    "Gutter alignment issue on east side",
    "Tree branches touching roof surface"
  ],
  permits: {
    required: false,
    notes: "Simple maintenance and repairs do not require permits in this jurisdiction"
  }
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<ViewMode>('input');
  const [activeTab, setActiveTab] = useState('new');
  const [currentAddress, setCurrentAddress] = useState('');
  const [processingStep, setProcessingStep] = useState<'imagery' | 'analysis' | 'calculate' | 'report'>('imagery');
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'completed' | 'failed' | 'cancelled'>('processing');
  const [analysisRuns, setAnalysisRuns] = useState<AnalysisRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user's analysis runs
  useEffect(() => {
    const loadAnalysisRuns = async () => {
      if (!user) return;
      
      const { data, error } = await getAnalysisRuns();
      if (error) {
        toast({
          title: "Error loading analysis history",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setAnalysisRuns(data);
      }
    };

    loadAnalysisRuns();
  }, [user, toast]);

  const handleAddressSubmit = async (address: string) => {
    setIsLoading(true);
    setCurrentAddress(address);
    
    try {
      const { data, error } = await createAnalysisRun(address);
      
      if (error) {
        toast({
          title: "Error starting analysis",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (data) {
        setCurrentView('processing');
        setProcessingStep('imagery');
        setProcessingStatus('processing');
        
        // For demo purposes, simulate the processing
        setTimeout(() => setProcessingStep('analysis'), 2000);
        setTimeout(() => setProcessingStep('calculate'), 6000);
        setTimeout(() => setProcessingStep('report'), 8000);
        setTimeout(() => {
          setProcessingStatus('completed');
          setCurrentView('results');
          // Reload analysis runs to show the completed one
          loadAnalysisRuns();
        }, 10000);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start analysis",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const loadAnalysisRuns = async () => {
    if (!user) return;
    
    const { data, error } = await getAnalysisRuns();
    if (error) {
      console.error('Error loading analysis runs:', error);
    } else if (data) {
      setAnalysisRuns(data);
    }
  };

  const handleCancel = () => {
    setProcessingStatus('cancelled');
    setTimeout(() => setCurrentView('input'), 1000);
  };

  const handleRetry = () => {
    setCurrentView('input');
  };

  const handleNewAnalysis = () => {
    setCurrentView('input');
    setActiveTab('new');
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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out.",
        variant: "destructive",
      });
    }
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

  if (currentView === 'results') {
    return (
      <div className="min-h-screen bg-gradient-subtle py-12 px-4">
        <ReportResults
          analysis={mockAnalysisResult}
          pdfUrl="#sample-report.pdf"
          onRetry={handleRetry}
          onNewAnalysis={handleNewAnalysis}
        />
      </div>
    );
  }

  return (
    <AuthRequired>
      <div className="min-h-screen bg-gradient-subtle">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="relative bg-gradient-primary/90 text-white">
            <div className="container mx-auto px-4 py-16">
              {/* User Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <User className="w-6 h-6" />
                  <span className="text-lg">Welcome, {user?.email}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              
              <div className="text-center">
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
            <AddressInput 
              onSubmit={handleAddressSubmit} 
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="history" className="mt-8">
            <AnalysisHistory 
              runs={analysisRuns}
              onRetryAnalysis={(address) => {
                setCurrentAddress(address);
                handleAddressSubmit(address);
              }}
            />
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
    </AuthRequired>
  );
}