import { db } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ClientMethodTemplate } from '../types/ClientMethodTemplate';

const COLLECTION_NAME = 'namespace-api-template';

export const templateService = {
  async saveTemplate(template: Omit<ClientMethodTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Clean the template data before saving
      const cleanTemplate = {
        ...template,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Remove undefined values from expectedResponse
        expectedResponse: template.expectedResponse ? {
          body: template.expectedResponse.body || null,
          headers: template.expectedResponse.headers || null,
          status: template.expectedResponse.status || null
        } : null,
        // Ensure other fields are not undefined
        queryParams: template.queryParams || [],
        headers: template.headers || [],
        requestBody: template.requestBody || null
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanTemplate);
      return { ...cleanTemplate, id: docRef.id };
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  },

  async getTemplates() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClientMethodTemplate[];
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  },

  async deleteTemplate(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }
}; 