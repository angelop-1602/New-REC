import { NextResponse } from 'next/server';
import { initializeSampleReviewers } from '@/lib/services/reviewerService';

export async function GET() {
  try {
    await initializeSampleReviewers();
    return NextResponse.json({ 
      success: true, 
      message: 'Sample reviewers initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing reviewers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize reviewers' 
      },
      { status: 500 }
    );
  }
}
