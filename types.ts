// A global user pool
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

// A team member is a user with a specific schedule for a project
export interface TeamMember {
  userId: string;
  startDate: string;
  endDate: string;
  useSharedSchedule?: boolean;
}

// Each role is an array of team members
export type Role = TeamMember[];

export enum ProjectStatus {
  NotStarted = '未开始',
  Discussion = '讨论中',
  RequirementsDone = '需求完成',
  ReviewDone = '评审完成',
  ProductDesign = '产品设计',
  InProgress = '开发中',
  DevDone = '开发完成',
  Testing = '测试中',
  TestDone = '测试完成',
  Paused = '暂停',
  Launched = '已上线',
}

export enum Priority {
    DeptOKR = '部门OKR相关',
    CompanyOKR = '公司OKR相关',
    BusinessRequirement = '业务需求',
    TechOptimization = '技术优化',
}

export interface KeyResult {
  id: string;
  description: string;
}

export interface OKR {
  id:string;
  objective: string;
  keyResults: KeyResult[];
}

export interface OkrSet {
  periodId: string; // e.g., "2025-H2"
  periodName: string; // e.g., "2025下半年"
  okrs: OKR[];
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  mentions?: string[];
  readBy?: string[]; // 已读用户ID列表
}

export interface ChangeLogEntry {
  id: string;
  userId: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
}

export interface Project {
  id: string;
  name: string;
  priority: Priority;
  businessProblem: string;
  keyResultIds: string[];
  weeklyUpdate: string;
  lastWeekUpdate: string;
  status: ProjectStatus;
  productManagers: Role;
  backendDevelopers: Role;
  frontendDevelopers: Role;
  qaTesters: Role;
  proposedDate: string | null;
  launchDate: string | null;
  followers: string[];
  comments: Comment[];
  changeLog: ChangeLogEntry[];
  isNew?: boolean;
}

export type ProjectRoleKey = keyof Pick<Project, 'productManagers' | 'backendDevelopers' | 'frontendDevelopers' | 'qaTesters'>;