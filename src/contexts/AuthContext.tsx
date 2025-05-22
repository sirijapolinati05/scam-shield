
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import { app, auth } from '../lib/firebase';
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Use session persistence to avoid token refresh issues during development
      await setPersistence(auth, browserSessionPersistence);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: username
        });
        setCurrentUser({
          ...auth.currentUser,
          displayName: username
        });
      }
      toast({
        title: "Account created!",
        description: "Welcome to ScamShield!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Use session persistence to avoid token refresh issues during development
      await setPersistence(auth, browserSessionPersistence);
      
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Use session persistence to avoid token refresh issues during development
      await setPersistence(auth, browserSessionPersistence);
      
      const provider = new GoogleAuthProvider();
      // Add custom parameters to the Google provider
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      await signInWithPopup(auth, provider);
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google.",
      });
    } catch (error: any) {
      console.error("Google sign in error:", error);
      const errorCode = error.code;
      let errorMessage = error.message;
      
      // Provide more specific error messages
      if (errorCode === 'auth/unauthorised-domain') {
        errorMessage = 'This domain is not authorized for authentication. Please update your Firebase console settings.';
      }
      
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: errorMessage,
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
