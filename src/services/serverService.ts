import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export class ServerService {
  private logger: Logger;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('ServerService');
  }

  async getServerInfo(): Promise<ToolResult> {
    try {
      this.logger.debug('Fetching server information');

      const serverInfo = await this.apiClient.getServerInfo();

      return {
        content: [
          {
            type: 'text',
            text: `# 🖥️ Jira Server Information

## Server Details
- **Base URL**: ${serverInfo.baseUrl}
- **Server Title**: ${serverInfo.serverTitle || 'Jira'}
- **Version**: ${serverInfo.version}
- **Build Number**: ${serverInfo.buildNumber}
- **Build Date**: ${new Date(serverInfo.buildDate).toLocaleString()}
- **Deployment Type**: ${serverInfo.deploymentType || 'Cloud'}

## Current Status
- **Server Time**: ${new Date(serverInfo.serverTime).toLocaleString()}
- **Time Zone**: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
- **SCM Info**: ${serverInfo.scmInfo || 'Not available'}

## Version Information
${serverInfo.versionNumbers ? `- **Version Numbers**: [${serverInfo.versionNumbers.join('.')}]` : ''}

## Health Checks
${serverInfo.healthChecks && serverInfo.healthChecks.length > 0 ? 
  serverInfo.healthChecks.map((check: any) => 
    `- **${check.name}**: ${check.passed ? '✅ Passed' : '❌ Failed'} - ${check.description}`
  ).join('\n') : 
  '- No health check information available'
}

## System Information
- **Current Date/Time**: ${new Date().toLocaleString()}
- **Server Response Time**: Available (successfully connected)
- **API Endpoints**: 
  - REST API v2: \`${serverInfo.baseUrl}/rest/api/2\`
  - REST API v3: \`${serverInfo.baseUrl}/rest/api/3\`
  - Agile API: \`${serverInfo.baseUrl}/rest/agile/1.0\`

## Quick Actions
- Test connection: This command validates connectivity
- Get current user: Use \`get_current_user\`
- List projects: Use \`get_projects\`
- Search issues: Use \`search_issues\``,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get server info:', error);
      throw new Error(`Failed to retrieve server information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}