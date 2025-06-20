import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Core configuration
export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  values?: T[];
  issues?: T[];
  total?: number;
  startAt?: number;
  maxResults?: number;
  isLast?: boolean;
}

// Tool definitions
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export type ToolResult = CallToolResult;

// Custom Error class
export class JiraError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'JiraError';
  }
}

// Board related types
export interface Board {
  id: number;
  name: string;
  type: string;
  self: string;
  location?: {
    projectId: number;
    projectKey: string;
    projectName: string;
    displayName: string;
    projectTypeKey: string;
    avatarURI: string;
    name: string;
  };
  filterId?: number;
  columnConfig?: {
    columns: Array<{
      name: string;
      statuses: Array<{
        id: string;
        self: string;
      }>;
    }>;
  };
}

export interface BoardIssueParams {
  boardId: string;
  assigneeFilter?: 'currentUser' | 'unassigned' | 'all';
  statusFilter?: 'new' | 'indeterminate' | 'done' | 'all';
  maxResults?: number;
}

// Issue related types
export interface Issue {
  id: string;
  key: string;
  self: string;
  fields: IssueFields;
  changelog?: {
    histories: Array<{
      id: string;
      created: string;
      items: Array<{
        field: string;
        fieldtype: string;
        from: string;
        fromString: string;
        to: string;
        toString: string;
      }>;
    }>;
  };
}

export interface IssueFields {
  summary: string;
  description?: any;
  status: Status;
  assignee?: User;
  reporter?: User;
  priority?: Priority;
  issuetype: IssueType;
  project: Project;
  created: string;
  updated: string;
  duedate?: string;
  labels: string[];
  components: Component[];
  fixVersions: Version[];
  versions: Version[];
  parent?: {
    key: string;
    fields: {
      summary: string;
    };
  };
  subtasks: Array<{
    id: string;
    key: string;
    fields: {
      summary: string;
      status: Status;
    };
  }>;
  timetracking?: {
    originalEstimate?: string;
    remainingEstimate?: string;
    timeSpent?: string;
    originalEstimateSeconds?: number;
    remainingEstimateSeconds?: number;
    timeSpentSeconds?: number;
  };
  resolution?: Resolution;
  environment?: string;
  comment?: {
    comments: Comment[];
    maxResults: number;
    total: number;
    startAt: number;
  };
  worklog?: {
    worklogs: Worklog[];
    maxResults: number;
    total: number;
    startAt: number;
  };
}

export interface Status {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  statusCategory: {
    id: number;
    key: string;
    colorName: string;
    name: string;
  };
}

export interface User {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  active: boolean;
  timeZone?: string;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
}

export interface Priority {
  id: string;
  name: string;
  iconUrl: string;
}

export interface IssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  subtask: boolean;
  hierarchyLevel: number;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
  properties: Record<string, any>;
  entityId: string;
  uuid: string;
  lead?: User;
  components: Component[];
  issueTypes: IssueType[];
  versions: Version[];
  roles: Record<string, string>;
}

export interface Component {
  id: string;
  name: string;
  description?: string;
  lead?: User;
  assigneeType: string;
  assignee?: User;
  realAssigneeType: string;
  realAssignee?: User;
  isAssigneeTypeValid: boolean;
  project: string;
  projectId: number;
}

export interface Version {
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  released: boolean;
  startDate?: string;
  releaseDate?: string;
  userStartDate?: string;
  userReleaseDate?: string;
  project: string;
  projectId: number;
}

export interface Resolution {
  id: string;
  name: string;
  description: string;
}

export interface Comment {
  id: string;
  body: any;
  author: User;
  updateAuthor: User;
  created: string;
  updated: string;
  visibility?: {
    type: string;
    value: string;
  };
}

export interface Worklog {
  id: string;
  issueId: string;
  author: User;
  updateAuthor: User;
  comment?: any;
  created: string;
  updated: string;
  visibility?: {
    type: string;
    value: string;
  };
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
}

export interface Transition {
  id: string;
  name: string;
  to: Status;
  hasScreen: boolean;
  isGlobal: boolean;
  isInitial: boolean;
  isAvailable: boolean;
  isConditional: boolean;
  fields: Record<string, any>;
}

// Search and filter types
export interface SearchParams {
  jql: string;
  maxResults?: number;
  startAt?: number;
  fields?: string[];
  expand?: string[];
}

export interface IssueCreateRequest {
  projectKey: string;
  issueType: string;
  summary: string;
  description?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  components?: string[];
  fixVersions?: string[];
  dueDate?: string;
  parentKey?: string;
}

export interface IssueUpdateRequest {
  issueKey: string;
  summary?: string;
  description?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  components?: string[];
  fixVersions?: string[];
  dueDate?: string;
}

export interface TransitionRequest {
  issueKey: string;
  transitionName: string;
  comment?: string;
}

export interface WorklogRequest {
  issueKey: string;
  timeSpent: string;
  comment?: string;
  startDate?: string;
}

// Server info
export interface ServerInfo {
  baseUrl: string;
  version: string;
  versionNumbers: number[];
  deploymentType: string;
  buildNumber: number;
  buildDate: string;
  serverTime: string;
  scmInfo: string;
  serverTitle: string;
  healthChecks: Array<{
    name: string;
    description: string;
    passed: boolean;
  }>;
}

// Utility types for formatting responses
export interface FormattedBoard {
  id: number;
  name: string;
  type: string;
  projectKey?: string;
  projectName?: string;
  location?: string;
}

export interface FormattedIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  assignee: string;
  priority: string;
  issueType: string;
  created: string;
  updated: string;
  dueDate?: string;
  labels: string[];
  components: string[];
  timeSpent?: string;
  remainingEstimate?: string;
}

export interface FormattedUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  active: boolean;
  timeZone?: string;
}

export interface FormattedProject {
  key: string;
  name: string;
  projectType: string;
  leadName?: string;
  issueTypeCount: number;
  componentCount: number;
  versionCount: number;
}

// Rate limiting types
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs: number;
}

// Logger types
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: any;
}