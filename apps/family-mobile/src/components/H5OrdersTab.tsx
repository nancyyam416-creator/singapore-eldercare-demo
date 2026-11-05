import { segmentedControlClass, segmentedOptionClass } from './segmentedControlStyles';
import React, { useEffect, useState } from 'react';
import { Order, ActivityLog, ReminderScenario, StoreCategoryScenario } from '../types';
import { H5ServiceDirectory } from './H5ServiceDirectory';
import { H5BookingConfirmation, ServiceAssistanceBadge } from './H5BookingConfirmation';
interface H5OrdersTabProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  activities: ActivityLog[];
  setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  elderName: string;
  elderId: string;
  reminderScenario: ReminderScenario;
  openReminderSignal: number;
  storeCategoryScenario: StoreCategoryScenario;
  openStoreSignal: number;
  elderProject: string;
  communityId?: string;
}

export const H5OrdersTab: React.FC<H5OrdersTabProps> = ({ communityId, storeCategoryScenario, openStoreSignal }) => {
  const [section, setSection] = useState('directory');
  useEffect(() => { setSection(storeCategoryScenario === 'records' ? 'records' : 'directory'); }, [storeCategoryScenario, openStoreSignal]);
  const previewCommunityId = storeCategoryScenario === 'alternate_community' ? 'COM-003' : storeCategoryScenario === 'empty' ? 'COM-002' : communityId;
  return <div id="h5-orders-tab" className="space-y-4 p-4">
    <div className={segmentedControlClass}>{[['directory','服务目录'],['records','服务协助记录']].map(([id,label]) => <button key={id} onClick={() => setSection(id)} aria-pressed={section === id} className={segmentedOptionClass(section === id)}>{label}{id === 'records' && <ServiceAssistanceBadge/>}</button>)}</div>
    {section === 'directory' ? <div key={`${storeCategoryScenario}-${openStoreSignal}-${communityId}`}><H5ServiceDirectory communityId={previewCommunityId} disabledCategory={storeCategoryScenario === 'category_disabled' ? 'water' : undefined} loadError={storeCategoryScenario === 'load_error'}/></div> : <div key={openStoreSignal}><H5BookingConfirmation visible inline resetSignal={0}/></div>}
  </div>;
};
