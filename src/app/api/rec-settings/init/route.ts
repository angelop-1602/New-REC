import { NextResponse } from 'next/server';
import { initializeDefaultSettings } from '@/lib/services/recSettingsService';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const success = await initializeDefaultSettings(userId);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'REC settings initialized successfully' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to initialize settings' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error initializing REC settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
