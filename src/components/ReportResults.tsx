import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Home, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  RotateCcw
} from 'lucide-react';

interface RoofAnalysis {
  summary: {
    address: string;
    overall_risk: 'low' | 'medium' | 'high';
    notes: string;
  };
  measurements: {
    total_area_sqft: number;
    avg_pitch: string;
    ridge_length_ft: number;
    valley_length_ft: number;
    eaves_length_ft: number;
  };
  materials: {
    shingles_bundles: number;
    underlayment_sq: number;
    drip_edge_ft: number;
    flashing_ft: number;
    vents_count: number;
  };
  cost_breakdown: {
    labor_usd: number;
    materials_usd: number;
    disposal_usd: number;
    contingency_usd: number;
    total_usd: number;
  };
  risks: string[];
  permits: {
    required: boolean;
    notes: string;
  };
}

interface ReportResultsProps {
  analysis: RoofAnalysis;
  pdfUrl: string;
  onRetry?: () => void;
  onNewAnalysis?: () => void;
}

export function ReportResults({ analysis, pdfUrl, onRetry, onNewAnalysis }: ReportResultsProps) {
  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Roof Analysis Complete</CardTitle>
              <CardDescription className="text-base mt-2">{analysis.summary.address}</CardDescription>
            </div>
            <div className="text-right">
              <Badge 
                variant={getRiskBadgeVariant(analysis.summary.overall_risk)}
                className="text-sm px-3 py-1"
              >
                {analysis.summary.overall_risk.charAt(0).toUpperCase() + analysis.summary.overall_risk.slice(1)} Risk
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="construction" size="lg" asChild>
              <a href={pdfUrl} download>
                <Download className="w-5 h-5" />
                Download Full Report
              </a>
            </Button>
            {onNewAnalysis && (
              <Button variant="professional" size="lg" onClick={onNewAnalysis}>
                <Home className="w-5 h-5" />
                New Analysis
              </Button>
            )}
            {onRetry && (
              <Button variant="outline" size="lg" onClick={onRetry}>
                <RotateCcw className="w-5 h-5" />
                Retry Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary & Measurements */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Roof Measurements & Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Analysis Notes</p>
              <p className="text-base">{analysis.summary.notes}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Area</p>
                <p className="text-2xl font-bold">{analysis.measurements.total_area_sqft.toLocaleString()} sq ft</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Pitch</p>
                <p className="text-2xl font-bold">{analysis.measurements.avg_pitch}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ridge Length</p>
                <p className="text-2xl font-bold">{analysis.measurements.ridge_length_ft}′</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valley Length</p>
                <p className="text-2xl font-bold">{analysis.measurements.valley_length_ft}′</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eaves Length</p>
                <p className="text-2xl font-bold">{analysis.measurements.eaves_length_ft}′</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Material Requirements</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>Shingles: <span className="font-medium">{analysis.materials.shingles_bundles} bundles</span></div>
                <div>Underlayment: <span className="font-medium">{analysis.materials.underlayment_sq} sq</span></div>
                <div>Drip Edge: <span className="font-medium">{analysis.materials.drip_edge_ft}′</span></div>
                <div>Flashing: <span className="font-medium">{analysis.materials.flashing_ft}′</span></div>
                <div>Vents: <span className="font-medium">{analysis.materials.vents_count} units</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cost Estimate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Labor</span>
                <span className="font-medium">{formatCurrency(analysis.cost_breakdown.labor_usd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Materials</span>
                <span className="font-medium">{formatCurrency(analysis.cost_breakdown.materials_usd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Disposal</span>
                <span className="font-medium">{formatCurrency(analysis.cost_breakdown.disposal_usd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Contingency</span>
                <span className="font-medium">{formatCurrency(analysis.cost_breakdown.contingency_usd)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Estimate</span>
                <span className="text-primary">{formatCurrency(analysis.cost_breakdown.total_usd)}</span>
              </div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium text-sm">Permits</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                {analysis.permits.required ? (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-success" />
                )}
                <span className="text-sm font-medium">
                  {analysis.permits.required ? 'Required' : 'Not Required'}
                </span>
              </div>
              {analysis.permits.notes && (
                <p className="text-xs text-muted-foreground mt-1">{analysis.permits.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risks & Maintenance */}
      {analysis.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Identified Risks & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.risks.map((risk, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{risk}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}