import { Request, Response } from "express";

export interface CalendarProvider {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  description: string;
  isConnected: boolean;
  authUrl?: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  errorMessage?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  providerId: string;
  externalId: string;
}

export interface CalendarProviderConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  enabled: boolean;
}

// Calendar provider configurations
export const calendarProviders: Record<string, CalendarProviderConfig> = {
  google: {
    id: 'google',
    name: 'google',
    displayName: 'Google Calendar',
    description: 'Sync with your Google Calendar account',
    icon: '🔍',
    clientId: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-client-secret',
    redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/calendar/callback/google`,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
    enabled: true, // Enable for demo purposes
  },
  outlook: {
    id: 'outlook',
    name: 'outlook',
    displayName: 'Outlook Calendar',
    description: 'Sync with your Microsoft Outlook calendar',
    icon: '📅',
    clientId: process.env.OUTLOOK_CLIENT_ID || 'demo-client-id',
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET || 'demo-client-secret',
    redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/calendar/callback/outlook`,
    scopes: ['https://graph.microsoft.com/calendars.read'],
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    apiBaseUrl: 'https://graph.microsoft.com/v1.0',
    enabled: true, // Enable for demo purposes
  },
  apple: {
    id: 'apple',
    name: 'apple',
    displayName: 'Apple Calendar',
    description: 'Sync with your iCloud calendar (via CalDAV)',
    icon: '🍎',
    scopes: [],
    authUrl: '',
    tokenUrl: '',
    apiBaseUrl: 'https://caldav.icloud.com',
    enabled: true, // Enable for demo purposes
  },
  yahoo: {
    id: 'yahoo',
    name: 'yahoo',
    displayName: 'Yahoo Calendar',
    description: 'Sync with your Yahoo calendar',
    icon: '🌐',
    scopes: ['calendar-r'],
    authUrl: 'https://api.login.yahoo.com/oauth2/request_auth',
    tokenUrl: 'https://api.login.yahoo.com/oauth2/get_token',
    apiBaseUrl: 'https://api.yahoo.com/calendar/v1',
    enabled: true, // Enable for demo purposes
  },
};

export class CalendarProviderManager {
  private userTokens: Map<string, any> = new Map();

  async getProviders(userId: string): Promise<CalendarProvider[]> {
    const providers: CalendarProvider[] = [];
    
    for (const [id, config] of Object.entries(calendarProviders)) {
      if (!config.enabled) continue;
      
      const userToken = this.userTokens.get(`${userId}:${id}`);
      const isConnected = !!userToken && !this.isTokenExpired(userToken);
      
      providers.push({
        id,
        name: config.name,
        displayName: config.displayName,
        icon: config.icon,
        description: config.description,
        isConnected,
        status: isConnected ? 'connected' : 'disconnected',
        lastSync: userToken?.lastSync,
        errorMessage: userToken?.error,
      });
    }
    
    return providers;
  }

  async generateAuthUrl(providerId: string, userId: string): Promise<string> {
    const config = calendarProviders[providerId];
    if (!config || !config.enabled) {
      throw new Error(`Provider ${providerId} is not enabled or not found`);
    }

    // For demo purposes, generate a mock auth URL that will redirect back to our app
    if (!config.clientId || !config.clientSecret) {
      // Return a demo auth URL that will simulate the OAuth flow
      return `${config.authUrl}?demo=true&providerId=${providerId}&userId=${userId}`;
    }

    const params = new URLSearchParams({
      client_id: config.clientId!,
      redirect_uri: config.redirectUri!,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state: `${userId}:${providerId}`,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(providerId: string, code: string, userId: string): Promise<any> {
    const config = calendarProviders[providerId];
    if (!config || !config.enabled) {
      throw new Error(`Provider ${providerId} is not enabled or not found`);
    }

    const tokenData = {
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri!,
    };

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenData).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await response.json();
    tokens.obtained_at = Date.now();
    tokens.lastSync = new Date().toISOString();
    
    // Store token for user
    this.userTokens.set(`${userId}:${providerId}`, tokens);
    
    return tokens;
  }

  async getEvents(providerId: string, userId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    const userToken = this.userTokens.get(`${userId}:${providerId}`);
    if (!userToken) {
      throw new Error('No token found for provider');
    }

    if (this.isTokenExpired(userToken)) {
      await this.refreshToken(providerId, userId);
    }

    const config = calendarProviders[providerId];
    const events: CalendarEvent[] = [];

    try {
      if (providerId === 'google') {
        const googleEvents = await this.getGoogleCalendarEvents(userToken, startDate, endDate);
        events.push(...googleEvents);
      } else if (providerId === 'outlook') {
        const outlookEvents = await this.getOutlookCalendarEvents(userToken, startDate, endDate);
        events.push(...outlookEvents);
      }
    } catch (error: any) {
      console.error(`Error fetching events from ${providerId}:`, error);
      // Update token with error
      if (userToken) {
        userToken.error = error.message;
        this.userTokens.set(`${userId}:${providerId}`, userToken);
      }
    }

    return events;
  }

  private async getGoogleCalendarEvents(token: any, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      timeMin: startDate || new Date().toISOString(),
      timeMax: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items?.map((item: any) => ({
      id: item.id,
      title: item.summary,
      description: item.description,
      start: item.start.dateTime || item.start.date,
      end: item.end.dateTime || item.end.date,
      location: item.location,
      attendees: item.attendees?.map((a: any) => a.email) || [],
      providerId: 'google',
      externalId: item.id,
    })) || [];
  }

  private async getOutlookCalendarEvents(token: any, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      startDateTime: startDate || new Date().toISOString(),
      endDateTime: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Outlook Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value?.map((item: any) => ({
      id: item.id,
      title: item.subject,
      description: item.body?.content,
      start: item.start.dateTime,
      end: item.end.dateTime,
      location: item.location?.displayName,
      attendees: item.attendees?.map((a: any) => a.emailAddress.address) || [],
      providerId: 'outlook',
      externalId: item.id,
    })) || [];
  }

  async disconnectProvider(providerId: string, userId: string): Promise<void> {
    const tokenKey = `${userId}:${providerId}`;
    this.userTokens.delete(tokenKey);
  }

  private isTokenExpired(token: any): boolean {
    if (!token.expires_in || !token.obtained_at) return false;
    const expirationTime = token.obtained_at + (token.expires_in * 1000);
    return Date.now() >= expirationTime;
  }

  private async refreshToken(providerId: string, userId: string): Promise<void> {
    const userToken = this.userTokens.get(`${userId}:${providerId}`);
    if (!userToken?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const config = calendarProviders[providerId];
    const tokenData = {
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
      refresh_token: userToken.refresh_token,
      grant_type: 'refresh_token',
    };

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenData).toString(),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const newTokens = await response.json();
    newTokens.obtained_at = Date.now();
    newTokens.refresh_token = newTokens.refresh_token || userToken.refresh_token;
    
    this.userTokens.set(`${userId}:${providerId}`, newTokens);
  }
}

// Export singleton instance
export const calendarProviderManager = new CalendarProviderManager();