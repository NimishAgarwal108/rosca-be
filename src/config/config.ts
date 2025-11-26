import dotenv from 'dotenv';
dotenv.config(); // Load .env variables

interface AppConfig {
  port: number;
  env: string;
  name: string;
}

interface DBConfig {
  uri: string;
}

interface EmailConfig {
  user: string;
  pass: string;
  apiKey?: string;
}

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface SecurityConfig {
  bcryptSaltRounds: number;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
}

interface LoggingConfig {
  level: string;
  nodeEnv: string;
  appName: string;
}

// New: Google OAuth Config
interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

interface Config {
  app: AppConfig;
  db: DBConfig;
  email: EmailConfig;
  cloudinary: CloudinaryConfig;
  security: SecurityConfig;
  jwt: JWTConfig;
  logging: LoggingConfig;
  googleOAuth: GoogleOAuthConfig; // Added
}

const config: Config = {
  app: {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'RoscA Backend',
  },
  db: {
    uri: process.env.MONGO_URI || 'mongodb+srv://root:root@cluster0.mx9jy6u.mongodb.net/',
  },
  email: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
    apiKey: process.env.EMAIL_API_KEY,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  security: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'findmyroom',
  },
  // New: Google OAuth Configuration
  googleOAuth: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI||'',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ')
  }
};

// Helper function to generate Google OAuth URL
export const getGoogleAuthUrl = (): string => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  
  const options = {
    redirect_uri: config.googleOAuth.redirectUri,
    client_id: config.googleOAuth.clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: config.googleOAuth.scope
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

export default config;