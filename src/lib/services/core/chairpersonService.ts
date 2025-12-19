import { reviewersManagementService } from '@/lib/services/reviewers/reviewersManagementService';

/**
 * Get current chairperson name from reviewers collection
 * Falls back to "REC Chairperson" if not found
 */
export async function getCurrentChairName(): Promise<string> {
  try {
    const reviewers = await reviewersManagementService.getAllReviewers();
    const chairperson = reviewers.find(r => r.role === 'chairperson' && r.isActive);
    return chairperson?.name || 'REC Chairperson';
  } catch (error) {
    console.error('Error fetching chairperson name:', error);
    return 'REC Chairperson';
  }
}

