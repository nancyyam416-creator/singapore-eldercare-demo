import { segmentedControlClass, segmentedOptionClass } from './segmentedControlStyles';
import React, { useState } from 'react';
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

export const H5OrdersTab: React.FC<H5OrdersTabProps> = ({ communityId }) => {
  const [section, setSection] = useState('directory');
  return <div id="h5-orders-tab" className="space-y-4 p-4">
    <div className={segmentedControlClass}>{[['directory','服务目录'],['records','服务协助记录']].map(([id,label]) => <button key={id} onClick={() => setSection(id)} aria-pressed={section === id} className={segmentedOptionClass(section === id)}>{label}{id === 'records' && <ServiceAssistanceBadge/>}</button>)}</div>
    {section === 'directory' ? <H5ServiceDirectory communityId={communityId}/> : <H5BookingConfirmation visible inline resetSignal={0}/>}
  </div>;
};
