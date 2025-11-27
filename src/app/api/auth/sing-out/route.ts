import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Add your sign-out logic here
    
    return NextResponse.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
