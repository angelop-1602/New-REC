# Environment Variables Setup for AI Reviewer

**Note**: This document is kept for future reference. The AI Reviewer feature has been removed from the codebase for now, but this documentation will be useful when learning how to integrate it.

This document lists all the environment variables needed for the AI Reviewer functionality.

## Required Environment Variables

### Firebase Configuration (Already Set Up)

These should already be in your `.env.local` file:

```env
# Firebase Client SDK (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (Server-side only - NOT public)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
```

### New Environment Variables for AI Reviewer

Add these to your `.env.local` file:

```env
# HuggingFace API Configuration
NEXT_PUBLIC_HUGGINGFACE_API_KEY=your_huggingface_api_key
NEXT_PUBLIC_HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.3

# Optional: Custom model endpoint (if using a different model)
# NEXT_PUBLIC_HUGGINGFACE_MODEL_ENDPOINT=https://api-inference.huggingface.co/models
```

## Firebase Cloud Functions Configuration

For Cloud Functions, you'll need to set these using Firebase CLI:

```bash
# Set HuggingFace API key in Firebase Functions config
firebase functions:config:set hf.api_key="your_huggingface_api_key"

# Set the model name (optional, defaults to Mistral)
firebase functions:config:set hf.model="mistralai/Mistral-7B-Instruct-v0.2"
```

Or if using environment variables in Firebase Functions (recommended for newer projects):

Add to `functions/.env` (if using dotenv) or set in Firebase Console:
- `HF_API_KEY=your_huggingface_api_key`
- `HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2`

## Getting Your HuggingFace API Key

1. Go to [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. Create a new token with "Read" permissions
3. Copy the token and add it to your environment variables

## Environment Variables Summary

### Client-Side (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_HUGGINGFACE_API_KEY` - For direct client-side API calls (if needed)
- `NEXT_PUBLIC_HUGGINGFACE_MODEL` - Model identifier

### Server-Side (Cloud Functions)
- `HF_API_KEY` - HuggingFace API key (set via Firebase Functions config)
- `HF_MODEL` - Model identifier (set via Firebase Functions config)

## Testing

After setting up environment variables:

1. Restart your Next.js development server
2. Navigate to `/rec/chairperson/ai-reviewer-test`
3. Upload a test protocol document
4. Click "Run AI Review" to test the functionality

## Security Notes

- **Never commit `.env.local` to version control**
- Keep your HuggingFace API key secure
- Use Firebase Functions config for server-side secrets (not client-side env vars)
- The `NEXT_PUBLIC_*` prefix makes variables available to the browser - only use for non-sensitive config

## Troubleshooting

### "Missing Firebase configuration keys" warning
- Make sure all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`
- Restart your development server after adding variables

### "AI review failed" error
- Check that Cloud Functions are deployed
- Verify HuggingFace API key is correct
- Check Firebase Functions logs: `firebase functions:log`

### "Upload failed" error
- Verify Firebase Storage is enabled in your Firebase project
- Check Storage security rules allow uploads
- Ensure `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set correctly

