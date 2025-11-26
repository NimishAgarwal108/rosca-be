// src/services/googleAuthService.ts
import axios from 'axios';
import config from '../config/config.js';

interface GoogleTokensResult {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token: string;
}

interface GoogleUserResult {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

/**
 * Exchange authorization code for Google OAuth tokens
 */
export const getGoogleOAuthTokens = async (
  code: string
): Promise<GoogleTokensResult> => {
  const url = 'https://oauth2.googleapis.com/token';

  const values = {
    code,
    client_id: config.googleOAuth.clientId,
    client_secret: config.googleOAuth.clientSecret,
    redirect_uri: config.googleOAuth.redirectUri,
    grant_type: 'authorization_code',
  };

  try {
    const res = await axios.post<GoogleTokensResult>(
      url,
      new URLSearchParams(values).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error('Failed to fetch Google OAuth Tokens:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Google');
  }
};

/**
 * Get Google user information using access token
 */
export const getGoogleUser = async (
  id_token: string,
  access_token: string
): Promise<GoogleUserResult> => {
  try {
    const res = await axios.get<GoogleUserResult>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error('Failed to fetch Google user:', error.response?.data || error.message);
    throw new Error('Failed to get user information from Google');
  }
};