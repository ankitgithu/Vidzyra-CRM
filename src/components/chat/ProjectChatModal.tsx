import React from 'react';
import { X } from 'lucide-react';
import { ProjectChatBox } from './ProjectChatBox';

interface ProjectChatModalProps {
  projectId: string;
  viewerRole: 'admin' | 'client' | 'editor';
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}

export const ProjectChatModal: React.FC<ProjectChatModalProps> = ({
  projectId,
  viewerRole,
  currentUserId,
  currentUserName,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ProjectChatBox
          projectId={projectId}
          viewerRole={viewerRole}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
