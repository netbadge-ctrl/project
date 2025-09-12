import React, { useMemo, useState, useEffect } from 'react';
import { Project, User, OKR, ProjectStatus, Comment } from '../types';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ActivityItem } from './ActivityItem';
import { AnnualStats } from './AnnualStats';


interface PersonalViewProps {
  projects: Project[];
  allUsers: User[];
  activeOkrs: OKR[];
  currentUser: User;
  onUpdateProject: (projectId: string, field: keyof Project, value: any) => void;
  onOpenModal: (type: 'role' | 'comments' | 'changelog', projectId: string, details?: any) => void;
  onToggleFollow: (projectId: string) => void;
  onReply: (project: Project, user: User) => void;
}

export const PersonalView: React.FC<PersonalViewProps> = ({ projects, allUsers, activeOkrs, currentUser, onUpdateProject, onOpenModal, onToggleFollow, onReply }) => {
  
  const handleMarkAsRead = async (projectId: string, commentId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const comment = project.comments.find(c => c.id === commentId);
    if (!comment) return;

    const readBy = comment.readBy || [];
    if (!readBy.includes(currentUser.id)) {
      const updatedReadBy = [...readBy, currentUser.id];
      const updatedComments = project.comments.map(c => 
        c.id === commentId ? { ...c, readBy: updatedReadBy } : c
      );
      await onUpdateProject(projectId, 'comments', updatedComments);
    }
  };
  const [detailModalProject, setDetailModalProject] = useState<Project | null>(null);

  useEffect(() => {
    if (detailModalProject) {
        const updatedProject = projects.find(p => p.id === detailModalProject.id);
        if (updatedProject && JSON.stringify(updatedProject) !== JSON.stringify(detailModalProject)) {
            setDetailModalProject(updatedProject);
        }
    }
  }, [projects, detailModalProject]);

  const { myActiveProjects, followedProjects, activityFeed } = useMemo(() => {
    const myActive: Project[] = [];
    const followed: Project[] = [];

    projects?.forEach(p => {
      const isParticipant = (
        (p.productManagers || []).some(m => m?.userId === currentUser.id) ||
        (p.backendDevelopers || []).some(m => m?.userId === currentUser.id) ||
        (p.frontendDevelopers || []).some(m => m?.userId === currentUser.id) ||
        (p.qaTesters || []).some(m => m?.userId === currentUser.id)
      );

      // "Ongoing" projects are those that are not 'Completed', 'LaunchedThisWeek', 'Not Started', and 'Paused'.
      const isOngoing = p.status !== ProjectStatus.Completed && 
                       p.status !== ProjectStatus.LaunchedThisWeek && 
                       p.status !== ProjectStatus.NotStarted && 
                       p.status !== ProjectStatus.Paused;

      if (isParticipant && isOngoing) {
        myActive.push(p);
      }

      if (p.followers && p.followers.includes(currentUser.id)) {
        followed.push(p);
      }
    });

    const relevantProjectIds = new Set([
        ...myActive.map(p => p.id),
        ...followed.map(p => p.id),
    ]);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const allComments: { comment: Comment; project: Project }[] = [];
    const seenCommentIds = new Set<string>();

    projects?.forEach(p => {
        (p.comments || []).forEach(c => {
            const commentDate = new Date(c.createdAt);
            const isRelevantProject = relevantProjectIds.has(p.id);
            const isMentioned = c.mentions?.includes(currentUser.id) ?? false;
            
            if (commentDate >= twoWeeksAgo && (isRelevantProject || isMentioned) && !seenCommentIds.has(c.id)) {
                allComments.push({ comment: c, project: p });
                seenCommentIds.add(c.id);
            }
        });
    });
    
    allComments.sort((a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime());

    return { myActiveProjects: myActive, followedProjects: followed, activityFeed: allComments };
  }, [projects, currentUser.id]);

  const Section: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => (
    <section>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {title} <span className="text-base font-normal text-gray-500 dark:text-gray-400">({count})</span>
      </h2>
      {count > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {children}
          </div>
      ) : (
          <div className="bg-white dark:bg-[#232323] border border-dashed border-gray-200 dark:border-[#363636] rounded-xl p-8 text-center text-gray-400 dark:text-gray-500">
              <p>暂无相关项目</p>
          </div>
      )}
    </section>
  );

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-[#1f1f1f]">
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <AnnualStats projects={projects} currentUser={currentUser} activeOkrs={activeOkrs} />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Left column for projects */}
            <div className="lg:col-span-3 space-y-8">
                <Section title="我参与的正在进行的项目" count={myActiveProjects.length}>
                  {myActiveProjects.map(project => (
                    <ProjectCard key={`my-${project.id}`} project={project} allUsers={allUsers} onClick={() => setDetailModalProject(project)} />
                  ))}
                </Section>
                <Section title="我关注的项目" count={followedProjects.length}>
                  {followedProjects.map(project => (
                    <ProjectCard key={`followed-${project.id}`} project={project} allUsers={allUsers} onClick={() => setDetailModalProject(project)} />
                  ))}
                </Section>
            </div>

            {/* Right column for activity feed */}
            <div className="lg:col-span-1 lg:sticky lg:top-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    过去两周的评论
                </h2>
                {activityFeed.length > 0 ? (
                    <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 -mr-2">
                        {activityFeed.map(({ comment, project }) => (
                            <ActivityItem 
                                key={comment.id}
                                comment={comment}
                                project={project}
                                allUsers={allUsers}
                                currentUser={currentUser}
                                onReply={onReply}
                                onMarkAsRead={handleMarkAsRead}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#232323] border border-dashed border-gray-200 dark:border-[#363636] rounded-xl p-8 text-center text-gray-400 dark:text-gray-500">
                        <p>暂无动态</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {detailModalProject && (
        <ProjectDetailModal
          project={detailModalProject}
          allUsers={allUsers}
          activeOkrs={activeOkrs}
          currentUser={currentUser}
          onClose={() => setDetailModalProject(null)}
          onUpdateProject={onUpdateProject}
          onOpenRoleModal={(roleKey, roleName) => onOpenModal('role', detailModalProject.id, { roleKey, roleName })}
          onToggleFollow={onToggleFollow}
        />
      )}
    </main>
  );
};