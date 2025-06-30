import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { AuthProvider } from '@/lib/auth-context';
import { localStorageService } from 'http-client-local';

function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceUuid, setDeviceUuid] = useState<string>('');
  const { login } = useAuth();

  // Check for existing device UUID on mount
  useEffect(() => {
    const existingDeviceUuid = localStorageService.getDeviceUuid();
    if (existingDeviceUuid) {
      setDeviceUuid(existingDeviceUuid);
    }
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let currentDeviceUuid
      const deviceResponse = await authService.createDeviceUuid();
      currentDeviceUuid = deviceResponse.deviceUuid;
      setDeviceUuid(currentDeviceUuid);
      // Store for future use
      localStorageService.setDeviceUuid(currentDeviceUuid);

      // Step 2: Request OTP with the device UUID
      await authService.requestOtp({ email, deviceUuid: currentDeviceUuid });
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Step 3: Verify OTP with the same device UUID
      const tokens = await authService.verifyOtp({
        email,
        deviceUuid, // Use the same device UUID from step 1
        otp: parseInt(otp),
      });
      
      // Store user data for future use (including email for checkout sessions)
      const userData = {
        email,
        userId: tokens.userId,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      
      login(tokens);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
    // Keep the device UUID for retry
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {step === 'email' ? 'Sign In' : 'Verify OTP'}
        </CardTitle>
        <CardDescription className="text-center">
          {step === 'email' 
            ? 'Enter your email to receive an OTP' 
            : `We've sent a verification code to ${email}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 5-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 5))}
                required
                disabled={isLoading}
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 5}>
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBackToEmail}
                disabled={isLoading}
              >
                Back to Email
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function LoginForm() {
  return (
    <AuthProvider>
      <LoginFormContent />
    </AuthProvider>
  );
} 