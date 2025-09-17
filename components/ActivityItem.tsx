import React, { useEffect } from 'react';
import { Comment, Project, User } from '../types';
import { formatDateTime, renderCommentTextAsHtml } from '../utils';
import { IconMessageSquare } from './Icons';

interface ActivityItemProps {
    comment: Comment;
    project: Project;
    allUsers: User[];
    currentUser: User;
    onReply: (project: Project, user: User) => void;
    onMarkAsRead: (projectId: string, commentId: string) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ comment, project, allUsers, currentUser, onReply, onMarkAsRead }) => {
    const author = allUsers.find(u => u.id === comment.userId);

    if (!author) return null;

    const handleReply = () => {
        if (author.id !== currentUser.id) {
            onReply(project, author);
        }
    };

    const isMentioned = comment.mentions?.includes(currentUser.id);
    const isRead = comment.readBy?.includes(currentUser.id) || false;
    const isOwnComment = comment.userId === currentUser.id;

    // 自动标记为已读（当用户看到评论时）
    useEffect(() => {
        if (!isRead && !isOwnComment) {
            const timer = setTimeout(() => {
                onMarkAsRead(project.id, comment.id);
            }, 2000); // 2秒后标记为已读
            return () => clearTimeout(timer);
        }
    }, [isRead, isOwnComment, onMarkAsRead, project.id, comment.id]);

    // 根据已读状态确定边框样式
    const getBorderStyle = () => {
        if (isOwnComment) {
            return 'border-blue-200 dark:border-blue-800/50'; // 自己的评论用蓝色边框
        }
        if (!isRead) {
            return 'border-orange-300 dark:border-orange-700/60 border-2'; // 未读用橙色粗边框
        }
        return 'border-slate-200 dark:border-slate-700/60'; // 已读用灰色边框
    };

    const getBackgroundStyle = () => {
        if (isOwnComment) {
            return 'bg-blue-50/50 dark:bg-blue-950/20';
        }
        if (!isRead) {
            return 'bg-orange-50/30 dark:bg-orange-950/10';
        }
        return 'bg-slate-50/50 dark:bg-slate-800/30';
    };

    return (
        <div className="relative">
            {isMentioned && (
                <div className="absolute -left-6 top-3 text-indigo-500 dark:text-indigo-400" title="你被提及了">
                    <IconMessageSquare className="w-3 h-3 fill-indigo-500/20 dark:fill-indigo-400/20" />
                </div>
            )}
            <div className={`${getBackgroundStyle()} border ${getBorderStyle()} rounded-xl p-4 min-w-0 transition-all duration-200`}>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{author.name}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">评论于</span>
                        <span className="font-medium text-indigo-600 dark:text-indigo-400 text-sm break-words">{project.name}</span>
                        {!isRead && !isOwnComment && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                新
                            </span>
                        )}
                    </div>
                </div>
                <div 
                    className="mt-2 text-gray-700 dark:text-gray-300 text-sm break-words leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderCommentTextAsHtml(comment, allUsers) }}
                />
                <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDateTime(comment.createdAt)}</span>
                    {author.id !== currentUser.id && (
                        <button 
                            onClick={handleReply}
                            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            回复
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
