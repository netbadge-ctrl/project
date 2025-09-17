import React from 'react';
import { Project, User } from '../types';
import { IconX, IconUser } from './Icons';
import { formatDateTime } from '../utils';

interface ChangeLogModalProps {
  project: Project;
  allUsers: User[];
  onClose: () => void;
}

export const ChangeLogModal: React.FC<ChangeLogModalProps> = ({ project, allUsers, onClose }) => {
  const getUser = (userId: string) => allUsers.find(u => u.id === userId);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl w-full max-w-3xl text-gray-900 dark:text-white shadow-lg flex flex-col h-[70vh]">
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-[#363636]">
          <h2 id="modal-title" className="text-xl font-bold">"{project.name}" 的变更记录</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="关闭">
            <IconX className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow p-4 overflow-y-auto">
          {(project.changeLog || []).length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 pt-10">暂无变更记录</div>
          ) : (
            <div className="space-y-4">
              {(project.changeLog || []).map(log => {
                const user = getUser(log.userId);
                return (
                  <div key={log.id} className="flex items-start gap-4 text-sm">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mt-1">
                        {user && <IconUser className="w-5 h-5 text-gray-500 dark:text-gray-400"/>}
                    </div>
                    <div className="flex-grow">
                        <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-900 dark:text-white">{user?.name || '未知用户'}</span>
                            <span className="text-gray-500 dark:text-gray-400"> 将 </span>
                            <span className="font-semibold text-cyan-600 dark:text-cyan-400">{log.field}</span>
                            <span className="text-gray-500 dark:text-gray-400"> 从 </span>
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400 bg-black/5 dark:bg-black/20 px-1 rounded">
                              {log.field === '本周进展/问题' || log.field === '上周进展/问题' || log.field === '解决的业务问题' 
                                ? (log.oldValue ? log.oldValue.replace(/<[^>]*>/g, '').trim() || '空' : '空')
                                : (log.oldValue || '空')
                              }
                            </span>
                            <span className="text-gray-500 dark:text-gray-400"> 修改为 </span>
                            <span className="font-semibold text-green-600 dark:text-green-400 bg-black/5 dark:bg-black/20 px-1 rounded">
                              {log.field === '本周进展/问题' || log.field === '上周进展/问题' || log.field === '解决的业务问题'
                                ? (log.newValue ? log.newValue.replace(/<[^>]*>/g, '').trim() || '空' : '空')
                                : (log.newValue || '空')
                              }
                            </span>
                        </p>
                       <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDateTime(log.changedAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-[#363636] flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-[#3a3a3a] border border-gray-300 dark:border-[#4a4a4a] text-gray-800 dark:text-gray-200 rounded-lg font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">关闭</button>
        </div>
      </div>
    </div>
  );
};