# 筛选条件持久化功能

## 功能概述

本系统实现了跨页面的筛选条件持久化功能，确保用户在不同页面之间切换时，筛选条件能够自动保存和恢复。即使浏览器刷新后，之前设置的筛选条件也会被恢复。

## 核心特性

### 🔄 跨页面状态保持
- **项目总览页面** - 保存搜索词、状态、优先级、负责人、KR等筛选条件
- **项目概览页面** - 保存搜索词、状态筛选、优先级筛选
- **看板视图页面** - 保存用户选择、项目选择、KR选择、时间粒度、查看日期
- **周会视图页面** - 保存优先级、KR、参与者、状态筛选条件

### 💾 持久化存储
- 使用 `localStorage` 自动保存筛选条件
- 浏览器刷新后自动恢复之前的筛选状态
- 支持多个页面独立的筛选状态管理

### ⚡ 实时同步
- 筛选条件变化时立即保存
- 页面切换时状态无缝切换
- 高性能的状态更新机制

## 技术实现

### 状态管理架构
```
FilterStateProvider (React Context)
├── ProjectList Filters (项目总览)
├── ProjectOverview Filters (项目概览)  
├── KanbanView Filters (看板视图)
└── WeeklyMeeting Filters (周会视图)
```

### 核心组件

#### 1. FilterStateContext
- 集中管理所有页面的筛选状态
- 提供统一的状态更新接口
- 自动处理 localStorage 持久化

#### 2. useFilterState Hook
```typescript
const { state, updateProjectListFilters } = useFilterState();

// 更新项目列表筛选条件
updateProjectListFilters({
  searchTerm: '新搜索词',
  selectedStatuses: ['进行中', '已完成']
});
```

#### 3. 页面级别的筛选状态
每个页面都有独立的筛选状态结构：

```typescript
// 项目总览筛选状态
interface ProjectListFilters {
  searchTerm: string;
  selectedStatuses: string[];
  selectedPriorities: string[];
  selectedOwners: string[];
  selectedKrs: string[];
  dateRange: { start: string; end: string };
  hasComments: boolean;
}

// 看板视图筛选状态
interface KanbanViewFilters {
  selectedUserIds: string[];
  selectedProjectIds: string[];
  selectedKrIds: string[];
  granularity: 'week' | 'month';
  viewDate: string;
}
```

## 使用方法

### 1. 在组件中使用筛选状态

```typescript
import { useFilterState } from '../context/FilterStateContext';

const MyComponent = () => {
  const { state, updateProjectListFilters } = useFilterState();
  const filters = state.projectList;

  // 更新搜索词
  const handleSearchChange = (searchTerm: string) => {
    updateProjectListFilters({ searchTerm });
  };

  // 更新多个筛选条件
  const handleFiltersChange = (newFilters: Partial<ProjectListFilters>) => {
    updateProjectListFilters(newFilters);
  };

  return (
    <div>
      <input 
        value={filters.searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
      />
    </div>
  );
};
```

### 2. 性能优化

使用 `useFilterSelector` 进行精确的状态订阅：

```typescript
import { useFilterSelector } from '../context/FilterStateContext';

const SearchComponent = () => {
  // 只在搜索词变化时重新渲染
  const searchTerm = useFilterSelector(state => state.projectList.searchTerm);
  
  return <input value={searchTerm} />;
};
```

## 支持的页面和筛选条件

### 项目总览 (MainContent)
- ✅ 搜索关键词
- ✅ 项目状态多选
- ✅ 优先级多选  
- ✅ 负责人多选
- ✅ KR关联多选
- ✅ 日期范围选择
- ✅ 是否有评论

### 项目概览 (ProjectOverview)
- ✅ 搜索关键词
- ✅ 状态筛选
- ✅ 优先级筛选

### 看板视图 (KanbanView)
- ✅ 用户选择
- ✅ 项目选择
- ✅ KR选择
- ✅ 时间粒度 (周/月)
- ✅ 查看日期

### 周会视图 (WeeklyMeetingView)
- ✅ 优先级筛选
- ✅ KR筛选
- ✅ 参与者筛选
- ✅ 状态筛选

## 兼容性

### 浏览器支持
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

### 移动端支持
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ 响应式设计适配

## 故障排除

### 常见问题

1. **筛选条件没有保存**
   - 检查浏览器是否启用了 localStorage
   - 确认没有在隐私模式下使用

2. **页面切换后筛选条件丢失**
   - 确认 FilterStateProvider 已正确包装应用根组件
   - 检查组件是否正确使用 useFilterState Hook

3. **性能问题**
   - 使用 useFilterSelector 进行精确订阅
   - 避免在渲染函数中直接调用更新函数

### 调试方法

```typescript
// 在浏览器控制台查看当前筛选状态
console.log('Filter State:', JSON.parse(localStorage.getItem('filterState') || '{}'));

// 清除所有筛选状态
localStorage.removeItem('filterState');
```

## 更新日志

### v1.0.0 (2025-01-04)
- ✅ 实现基础的筛选条件持久化功能
- ✅ 支持项目总览、项目概览、看板视图、周会视图四个页面
- ✅ 集成到现有系统，无需额外配置
- ✅ 提供完整的 TypeScript 类型支持
- ✅ 移动端和桌面端兼容性优化