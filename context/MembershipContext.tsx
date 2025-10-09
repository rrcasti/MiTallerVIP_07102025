// Ruta: context/MembershipContext.tsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth } from '../firebase/config';
import { getUserActiveMembership } from '../services/membershipService';

const MembershipContext = createContext(null);

export const MembershipProvider = ({ children }) => {
  const [membership, setMembership] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembership = useCallback(async (user) => {
    if (user) {
      setIsLoading(true);
      const activeMembership = await getUserActiveMembership(user.uid);
      setMembership(activeMembership);
      setIsLoading(false);
    } else {
      setMembership(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(fetchMembership);
    return () => unsubscribe();
  }, [fetchMembership]);

  const refreshMembership = () => {
    fetchMembership(auth.currentUser);
  };
  
  return (
    <MembershipContext.Provider value={{ membership, isLoading, refreshMembership }}>
      {children}
    </MembershipContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
export const useMembership = () => {
  return useContext(MembershipContext);
};