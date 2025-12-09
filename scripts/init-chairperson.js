/**
 * Script to initialize chairperson settings document
 * Run this script to create the necessary documents for chairperson access
 * 
 * Usage: node scripts/init-chairperson.js <userId>
 * 
 * Example: node scripts/init-chairperson.js XBjPLyG8RRYo0rhQA5Ft7pgfWD83
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../e-rec-system-2025-firebase-adminsdk-fbsvc-acec3f1aa5.json');

if (!require('fs').existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found. Please ensure the Firebase admin SDK JSON file exists.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initChairperson(userId) {
  try {
    console.log(`🔧 Initializing chairperson documents for user: ${userId}`);
    
    // Create rec_settings document
    const recSettingsRef = db.collection('rec_settings').doc(userId);
    const recSettingsDoc = await recSettingsRef.get();
    
    if (!recSettingsDoc.exists) {
      await recSettingsRef.set({
        initialized: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Created rec_settings document');
    } else {
      console.log('ℹ️  rec_settings document already exists');
    }
    
    // Create settings document (alternative)
    const settingsRef = db.collection('settings').doc(userId);
    const settingsDoc = await settingsRef.get();
    
    if (!settingsDoc.exists) {
      await settingsRef.set({
        initialized: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Created settings document');
    } else {
      console.log('ℹ️  settings document already exists');
    }
    
    console.log('✅ Chairperson initialization complete!');
    console.log('📝 The chairperson should now be able to access reviewers collection.');
    
  } catch (error) {
    console.error('❌ Error initializing chairperson:', error);
    process.exit(1);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID as an argument');
  console.log('Usage: node scripts/init-chairperson.js <userId>');
  console.log('Example: node scripts/init-chairperson.js XBjPLyG8RRYo0rhQA5Ft7pgfWD83');
  process.exit(1);
}

initChairperson(userId).then(() => {
  process.exit(0);
});

