import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Shield, Mail, User } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const Login: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, signInWithUsername } = useAuth();
  const navigate = useNavigate();

  const isEmail = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      // First try the appropriate method based on input
      if (isEmail(emailOrUsername)) {
        await signIn(emailOrUsername, password);
      } else {
        // If username login is available, try that first
        if (signInWithUsername) {
          await signInWithUsername(emailOrUsername, password);
        } else {
          // Fallback to email login (might be an email without @)
          await signIn(emailOrUsername, password);
        }
      }

      navigate('/');
    } catch (error: any) {
      // If first attempt failed, try the alternative method
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        try {
          if (isEmail(emailOrUsername)) {
            // If first attempt was with email, try username
            if (signInWithUsername) {
              await signInWithUsername(emailOrUsername, password);
            }
          } else {
            // If first attempt was with username, try email
            await signIn(emailOrUsername, password);
          }
        } catch (secondAttemptError: any) {
          handleAuthError(secondAttemptError);
        }
      } else {
        handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    switch (error.code) {
      case 'auth/user-not-found':
        setError('No account found. Please check credentials or sign up.');
        break;
      case 'auth/wrong-password':
        setError('Incorrect password. Please try again.');
        break;
      case 'auth/invalid-email':
        setError('Invalid email format.');
        break;
      case 'auth/user-disabled':
        setError('Account disabled. Contact support.');
        break;
      case 'auth/too-many-requests':
        setError('Too many attempts. Try again later.');
        break;
      case 'auth/network-request-failed':
        setError('Network error. Check connection.');
        break;
      default:
        setError('Login failed. Check credentials.');
        console.error('Login error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      setError('Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const getInputProps = () => {
    const isEmailInput = isEmail(emailOrUsername);

    return {
      placeholder: 'Enter email or username',
      icon: isEmailInput ? (
        <Mail className="h-4 w-4 text-blue-500" />
      ) : (
        <User className="h-4 w-4 text-green-500" />
      )
    };
  };

  const inputProps = getInputProps();

  return (
    <Layout>
      <div className="flex justify-center items-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your ScamShield account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">Email or Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {emailOrUsername ? inputProps.icon : <User className="h-4 w-4 text-gray-400" />}
                  </div>
                  <Input
                    id="emailOrUsername"
                    type="text"
                    placeholder={inputProps.placeholder}
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {emailOrUsername && (
                  <div className="text-xs mt-1">
                    {isEmail(emailOrUsername) ? (
                      <span className="text-blue-600 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email format detected
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1">
                        <User className="h-3 w-3" /> Username format detected
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" fill="none">
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
                  c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4
                  C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12
                  c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238
                  C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303
                  c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24
                  C44,22.659,43.862,21.35,43.611,20.083z"
                />
              </svg>
              Sign in with Google
            </Button>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;