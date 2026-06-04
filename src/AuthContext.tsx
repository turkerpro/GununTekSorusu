import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  loginAnonymous: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  togglePremium: () => void; // Mock function for premium
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Mock Premium State
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('gts-premium') === 'true';
  });

  const togglePremium = () => {
    const newState = !isPremium;
    setIsPremium(newState);
    localStorage.setItem('gts-premium', String(newState));
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAnonymous = async () => {
    if (!isFirebaseConfigured) {
      alert("Firebase kurulu değil. Mock modda devam ediyorsunuz.");
      setUser({ uid: "mock-anon", isAnonymous: true, displayName: "Anonim Ziyaretçi" } as any);
      return;
    }
    await signInAnonymously(auth);
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      alert("Firebase kurulu değil. Mock modda devam ediyorsunuz.");
      setUser({ uid: "mock-google", isAnonymous: false, displayName: "Mock Kullanıcı", email: "user@example.com" } as any);
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (!isFirebaseConfigured) {
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPremium, loginAnonymous, loginWithGoogle, logout, togglePremium }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
