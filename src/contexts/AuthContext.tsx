import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  setPersistence,
  sendEmailVerification,
} from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    additionalData: { dob: string; gender: string }
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithUsername: (username: string, password: string) => Promise<void>;
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

  const signUp = async (
    email: string,
    password: string,
    username: string,
    additionalData: { dob: string; gender: string }
  ) => {
    try {
      if (!username || username.trim() === '') {
        const error: any = new Error('Username is required.');
        error.code = 'invalid-username';
        throw error;
      }

      const q = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const error: any = new Error('This username already exists.');
        error.code = 'username-already-exists';
        throw error;
      }

      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: username });
        setCurrentUser({ ...auth.currentUser, displayName: username });

        await sendEmailVerification(auth.currentUser, {
          url: 'http://localhost:3000/confirm',
          handleCodeInApp: true,
        });
        console.log('Verification email sent to:', email);

        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          username,
          email,
          uid: auth.currentUser.uid,
          dob: additionalData.dob,
          gender: additionalData.gender,
          isVerified: false,
          createdAt: new Date(),
        });

        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
        });
      } else {
        throw new Error('User not found after signup.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description:
          error.code === 'username-already-exists'
            ? 'This username already exists.'
            : error.code === 'auth/email-already-in-use'
            ? 'This email is already registered.'
            : error.code === 'auth/invalid-email'
            ? 'Invalid email address.'
            : error.message || 'Failed to create an account.',
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.',
      });
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error.message || 'Error signing in.',
      });
      throw error;
    }
  };

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      console.log('📛 Username:', username);
      console.log('📄 Found users:', querySnapshot.docs.length);

      if (querySnapshot.empty) {
        throw new Error('No user found with that username.');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const email = userData.email;

      if (!email) throw new Error('Email not found for this username.');

      await signIn(email, password);
    } catch (error: any) {
      console.error('Username sign-in error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error.message || 'Error signing in with username.',
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await setPersistence(auth, browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Generate a unique username
        let baseUsername = user.displayName
          ? user.displayName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
          : user.email?.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || `user_${user.uid.slice(0, 8)}`;
        
        let username = baseUsername;
        let counter = 1;
        while (true) {
          const q = query(collection(db, 'users'), where('username', '==', username));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) break;
          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Update Firebase Auth profile
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: username });
          setCurrentUser({ ...auth.currentUser, displayName: username });

          // Create user document in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            username,
            email: user.email || '',
            uid: user.uid,
            dob: '',
            gender: '',
            isVerified: user.emailVerified || false,
            createdAt: new Date(),
          });

          // Send email verification
          await sendEmailVerification(auth.currentUser, {
            url: 'http://localhost:3000/confirm',
            handleCodeInApp: true,
          });
          console.log('Verification email sent to:', user.email);

          toast({
            title: 'Account created!',
            description: 'Please check your email to verify your account.',
          });
        } else {
          throw new Error('User not found after Google sign-in.');
        }
      } else {
        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in with Google.',
        });
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: error.message || 'Failed to sign in with Google.',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error: any) {
      console.error('Sign-out error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign out failed',
        description: error.message || 'Error signing out.',
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithUsername,
    signInWithGoogle,
    signOut,
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
