import DashboardView from './DashboardView';
import ReportsView from './ReportsView';
import PredictionForm from './PredictionForm';
import UploadData from './UploadData';
import Settings from './Settings';
import DataExplorer from './DataExplorer';

interface DashboardContentProps {
  activeTab: string;
}

export default function DashboardContent({ activeTab }: DashboardContentProps) {
  return (
    <>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'predict' && <PredictionForm />}
      {activeTab === 'upload' && <UploadData />}
      {activeTab === 'explorer' && <DataExplorer />}
      {activeTab === 'settings' && <Settings />}
    </>
  );
}
