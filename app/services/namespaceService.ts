import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { Namespace, NamespaceAccount, NamespaceMethod } from '../types/namespace';

export const namespaceService = {
  async getNamespaces(): Promise<Namespace[]> {
    const querySnapshot = await getDocs(collection(db, 'namespace'));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        'namespace-id': doc.id,
        'namespace-name': data['namespace-name'] || '',
        'namespace-url': data['namespace-url'] || ''
      } satisfies Namespace;
    });
  },

  async getNamespaceAccounts(namespaceId: string): Promise<NamespaceAccount[]> {
    const q = query(collection(db, 'namespace-account'), where('namespace-id', '==', namespaceId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NamespaceAccount));
  },

  async getNamespaceMethods(namespaceId: string): Promise<NamespaceMethod[]> {
    const q = query(
      collection(db, 'namespace-account-method'), 
      where('namespace-id', '==', namespaceId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NamespaceMethod));
  },

  async createNamespace(data: Omit<Namespace, 'namespace-id'>): Promise<void> {
    await addDoc(collection(db, 'namespace'), data);
  },

  async createNamespaceAccount(data: Omit<NamespaceAccount, 'namespace-account-id'>): Promise<void> {
    await addDoc(collection(db, 'namespace-account'), data);
  },

  async createNamespaceMethod(data: Omit<NamespaceMethod, 'namespace-account-method-id'>): Promise<void> {
    await addDoc(collection(db, 'namespace-account-method'), data);
  },

  async deleteNamespace(id: string): Promise<void> {
    await deleteDoc(doc(db, 'namespace', id));
  },

  async deleteNamespaceAccount(id: string): Promise<void> {
    await deleteDoc(doc(db, 'namespace-account', id));
  },

  async deleteNamespaceMethod(id: string): Promise<void> {
    await deleteDoc(doc(db, 'namespace-account-method', id));
  },

  async getNamespaceAccount(namespaceId: string): Promise<NamespaceAccount | null> {
    const accounts = await this.getNamespaceAccounts(namespaceId);
    return accounts[0] || null;
  },

  async getNamespace(namespaceId: string): Promise<Namespace | null> {
    const docRef = doc(db, 'namespace', namespaceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Namespace;
    }
    
    return null;
  }
}; 