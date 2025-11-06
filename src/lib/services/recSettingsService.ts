import firebaseApp from '@/lib/firebaseConfig';
import { getFirestore } from 'firebase/firestore';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { 
  RECSettings, 
  RECLineup, 
  RECMember, 
  CreateRECMemberRequest,
  UpdateRECLineupRequest 
} from '@/types/rec-settings.types';

const db = getFirestore(firebaseApp);

const REC_SETTINGS_COLLECTION = 'rec_settings';
const REC_MEMBERS_COLLECTION = 'rec_members';
const REC_LINEUPS_COLLECTION = 'rec_lineups';

class RECSettingsService {
  /**
   * Get current REC settings
   */
  async getCurrentSettings(): Promise<RECSettings | null> {
    try {
      const settingsRef = doc(db, REC_SETTINGS_COLLECTION, 'current');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        return {
          id: settingsSnap.id,
          ...settingsSnap.data()
        } as RECSettings;
      }
      return null;
    } catch (error) {
      console.error('Error fetching REC settings:', error);
      return null;
    }
  }

  /**
   * Get current REC chair name
   */
  async getCurrentChairName(): Promise<string> {
    try {
      const settings = await this.getCurrentSettings();
      return settings?.currentLineup?.chair?.name || 'REC Chairperson';
    } catch (error) {
      console.error('Error fetching chair name:', error);
      return 'REC Chairperson';
    }
  }

  /**
   * Get all REC members
   */
  async getAllMembers(): Promise<RECMember[]> {
    try {
      const membersRef = collection(db, REC_MEMBERS_COLLECTION);
      const q = query(membersRef, where('isActive', '==', true), orderBy('name'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RECMember));
    } catch (error) {
      console.error('Error fetching REC members:', error);
      return [];
    }
  }

  /**
   * Create a new REC member
   */
  async createMember(memberData: CreateRECMemberRequest, createdBy: string): Promise<string | null> {
    try {
      const memberRef = doc(collection(db, REC_MEMBERS_COLLECTION));
      const member: Omit<RECMember, 'id'> = {
        ...memberData,
        isActive: true,
        appointedAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(memberRef, member);
      return memberRef.id;
    } catch (error) {
      console.error('Error creating REC member:', error);
      return null;
    }
  }

  /**
   * Update REC member
   */
  async updateMember(memberId: string, updates: Partial<CreateRECMemberRequest>): Promise<boolean> {
    try {
      const memberRef = doc(db, REC_MEMBERS_COLLECTION, memberId);
      await updateDoc(memberRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating REC member:', error);
      return false;
    }
  }

  /**
   * Get current lineup
   */
  async getCurrentLineup(): Promise<RECLineup | null> {
    try {
      const settings = await this.getCurrentSettings();
      return settings?.currentLineup || null;
    } catch (error) {
      console.error('Error fetching current lineup:', error);
      return null;
    }
  }

  /**
   * Update REC lineup
   */
  async updateLineup(updates: UpdateRECLineupRequest, updatedBy: string): Promise<boolean> {
    try {
      const allMembers = await this.getAllMembers();
      const memberMap = new Map(allMembers.map(m => [m.id, m]));

      // Build new lineup
      const newLineup: Omit<RECLineup, 'id'> = {
        chair: updates.chairId ? memberMap.get(updates.chairId)! : {} as RECMember,
        viceChair: updates.viceChairId ? memberMap.get(updates.viceChairId)! : {} as RECMember,
        secretary: updates.secretaryId ? memberMap.get(updates.secretaryId)! : {} as RECMember,
        staff: updates.staffIds?.map(id => memberMap.get(id)!).filter(Boolean) || [],
        members: updates.memberIds?.map(id => memberMap.get(id)!).filter(Boolean) || [],
        isActive: true,
        effectiveDate: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        createdBy: updatedBy
      };

      // Save lineup
      const lineupRef = doc(collection(db, REC_LINEUPS_COLLECTION));
      await setDoc(lineupRef, newLineup);

      // Update settings to point to new lineup
      const settingsRef = doc(db, REC_SETTINGS_COLLECTION, 'current');
      const currentSettings = await this.getCurrentSettings();

      const updatedSettings: Partial<RECSettings> = {
        currentLineup: {
          id: lineupRef.id,
          ...newLineup
        } as RECLineup,
        updatedAt: serverTimestamp() as Timestamp,
        updatedBy: updatedBy
      };

      if (currentSettings) {
        await updateDoc(settingsRef, updatedSettings);
      } else {
        // Create initial settings
        const initialSettings: Omit<RECSettings, 'id'> = {
          currentLineup: {
            id: lineupRef.id,
            ...newLineup
          } as RECLineup,
          institutionName: 'St. Paul University Philippines',
          defaultDurationApproval: '1 year',
          documentTemplates: {},
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          updatedBy: updatedBy
        };
        await setDoc(settingsRef, initialSettings);
      }

      return true;
    } catch (error) {
      console.error('Error updating REC lineup:', error);
      return false;
    }
  }

  /**
   * Initialize default settings and sample members
   */
  async initializeDefaultSettings(createdBy: string): Promise<boolean> {
    try {
      // Create sample REC members
      const sampleMembers: CreateRECMemberRequest[] = [
        {
          name: 'Dr. Maria Elena Santos',
          email: 'maria.santos@spup.edu.ph',
          position: 'REC Chairperson',
          department: 'Research Ethics Committee'
        },
        {
          name: 'Dr. Robert Cruz',
          email: 'robert.cruz@spup.edu.ph', 
          position: 'REC Vice Chairperson',
          department: 'Research Ethics Committee'
        },
        {
          name: 'Ms. Angela Torres',
          email: 'angela.torres@spup.edu.ph',
          position: 'REC Secretary',
          department: 'Research Ethics Committee'
        },
        {
          name: 'Mr. John Reyes',
          email: 'john.reyes@spup.edu.ph',
          position: 'REC Staff',
          department: 'Research Ethics Committee'
        },
        {
          name: 'Dr. Elena Garcia',
          email: 'elena.garcia@spup.edu.ph',
          position: 'REC Member',
          department: 'Medical Ethics'
        },
        {
          name: 'Dr. Michael Lim',
          email: 'michael.lim@spup.edu.ph',
          position: 'REC Member', 
          department: 'Social Sciences'
        }
      ];

      // Create members
      const memberIds: string[] = [];
      for (const memberData of sampleMembers) {
        const memberId = await this.createMember(memberData, createdBy);
        if (memberId) {
          memberIds.push(memberId);
        }
      }

      // Set up initial lineup
      if (memberIds.length >= 6) {
        await this.updateLineup({
          chairId: memberIds[0],      // Dr. Maria Elena Santos
          viceChairId: memberIds[1],  // Dr. Robert Cruz
          secretaryId: memberIds[2],  // Ms. Angela Torres
          staffIds: [memberIds[3]],   // Mr. John Reyes
          memberIds: [memberIds[4], memberIds[5]] // Dr. Elena Garcia, Dr. Michael Lim
        }, createdBy);
      }

      return true;
    } catch (error) {
      console.error('Error initializing default settings:', error);
      return false;
    }
  }

  /**
   * Update institution settings
   */
  async updateInstitutionSettings(updates: {
    institutionName?: string;
    institutionAddress?: string;
    contactEmail?: string;
    contactPhone?: string;
  }, updatedBy: string): Promise<boolean> {
    try {
      const settingsRef = doc(db, REC_SETTINGS_COLLECTION, 'current');
      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: updatedBy
      });
      return true;
    } catch (error) {
      console.error('Error updating institution settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export const recSettingsService = new RECSettingsService();

// Export utility functions
export const getCurrentChairName = recSettingsService.getCurrentChairName.bind(recSettingsService);
export const getCurrentSettings = recSettingsService.getCurrentSettings.bind(recSettingsService);
export const initializeDefaultSettings = recSettingsService.initializeDefaultSettings.bind(recSettingsService);
