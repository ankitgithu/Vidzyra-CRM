import React from 'react';
import { renderToString } from 'react-dom/server';
import { CrmProvider, useCrm } from './src/context/CrmContext';
import { Dashboard } from './src/components/dashboard/Dashboard';
import { PaymentList } from './src/components/payments/PaymentList';
import { ClientList } from './src/components/clients/ClientList';
import { EditorList } from './src/components/editors/EditorList';
import { WorkList } from './src/components/work/WorkList';
import { Reports } from './src/components/reports/Reports';
import { DataCenter } from './src/components/datacenter/DataCenter';
import { Settings } from './src/components/settings/Settings';

// Set mock window and localStorage
(global as any).window = {
  location: { pathname: '/', search: '', hash: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  history: { pushState: () => {} },
};
(global as any).localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function TestRunner() {
  const tabs = ['dashboard', 'clients', 'editors', 'work', 'payments', 'reports', 'datacenter', 'settings'];
  for (const tab of tabs) {
    try {
      console.log(`Testing tab: ${tab}`);
      let html = '';
      if (tab === 'dashboard') {
        html = renderToString(
          <CrmProvider>
            <Dashboard onOpenWork={() => {}} onOpenClient={() => {}} onOpenEditor={() => {}} onOpenEditLink={() => {}} />
          </CrmProvider>
        );
      } else if (tab === 'payments') {
        html = renderToString(
          <CrmProvider>
            <PaymentList />
          </CrmProvider>
        );
      } else if (tab === 'clients') {
        html = renderToString(
          <CrmProvider>
            <ClientList onOpenClientDetail={() => {}} onOpenNewClient={() => {}} onEditClient={() => {}} onSharePortal={() => {}} onAddWorkForClient={() => {}} onAddPaymentForClient={() => {}} onOpenEditLink={() => {}} />
          </CrmProvider>
        );
      } else if (tab === 'editors') {
        html = renderToString(
          <CrmProvider>
            <EditorList onOpenEditorDetail={() => {}} onOpenNewEditor={() => {}} onEditEditor={() => {}} onSharePortal={() => {}} onAddPaymentForEditor={() => {}} />
          </CrmProvider>
        );
      } else if (tab === 'work') {
        html = renderToString(
          <CrmProvider>
            <WorkList onOpenWorkDetail={() => {}} onOpenNewWork={() => {}} onEditWork={() => {}} onEditLinks={() => {}} />
          </CrmProvider>
        );
      } else if (tab === 'reports') {
        html = renderToString(
          <CrmProvider>
            <Reports />
          </CrmProvider>
        );
      } else if (tab === 'datacenter') {
        html = renderToString(
          <CrmProvider>
            <DataCenter />
          </CrmProvider>
        );
      } else if (tab === 'settings') {
        html = renderToString(
          <CrmProvider>
            <Settings />
          </CrmProvider>
        );
      }
      console.log(`Tab ${tab} rendered OK (length: ${html.length})`);
    } catch (err) {
      console.error(`ERROR rendering ${tab}:`, err);
    }
  }
}

TestRunner();
