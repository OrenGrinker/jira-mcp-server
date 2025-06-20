import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult, WorklogRequest } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { formatMarkdownTable } from '../utils/formatters.js';

export class WorklogService {
  private logger: Logger;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('WorklogService');
  }

  async addWorklog(params: WorklogRequest): Promise<ToolResult> {
    try {
      this.logger.debug(`Adding worklog to issue: ${params.issueKey}`, params);

      const result = await this.apiClient.addWorklog(
        params.issueKey,
        params.timeSpent,
        params.comment,
        params.startDate
      );

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Work Log Added Successfully!

**Issue**: ${params.issueKey}
**Time Spent**: ${params.timeSpent}
**Work Log ID**: ${result.id}
**Started**: ${new Date(result.started).toLocaleString()}
${params.comment ? `**Comment**: ${params.comment}` : ''}

## Work Details
- **Author**: ${result.author.displayName}
- **Created**: ${new Date(result.created).toLocaleString()}
- **Time in Seconds**: ${result.timeSpentSeconds}

## Quick Actions
- View all worklogs: Use \`get_worklogs\` with issueKey: ${params.issueKey}
- View issue details: Use \`get_issue_details\` with issueKey: ${params.issueKey}
- Add another worklog: Use \`add_worklog\` again

## Time Format Examples
- Hours: "2h", "4h 30m"
- Days: "1d", "2d 4h"
- Minutes: "30m", "1h 15m"
- Mixed: "1w 2d 3h 30m"`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to add worklog to ${params.issueKey}:`, error);
      throw new Error(`Failed to add work log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWorklogs(issueKey: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Fetching worklogs for issue: ${issueKey}`);

      const response = await this.apiClient.getWorklogs(issueKey);
      const worklogs = response.worklogs || [];

      if (worklogs.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `# ⏱️ Work Logs for ${issueKey}

No work logs found for this issue.

## Quick Actions
- Add work log: Use \`add_worklog\` with issueKey: ${issueKey}
- View issue details: Use \`get_issue_details\` with issueKey: ${issueKey}`,
            },
          ],
        };
      }

      const tableData = worklogs.map((worklog: any) => [
        worklog.author.displayName,
        worklog.timeSpent,
        new Date(worklog.started).toLocaleDateString(),
        new Date(worklog.created).toLocaleDateString(),
        worklog.comment ? 'Yes' : 'No',
      ]);

      const markdownTable = formatMarkdownTable(
        ['Author', 'Time Spent', 'Work Date', 'Logged Date', 'Has Comment'],
        tableData
      );

      const totalSeconds = worklogs.reduce((sum: number, w: any) => sum + w.timeSpentSeconds, 0);
      const totalTime = this.formatDuration(totalSeconds);
      const uniqueAuthors = [...new Set(worklogs.map((w: any) => w.author.displayName))];

      return {
        content: [
          {
            type: 'text',
            text: `# ⏱️ Work Logs for ${issueKey}

**Total Time Logged**: ${totalTime}
**Total Entries**: ${worklogs.length}
**Contributors**: ${uniqueAuthors.length}

${markdownTable}

## Summary
- **Total Time (seconds)**: ${totalSeconds}
- **Contributors**: ${uniqueAuthors.join(', ')}
- **Latest Entry**: ${new Date(Math.max(...worklogs.map((w: any) => new Date(w.created).getTime()))).toLocaleString()}
- **Earliest Entry**: ${new Date(Math.min(...worklogs.map((w: any) => new Date(w.created).getTime()))).toLocaleString()}

## Quick Actions
- Add more work: Use \`add_worklog\` with issueKey: ${issueKey}
- View issue details: Use \`get_issue_details\` with issueKey: ${issueKey}

### Recent Work Log Details
${worklogs.slice(-3).map((w: any) => `
**${w.author.displayName}** - ${w.timeSpent} (${new Date(w.started).toLocaleDateString()})
${w.comment ? `Comment: ${typeof w.comment === 'string' ? w.comment : 'Rich text comment'}` : 'No comment'}
`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get worklogs for ${issueKey}:`, error);
      throw new Error(`Failed to retrieve work logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(seconds / 86400);
      const remainingHours = Math.floor((seconds % 86400) / 3600);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  }
}