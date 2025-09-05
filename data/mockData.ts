import { Project, User } from '../types';

// 模拟用户数据
export const mockUsers: User[] = [
  {
    id: 'user1',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 'product_manager',
    avatar: '',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'user2',
    name: '李四',
    email: 'lisi@example.com',
    role: 'backend_developer',
    avatar: '',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'user3',
    name: '王五',
    email: 'wangwu@example.com',
    role: 'frontend_developer',
    avatar: '',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'user4',
    name: '赵六',
    email: 'zhaoliu@example.com',
    role: 'qa_tester',
    avatar: '',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'user5',
    name: '钱七',
    email: 'qianqi@example.com',
    role: 'product_manager',
    avatar: '',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
];

// 模拟项目数据
export const mockProjects: Project[] = [
  {
    id: 'project1',
    name: '用户增长优化项目',
    businessProblem: '提升用户注册转化率，优化新用户体验流程 KR1',
    status: 'in_progress',
    priority: 'P1',
    productManagers: [{ userId: 'user1', role: 'product_manager' }],
    backendDevelopers: [{ userId: 'user2', role: 'backend_developer' }],
    frontendDevelopers: [{ userId: 'user3', role: 'frontend_developer' }],
    qaTesters: [{ userId: 'user4', role: 'qa_tester' }],
    proposedDate: '2024-08-01',
    launchDate: '2024-09-15',
    weeklyUpdate: '完成了用户注册流程的前端优化',
    comments: [
      {
        id: 'comment1',
        userId: 'user1',
        content: '进展顺利，预计按时完成',
        createdAt: '2024-09-01',
        updatedAt: '2024-09-01'
      }
    ],
    followers: ['user1', 'user5'],
    createdAt: '2024-08-01',
    updatedAt: '2024-09-04'
  },
  {
    id: 'project2',
    name: '支付系统重构',
    businessProblem: '提升支付成功率，减少支付异常 KR2',
    status: 'not_started',
    priority: 'P0',
    productManagers: [{ userId: 'user5', role: 'product_manager' }],
    backendDevelopers: [{ userId: 'user2', role: 'backend_developer' }],
    frontendDevelopers: [],
    qaTesters: [{ userId: 'user4', role: 'qa_tester' }],
    proposedDate: '2024-09-01',
    launchDate: '2024-10-30',
    weeklyUpdate: '',
    comments: [],
    followers: ['user5'],
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01'
  },
  {
    id: 'project3',
    name: '移动端性能优化',
    businessProblem: '优化移动端加载速度，提升用户体验 KR3',
    status: 'completed',
    priority: 'P2',
    productManagers: [{ userId: 'user1', role: 'product_manager' }],
    backendDevelopers: [],
    frontendDevelopers: [{ userId: 'user3', role: 'frontend_developer' }],
    qaTesters: [{ userId: 'user4', role: 'qa_tester' }],
    proposedDate: '2024-07-01',
    launchDate: '2024-08-15',
    weeklyUpdate: '项目已完成上线',
    comments: [
      {
        id: 'comment2',
        userId: 'user3',
        content: '性能提升明显，用户反馈良好',
        createdAt: '2024-08-16',
        updatedAt: '2024-08-16'
      },
      {
        id: 'comment3',
        userId: 'user4',
        content: '测试通过，无重大问题',
        createdAt: '2024-08-14',
        updatedAt: '2024-08-14'
      }
    ],
    followers: ['user1', 'user3', 'user4'],
    createdAt: '2024-07-01',
    updatedAt: '2024-08-16'
  },
  {
    id: 'project4',
    name: '数据分析平台',
    businessProblem: '构建统一的数据分析平台，支持业务决策 KR4',
    status: 'on_hold',
    priority: 'tech_optimization',
    productManagers: [{ userId: 'user5', role: 'product_manager' }],
    backendDevelopers: [{ userId: 'user2', role: 'backend_developer' }],
    frontendDevelopers: [{ userId: 'user3', role: 'frontend_developer' }],
    qaTesters: [],
    proposedDate: '2024-06-01',
    launchDate: null,
    weeklyUpdate: '项目暂停，等待资源分配',
    comments: [
      {
        id: 'comment4',
        userId: 'user5',
        content: '需要等待数据团队的支持',
        createdAt: '2024-08-20',
        updatedAt: '2024-08-20'
      }
    ],
    followers: ['user5', 'user2'],
    createdAt: '2024-06-01',
    updatedAt: '2024-08-20'
  },
  {
    id: 'project5',
    name: '客服系统升级',
    businessProblem: '升级客服系统，提升客服效率和用户满意度',
    status: 'in_progress',
    priority: 'P2',
    productManagers: [{ userId: 'user1', role: 'product_manager' }],
    backendDevelopers: [{ userId: 'user2', role: 'backend_developer' }],
    frontendDevelopers: [{ userId: 'user3', role: 'frontend_developer' }],
    qaTesters: [{ userId: 'user4', role: 'qa_tester' }],
    proposedDate: '2024-08-15',
    launchDate: '2024-10-01',
    weeklyUpdate: '正在进行需求分析和技术方案设计',
    comments: [],
    followers: ['user1'],
    createdAt: '2024-08-15',
    updatedAt: '2024-09-04'
  }
];