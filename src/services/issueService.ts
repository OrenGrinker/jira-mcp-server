import { JiraApiClient } from '../jiraApiClient.js';
import { 
  ToolResult, 
  SearchParams, 
  IssueCreateRequest, 
  IssueUpdateRequest, 
  TransitionRequest 
} from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { formatMarkdownTable } from '../utils/formatters.js';

export class IssueService {
  private logger: Logger;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('IssueService');
  }

  async searchIssues(params: SearchParams): Promise<ToolResult> {
    try {
      this.logger.debug('Searching issues', params);

      const response = await this.apiClient.searchIssues(params.jql, {
        maxResults: params.maxResults || 50,
        startAt: params.startAt || 0,
        fields: params.fields || [
          'summary', 'status', 'assignee', 'priority', 'issuetype',
          'created', 'updated', 'duedate', 'labels'
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

      return {
        content: [
          {
            type: 'text',
            text: `# 🔍 Issue Search Results

**JQL Query**: \`${params.jql}\`
**Total Found**: ${response.total} issues (showing ${issues.length})

${markdownTable}

## Quick Actions
- Get details: Use \`get_issue_details\` with any issue key
- Add comment: Use \`add_comment\` with issue key and comment text
- Transition: Use \`transition_issue\` to change status`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to search issues:', error);
      throw new Error(`Failed to search issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getIssueDetails(params: { 
    issueKey: string; 
    includeComments?: boolean; 
    includeWorklogs?: boolean; 
  }): Promise<ToolResult> {
    try {
      this.logger.debug(`Fetching issue details for: ${params.issueKey}`);

      const expandFields = [];
      if (params.includeComments) expandFields.push('changelog');
      if (params.includeWorklogs) expandFields.push('changelog');

      const issue = await this.apiClient.getIssue(params.issueKey, {
        expand: expandFields,
        fields: [
          'summary', 'description', 'status', 'assignee', 'reporter',
          'priority', 'issuetype', 'project', 'created', 'updated',
          'duedate', 'labels', 'components', 'fixVersions', 'versions',
          'parent', 'subtasks', 'timetracking', 'resolution', 'environment',
          'comment', 'worklog'
        ],
      });

      const timeTracking = issue.fields.timetracking || {};
      
      let details = `# 📋 Issue Details: ${issue.key}

## ${issue.fields.summary}

### Basic Information
- **Status**: ${issue.fields.status.name} (${issue.fields.status.statusCategory.name})
- **Type**: ${issue.fields.issuetype.name}
- **Priority**: ${issue.fields.priority?.name || 'None'}
- **Project**: ${issue.fields.project.name} (${issue.fields.project.key})

### People
- **Assignee**: ${issue.fields.assignee?.displayName || 'Unassigned'}
- **Reporter**: ${issue.fields.reporter?.displayName || 'Unknown'}

### Dates
- **Created**: ${new Date(issue.fields.created).toLocaleString()}
- **Updated**: ${new Date(issue.fields.updated).toLocaleString()}
${issue.fields.duedate ? `- **Due Date**: ${new Date(issue.fields.duedate).toLocaleDateString()}` : ''}

### Time Tracking
${timeTracking.originalEstimate ? `- **Original Estimate**: ${timeTracking.originalEstimate}` : ''}
${timeTracking.remainingEstimate ? `- **Remaining**: ${timeTracking.remainingEstimate}` : ''}
${timeTracking.timeSpent ? `- **Time Spent**: ${timeTracking.timeSpent}` : ''}

### Labels & Components
${issue.fields.labels.length > 0 ? `- **Labels**: ${issue.fields.labels.join(', ')}` : '- **Labels**: None'}
${issue.fields.components.length > 0 ? `- **Components**: ${issue.fields.components.map((c: any) => c.name).join(', ')}` : '- **Components**: None'}

### Fix Versions
${issue.fields.fixVersions.length > 0 ? issue.fields.fixVersions.map((v: any) => `- ${v.name}`).join('\n') : '- No fix versions'}

${issue.fields.description ? `\n### Description\n${typeof issue.fields.description === 'string' ? issue.fields.description : 'Rich text description (use Jira web interface to view)'}` : ''}

${issue.fields.parent ? `\n### Parent Issue\n- **${issue.fields.parent.key}**: ${issue.fields.parent.fields.summary}` : ''}

${issue.fields.subtasks.length > 0 ? `\n### Subtasks (${issue.fields.subtasks.length})\n${issue.fields.subtasks.map((st: any) => `- **${st.key}**: ${st.fields.summary} (${st.fields.status.name})`).join('\n')}` : ''}

${issue.fields.resolution ? `\n### Resolution\n- **${issue.fields.resolution.name}**: ${issue.fields.resolution.description || 'No description'}` : ''}`;

      // Add comments if requested
      if (params.includeComments && issue.fields.comment?.comments.length > 0) {
        details += `\n\n### Recent Comments (${issue.fields.comment.total} total)\n`;
        const recentComments = issue.fields.comment.comments.slice(-3);
        recentComments.forEach((comment: any) => {
          details += `\n**${comment.author.displayName}** (${new Date(comment.created).toLocaleDateString()}):\n`;
          details += typeof comment.body === 'string' ? comment.body : 'Rich text comment (use Jira web interface to view)';
          details += '\n';
        });
      }

      // Add worklogs if requested
      if (params.includeWorklogs && issue.fields.worklog?.worklogs.length > 0) {
        details += `\n\n### Recent Work Logs (${issue.fields.worklog.total} total)\n`;
        const recentWorklogs = issue.fields.worklog.worklogs.slice(-5);
        recentWorklogs.forEach((worklog: any) => {
          details += `- **${worklog.author.displayName}**: ${worklog.timeSpent} on ${new Date(worklog.started).toLocaleDateString()}`;
          if (worklog.comment) {
            details += ` - ${typeof worklog.comment === 'string' ? worklog.comment : 'Rich text comment'}`;
          }
          details += '\n';
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: details,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get issue details for ${params.issueKey}:`, error);
      throw new Error(`Failed to retrieve issue details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createIssue(params: IssueCreateRequest): Promise<ToolResult> {
    try {
      this.logger.debug('Creating new issue', params);

      const issueData: any = {
        fields: {
          project: { key: params.projectKey },
          issuetype: { name: params.issueType },
          summary: params.summary,
        }
      };

      if (params.description) {
        issueData.fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: params.description,
                },
              ],
            },
          ],
        };
      }

      if (params.priority) {
        issueData.fields.priority = { name: params.priority };
      }

      if (params.assignee) {
        issueData.fields.assignee = { accountId: params.assignee };
      }

      if (params.labels && params.labels.length > 0) {
        issueData.fields.labels = params.labels;
      }

      if (params.components && params.components.length > 0) {
        issueData.fields.components = params.components.map(name => ({ name }));
      }

      if (params.fixVersions && params.fixVersions.length > 0) {
        issueData.fields.fixVersions = params.fixVersions.map(name => ({ name }));
      }

      if (params.dueDate) {
        issueData.fields.duedate = params.dueDate;
      }

      if (params.parentKey) {
        issueData.fields.parent = { key: params.parentKey };
      }

      const result = await this.apiClient.createIssue(issueData);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Issue Created Successfully!

**Issue Key**: ${result.key}
**Summary**: ${params.summary}
**Project**: ${params.projectKey}
**Type**: ${params.issueType}
${params.priority ? `**Priority**: ${params.priority}` : ''}

## Quick Actions
- View details: Use \`get_issue_details\` with key: ${result.key}
- Add comment: Use \`add_comment\` with key: ${result.key}
- Transition: Use \`transition_issue\` to change status

🔗 **View in Jira**: [${result.key}](${result.self})`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to create issue:', error);
      throw new Error(`Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateIssue(params: IssueUpdateRequest): Promise<ToolResult> {
    try {
      this.logger.debug(`Updating issue: ${params.issueKey}`, params);

      const updateData: any = { fields: {} };

      if (params.summary) {
        updateData.fields.summary = params.summary;
      }

      if (params.description) {
        updateData.fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: params.description,
                },
              ],
            },
          ],
        };
      }

      if (params.priority) {
        updateData.fields.priority = { name: params.priority };
      }

      if (params.assignee) {
        updateData.fields.assignee = { accountId: params.assignee };
      }

      if (params.labels) {
        updateData.fields.labels = params.labels;
      }

      if (params.components) {
        updateData.fields.components = params.components.map(name => ({ name }));
      }

      if (params.fixVersions) {
        updateData.fields.fixVersions = params.fixVersions.map(name => ({ name }));
      }

      if (params.dueDate) {
        updateData.fields.duedate = params.dueDate;
      }

      await this.apiClient.updateIssue(params.issueKey, updateData);

      const updatedFields = Object.keys(updateData.fields);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Issue Updated Successfully!

**Issue**: ${params.issueKey}
**Updated Fields**: ${updatedFields.join(', ')}

## Changes Made
${updatedFields.map(field => {
  const value = updateData.fields[field];
  if (typeof value === 'object' && value.name) {
    return `- **${field}**: ${value.name}`;
  } else if (Array.isArray(value)) {
    return `- **${field}**: ${value.join(', ')}`;
  } else {
    return `- **${field}**: Updated`;
  }
}).join('\n')}

Use \`get_issue_details\` with key: ${params.issueKey} to see all changes.`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to update issue ${params.issueKey}:`, error);
      throw new Error(`Failed to update issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transitionIssue(params: TransitionRequest): Promise<ToolResult> {
    try {
      this.logger.debug(`Transitioning issue: ${params.issueKey}`, params);

      // First, get available transitions
      const transitionsResponse = await this.apiClient.getIssueTransitions(params.issueKey);
      const transitions = transitionsResponse.transitions || [];

      // Find the transition by name
      const transition = transitions.find((t: any) => 
        t.name.toLowerCase() === params.transitionName.toLowerCase()
      );

      if (!transition) {
        const availableTransitions = transitions.map((t: any) => t.name).join(', ');
        throw new Error(`Transition "${params.transitionName}" not found. Available transitions: ${availableTransitions}`);
      }

      await this.apiClient.transitionIssue(params.issueKey, transition.id, params.comment);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Issue Transitioned Successfully!

**Issue**: ${params.issueKey}
**Transition**: ${params.transitionName}
**New Status**: ${transition.to.name}
${params.comment ? `**Comment Added**: ${params.comment}` : ''}

## Available Actions
- View updated details: Use \`get_issue_details\` with key: ${params.issueKey}
- Add another comment: Use \`add_comment\`
- Make another transition: Use \`transition_issue\`

### Other Available Transitions
${transitions.filter((t: any) => t.id !== transition.id).map((t: any) => `- ${t.name} → ${t.to.name}`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to transition issue ${params.issueKey}:`, error);
      throw new Error(`Failed to transition issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addComment(params: { issueKey: string; comment: string }): Promise<ToolResult> {
    try {
      this.logger.debug(`Adding comment to issue: ${params.issueKey}`);

      const result = await this.apiClient.addComment(params.issueKey, params.comment);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Comment Added Successfully!

**Issue**: ${params.issueKey}
**Comment ID**: ${result.id}
**Added**: ${new Date(result.created).toLocaleString()}

## Comment Content
${params.comment}

## Quick Actions
- View issue details: Use \`get_issue_details\` with key: ${params.issueKey}
- Add another comment: Use \`add_comment\`
- Transition issue: Use \`transition_issue\``,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to add comment to ${params.issueKey}:`, error);
      throw new Error(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}