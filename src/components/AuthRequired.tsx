import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, LogIn } from 'lucide-react';

interface AuthRequiredProps {
  children: ReactNode;
}

export const AuthRequired = ({ children }: AuthRequiredProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl">Roof Dynamics</CardTitle>
            </div>
            <CardDescription>
              Please sign in to access your roof analysis dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/auth" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};