import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    const fileName = searchParams.get('fileName');
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // If fileName is provided, this is a ZIP extraction request
    if (fileName) {
      // Redirect to extract endpoint
      return NextResponse.redirect(
        new URL(`/api/documents/preview/extract?documentId=${documentId}&fileName=${encodeURIComponent(fileName)}`, request.url)
      );
    }

    // For direct document preview, redirect to document endpoint
    return NextResponse.redirect(
      new URL(`/api/documents/preview/document/${documentId}`, request.url)
    );

  } catch (error) {
    console.error('Error in preview route:', error);
    return NextResponse.json(
      { error: 'Failed to process preview request' },
      { status: 500 }
    );
  }
}
