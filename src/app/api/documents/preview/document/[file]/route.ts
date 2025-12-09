import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import JSZip from 'jszip';

// JSZip needs Node.js runtime
export const runtime = 'nodejs';

// Initialize Firebase Admin SDK function
function initializeFirebaseAdmin() {
  try {
    // Try to get existing app
    const existingApp = getApps().find(app => app.name === '[DEFAULT]');
    
    if (existingApp) {
      return existingApp;
    }
    
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is required');
    }
    
    if (!clientEmail) {
      throw new Error('FIREBASE_CLIENT_EMAIL environment variable is required');
    }
    
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY environment variable is required');
    }
    
    if (!storageBucket) {
      throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is required');
    }
    
    const serviceAccount: ServiceAccount = {
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey,
    };
    
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: storageBucket,
    });
    return app;
  } catch (initError) {
    console.error('Firebase Admin SDK initialization failed:', initError);
    throw initError;
  }
}

// Helper function to guess MIME type from filename
function guessMime(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  const mimeTypes: Record<string, string> = {
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    
    // Documents
    'pdf': 'application/pdf',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Helper function to check if file is previewable
function isPreviewable(filename: string): boolean {
  return /\.(pdf|png|jpe?g|webp|gif)$/i.test(filename);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  try {
    const { file: filename } = await params;
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const entry = searchParams.get('entry');
    const auto = searchParams.get('auto');
    const storagePath = searchParams.get('storagePath'); // New parameter for direct storage path
    
    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }
    
    // Initialize Firebase Admin SDK
    const adminApp = initializeFirebaseAdmin();
    const storage = getStorage(adminApp);
    
    // Get file from Firebase Storage
    const bucket = storage.bucket();
    let file;
    let [exists] = [false];
    
    // If storagePath is provided, use it directly
    if (storagePath) {
      file = bucket.file(storagePath);
      [exists] = await file.exists();
    } else {
      // Fallback to constructing path from filename
      // All documents are now stored in submissions collection
      const storagePath = `submissions/${submissionId}/documents/${filename}`;
      
      file = bucket.file(storagePath);
      [exists] = await file.exists();
    }
    
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Get file metadata
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || guessMime(filename);
    
    // Check if it's a ZIP file
    const isZip = filename.toLowerCase().endsWith('.zip') || contentType === 'application/zip';
    
    if (!isZip) {
      // For non-ZIP files, stream directly
      const [fileBuffer] = await file.download();
      
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, max-age=600',
        },
      });
    }
    
    // Handle ZIP files
    const [zipBuffer] = await file.download();
    const zip = await JSZip.loadAsync(zipBuffer);
    
    if (entry) {
      // Specific entry requested
      const zipEntry = zip.file(entry);
      if (!zipEntry) {
        return NextResponse.json({ error: 'Entry not found in ZIP' }, { status: 404 });
      }
      
      const entryContent = await zipEntry.async('nodebuffer');
      const entryMime = guessMime(entry);
      
      return new NextResponse(new Uint8Array(entryContent), {
        status: 200,
        headers: {
          'Content-Type': entryMime,
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, max-age=600',
          'X-Preview-Entry': encodeURIComponent(entry),
        },
      });
    }
    
    if (auto === '1') {
      // Auto-pick first previewable file
      const entries = Object.keys(zip.files);
      const previewableEntry = entries.find(entryName => {
        const file = zip.file(entryName);
        return file && !file.dir && isPreviewable(entryName);
      });
      
      if (!previewableEntry) {
        return NextResponse.json({ error: 'No previewable files found in ZIP' }, { status: 404 });
      }
      
      const zipEntry = zip.file(previewableEntry);
      if (!zipEntry) {
        return NextResponse.json({ error: 'Failed to extract entry' }, { status: 500 });
      }
      
      const entryContent = await zipEntry.async('nodebuffer');
      const entryMime = guessMime(previewableEntry);
      
      return new NextResponse(new Uint8Array(entryContent), {
        status: 200,
        headers: {
          'Content-Type': entryMime,
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, max-age=600',
          'X-Preview-Entry': encodeURIComponent(previewableEntry),
        },
      });
    }
    
    // Return list of entries for ZIP without parameters
    const entries = Object.keys(zip.files)
      .filter(entryName => {
        const file = zip.file(entryName);
        return file && !file.dir;
      })
      .map(entryName => entryName);
    
    return NextResponse.json({
      error: 'ZIP entry required',
      entries,
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in preview API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

