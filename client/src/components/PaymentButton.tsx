import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, CreditCard } from 'lucide-react';

interface PaymentButtonProps {
  amount: number;
  purpose: 'plan_upgrade' | 'test_purchase' | 'practice_pack_purchase' | 'subscription' | 'national_test';
  planType?: string;
  testsCount?: number;
  metadata?: Record<string, any>;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  "data-testid"?: string;
  buttonText?: string;
}

// Razorpay window declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentButton({
  amount,
  purpose,
  planType,
  testsCount,
  metadata,
  onSuccess,
  onError,
  children,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  "data-testid": dataTestId,
  buttonText
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load Razorpay script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if already loaded
      if (window.Razorpay) {
        console.log('Razorpay already loaded');
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        resolve(true);
      };
      script.onerror = (error) => {
        console.error('Razorpay script load error:', error);
        resolve(false);
      };
      document.body.appendChild(script);
      console.log('Razorpay script tag added to body');
    });
  };

  const handlePayment = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    
    try {
      // Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load payment system');
      }

      // Create order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          purpose,
          planType,
          testsCount,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderResponse = await response.json();

      if (!orderResponse.order_id) {
        throw new Error('Failed to create payment order');
      }

      // Configure Razorpay options
      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'NEET/JEE Mock Tests',
        description: purpose === 'subscription'
          ? `Subscribe to ${planType} plan`
          : purpose === 'plan_upgrade' 
            ? `Upgrade to ${planType} plan`
            : purpose === 'national_test'
              ? `National Test Registration`
              : `Purchase ${testsCount} test${testsCount !== 1 ? 's' : ''}`,
        order_id: orderResponse.order_id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponseRaw = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            if (!verifyResponseRaw.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyResponse = await verifyResponseRaw.json();

            if (verifyResponse.status === 'paid') {
              toast({
                title: 'Payment Successful!',
                description: purpose === 'subscription'
                  ? `Successfully subscribed to ${planType} plan`
                  : purpose === 'plan_upgrade' 
                    ? `Successfully upgraded to ${planType} plan`
                    : `Successfully purchased ${testsCount} test${testsCount !== 1 ? 's' : ''}`,
              });
              
              // Invalidate relevant queries
              queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
              queryClient.invalidateQueries({ queryKey: ['/api/payments/history'] });
              queryClient.invalidateQueries({ queryKey: ['/api/practice/summary'] });
              
              onSuccess?.(verifyResponse.transaction_id);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
            toast({
              title: 'Payment Verification Failed',
              description: errorMessage,
              variant: 'destructive',
            });
            onError?.(errorMessage);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: 'Student',
          email: 'student@example.com',
        },
        theme: {
          color: 'hsl(var(--primary))',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast({
              title: 'Payment Cancelled',
              description: 'You can try again anytime',
              variant: 'default',
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(errorMessage);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={className}
      data-testid={dataTestId || `button-payment-${purpose}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <CreditCard className="h-4 w-4 mr-2" />
      )}
      {buttonText || children || (loading ? 'Processing...' : `Pay ₹${amount}`)}
    </Button>
  );
}