import { JiraApiClient } from './jiraApiClient.js';
import { ToolDefinition, ToolResult } from './types/index.js';
import { Logger } from './utils/logger.js';
import { 
  BoardService,
  IssueService,
  UserService,
  ProjectService,
  WorklogService,
  ServerService
} from './services/index.js';

export class JiraToolRegistry {
  private logger: Logger;
  private boardService: BoardService;
  private issueService: IssueService;
  private userService: UserService;
  private projectService: ProjectService;
  private worklogService: WorklogService;
  private serverService: ServerService;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('JiraToolRegistry');
    
    // Initialize services
    this.boardService = new BoardService(apiClient);
    this.issueService = new IssueService(apiClient);
    this.userService = new UserService(apiClient);
    this.projectService = new ProjectService(apiClient);
    this.worklogService = new WorklogService(apiClient);
    this.serverService = new ServerService(apiClient);
  }

  getToolDefinitions(): ToolDefinition[] {
    return [
      // Board tools
      {
        name: 'get_boards',
        description: 'List all available Jira boards with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Board type filter (scrum, kanban, simple)',
              enum: ['scrum', 'kanban', 'simple']
            },
            projectKey: {
              type: 'string',
              description: 'Filter boards by project key'
            }
          },
        },
      },
      {
        name: 'get_board_details',
        description: 'Get detailed information about a specific board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID to get details for'
            }
          },
          required: ['boardId'],
        },
      },
      {
        name: 'get_board_issues',
        description: 'Get issues from a specific board with advanced filtering',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID to get issues from'
            },
            assigneeFilter: {
              type: 'string',
              description: 'Filter by assignee (currentUser, unassigned, or specific user)',
              enum: ['currentUser', 'unassigned', 'all']
            },
            statusFilter: {
              type: 'string',
              description: 'Filter by status category',
              enum: ['new', 'indeterminate', 'done', 'all']
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return (default: 50)',
              minimum: 1,
              maximum: 100
            }
          },
          required: ['boardId'],
        },
      },

      // Issue tools
      {
        name: 'search_issues',
        description: 'Search for issues using JQL (Jira Query Language)',
        inputSchema: {
          type: 'object',
          properties: {
            jql: {
              type: 'string',
              description: 'JQL query string'
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results (default: 50)',
              minimum: 1,
              maximum: 100
            }
          },
          required: ['jql'],
        },
      },
      {
        name: 'get_issue_details',
        description: 'Get comprehensive details about a specific issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key (e.g., PROJ-123) or ID'
            },
            includeComments: {
              type: 'boolean',
              description: 'Include comments in the response (default: false)'
            },
            includeWorklogs: {
              type: 'boolean',
              description: 'Include worklogs in the response (default: false)'
            }
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'create_issue',
        description: 'Create a new Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'Project key where the issue will be created'
            },
            issueType: {
              type: 'string',
              description: 'Issue type (e.g., Task, Bug, Story)'
            },
            summary: {
              type: 'string',
              description: 'Issue summary/title'
            },
            description: {
              type: 'string',
              description: 'Issue description'
            },
            priority: {
              type: 'string',
              description: 'Issue priority (Highest, High, Medium, Low, Lowest)',
              enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest']
            },
            assignee: {
              type: 'string',
              description: 'Assignee account ID (optional)'
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Issue labels'
            }
          },
          required: ['projectKey', 'issueType', 'summary'],
        },
      },
      {
        name: 'update_issue',
        description: 'Update an existing issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to update'
            },
            summary: {
              type: 'string',
              description: 'New summary'
            },
            description: {
              type: 'string',
              description: 'New description'
            },
            priority: {
              type: 'string',
              description: 'New priority'
            },
            assignee: {
              type: 'string',
              description: 'New assignee account ID'
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'New labels'
            }
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'transition_issue',
        description: 'Transition an issue to a different status',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to transition'
            },
            transitionName: {
              type: 'string',
              description: 'Name of the transition (e.g., "In Progress", "Done")'
            },
            comment: {
              type: 'string',
              description: 'Optional comment to add during transition'
            }
          },
          required: ['issueKey', 'transitionName'],
        },
      },
      {
        name: 'add_comment',
        description: 'Add a comment to an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to comment on'
            },
            comment: {
              type: 'string',
              description: 'Comment text'
            }
          },
          required: ['issueKey', 'comment'],
        },
      },

      // User tools
      {
        name: 'get_current_user',
        description: 'Get information about the currently authenticated user',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_users',
        description: 'Search for users by username, email, or display name',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (username, email, or display name)'
            }
          },
          required: ['query'],
        },
      },
      {
        name: 'get_user_details',
        description: 'Get detailed information about a specific user',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: {
              type: 'string',
              description: 'User account ID'
            }
          },
          required: ['accountId'],
        },
      },

      // Project tools
      {
        name: 'get_projects',
        description: 'List all accessible projects',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_project_details',
        description: 'Get detailed information about a specific project',
        inputSchema: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'Project key or ID'
            }
          },
          required: ['projectKey'],
        },
      },

      // Worklog tools
      {
        name: 'add_worklog',
        description: 'Add work log entry to an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to log work against'
            },
            timeSpent: {
              type: 'string',
              description: 'Time spent (e.g., "2h 30m", "1d", "4h")'
            },
            comment: {
              type: 'string',
              description: 'Work description/comment'
            },
            startDate: {
              type: 'string',
              description: 'Start date (ISO format, optional - defaults to now)'
            }
          },
          required: ['issueKey', 'timeSpent'],
        },
      },
      {
        name: 'get_worklogs',
        description: 'Get work logs for an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to get worklogs for'
            }
          },
          required: ['issueKey'],
        },
      },

      // Server tools
      {
        name: 'get_server_info',
        description: 'Get Jira server information and status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<ToolResult> {
    this.logger.debug(`Executing tool: ${toolName}`, args);

    try {
      switch (toolName) {
        // Board tools
        case 'get_boards':
          return await this.boardService.getBoards(args);
        case 'get_board_details':
          return await this.boardService.getBoardDetails(args.boardId as string);
        case 'get_board_issues':
          return await this.boardService.getBoardIssues({
            boardId: args.boardId as string,
            assigneeFilter: args.assigneeFilter as 'currentUser' | 'unassigned' | 'all',
            statusFilter: args.statusFilter as 'new' | 'indeterminate' | 'done' | 'all',
            maxResults: args.maxResults as number,
          });

        // Issue tools
        case 'search_issues':
          return await this.issueService.searchIssues({
            jql: args.jql as string,
            maxResults: args.maxResults as number,
            startAt: args.startAt as number,
            fields: args.fields as string[],
            expand: args.expand as string[],
          });
        case 'get_issue_details':
          return await this.issueService.getIssueDetails({
            issueKey: args.issueKey as string,
            includeComments: args.includeComments as boolean,
            includeWorklogs: args.includeWorklogs as boolean,
          });
        case 'create_issue':
          return await this.issueService.createIssue({
            projectKey: args.projectKey as string,
            issueType: args.issueType as string,
            summary: args.summary as string,
            description: args.description as string,
            priority: args.priority as string,
            assignee: args.assignee as string,
            labels: args.labels as string[],
            components: args.components as string[],
            fixVersions: args.fixVersions as string[],
            dueDate: args.dueDate as string,
            parentKey: args.parentKey as string,
          });
        case 'update_issue':
          return await this.issueService.updateIssue({
            issueKey: args.issueKey as string,
            summary: args.summary as string,
            description: args.description as string,
            priority: args.priority as string,
            assignee: args.assignee as string,
            labels: args.labels as string[],
            components: args.components as string[],
            fixVersions: args.fixVersions as string[],
            dueDate: args.dueDate as string,
          });
        case 'transition_issue':
          return await this.issueService.transitionIssue({
            issueKey: args.issueKey as string,
            transitionName: args.transitionName as string,
            comment: args.comment as string,
          });
        case 'add_comment':
          return await this.issueService.addComment({
            issueKey: args.issueKey as string,
            comment: args.comment as string,
          });

        // User tools
        case 'get_current_user':
          return await this.userService.getCurrentUser();
        case 'search_users':
          return await this.userService.searchUsers(args.query as string);
        case 'get_user_details':
          return await this.userService.getUserDetails(args.accountId as string);

        // Project tools
        case 'get_projects':
          return await this.projectService.getProjects();
        case 'get_project_details':
          return await this.projectService.getProjectDetails(args.projectKey as string);

        // Worklog tools
        case 'add_worklog':
          return await this.worklogService.addWorklog({
            issueKey: args.issueKey as string,
            timeSpent: args.timeSpent as string,
            comment: args.comment as string,
            startDate: args.startDate as string,
          });
        case 'get_worklogs':
          return await this.worklogService.getWorklogs(args.issueKey as string);

        // Server tools
        case 'get_server_info':
          return await this.serverService.getServerInfo();

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      this.logger.error(`Tool execution failed for ${toolName}:`, error);
      throw error;
    }
  }
}