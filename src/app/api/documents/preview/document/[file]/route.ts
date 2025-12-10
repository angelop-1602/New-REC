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
    
    // Fix private key formatting (replace escaped newlines)
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    const serviceAccount: ServiceAccount = {
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: formattedPrivateKey,
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
  // Declare here for catch logging
  let filename = '';
  let submissionId: string | null = null;
  let storagePath: string | null = null;
  let storageFile: any | null = null;
  try {
    const { file: fileParam } = await params;
    filename = fileParam;
    const { searchParams } = new URL(request.url);
    submissionId = searchParams.get('submissionId');
    const entry = searchParams.get('entry');
    const auto = searchParams.get('auto');
    storagePath = searchParams.get('storagePath'); // Prefer explicit storagePath
    
    // If storagePath is provided, we can fetch directly via public download URL without admin
    if (storagePath) {
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      if (!bucketName) {
        return NextResponse.json(
          { error: 'Storage bucket not configured', details: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is missing' },
          { status: 500 }
        );
      }
      
      // Build public download URL
      const decodedPath = (() => {
        try { return decodeURIComponent(storagePath); } catch { return storagePath; }
      })();
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(decodedPath)}?alt=media`;
      
      try {
        // Fetch the file from Firebase Storage
        const resp = await fetch(downloadUrl);
        if (!resp.ok) {
          return NextResponse.json({ 
            error: 'Failed to fetch file', 
            details: `${resp.status} ${resp.statusText}`,
            storagePath: decodedPath
          }, { status: resp.status });
        }
        
        const fileBuffer = await resp.arrayBuffer();
        const isZip = filename.toLowerCase().endsWith('.zip') || resp.headers.get('content-type')?.includes('zip');
        
        // If not a ZIP file, stream directly
        if (!isZip) {
          const contentType = resp.headers.get('content-type') || guessMime(filename);
          return new NextResponse(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': 'inline',
              'Cache-Control': 'private, max-age=600',
            },
          });
        }
        
        // Handle ZIP files - extract and return previewable content
        const zip = await JSZip.loadAsync(fileBuffer);
        
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
        
      } catch (err) {
        console.error('Error fetching/processing file via storagePath:', err);
        return NextResponse.json(
          { 
            error: 'Failed to process file',
            details: err instanceof Error ? err.message : 'Unknown error',
            storagePath: decodedPath
          },
          { status: 500 }
        );
      }
    }
    
    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }
    
    // Initialize Firebase Admin SDK (fallback when direct fetch fails or for ZIP)
    let adminApp;
    try {
      adminApp = initializeFirebaseAdmin();
    } catch (initError) {
      console.error('Failed to initialize Firebase Admin:', initError);
      return NextResponse.json(
        { 
          error: 'Failed to initialize storage service',
          details: initError instanceof Error ? initError.message : 'Unknown initialization error'
        },
        { status: 500 }
      );
    }
    
    const storage = getStorage(adminApp);
    
    // Get file from Firebase Storage
    const bucket = storage.bucket();
    
    if (!bucket) {
      return NextResponse.json(
        { error: 'Storage bucket not available' },
        { status: 500 }
      );
    }
    let file;
    let [exists] = [false];
    let actualStoragePath = '';
    
    // If storagePath is provided, use it directly
    if (storagePath) {
      // Decode URL-encoded storage path
      try {
        actualStoragePath = decodeURIComponent(storagePath);
      } catch {
        actualStoragePath = storagePath;
      }
      
      storageFile = bucket.file(actualStoragePath);
      [exists] = await storageFile.exists();
      
      // If not found with decoded path, try original
      if (!exists && actualStoragePath !== storagePath) {
        storageFile = bucket.file(storagePath);
        [exists] = await storageFile.exists();
        if (exists) {
          actualStoragePath = storagePath;
        }
      }
    }
    
    // If still not found, try different path formats
    if (!exists) {
      const possiblePaths = [
        `submissions/${submissionId}/documents/${filename}`, // Old format: submissions/{id}/documents/{filename}
      ];
      
      // Try each possible path
      for (const path of possiblePaths) {
        try {
        storageFile = bucket.file(path);
        [exists] = await storageFile.exists();
          if (exists) {
            actualStoragePath = path;
            break;
          }
        } catch (pathError) {
          console.warn(`Error checking path ${path}:`, pathError);
          continue;
        }
      }
    }
    
    if (!exists) {
      console.error('File not found. Tried paths:', {
        storagePath,
        decodedStoragePath: storagePath ? (() => {
          try {
            return decodeURIComponent(storagePath);
          } catch {
            return storagePath;
          }
        })() : null,
        fallback: `submissions/${submissionId}/documents/${filename}`,
        filename,
        submissionId
      });
      return NextResponse.json({ 
        error: 'File not found',
        details: `Could not find file: ${filename}`,
        triedPaths: storagePath ? [
          storagePath, 
          (() => {
            try {
              return decodeURIComponent(storagePath);
            } catch {
              return storagePath;
            }
          })(),
          `submissions/${submissionId}/documents/${filename}`
        ] : [`submissions/${submissionId}/documents/${filename}`]
      }, { status: 404 });
    }
    
    if (!file) {
      return NextResponse.json(
        { error: 'File reference missing after lookup', details: actualStoragePath },
        { status: 500 }
      );
    }
    
    // Get file metadata
    const [metadata] = await storageFile.getMetadata();
    const contentType = metadata.contentType || guessMime(filename);
    
    // Check if it's a ZIP file
    const isZip = filename.toLowerCase().endsWith('.zip') || contentType === 'application/zip';
    
    if (!isZip) {
      // For non-ZIP files, stream directly
      const [fileBuffer] = await storageFile.download();
      
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
    let zipBuffer: Buffer;
    try {
      [zipBuffer] = await storageFile.download();
    } catch (downloadError) {
      console.error('Failed to download file from storage:', downloadError);
      return NextResponse.json(
        { 
          error: 'Failed to download file',
          details: downloadError instanceof Error ? downloadError.message : 'Unknown download error',
          storagePath: actualStoragePath
        },
        { status: 500 }
      );
    }
    
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(zipBuffer);
    } catch (zipError) {
      console.error('Failed to load ZIP file:', zipError);
      return NextResponse.json(
        { 
          error: 'Invalid ZIP file',
          details: zipError instanceof Error ? zipError.message : 'Unknown ZIP error'
        },
        { status: 500 }
      );
    }
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log more details for debugging
    console.error('Preview API Error Details:', {
      message: errorMessage,
      stack: errorStack,
      filename,
      submissionId,
      storagePath,
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {})
      },
      { status: 500 }
    );
  }
}

