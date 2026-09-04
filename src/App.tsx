import React, { useState } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { Dashboard } from './components/dashboard/Dashboard';
import { ClientList } from './components/clients/ClientList';
import { ClientDetailModal } from './components/clients/ClientDetailModal';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { EditorList } from './components/editors/EditorList';
import { EditorDetailModal } from './components/editors/EditorDetailModal';
import { EditorFormModal } from './components/editors/EditorFormModal';
import { WorkList } from './components/work/WorkList';
import { WorkDetailModal } from './components/work/WorkDetailModal';
import { WorkFormModal } from './components/work/WorkFormModal';
import { PaymentList } from './components/payments/PaymentList';
import { PaymentFormModal } from './components/payments/PaymentFormModal';
import { Reports } from './components/reports/Reports';
import { DataCenter } from './components/datacenter/DataCenter';
import { Settings } from './components/settings/Settings';
import { ClientPortalView } from './components/portal/ClientPortalView';
import { EditorPortalView } from './components/portal/EditorPortalView';
import { EditLinkModal } from './components/modals/EditLinkModal';
import { SharePortalModal } from './components/modals/SharePortalModal';
import { Client, Editor, WorkProject } from './types';
import { AlertCircle } from 'lucide-react';
import { getSharedPortalSession } from './utils/portalAuth';

const MainApp: React.FC = () => {
  const {
    activeTab,
    activePortalUser,
    setActivePortalUser,
    searchQuery,
    setSearchQuery,
    projects,
    clients,
    editors,
    selectedWorkId,
    setSelectedWorkId,
    isLoading,
  } = useCrm();

  // Modals state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Client Modals
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  // Editor Modals
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);
  const [isEditorFormOpen, setIsEditorFormOpen] = useState(false);
  const [editorToEdit, setEditorToEdit] = useState<Editor | null>(null);

  // Work Modals
  const [isWorkFormOpen, setIsWorkFormOpen] = useState(false);
  const [workToEdit, setWorkToEdit] = useState<WorkProject | null>(null);
  const [defaultWorkClientId, setDefaultWorkClientId] = useState<string | null>(null);

  // Payment Modal
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [paymentDefaultCategory, setPaymentDefaultCategory] = useState<'Client' | 'Editor' | 'Expense'>('Client');
  const [paymentDefaultRecipientId, setPaymentDefaultRecipientId] = useState<string | null>(null);

  // Four-Link Modal
  const [editLinkWorkId, setEditLinkWorkId] = useState<string | null>(null);

  // Share Portal Modal
  const [sharePortalData, setSharePortalData] = useState<{
    type: 'client' | 'editor';
    id: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-slate-800/90 border border-slate-700/70 p-8 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">Vidzyra CRM</h2>
            <p className="text-xs text-slate-400">Connecting to cloud database...</p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Standalone Shared Portal Route (isolated from Admin CRM)
  const sharedPortal = getSharedPortalSession();
  if (sharedPortal) {
    if (sharedPortal.type === 'client') {
      const client = clients.find((c) => c.portalToken === sharedPortal.token || c.id === sharedPortal.token);
      if (!client) {
        return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Client Portal Not Found</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                The requested client portal link is invalid or has expired. Please contact Vidzyra support.
              </p>
            </div>
          </div>
        );
      }
      return <ClientPortalView clientId={client.id} isSharedPortal={true} />;
    }

    if (sharedPortal.type === 'editor') {
      const editor = editors.find((e) => e.portalToken === sharedPortal.token || e.id === sharedPortal.token);
      if (!editor) {
        return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Editor Portal Not Found</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                The requested editor portal link is invalid or has expired. Please contact Vidzyra management.
              </p>
            </div>
          </div>
        );
      }
      return <EditorPortalView editorId={editor.id} isSharedPortal={true} />;
    }
  }

  // 2. Admin In-App Preview mode (when admin simulates portal within CRM)
  if (activePortalUser) {
    if (activePortalUser.type === 'client') {
      return (
        <ClientPortalView
          clientId={activePortalUser.id}
          onExit={() => setActivePortalUser(null)}
          isSharedPortal={false}
        />
      );
    }
    if (activePortalUser.type === 'editor') {
      return (
        <EditorPortalView
          editorId={activePortalUser.id}
          onExit={() => setActivePortalUser(null)}
          isSharedPortal={false}
        />
      );
    }
  }

  // Handlers
  const handleOpenClientDetail = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleOpenNewClient = () => {
    setClientToEdit(null);
    setIsClientFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsClientFormOpen(true);
  };

  const handleOpenEditorDetail = (editorId: string) => {
    setSelectedEditorId(editorId);
  };

  const handleOpenNewEditor = () => {
    setEditorToEdit(null);
    setIsEditorFormOpen(true);
  };

  const handleEditEditor = (editor: Editor) => {
    setEditorToEdit(editor);
    setIsEditorFormOpen(true);
  };

  const handleOpenWorkDetail = (workId: string) => {
    setSelectedWorkId(workId);
  };

  const handleOpenNewWork = (clientId?: string) => {
    setWorkToEdit(null);
    setDefaultWorkClientId(clientId || null);
    setIsWorkFormOpen(true);
  };

  const handleEditWork = (project: WorkProject) => {
    setWorkToEdit(project);
    setIsWorkFormOpen(true);
  };

  const handleOpenNewPayment = (category: 'Client' | 'Editor' | 'Expense' = 'Client', recipientId?: string) => {
    setPaymentDefaultCategory(category);
    setPaymentDefaultRecipientId(recipientId || null);
    setIsPaymentFormOpen(true);
  };

  const handleOpenSharePortal = (type: 'client' | 'editor', id: string) => {
    setSharePortalData({ type, id });
  };

  const handleOpenEditLinks = (workId: string) => {
    setEditLinkWorkId(workId);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans antialiased">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenNewWork={() => handleOpenNewWork()}
          onOpenNewClient={handleOpenNewClient}
          onOpenNewPayment={() => handleOpenNewPayment('Client')}
          onToggleNotifications={() => setIsNotificationsOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* View Switcher */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
          {activeTab === 'dashboard' && (
            <Dashboard
              onOpenWork={handleOpenWorkDetail}
              onOpenClient={handleOpenClientDetail}
              onOpenEditor={handleOpenEditorDetail}
              onOpenEditLink={handleOpenEditLinks}
            />
          )}

          {activeTab === 'clients' && (
            <ClientList
              onOpenClientDetail={handleOpenClientDetail}
              onOpenNewClient={handleOpenNewClient}
              onEditClient={handleEditClient}
              onSharePortal={(cId) => handleOpenSharePortal('client', cId)}
              onAddWorkForClient={(cId) => handleOpenNewWork(cId)}
              onAddPaymentForClient={(cId) => handleOpenNewPayment('Client', cId)}
              onOpenEditLink={handleOpenEditLinks}
            />
          )}

          {activeTab === 'editors' && (
            <EditorList
              onOpenEditorDetail={handleOpenEditorDetail}
              onOpenNewEditor={handleOpenNewEditor}
              onEditEditor={handleEditEditor}
              onSharePortal={(eId) => handleOpenSharePortal('editor', eId)}
              onAddPaymentForEditor={(eId) => handleOpenNewPayment('Editor', eId)}
            />
          )}

          {activeTab === 'work' && (
            <WorkList
              onOpenWorkDetail={handleOpenWorkDetail}
              onOpenNewWork={() => handleOpenNewWork()}
              onEditWork={handleEditWork}
              onEditLinks={handleOpenEditLinks}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentList onOpenNewPayment={handleOpenNewPayment} />
          )}

          {activeTab === 'reports' && <Reports />}

          {activeTab === 'datacenter' && <DataCenter />}

          {activeTab === 'settings' && <Settings />}
        </div>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenWork={handleOpenWorkDetail}
        onOpenClient={handleOpenClientDetail}
        onOpenEditor={handleOpenEditorDetail}
      />

      {/* Client Detail Modal */}
      <ClientDetailModal
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
        clientId={selectedClientId}
        onOpenWork={handleOpenWorkDetail}
        onAddWorkForClient={(cId) => handleOpenNewWork(cId)}
        onAddPaymentForClient={(cId) => handleOpenNewPayment('Client', cId)}
        onSharePortal={(cId) => handleOpenSharePortal('client', cId)}
        onEditLink={handleOpenEditLinks}
      />

      {/* Client Form Modal (Add / Edit) */}
      <ClientFormModal
        isOpen={isClientFormOpen}
        onClose={() => {
          setIsClientFormOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
      />

      {/* Editor Detail Modal */}
      <EditorDetailModal
        isOpen={!!selectedEditorId}
        onClose={() => setSelectedEditorId(null)}
        editorId={selectedEditorId}
        onOpenWork={handleOpenWorkDetail}
        onAddPaymentForEditor={(eId) => handleOpenNewPayment('Editor', eId)}
        onSharePortal={(eId) => handleOpenSharePortal('editor', eId)}
        onEditLink={handleOpenEditLinks}
      />

      {/* Editor Form Modal (Add / Edit) */}
      <EditorFormModal
        isOpen={isEditorFormOpen}
        onClose={() => {
          setIsEditorFormOpen(false);
          setEditorToEdit(null);
        }}
        editorToEdit={editorToEdit}
      />

      {/* Work Detail Modal */}
      <WorkDetailModal
        isOpen={!!selectedWorkId}
        onClose={() => setSelectedWorkId(null)}
        workId={selectedWorkId}
        onEditWork={(wId) => {
          setSelectedWorkId(null);
          const pr = projects.find((p) => p.id === wId);
          if (pr) handleEditWork(pr);
        }}
        onEditLinks={handleOpenEditLinks}
      />

      {/* Work Form Modal (Create / Edit) */}
      <WorkFormModal
        isOpen={isWorkFormOpen}
        onClose={() => {
          setIsWorkFormOpen(false);
          setWorkToEdit(null);
          setDefaultWorkClientId(null);
        }}
        workToEdit={workToEdit}
        defaultClientId={defaultWorkClientId}
      />

      {/* Payment Form Modal */}
      <PaymentFormModal
        isOpen={isPaymentFormOpen}
        onClose={() => {
          setIsPaymentFormOpen(false);
          setPaymentDefaultRecipientId(null);
        }}
        defaultRecipientType={paymentDefaultCategory}
        defaultRecipientId={paymentDefaultRecipientId}
      />

      {/* Four-Link Configuration Modal */}
      <EditLinkModal
        isOpen={!!editLinkWorkId}
        onClose={() => setEditLinkWorkId(null)}
        workId={editLinkWorkId}
      />

      {/* Share Portal Modal */}
      {sharePortalData && (
        <SharePortalModal
          isOpen={!!sharePortalData}
          onClose={() => setSharePortalData(null)}
          entityType={sharePortalData.type}
          entityId={sharePortalData.id}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <CrmProvider>
      <MainApp />
    </CrmProvider>
  );
}
