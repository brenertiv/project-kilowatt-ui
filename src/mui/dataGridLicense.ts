import { LicenseInfo } from '@mui/x-license';

// List view and tree data need MUI X's Pro plan. The key comes from .env.local (see .env.example); without it the
// grid still works, under MUI's "Missing license key" watermark. MUI checks the key in the browser, so it ships in the bundle.
const license = import.meta.env.VITE_MUI_X_LICENSE;
if (license) LicenseInfo.setLicenseKey(license);
