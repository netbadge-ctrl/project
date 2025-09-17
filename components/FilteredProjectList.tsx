import React, { useMemo } from 'react';
import { Project, User } from '../types';
import { useFilterState, FilterState } from '../context/FilterStateContext';

interface FilteredProjectListProps {
  projects: Project[];
  allUsers: User[];
  currentUser: User;
  onProjectClick?: (project: Project) => void;
  className?: string;
}

// 筛选逻辑函数
const filterProjects = (projects: Project[], filters: FilterState['projectList'], allUsers: User[], currentUserId: string): Project[] => {
  return projects.filter(project => {
    // 搜索筛选
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      const matchesName = project.name.toLowerCase().includes(searchTerm);
      const matchesProblem = project.businessProblem.toLowerCase().includes(searchTerm);
      if (!matchesName && !matchesProblem) return false;
    }

    // 状态筛选
    if (filters.selectedStatuses.length > 0 && !filters.selectedStatuses.includes(project.status)) {
      return false;
    }

    // 优先级筛选
    if (filters.selectedPriorities.length > 0 && !filters.selectedPriorities.includes(project.priority)) {
      return false;
    }

    // 负责人筛选（检查所有角色）
    if (filters.selectedOwners.length > 0) {
      const allProjectMembers = [
        ...project.productManagers.map(m => m.userId),
        ...project.backendDevelopers.map(m => m.userId),
        ...project.frontendDevelopers.map(m => m.userId),
        ...project.qaTesters.map(m => m.userId)
      ];
      const hasMatchingOwner = filters.selectedOwners.some(ownerId => allProjectMembers.includes(ownerId));
      if (!hasMatchingOwner) {
        return false;
      }
    }

    // KR筛选
    if (filters.selectedKrs.length > 0) {
      // 假设项目有KR关联字段，这里简化处理
      const projectKrs = project.businessProblem.match(/KR\d+/g) || [];
      const hasMatchingKr = filters.selectedKrs.some(kr => projectKrs.includes(kr));
      if (!hasMatchingKr) {
        return false;
      }
    }

    // 日期范围筛选
    if (filters.dateRange.start || filters.dateRange.end) {
      const projectDate = project.launchDate || project.proposedDate;
      if (projectDate) {
        // 将项目日期标准化为当天的开始时间（00:00:00）
        const projectDateObj = new Date(projectDate);
        projectDateObj.setHours(0, 0, 0, 0);
        
        if (filters.dateRange.start) {
          const startDateObj = new Date(filters.dateRange.start);
          startDateObj.setHours(0, 0, 0, 0);
          if (projectDateObj < startDateObj) {
            return false;
          }
        }
        
        if (filters.dateRange.end) {
          const endDateObj = new Date(filters.dateRange.end);
          endDateObj.setHours(23, 59, 59, 999); // 设置为当天的结束时间
          if (projectDateObj > endDateObj) {
            return false;
          }
        }
      } else if (filters.dateRange.start || filters.dateRange.end) {
        // 如果设置了日期筛选但项目没有日期，则排除
        return false;
      }
    }

    // 评论筛选
    if (filters.hasComments && project.comments.length === 0) {
      return false;
    }

    return true;
  });
};

export const FilteredProjectList: React.FC<FilteredProjectListProps> = ({
  projects,
  allUsers,
  currentUser,
  onProjectClick,
  className = ''
}) => {
  const { state } = useFilterState();
  const filters = state.projectList;

  // 使用useMemo优化筛选性能
  const filteredProjects = useMemo(() => {
    return filterProjects(projects, filters, allUsers, currentUser.id);
  }, [projects, filters, allUsers, currentUser.id]);

  // 获取用户名称的辅助函数
  const getUserName = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? user.name : '未知用户';
  };

  // 格式化日期的辅助函数
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未设置';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 获取状态显示文本
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'not_started': '未开始',
      'in_progress': '进行中',
      'completed': '已完成',
      'on_hold': '暂停',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 获取优先级显示文本
  const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'P0': 'P0 - 最高',
      'P1': 'P1 - 高',
      'P2': 'P2 - 中',
      'tech_optimization': '技术优化'
    };
    return priorityMap[priority] || priority;
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      'P0': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'P1': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'P2': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'tech_optimization': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'not_started': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'on_hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  if (filteredProjects.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium mb-2">没有找到匹配的项目</p>
          <p className="text-sm">请尝试调整筛选条件或清除筛选</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 结果统计 */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>找到 {filteredProjects.length} 个项目</span>
        <span>共 {projects.length} 个项目</span>
      </div>

      {/* 项目列表 */}
      <div className="grid gap-4">
        {filteredProjects.map(project => (
          <div
            key={project.id}
            onClick={() => onProjectClick?.(project)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {project.businessProblem || '暂无描述'}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {getPriorityText(project.priority)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-500 dark:text-gray-400">
              {/* 团队成员 */}
              <div>
                <span className="font-medium">团队：</span>
                <div className="mt-1">
                  {project.productManagers.length > 0 && (
                    <div>产品: {project.productManagers.map(m => getUserName(m.userId)).join(', ')}</div>
                  )}
                  {project.backendDevelopers.length > 0 && (
                    <div>后端: {project.backendDevelopers.map(m => getUserName(m.userId)).join(', ')}</div>
                  )}
                  {project.frontendDevelopers.length > 0 && (
                    <div>前端: {project.frontendDevelopers.map(m => getUserName(m.userId)).join(', ')}</div>
                  )}
                  {project.qaTesters.length > 0 && (
                    <div>测试: {project.qaTesters.map(m => getUserName(m.userId)).join(', ')}</div>
                  )}
                </div>
              </div>

              {/* 日期信息 */}
              <div>
                <span className="font-medium">时间：</span>
                <div className="mt-1">
                  {project.proposedDate && <div>提出: {formatDate(project.proposedDate)}</div>}
                  {project.launchDate && <div>上线: {formatDate(project.launchDate)}</div>}
                </div>
              </div>

              {/* 互动信息 */}
              <div>
                <span className="font-medium">互动：</span>
                <div className="mt-1 flex items-center space-x-3">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    {project.comments.length}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {project.followers.length}
                  </span>
                </div>
              </div>

              {/* 最近更新 */}
              <div>
                <span className="font-medium">更新：</span>
                <div className="mt-1">
                  {project.weeklyUpdate ? (
                    <div className="truncate">{project.weeklyUpdate}</div>
                  ) : (
                    <div className="text-gray-400">暂无更新</div>
                  )}
                </div>
              </div>
            </div>

            {/* 关注状态指示器 */}
            {(project.followers || []).includes(currentUser.id) && (
              <div className="mt-3 flex items-center text-xs text-blue-600 dark:text-blue-400">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                已关注
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilteredProjectList;