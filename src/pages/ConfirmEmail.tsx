import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { applyActionCode } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const oobCode = searchParams.get('oobCode');
      if (!oobCode) {
        setError('Invalid or missing verification code');
        setLoading(false);
        return;
      }

      try {
        await applyActionCode(auth, oobCode);
        const user = auth.currentUser;
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            isVerified: true,
          });
          setMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => navigate('/sign-in'), 3000);
        } else {
          setError('No user is signed in');
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        setError(err.message || 'Failed to verify email');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <Layout>
      <div className="flex justify-center items-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p>Verifying your email...</p>}
            {message && (
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {!loading && !error && (
              <Button onClick={() => navigate('/sign-in')} className="mt-4">
                Go to Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ConfirmEmail;