# Firebase Admin SDK Environment Variables Setup

This guide shows you how to add Firebase Admin SDK credentials to your `.env.local` file.

## Step 1: Extract Values from JSON File

From your Firebase service account JSON file, extract these values:

- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (needs special formatting)

## Step 2: Add to .env.local

Create or update your `.env.local` file in the root of your project with these variables:

```env
# Firebase Admin SDK (Server-side only - NOT public)
# These are used for server-side operations like document preview, file downloads, etc.

FIREBASE_PROJECT_ID=e-rec-system-2025
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@e-rec-system-2025.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC65E39tQHwN80W\n5OmENkFLY1qOmUtP8yWIpK30rdSq4sebdEyfccDNcz5t066m754Bl0j03RqWn74Z\n/CylP7N1URPabhnKP7FvsrqySdv0ndCKh1hmnsQ2AOlEbpyIFzljxgCrQCy4pbo9\nNz+UWNcve8EKIIGrkRoZfaTuGaDs1haRAv0rDl58y22JGzIVmAWRwM+2Irn4N192\n3/Kr7Zq+lgAWRCWc5t+hAr1C9snwtOVzyQOTEy5MGtlFpWuhrRLh655OSn6GDUWm\nlgsqRNm9mm1+HLqLqfGZfKFkgaNGVKpwySi5WjKJPF7RfW/pz2/amc5tIi6hMJ1Y\nipWhBa+LAgMBAAECggEAGRRK/Pk9xdkPHfvg9Dt9npq6C7m5eASWbFRA/b0X9UiS\nZaOBJsJSj59f6MgHv2IXT3pYMXe8Ois8jOsgqJo4QE19fwnYTyIl8unGkOdFa3mE\nAxrve3Hhvad4phS7z61iJ6fp7hEiDzM6Hz3bO9KCKd6PBIdhLz89A9+u8r6gsDc9\nW6gRsIASGK5oJU087n75+hmrjA57/YeVT1a8iKxuk6a0Ou92QAJMAZ6KwLisRzFG\n4G27Lu+NBC02i8X5FOFw2nOmtOWIRlKt3YYR+RB6vtF82BNC6fqVwa+mk3Nst8fE\nzoDMBYwIlMXZgPcGtoFj++QnhKW1SL5C2geyTe49XQKBgQD13Bqt4EFxdhULKFXZ\n3Oh/GSlEDsPDCfHFTP+DSqE0Oc/zgX81wpA+RBt6+1APf5jtNe+YRcEHbPnpCrKj\n28NO9HaOvLuwDWq0u+aR0lJvsuAc99ye8wowNfq5Gsons2MJRUP9r/oDmUsPVaHU\nwySzOkvHA5vD2gSYQ8RG1ryOVQKBgQDCmZc3XMwBkeXDrwT/2puSX9wI8oPjWr6r\n79xkgqxLCYg11tdi/qpKGKQfWxkrtZJ//GTzS36pOucqN0tr+1edxMb0ZNMimcqo\njCQVzRGcM+kPHUtjTKnziSmriMgVpHuEUKGbY0NVHpeLZU/c1bYl3KiTUPrA7YWZ\nsG8lN/tmXwKBgQC6wWTqqyxK+X1mqk78XNempAA6mFSPtOAYFTMKEgh92WRi/f0Z\nYx+ajLWrJ3dbLnuFxLCpJGNKNrdnFB86ZNbpBL2CE08mnipt+0Vbgz3nZyLiHk1R\n2B/nGznGndjta1BRXHIXJDNvxGPF1DBHo6wfEKs7Ezyg+tz+pItVnAxCuQKBgQCP\nTJLyDb+cmFdd1hAUaGKPU0+wtwUv8q7d5e+hhChjyU0oeGB7YZT8o1CYVnkemsKa\nxL2B+2H2NI3tpHJBvgAzCaiIZ4aiwCVgIHKiKzSAlilVG/lb0iSEVcj9q+fLKChc\nsxOOXXZDxBdMavp4YFeVYfwxHzzHvSDYn/f4rFTQeQKBgAKD30NTKYqMNMemYREs\nokGMONzCEomULkBYlfqZPEQCRbguEiGFsNs44s0M9+CHyaxHhxXYUJZVlKHPRMqe\nPG61f3UXFej5U/M0mbB57OghRDrejaLIo8yz+OmPzhJKwSuaPNqK06fmSsGowVb0\nzwkzai/alTs1SZgoEOnMKmeb\n-----END PRIVATE KEY-----"
```

## Important Notes:

1. **Private Key Formatting**: The `FIREBASE_PRIVATE_KEY` must include the `\n` characters as literal newlines. In your `.env.local` file, you can either:
   - Use double quotes and include `\n` (as shown above)
   - Or use actual newlines (but this can be tricky in some editors)

2. **Security**: 
   - Never commit your `.env.local` file to git (it's already in `.gitignore`)
   - Never commit the JSON service account file (also added to `.gitignore`)
   - Keep these credentials secure and private

3. **Verification**: After adding these variables, restart your Next.js development server for the changes to take effect.

## Quick Copy-Paste Template

Here's the exact values from your JSON file ready to paste:

```env
FIREBASE_PROJECT_ID=e-rec-system-2025
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@e-rec-system-2025.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC65E39tQHwN80W\n5OmENkFLY1qOmUtP8yWIpK30rdSq4sebdEyfccDNcz5t066m754Bl0j03RqWn74Z\n/CylP7N1URPabhnKP7FvsrqySdv0ndCKh1hmnsQ2AOlEbpyIFzljxgCrQCy4pbo9\nNz+UWNcve8EKIIGrkRoZfaTuGaDs1haRAv0rDl58y22JGzIVmAWRwM+2Irn4N192\n3/Kr7Zq+lgAWRCWc5t+hAr1C9snwtOVzyQOTEy5MGtlFpWuhrRLh655OSn6GDUWm\nlgsqRNm9mm1+HLqLqfGZfKFkgaNGVKpwySi5WjKJPF7RfW/pz2/amc5tIi6hMJ1Y\nipWhBa+LAgMBAAECggEAGRRK/Pk9xdkPHfvg9Dt9npq6C7m5eASWbFRA/b0X9UiS\nZaOBJsJSj59f6MgHv2IXT3pYMXe8Ois8jOsgqJo4QE19fwnYTyIl8unGkOdFa3mE\nAxrve3Hhvad4phS7z61iJ6fp7hEiDzM6Hz3bO9KCKd6PBIdhLz89A9+u8r6gsDc9\nW6gRsIASGK5oJU087n75+hmrjA57/YeVT1a8iKxuk6a0Ou92QAJMAZ6KwLisRzFG\n4G27Lu+NBC02i8X5FOFw2nOmtOWIRlKt3YYR+RB6vtF82BNC6fqVwa+mk3Nst8fE\nzoDMBYwIlMXZgPcGtoFj++QnhKW1SL5C2geyTe49XQKBgQD13Bqt4EFxdhULKFXZ\n3Oh/GSlEDsPDCfHFTP+DSqE0Oc/zgX81wpA+RBt6+1APf5jtNe+YRcEHbPnpCrKj\n28NO9HaOvLuwDWq0u+aR0lJvsuAc99ye8wowNfq5Gsons2MJRUP9r/oDmUsPVaHU\nwySzOkvHA5vD2gSYQ8RG1ryOVQKBgQDCmZc3XMwBkeXDrwT/2puSX9wI8oPjWr6r\n79xkgqxLCYg11tdi/qpKGKQfWxkrtZJ//GTzS36pOucqN0tr+1edxMb0ZNMimcqo\njCQVzRGcM+kPHUtjTKnziSmriMgVpHuEUKGbY0NVHpeLZU/c1bYl3KiTUPrA7YWZ\nsG8lN/tmXwKBgQC6wWTqqyxK+X1mqk78XNempAA6mFSPtOAYFTMKEgh92WRi/f0Z\nYx+ajLWrJ3dbLnuFxLCpJGNKNrdnFB86ZNbpBL2CE08mnipt+0Vbgz3nZyLiHk1R\n2B/nGznGndjta1BRXHIXJDNvxGPF1DBHo6wfEKs7Ezyg+tz+pItVnAxCuQKBgQCP\nTJLyDb+cmFdd1hAUaGKPU0+wtwUv8q7d5e+hhChjyU0oeGB7YZT8o1CYVnkemsKa\nxL2B+2H2NI3tpHJBvgAzCaiIZ4aiwCVgIHKiKzSAlilVG/lb0iSEVcj9q+fLKChc\nsxOOXXZDxBdMavp4YFeVYfwxHzzHvSDYn/f4rFTQeQKBgAKD30NTKYqMNMemYREs\nokGMONzCEomULkBYlfqZPEQCRbguEiGFsNs44s0M9+CHyaxHhxXYUJZVlKHPRMqe\nPG61f3UXFej5U/M0mbB57OghRDrejaLIo8yz+OmPzhJKwSuaPNqK06fmSsGowVb0\nzwkzai/alTs1SZgoEOnMKmeb\n-----END PRIVATE KEY-----"
```

## Troubleshooting

If you encounter issues:

1. **Private Key Not Working**: Make sure the private key includes the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers
2. **Newline Issues**: If `\n` doesn't work, try using actual line breaks in your `.env.local` file
3. **Restart Required**: Always restart your Next.js dev server after changing environment variables

