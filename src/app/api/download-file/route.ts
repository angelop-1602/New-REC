import { NextRequest, NextResponse } from 'next/server';
import { getDownloadURL, ref, getStorage } from 'firebase/storage';
import firebaseApp from '@/lib/firebaseConfig';

export async function POST(request: NextRequest) {
  try {
    const { storagePath } = await request.json();
    
    // Validate input
    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json(
        { error: 'Valid storage path is required' },
        { status: 400 }
      );
    }

    // Security check: ensure path is from submissions folder
    if (!storagePath.startsWith('submissions/')) {
      return NextResponse.json(
        { error: 'Invalid storage path' },
        { status: 403 }
      );
    }

    // Get the download URL from Firebase Storage
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, storagePath);
    
    let downloadUrl: string;
    try {
      downloadUrl = await getDownloadURL(storageRef);
    } catch {
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 }
      );
    }
    
    // Fetch the file server-side (bypasses CORS completely)
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'NextJS-Server/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    // Get the file as a buffer
    const fileBuffer = await response.arrayBuffer();
    
    // Return the file data with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': fileBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to download file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}