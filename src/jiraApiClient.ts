import { JiraConfig, ApiResponse, JiraError } from './types/index.js';
import { Logger } from './utils/logger.js';
import { RateLimiter } from './utils/rateLimiter.js';

export class JiraApiClient {
  private config: JiraConfig;
  private logger: Logger;
  private rateLimiter: RateLimiter;
  private authHeader: string;

  constructor() {
    this.config = this.getJiraConfig();
    this.logger = new Logger('JiraApiClient');
    this.rateLimiter = new RateLimiter();
    this.authHeader = `Basic ${Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64')}`;
  }

  private getJiraConfig(): JiraConfig {
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!baseUrl || !email || !apiToken) {
      throw new Error(
        'Missing Jira configuration. Please set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.'
      );
    }

    // Ensure baseUrl doesn't end with slash
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    return { baseUrl: cleanBaseUrl, email, apiToken };
  }

  async testConnection(): Promise<void> {
    try {
      await this.makeRequest('/myself', { useV3Api: true });
      this.logger.info('Jira connection test successful');
    } catch (error) {
      this.logger.error('Jira connection test failed:', error);
      throw new Error('Failed to connect to Jira. Please check your credentials and network connection.');
    }
  }

  async makeRequest<T = any>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      useV3Api?: boolean;
      useAgileApi?: boolean;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      useV3Api = false,
      useAgileApi = false,
      headers = {},
    } = options;

    // Apply rate limiting
    await this.rateLimiter.waitForSlot();

    const apiPath = useAgileApi ? '/rest/agile/1.0' : useV3Api ? '/rest/api/3' : '/rest/api/2';
    const url = `${this.config.baseUrl}${apiPath}${endpoint}`;

    const requestHeaders = {
      'Authorization': this.authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Enhanced-Jira-MCP-Server/2.0.0',
      ...headers,
    };

    this.logger.debug(`Making ${method} request to: ${url}`);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
      };

      // Only add body if it exists
      if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.errorMessages?.join(', ') || errorJson.message || errorText;
        } catch {
          errorMessage = errorText;
        }

        throw new JiraError(
          `Jira API error: ${response.status} ${response.statusText}`,
          response.status,
          errorMessage
        );
      }

      const responseText = await response.text();
      if (!responseText) {
        return {} as T;
      }
      return JSON.parse(responseText) as T;
    } catch (error) {
      this.logger.error(`API request failed for ${url}:`, error);
      
      if (error instanceof JiraError) {
        throw error;
      }
      
      throw new JiraError(
        'Network error occurred while making API request',
        0,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Board-related methods
  async getBoards(params: { type?: string; projectKeyOrId?: string } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.projectKeyOrId) queryParams.append('projectKeyOrId', params.projectKeyOrId);
    
    const endpoint = `/board${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint, { useAgileApi: true });
  }

  async getBoard(boardId: string): Promise<any> {
    return this.makeRequest(`/board/${boardId}`, { useAgileApi: true });
  }

  async getBoardIssues(boardId: string, params: {
    jql?: string;
    maxResults?: number;
    startAt?: number;
    fields?: string[];
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params.jql) queryParams.append('jql', params.jql);
    if (params.maxResults) queryParams.append('maxResults', params.maxResults.toString());
    if (params.startAt) queryParams.append('startAt', params.startAt.toString());
    if (params.fields) queryParams.append('fields', params.fields.join(','));
    
    const endpoint = `/board/${boardId}/issue${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint, { useAgileApi: true });
  }

  // Issue-related methods
  async searchIssues(jql: string, params: {
    maxResults?: number;
    startAt?: number;
    fields?: string[];
    expand?: string[];
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append('jql', jql);
    if (params.maxResults) queryParams.append('maxResults', params.maxResults.toString());
    if (params.startAt) queryParams.append('startAt', params.startAt.toString());
    if (params.fields) queryParams.append('fields', params.fields.join(','));
    if (params.expand) queryParams.append('expand', params.expand.join(','));
    
    return this.makeRequest(`/search?${queryParams}`, { useV3Api: true });
  }

  async getIssue(issueIdOrKey: string, params: {
    fields?: string[];
    expand?: string[];
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.fields) queryParams.append('fields', params.fields.join(','));
    if (params.expand) queryParams.append('expand', params.expand.join(','));
    
    const endpoint = `/issue/${issueIdOrKey}${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint, { useV3Api: true });
  }

  async addComment(issueIdOrKey: string, comment: string): Promise<any> {
    const adfBody = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: comment,
              },
            ],
          },
        ],
      },
    };

    return this.makeRequest(`/issue/${issueIdOrKey}/comment`, {
      method: 'POST',
      body: adfBody,
      useV3Api: true,
    });
  }

  async updateIssue(issueIdOrKey: string, updateData: any): Promise<void> {
    await this.makeRequest(`/issue/${issueIdOrKey}`, {
      method: 'PUT',
      body: updateData,
      useV3Api: true,
    });
  }

  async createIssue(issueData: any): Promise<any> {
    return this.makeRequest('/issue', {
      method: 'POST',
      body: issueData,
      useV3Api: true,
    });
  }

  async transitionIssue(issueIdOrKey: string, transitionId: string, comment?: string): Promise<void> {
    const body: any = {
      transition: { id: transitionId }
    };

    if (comment) {
      body.update = {
        comment: [{
          add: {
            body: {
              type: 'doc',
              version: 1,
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: comment }]
              }]
            }
          }
        }]
      };
    }

    await this.makeRequest(`/issue/${issueIdOrKey}/transitions`, {
      method: 'POST',
      body,
      useV3Api: true,
    });
  }

  async getIssueTransitions(issueIdOrKey: string): Promise<any> {
    return this.makeRequest(`/issue/${issueIdOrKey}/transitions`, { useV3Api: true });
  }

  // User-related methods
  async getCurrentUser(): Promise<any> {
    return this.makeRequest('/myself', { useV3Api: true });
  }

  async searchUsers(query: string): Promise<any[]> {
    return this.makeRequest(`/user/search?query=${encodeURIComponent(query)}`, { useV3Api: true });
  }

  async getUser(accountId: string): Promise<any> {
    return this.makeRequest(`/user?accountId=${accountId}`, { useV3Api: true });
  }

  // Project-related methods
  async getProjects(): Promise<any[]> {
    return this.makeRequest('/project', { useV3Api: true });
  }

  async getProject(projectIdOrKey: string): Promise<any> {
    return this.makeRequest(`/project/${projectIdOrKey}`, { useV3Api: true });
  }

  // Server info
  async getServerInfo(): Promise<any> {
    return this.makeRequest('/serverInfo', { useV3Api: true });
  }

  // Worklog methods
  async addWorklog(issueIdOrKey: string, timeSpent: string, comment?: string, startedDate?: string): Promise<any> {
    const body: any = {
      timeSpent,
      started: startedDate || new Date().toISOString(),
    };

    if (comment) {
      body.comment = {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: comment }]
        }]
      };
    }

    return this.makeRequest(`/issue/${issueIdOrKey}/worklog`, {
      method: 'POST',
      body,
      useV3Api: true,
    });
  }

  async getWorklogs(issueIdOrKey: string): Promise<any> {
    return this.makeRequest(`/issue/${issueIdOrKey}/worklog`, { useV3Api: true });
  }
}