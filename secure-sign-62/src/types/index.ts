export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  publicKey: string;
  privateKey: string;
  biometricSetup: boolean;
  role?: 'student' | 'institution';
  biometricType?: 'fingerprint' | 'face';
  walletAddress?: string | null;
  walletPublicKey?: string | null;

}

export interface Signer {
  id: string;
  name: string;
  publicKey: string;
  deadline?: string;
  status: 'pending' | 'signed' | 'expired';
  signedAt?: string;
  role?: 'student' | 'institution';
  order?: number;
  color: 'signer-1' | 'signer-2' | 'signer-3' | 'signer-4';
  position?: { x: number; y: number };
}

export interface Document {
  id: string;
  name: string;
  file: File;
  type: 'self' | 'sequential' | 'parallel';
  signers: Signer[];
  status: 'draft' | 'pending' | 'completed' | 'expired';
  createdAt: string;
  createdBy: string;
}

export type SigningType = 'self' | 'sequential' | 'parallel';
