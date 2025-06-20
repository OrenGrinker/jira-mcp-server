import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult, Board, FormattedBoard, BoardIssueParams } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { formatMarkdownTable } from '../utils/formatters.js';

export class BoardService {
  private logger: Logger;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('BoardService');
  }

  async getBoards(params: { type?: string; projectKey?: string } = {}): Promise<ToolResult> {
    try {
      this.logger.debug('Fetching boards', params);
      
      const apiParams: { type?: string; projectKeyOrId?: string } = {};
      if (params.type) apiParams.type = params.type;
      if (params.projectKey) apiParams.projectKeyOrId = params.projectKey;
      
      const response = await this.apiClient.getBoards(apiParams);

      const boards: Board[] = response.values || [];
      
      const formattedBoards: FormattedBoard[] = boards.map(board => {
        const formatted: FormattedBoard = {
          id: board.id,
          name: board.name,
          type: board.type,
          location: board.location?.displayName || 'No location',
        };
        
        if (board.location?.projectKey) {
          formatted.projectKey = board.location.projectKey;
        }
        
        if (board.location?.projectName) {
          formatted.projectName = board.location.projectName;
        }
        
        return formatted;
      });

      const tableData = formattedBoards.map(board => [
        board.id.toString(),
        board.name,
        board.type,
        board.projectKey || 'N/A',
        board.projectName || 'N/A',
      ]);

      const markdownTable = formatMarkdownTable(
        ['ID', 'Name', 'Type', 'Project Key', 'Project Name'],
        tableData
      );

      return {
        content: [
          {
            type: 'text',
            text: `# 📋 Jira Boards (${boards.length} found)\n\n${markdownTable}\n\n## Summary\n- Total boards: ${boards.length}\n- Scrum boards: ${boards.filter(b => b.type === 'scrum').length}\n- Kanban boards: ${boards.filter(b => b.type === 'kanban').length}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get boards:', error);
      throw new Error(`Failed to retrieve boards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBoardDetails(boardId: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Fetching board details for ID: ${boardId}`);
      
      const board: Board = await this.apiClient.getBoard(boardId);

      const details = `# 📋 Board Details: ${board.name}

## Basic Information
- **ID**: ${board.id}
- **Name**: ${board.name}
- **Type**: ${board.type}
- **Self URL**: ${board.self}

## Project Information
${board.location ? `
- **Project Key**: ${board.location.projectKey}
- **Project Name**: ${board.location.projectName}
- **Project Type**: ${board.location.projectTypeKey}
- **Location**: ${board.location.displayName}
` : '- No project location information available'}

## Configuration
${board.filterId ? `- **Filter ID**: ${board.filterId}` : '- No filter configured'}
${board.columnConfig ? `
- **Columns**: ${board.columnConfig.columns.length} configured
${board.columnConfig.columns.map(col => `  - ${col.name} (${col.statuses.length} statuses)`).join('\n')}
` : '- No column configuration available'}

## Actions Available
- View board issues: Use \`get_board_issues\` with boardId: ${board.id}
- Search issues: Use \`search_issues\` with JQL: \`project = "${board.location?.projectKey}"\``;

      return {
        content: [
          {
            type: 'text',
            text: details,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get board details for ${boardId}:`, error);
      throw new Error(`Failed to retrieve board details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBoardIssues(params: BoardIssueParams): Promise<ToolResult> {
    try {
      this.logger.debug('Fetching board issues', params);

      // First get board details to understand the project
      const board: Board = await this.apiClient.getBoard(params.boardId);
      const projectKey = board.location?.projectKey;

      if (!projectKey) {
        throw new Error('Board project key not found');
      }

      // Build JQL based on filters
      let jql = `project = "${projectKey}"`;
      
      if (params.assigneeFilter === 'currentUser') {
        jql += ' AND assignee = currentUser()';
      } else if (params.assigneeFilter === 'unassigned') {
        jql += ' AND assignee is EMPTY';
      }

      if (params.statusFilter === 'new') {
        jql += ' AND statusCategory = "To Do"';
      } else if (params.statusFilter === 'indeterminate') {
        jql += ' AND statusCategory = "In Progress"';
      } else if (params.statusFilter === 'done') {
        jql += ' AND statusCategory = "Done"';
      }

      jql += ' ORDER BY updated DESC';

      const response = await this.apiClient.searchIssues(jql, {
        maxResults: params.maxResults || 50,
        fields: [
          'summary', 'status', 'assignee', 'priority', 'issuetype',
          'created', 'updated', 'duedate', 'labels', 'components',
          'timetracking'
        ],
      });

      const issues = response.issues || [];
      
      const tableData = issues.map(issue => [
        issue.key,
        issue.fields.summary.length > 50 
          ? issue.fields.summary.substring(0, 47) + '...'
          : issue.fields.summary,
        issue.fields.status.name,
        issue.fields.assignee?.displayName || 'Unassigned',
        issue.fields.priority?.name || 'None',
        issue.fields.issuetype.name,
        new Date(issue.fields.updated).toLocaleDateString(),
      ]);

      const markdownTable = formatMarkdownTable(
        ['Key', 'Summary', 'Status', 'Assignee', 'Priority', 'Type', 'Updated'],
        tableData
      );

      const filterSummary = [];
      if (params.assigneeFilter) filterSummary.push(`Assignee: ${params.assigneeFilter}`);
      if (params.statusFilter) filterSummary.push(`Status: ${params.statusFilter}`);
      
      const statusCounts = issues.reduce((acc, issue) => {
        const category = issue.fields.status.statusCategory.name;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        content: [
          {
            type: 'text',
            text: `# 🎯 Issues from Board: ${board.name}

${filterSummary.length > 0 ? `**Filters Applied**: ${filterSummary.join(', ')}\n` : ''}

${markdownTable}

## Summary
- **Total Issues**: ${issues.length}
- **JQL Used**: \`${jql}\`

### Status Distribution
${Object.entries(statusCounts).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

### Issue Types
${Array.from(new Set(issues.map(i => i.fields.issuetype.name)))
  .map(type => `- ${type}: ${issues.filter(i => i.fields.issuetype.name === type).length}`)
  .join('\n')}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get board issues:', error);
      throw new Error(`Failed to retrieve board issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}