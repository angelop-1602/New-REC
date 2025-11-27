import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import firebaseApp from '@/lib/firebaseConfig';
import JSZip from 'jszip';

const storage = getStorage(firebaseApp);

export async function POST(request: NextRequest) {
  try {
    const { documentId, fileName } = await request.json();
    
    if (!documentId || !fileName) {
      return NextResponse.json({ 
        error: 'Document ID and file name are required' 
      }, { status: 400 });
    }

    // Get document reference from Firebase Storage
    const documentRef = ref(storage, `documents/${documentId}`);
    
    // Get download URL
    const downloadURL = await getDownloadURL(documentRef);
    
    // Fetch the ZIP file from Firebase Storage
    const response = await fetch(downloadURL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ZIP file: ${response.statusText}`);
    }

    // Get ZIP file content
    const zipBuffer = await response.arrayBuffer();
    
    // Extract the specific file from ZIP
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);
    
    const file = zipContent.file(fileName);
    
    if (!file) {
      return NextResponse.json({ 
        error: `File '${fileName}' not found in ZIP` 
      }, { status: 404 });
    }

    // Get file content
    const fileContent = await file.async('arraybuffer');
    
    // Determine content type based on file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (fileExtension) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'txt':
        contentType = 'text/plain';
        break;
      case 'md':
        contentType = 'text/markdown';
        break;
      case 'json':
        contentType = 'application/json';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'doc':
        contentType = 'application/msword';
        break;
      case 'xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'xls':
        contentType = 'application/vnd.ms-excel';
        break;
      case 'pptx':
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      case 'ppt':
        contentType = 'application/vnd.ms-powerpoint';
        break;
    }

    // Return the extracted file with proper headers
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error extracting file from ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to extract file from ZIP' },
      { status: 500 }
    );
  }
}
