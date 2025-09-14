import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, User, Comment } from '../types';
import { IconX, IconUser } from './Icons';
import { formatDateTime, fuzzySearch, renderCommentTextAsHtml } from '../utils';

interface CommentModalProps {
  project: Project;
  allUsers: User[];
  currentUser: User;
  onClose: () => void;
  onAddComment: (projectId: string, text: string, mentions: string[]) => void;
  replyToUser?: User;
}

export const CommentModal: React.FC<CommentModalProps> = ({ project, allUsers, currentUser, onClose, onAddComment, replyToUser }) => {
  const [newComment, setNewComment] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionPopup, setMentionPopup] = useState<{ show: boolean; filter: string }>({ show: false, filter: '' });
  
  const getUser = (userId: string) => allUsers.find(u => u.id === userId);

  useEffect(() => {
    if (replyToUser) {
        setNewComment(`@${replyToUser.name} `);
        setMentionedUserIds(ids => [...new Set([...ids, replyToUser.id])]);
        textareaRef.current?.focus();
    }
  }, [replyToUser]);

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(project.id, newComment.trim(), mentionedUserIds);
      setNewComment('');
      setMentionedUserIds([]);
    }
  };

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project.comments]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\S*)$/);
    
    if (mentionMatch) {
        setMentionPopup({ show: true, filter: mentionMatch[1] });
    } else {
        setMentionPopup({ show: false, filter: '' });
    }
  };

  const handleSelectMention = (user: User) => {
    const currentText = newComment;
    const cursorPos = textareaRef.current?.selectionStart || currentText.length;
    const textBeforeCursor = currentText.substring(0, cursorPos);
    
    const newText = textBeforeCursor.replace(/@\S*$/, `@${user.name} `) + currentText.substring(cursorPos);

    setNewComment(newText);
    setMentionedUserIds(ids => [...new Set([...ids, user.id])]);
    setMentionPopup({ show: false, filter: '' });
    
    setTimeout(() => textareaRef.current?.focus(), 0);
  };
  
  const filteredMentionUsers = useMemo(() => {
      if (!mentionPopup.show) return [];
      const mentionedIdsSet = new Set(mentionedUserIds);
      const searchTerm = mentionPopup.filter.toLowerCase();
      
      return allUsers.filter(u => {
          // 只过滤已经被@过的用户，允许@自己
          if (mentionedIdsSet.has(u.id)) {
              return false;
          }
          
          // 1. 姓名模糊搜索
          if (fuzzySearch(mentionPopup.filter, u.name)) {
              return true;
          }
          
          // 2. 邮箱前缀匹配（用于拼音搜索）
          if (u.email) {
              const emailPrefix = u.email.split('@')[0].toLowerCase();
              if (emailPrefix.includes(searchTerm)) {
                  return true;
              }
          }
          
          return false;
      });
  }, [mentionPopup, allUsers, currentUser.id, mentionedUserIds]);


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#363636] rounded-xl w-full max-w-2xl text-gray-900 dark:text-white shadow-lg flex flex-col h-[70vh]">
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-[#363636]">
          <h2 id="modal-title" className="text-xl font-bold">"{project.name}" 的评论</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="关闭">
            <IconX className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
          {(project.comments || []).length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 pt-10">暂无评论</div>
          ) : (
            (project.comments || []).map(comment => {
              const user = getUser(comment.userId);
              const handleReplyToComment = () => {
                if (user && user.id !== currentUser.id) {
                  setNewComment(`@${user.name} `);
                  setMentionedUserIds(ids => [...new Set([...ids, user.id])]);
                  textareaRef.current?.focus();
                }
              };
              
              return (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mt-1">
                      {user && <IconUser className="w-5 h-5 text-gray-500 dark:text-gray-400"/>}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-baseline gap-2">
                       <span className="font-semibold text-gray-900 dark:text-white">{user?.name}</span>
                       <span className="text-xs text-gray-500 dark:text-gray-500">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <div className="mt-1 bg-gray-100 dark:bg-[#2d2d2d] rounded-lg p-3 text-sm" dangerouslySetInnerHTML={{ __html: renderCommentTextAsHtml(comment, allUsers) }}></div>
                    <div className="mt-2 flex justify-end">
                      {user && user.id !== currentUser.id && (
                        <button 
                          onClick={handleReplyToComment}
                          className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          回复
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-[#363636]">
          <div className="flex items-start gap-3">
             <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mt-1">
                <IconUser className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
             </div>
             <div className="flex-grow relative">
                {mentionPopup.show && filteredMentionUsers.length > 0 && (
                    <div className="absolute bottom-full mb-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#4a4a4a] rounded-lg shadow-xl z-10 p-1">
                        <ul>
                            {filteredMentionUsers.map(user => (
                                <li key={user.id}>
                                    <button onClick={() => handleSelectMention(user)} className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#3a3a3a] text-gray-800 dark:text-gray-200">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <IconUser className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                                        </div>
                                        <span className="text-sm font-semibold">{user.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={newComment}
                    onChange={handleTextChange}
                    onKeyDown={(e) => {
                        // 只允许换行，不允许回车提交
                        if (e.key === 'Enter' && !e.shiftKey) {
                            // 普通Enter键也允许换行，不提交
                            return;
                        }
                    }}
                    placeholder="添加评论... 输入 @ 来提及他人"
                    className="w-full bg-gray-100 dark:bg-[#2d2d2d] border border-gray-300 dark:border-[#4a4a4a] rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] resize-none"
                    rows={3}
                />
                <div className="flex justify-end mt-2">
                    <button 
                        onClick={handleSubmit}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-[#6C63FF] text-white rounded-lg font-semibold text-sm hover:bg-[#5a52d9] disabled:bg-gray-400 disabled:dark:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        发送
                    </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};