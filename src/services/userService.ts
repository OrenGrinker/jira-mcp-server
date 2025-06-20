import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult, User, FormattedUser } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { formatMarkdownTable } from '../utils/formatters.js';

export class UserService {
  private logger: Logger;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('UserService');
  }

  async getCurrentUser(): Promise<ToolResult> {
    try {
      this.logger.debug('Fetching current user information');

      const user: User = await this.apiClient.getCurrentUser();

      return {
        content: [
          {
            type: 'text',
            text: `# 👤 Current User Information

## Basic Details
- **Display Name**: ${user.displayName}
- **Account ID**: ${user.accountId}
- **Email**: ${user.emailAddress || 'Not available'}
- **Status**: ${user.active ? '🟢 Active' : '🔴 Inactive'}
- **Time Zone**: ${user.timeZone || 'Not set'}

## Avatar URLs
- **16x16**: ${user.avatarUrls['16x16']}
- **24x24**: ${user.avatarUrls['24x24']}
- **32x32**: ${user.avatarUrls['32x32']}
- **48x48**: ${user.avatarUrls['48x48']}

## Quick Actions
- Search for other users: Use \`search_users\` with a query
- View user details: Use \`get_user_details\` with an account ID
- Assign issues to yourself: Use account ID \`${user.accountId}\` in \`create_issue\` or \`update_issue\``,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get current user:', error);
      throw new Error(`Failed to retrieve current user information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchUsers(query: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Searching users with query: ${query}`);

      const users: User[] = await this.apiClient.searchUsers(query);

      if (users.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `# 🔍 User Search Results

No users found for query: "${query}"

## Search Tips
- Try searching by:
  - Display name (e.g., "John Smith")
  - Email address (e.g., "john@company.com")
  - Username (e.g., "jsmith")
- Use partial matches (e.g., "john" instead of full name)
- Check spelling and try variations`,
            },
          ],
        };
      }

      const formattedUsers: FormattedUser[] = users.map(user => {
        const formatted: FormattedUser = {
          accountId: user.accountId,
          displayName: user.displayName,
          active: user.active,
        };
        
        if (user.emailAddress) {
          formatted.emailAddress = user.emailAddress;
        }
        
        if (user.timeZone) {
          formatted.timeZone = user.timeZone;
        }
        
        return formatted;
      });

      const tableData = formattedUsers.map(user => [
        user.displayName,
        user.emailAddress || 'N/A',
        user.active ? '🟢 Active' : '🔴 Inactive',
        user.timeZone || 'Not set',
        user.accountId.substring(0, 20) + '...',
      ]);

      const markdownTable = formatMarkdownTable(
        ['Display Name', 'Email', 'Status', 'Time Zone', 'Account ID (truncated)'],
        tableData
      );

      const activeUsers = users.filter(u => u.active).length;
      const inactiveUsers = users.filter(u => !u.active).length;

      return {
        content: [
          {
            type: 'text',
            text: `# 🔍 User Search Results

**Query**: "${query}"
**Total Found**: ${users.length} users

${markdownTable}

## Summary
- 🟢 Active users: ${activeUsers}
- 🔴 Inactive users: ${inactiveUsers}

## Quick Actions
- Get full details: Use \`get_user_details\` with any account ID
- Use account ID for issue assignment in \`create_issue\` or \`update_issue\`

### Full Account IDs
${formattedUsers.map(user => `- **${user.displayName}**: \`${user.accountId}\``).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to search users with query "${query}":`, error);
      throw new Error(`Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserDetails(accountId: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Fetching user details for account ID: ${accountId}`);

      const user: User = await this.apiClient.getUser(accountId);

      return {
        content: [
          {
            type: 'text',
            text: `# 👤 User Details: ${user.displayName}

## Complete Information
- **Display Name**: ${user.displayName}
- **Account ID**: ${user.accountId}
- **Email Address**: ${user.emailAddress || 'Not available'}
- **Status**: ${user.active ? '🟢 Active' : '🔴 Inactive'}
- **Time Zone**: ${user.timeZone || 'Not specified'}

## Avatar Images
- **Small (16x16)**: [View Avatar](${user.avatarUrls['16x16']})
- **Medium (24x24)**: [View Avatar](${user.avatarUrls['24x24']})
- **Large (32x32)**: [View Avatar](${user.avatarUrls['32x32']})
- **Extra Large (48x48)**: [View Avatar](${user.avatarUrls['48x48']})

## Usage Information
- **Account ID for API calls**: \`${user.accountId}\`
- **Use in JQL queries**: \`assignee = "${user.accountId}"\` or \`reporter = "${user.accountId}"\`

## Quick Actions
- Search issues assigned to this user: Use \`search_issues\` with JQL: \`assignee = "${user.accountId}"\`
- Search issues reported by this user: Use \`search_issues\` with JQL: \`reporter = "${user.accountId}"\`
- Assign issues to this user: Use account ID in \`create_issue\` or \`update_issue\`

## Example JQL Queries
\`\`\`
assignee = "${user.accountId}" AND status != Done
reporter = "${user.accountId}" AND created >= -7d
assignee = "${user.accountId}" AND priority = High
\`\`\``,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get user details for ${accountId}:`, error);
      throw new Error(`Failed to retrieve user details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}