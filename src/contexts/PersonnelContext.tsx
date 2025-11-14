
import React, { createContext, useContext } from 'react';
import { useSupabasePersonnel, Personnel } from '@/hooks/useSupabasePersonnel';

interface PersonnelContextType {
  personnel: Personnel[];
  loading: boolean;
  createPersonnel: (data: Omit<Personnel, 'id' | 'created_at' | 'updated_at'>) => Promise<Personnel>;
  updatePersonnel: (id: string, data: Partial<Omit<Personnel, 'id' | 'created_at' | 'updated_at'>>) => Promise<Personnel>;
  deletePersonnel: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const PersonnelContext = createContext<PersonnelContextType | undefined>(undefined);

export const PersonnelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const personnelData = useSupabasePersonnel();

  return (
    <PersonnelContext.Provider value={personnelData}>
      {children}
    </PersonnelContext.Provider>
  );
};

export const usePersonnelContext = () => {
  const context = useContext(PersonnelContext);
  if (context === undefined) {
    throw new Error('usePersonnelContext must be used within a PersonnelProvider');
  }
  return context;
};
