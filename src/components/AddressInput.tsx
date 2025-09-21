import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Satellite } from 'lucide-react';

interface AddressInputProps {
  onSubmit: (address: string) => void;
  isLoading?: boolean;
}

export function AddressInput({ onSubmit, isLoading = false }: AddressInputProps) {
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onSubmit(address.trim());
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-elegant">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <Satellite className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Start Roof Analysis</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter a property address to generate a comprehensive roof inspection report
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Enter property address (e.g., 123 Main St, City, State)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-10 h-12 text-base"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            variant="construction"
            size="lg"
            className="w-full h-12 text-base font-semibold"
            disabled={!address.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Analyzing Property...
              </>
            ) : (
              <>
                <Satellite className="w-5 h-5" />
                Generate Roof Report
              </>
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Analysis includes satellite imagery, roof measurements, material estimates, and cost breakdown
        </p>
      </CardContent>
    </Card>
  );
}