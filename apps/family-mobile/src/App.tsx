/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import {
  Medication,
  HealthStats,
  ActivityLog,
  Order,
  HomeCareScenario,
  HomeActivityScenario,
  FamilyReceiptScenario,
  FamilyMessageScenario,
  FamilyPhotoScenario,
  FamilyReceiptFilter,
  CareFeedScenario,
  ElderStatusCardScenario,
  ReassuranceScoreScenario,
  ElderProfileDataScenario,
  ElderProfileDeviceScenario,
  ElderBindingScenario,
  ReminderScenario,
  ChildLoginScenario,
  StoreCategoryScenario
} from './types';
import { 
  initialParentProfile, 
  initialMedications, 
  initialHealthStats, 
  initialActivities, 
  initialOrders 
} from './data/mockData';
import { IoTControlSandbox } from './components/IoTControlSandbox';
import { H5AppFrame } from './components/H5AppFrame';
import { H5InteractionWorkbench } from './components/H5InteractionWorkbench';

export default function App() {
  // Shared Live Synchronized State between Home IoT Sensors and the Mobile H5 App
  const [parentProfile, setParentProfile] = useState(initialParentProfile);
  const [healthStats, setHealthStats] = useState<HealthStats>(initialHealthStats);
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [showSimulator, setShowSimulator] = useState(false);
  const [homeCareScenario, setHomeCareScenario] = useState<HomeCareScenario>('normal');
  const [homeActivityScenario, setHomeActivityScenario] = useState<HomeActivityScenario>('normal');
  const [familyReceiptScenario, setFamilyReceiptScenario] = useState<FamilyReceiptScenario>('multiple');
  const [familyMessageScenario, setFamilyMessageScenario] = useState<FamilyMessageScenario>('normal');
  const [familyPhotoScenario, setFamilyPhotoScenario] = useState<FamilyPhotoScenario>('list_default');
  const [careFeedScenario, setCareFeedScenario] = useState<CareFeedScenario>('normal');
  const [elderStatusCardScenario, setElderStatusCardScenario] = useState<ElderStatusCardScenario>('normal');
  const [reassuranceScoreScenario, setReassuranceScoreScenario] = useState<ReassuranceScoreScenario>('normal');
  const [elderProfileDataScenario, setElderProfileDataScenario] = useState<ElderProfileDataScenario>('normal');
  const [elderProfileDeviceScenario, setElderProfileDeviceScenario] = useState<ElderProfileDeviceScenario>('all_online');
  const [elderBindingScenario, setElderBindingScenario] = useState<ElderBindingScenario>('bound');
  const [reminderScenario, setReminderScenario] = useState<ReminderScenario>('list');
  const [loginScenario, setLoginScenario] = useState<ChildLoginScenario>('default');
  const [storeCategoryScenario, setStoreCategoryScenario] = useState<StoreCategoryScenario>('default');
  const [elderProfileRadarExpanded, setElderProfileRadarExpanded] = useState(true);
  const [previewOpenElderProfileSignal, setPreviewOpenElderProfileSignal] = useState(0);
  const [previewCloseElderProfileSignal, setPreviewCloseElderProfileSignal] = useState(0);
  const [previewOpenScoreDetailsSignal, setPreviewOpenScoreDetailsSignal] = useState(0);
  const [previewCloseScoreDetailsSignal, setPreviewCloseScoreDetailsSignal] = useState(0);
  const [previewOpenFamilyReceiptsSignal, setPreviewOpenFamilyReceiptsSignal] = useState(0);
  const [previewOpenFamilyMessagesSignal, setPreviewOpenFamilyMessagesSignal] = useState(0);
  const [previewOpenFamilyPhotosSignal, setPreviewOpenFamilyPhotosSignal] = useState(0);
  const [previewOpenHomeSignal, setPreviewOpenHomeSignal] = useState(0);
  const [previewCloseFamilyReceiptsSignal, setPreviewCloseFamilyReceiptsSignal] = useState(0);
  const [previewCompleteFamilyVoiceSignal, setPreviewCompleteFamilyVoiceSignal] = useState(0);
  const [previewOpenMedicationDetailsSignal, setPreviewOpenMedicationDetailsSignal] = useState(0);
  const [previewFamilyReceiptFilter, setPreviewFamilyReceiptFilter] = useState<FamilyReceiptFilter>('all');
  const [previewResetSignal, setPreviewResetSignal] = useState(0);
  const [previewOpenProfileSignal, setPreviewOpenProfileSignal] = useState(0);
  const [previewOpenRemindersSignal, setPreviewOpenRemindersSignal] = useState(0);
  const [previewOpenLoginSignal, setPreviewOpenLoginSignal] = useState(0);
  const [previewOpenStoreSignal, setPreviewOpenStoreSignal] = useState(0);
  const [activePreviewPage, setActivePreviewPage] = useState<'login' | 'home' | 'family' | 'care' | 'profile'>('login');
  const [activePreviewFamilyModule, setActivePreviewFamilyModule] = useState<'family_messages' | 'family_photos'>('family_messages');
  
  // Real-time Emergency state triggered by the IoT sandbox
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);

  const handleTriggerEmergency = (msg: string) => {
    setEmergencyAlert(msg);
    setHealthStats(prev => ({ 
      ...prev, 
      heartRate: 118, 
      heartRateStatus: 'abnormal'
    }));
  };

  const handleClearEmergency = () => {
    setEmergencyAlert(null);
    setHealthStats(prev => ({ 
      ...prev, 
      heartRate: 72, 
      heartRateStatus: 'normal'
    }));
    // Log the reset
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    setActivities(prev => [{
      id: `act-clear-${Date.now()}`,
      time: timeStr,
      content: "物联网重置：系统已一键清除紧急警报状态，长辈各项指标恢复正常 🟢",
      type: "info"
    }, ...prev]);
  };

  const handleResetPreview = () => {
    setHomeCareScenario('normal');
    setHomeActivityScenario('normal');
    setFamilyReceiptScenario('multiple');
    setFamilyMessageScenario('normal');
    setFamilyPhotoScenario('list_default');
    setCareFeedScenario('normal');
    setElderStatusCardScenario('normal');
    setReassuranceScoreScenario('normal');
    setElderProfileDataScenario('normal');
    setElderProfileDeviceScenario('all_online');
    setElderBindingScenario('bound');
    setReminderScenario('list');
    setLoginScenario('default');
    setStoreCategoryScenario('default');
    setElderProfileRadarExpanded(true);
    setPreviewCloseScoreDetailsSignal(value => value + 1);
    setPreviewCloseFamilyReceiptsSignal(value => value + 1);
    setPreviewResetSignal(value => value + 1);
    setPreviewOpenLoginSignal(value => value + 1);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Main Container Layout */}
      <main className="flex-1 w-full mx-auto p-0 sm:p-4 lg:p-5 flex flex-col justify-center min-h-0">
        
        {/* Formal mobile preview stays focused; simulator is an optional demo tool. */}
        <div className={`flex flex-col lg:flex-row gap-8 items-start justify-center ${showSimulator ? 'max-w-[1440px]' : 'max-w-[830px]'} w-full mx-auto`}>
          
          {/* MOBILE APP */}
          <div className="flex w-full max-w-[450px] flex-col items-center">
            <H5AppFrame 
              parentProfile={parentProfile}
              healthStats={healthStats}
              setHealthStats={setHealthStats}
              medications={medications}
              setMedications={setMedications}
              activities={activities}
              setActivities={setActivities}
              orders={orders}
              setOrders={setOrders}
              emergencyAlert={emergencyAlert}
              setEmergencyAlert={setEmergencyAlert}
              homeCareScenario={homeCareScenario}
              homeActivityScenario={homeActivityScenario}
              familyReceiptScenario={familyReceiptScenario}
              familyMessageScenario={familyMessageScenario}
              familyPhotoScenario={familyPhotoScenario}
              careFeedScenario={careFeedScenario}
              elderStatusCardScenario={elderStatusCardScenario}
              reassuranceScoreScenario={reassuranceScoreScenario}
              elderProfileDataScenario={elderProfileDataScenario}
              elderProfileDeviceScenario={elderProfileDeviceScenario}
              elderProfileRadarExpanded={elderProfileRadarExpanded}
              setElderProfileRadarExpanded={setElderProfileRadarExpanded}
              onRetryElderProfile={() => setElderProfileDataScenario('normal')}
              previewOpenElderProfileSignal={previewOpenElderProfileSignal}
              previewCloseElderProfileSignal={previewCloseElderProfileSignal}
              previewOpenScoreDetailsSignal={previewOpenScoreDetailsSignal}
              previewCloseScoreDetailsSignal={previewCloseScoreDetailsSignal}
              previewOpenFamilyReceiptsSignal={previewOpenFamilyReceiptsSignal}
              previewOpenFamilyMessagesSignal={previewOpenFamilyMessagesSignal}
              previewOpenFamilyPhotosSignal={previewOpenFamilyPhotosSignal}
              previewOpenHomeSignal={previewOpenHomeSignal}
              previewCloseFamilyReceiptsSignal={previewCloseFamilyReceiptsSignal}
              previewFamilyReceiptFilter={previewFamilyReceiptFilter}
              previewCompleteFamilyVoiceSignal={previewCompleteFamilyVoiceSignal}
              previewOpenMedicationDetailsSignal={previewOpenMedicationDetailsSignal}
              previewResetSignal={previewResetSignal}
              previewOpenProfileSignal={previewOpenProfileSignal}
              reminderScenario={reminderScenario}
              previewOpenRemindersSignal={previewOpenRemindersSignal}
              loginScenario={loginScenario}
              previewOpenLoginSignal={previewOpenLoginSignal}
              elderBindingScenario={elderBindingScenario}
              storeCategoryScenario={storeCategoryScenario}
              previewOpenStoreSignal={previewOpenStoreSignal}
              onPreviewContextChange={(page, familyModule) => {
                setActivePreviewPage(page);
                if (familyModule) setActivePreviewFamilyModule(familyModule);
              }}
            />
          </div>

          <H5InteractionWorkbench
            activePreviewPage={activePreviewPage}
            activePreviewFamilyModule={activePreviewFamilyModule}
            homeCareScenario={homeCareScenario}
            homeActivityScenario={homeActivityScenario}
            familyReceiptScenario={familyReceiptScenario}
            familyMessageScenario={familyMessageScenario}
            familyPhotoScenario={familyPhotoScenario}
            careFeedScenario={careFeedScenario}
            elderStatusCardScenario={elderStatusCardScenario}
            reassuranceScoreScenario={reassuranceScoreScenario}
            elderProfileDataScenario={elderProfileDataScenario}
            elderProfileDeviceScenario={elderProfileDeviceScenario}
            elderBindingScenario={elderBindingScenario}
            reminderScenario={reminderScenario}
            loginScenario={loginScenario}
            storeCategoryScenario={storeCategoryScenario}
            elderProfileRadarExpanded={elderProfileRadarExpanded}
            showSimulator={showSimulator}
            onHomeCareScenarioChange={setHomeCareScenario}
            onHomeActivityScenarioChange={setHomeActivityScenario}
            onFamilyReceiptScenarioChange={setFamilyReceiptScenario}
            onFamilyMessageScenarioChange={setFamilyMessageScenario}
            onFamilyPhotoScenarioChange={setFamilyPhotoScenario}
            onOpenFamilyMessages={() => setPreviewOpenFamilyMessagesSignal(value => value + 1)}
            onOpenFamilyPhotos={() => setPreviewOpenFamilyPhotosSignal(value => value + 1)}
            onOpenHome={() => setPreviewOpenHomeSignal(value => value + 1)}
            onOpenElderBinding={() => setPreviewOpenProfileSignal(value => value + 1)}
            onCareFeedScenarioChange={scenario => {
              setCareFeedScenario(scenario);
              setHomeCareScenario(scenario === 'medication_overdue' ? 'medication_overdue' : 'normal');
            }}
            onElderStatusCardScenarioChange={setElderStatusCardScenario}
            onReassuranceScoreScenarioChange={setReassuranceScoreScenario}
            onElderProfileDataScenarioChange={setElderProfileDataScenario}
            onElderProfileDeviceScenarioChange={setElderProfileDeviceScenario}
            onElderBindingScenarioChange={setElderBindingScenario}
            onReminderScenarioChange={setReminderScenario}
            onLoginScenarioChange={setLoginScenario}
            onStoreCategoryScenarioChange={setStoreCategoryScenario}
            onOpenLogin={() => setPreviewOpenLoginSignal(value => value + 1)}
            onElderProfileRadarExpandedChange={setElderProfileRadarExpanded}
            onOpenElderProfile={() => setPreviewOpenElderProfileSignal(value => value + 1)}
            onCloseElderProfile={() => setPreviewCloseElderProfileSignal(value => value + 1)}
            onOpenScoreDetails={() => setPreviewOpenScoreDetailsSignal(value => value + 1)}
            onCloseScoreDetails={() => setPreviewCloseScoreDetailsSignal(value => value + 1)}
            onOpenFamilyReceipts={filter => {
              setPreviewFamilyReceiptFilter(filter);
              setPreviewOpenFamilyReceiptsSignal(value => value + 1);
            }}
            onCloseFamilyReceipts={() => setPreviewCloseFamilyReceiptsSignal(value => value + 1)}
            onCompleteFamilyVoice={() => setPreviewCompleteFamilyVoiceSignal(value => value + 1)}
            onOpenMedicationDetails={() => {
              setCareFeedScenario('medication_overdue');
              setHomeCareScenario('medication_overdue');
              setPreviewOpenMedicationDetailsSignal(value => value + 1);
            }}
            onOpenReminders={() => setPreviewOpenRemindersSignal(value => value + 1)}
            onOpenStore={() => setPreviewOpenStoreSignal(value => value + 1)}
            onReset={handleResetPreview}
            onToggleSimulator={() => setShowSimulator(value => !value)}
          />

          {/* OPTIONAL DEVELOPMENT SIMULATOR */}
          {showSimulator && (
          <div className="hidden sm:flex flex-col items-center space-y-4 w-full max-w-md">
            <div className="w-full max-w-md flex items-center justify-between px-1">
              <span className="text-2xs font-extrabold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                <Cpu size={14} />
                演示工具 · 设备仿真
              </span>
              <span className="text-3xs text-slate-400 font-medium">不属于正式子女端页面</span>
            </div>
            
            <IoTControlSandbox 
              healthStats={healthStats}
              setHealthStats={setHealthStats}
              medications={medications}
              setMedications={setMedications}
              activities={activities}
              setActivities={setActivities}
              triggerEmergencyAlert={handleTriggerEmergency}
              clearEmergencyAlert={handleClearEmergency}
              hasActiveAlert={emergencyAlert !== null}
            />
          </div>
          )}

        </div>
      </main>

      <footer className="hidden sm:block border-t border-slate-200 bg-white py-4 px-6 shrink-0 text-center text-xs text-slate-500 mt-12">
        © 2026 智慧养老长辈健康监护与服务商城 H5 系统版 • 基于 React 19 + Tailwind CSS 4 + Vite + Gemini 3.5 AI
      </footer>
    </div>
  );
}
