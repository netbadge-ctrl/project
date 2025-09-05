import React, { useMemo } from 'react';
import { Project, User, OKR, ProjectStatus } from '../types';
import { IconBriefcase, IconRocket, IconClipboard, IconTarget } from './Icons';

interface AnnualStatsProps {
  projects: Project[];
  activeOkrs: OKR[];
  currentUser: User;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: number | string; colorClasses: string; }> = ({ icon, title, value, colorClasses }) => (
    <div className={`p-4 rounded-xl flex items-center gap-4 ${colorClasses}`}>
        <div className="p-3 rounded-lg bg-white/20">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </div>
);

export const AnnualStats: React.FC<AnnualStatsProps> = ({ projects, activeOkrs, currentUser }) => {
    
    const stats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        
        const myProjects = projects.filter(p => 
            (p.productManagers || []).some(m => m.userId === currentUser.id) ||
            (p.backendDevelopers || []).some(m => m.userId === currentUser.id) ||
            (p.frontendDevelopers || []).some(m => m.userId === currentUser.id) ||
            (p.qaTesters || []).some(m => m.userId === currentUser.id)
        );

        const annualProjects = myProjects.filter(p => 
            p.proposedDate && new Date(p.proposedDate).getFullYear() === currentYear
        );

        const launchedProjects = myProjects.filter(p =>
            p.status === ProjectStatus.Launched && p.launchDate && new Date(p.launchDate).getFullYear() === currentYear
        );

        // 进行的OKR项目：状态不等于未开始、暂停、已上线且项目绑定了OKR
        const ongoingOkrProjects = myProjects.filter(p => 
            p.status !== ProjectStatus.NotStarted && 
            p.status !== ProjectStatus.Paused && 
            p.status !== ProjectStatus.Launched &&
            (p.keyResultIds || []).length > 0
        );

        // 年度已上线OKR项目：状态为已上线且项目绑定了OKR
        const launchedOkrProjects = myProjects.filter(p =>
            p.status === ProjectStatus.Launched && 
            p.launchDate && 
            new Date(p.launchDate).getFullYear() === currentYear &&
            (p.keyResultIds || []).length > 0
        );

        const krToOkrMap = new Map<string, string>();
        (activeOkrs || []).forEach(okr => {
            (okr.keyResults || []).forEach(kr => {
                krToOkrMap.set(kr.id, okr.id);
            });
        });
        
        const contributedOkrIds = new Set<string>();
        myProjects.forEach(p => {
            (p.keyResultIds || []).forEach(krId => {
                const okrId = krToOkrMap.get(krId);
                if (okrId) {
                    contributedOkrIds.add(okrId);
                }
            });
        });

        return {
            launchedCount: launchedProjects.length,
            ongoingOkrCount: ongoingOkrProjects.length,
            launchedOkrCount: launchedOkrProjects.length,
        };
    }, [projects, activeOkrs, currentUser]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard 
                icon={<IconRocket className="w-6 h-6"/>}
                title="年度上线项目"
                value={stats.launchedCount}
                colorClasses="bg-green-500 text-white"
            />
            <StatCard 
                icon={<IconClipboard className="w-6 h-6"/>}
                title="进行的OKR项目"
                value={stats.ongoingOkrCount}
                colorClasses="bg-orange-500 text-white"
            />
            <StatCard 
                icon={<IconTarget className="w-6 h-6"/>}
                title="年度已上线OKR项目"
                value={stats.launchedOkrCount}
                colorClasses="bg-purple-500 text-white"
            />
        </div>
    );
};