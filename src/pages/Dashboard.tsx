import { useState } from 'react';
import { AddressInput } from '@/components/AddressInput';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { ReportResults } from '@/components/ReportResults';
import { AnalysisHistory } from '@/components/AnalysisHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, History, Plus } from 'lucide-react';
import heroImage from '@/assets/hero-roof-satellite.jpg';

// Mock data for demonstration
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

const mockHistoryData = [
  {
    id: "1",
    address: "456 Oak Avenue, Springfield, IL 62704",
    status: "completed" as const,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:45:00Z",
    pdf_url: "#download-1"
  },
  {
    id: "2", 
    address: "789 Pine Street, Madison, WI 53703",
    status: "failed" as const,
    created_at: "2024-01-14T14:20:00Z",
    updated_at: "2024-01-14T14:35:00Z",
    metadata: { error: "Unable to acquire sufficient satellite imagery resolution" }
  },
  {
    id: "3",
    address: "321 Elm Drive, Austin, TX 78701",
    status: "cancelled" as const,
    created_at: "2024-01-13T09:15:00Z",
    updated_at: "2024-01-13T09:25:00Z"
  }
];

type ViewMode = 'input' | 'processing' | 'results';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewMode>('input');
  const [activeTab, setActiveTab] = useState('new');
  const [currentAddress, setCurrentAddress] = useState('');
  const [processingStep, setProcessingStep] = useState<'imagery' | 'analysis' | 'calculate' | 'report'>('imagery');
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'completed' | 'failed' | 'cancelled'>('processing');

  const handleAddressSubmit = (address: string) => {
    setCurrentAddress(address);
    setCurrentView('processing');
    setProcessingStep('imagery');
    setProcessingStatus('processing');
    
    // Simulate processing steps
    setTimeout(() => setProcessingStep('analysis'), 2000);
    setTimeout(() => setProcessingStep('calculate'), 6000);
    setTimeout(() => setProcessingStep('report'), 8000);
    setTimeout(() => {
      setProcessingStatus('completed');
      setCurrentView('results');
    }, 10000);
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
              runs={mockHistoryData}
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
  );
}