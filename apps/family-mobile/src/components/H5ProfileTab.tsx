/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Headphones,
  KeyRound,
  Link2,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { BoundElder, ElderBindingScenario } from '../types';
import { H5ElderBindingFlow } from './H5ElderBindingFlow';
import { BindingAction, BindingState, bindingCandidates, bindingStatusLabels, mockApplicantId } from '../data/familyBinding';

interface H5ProfileTabProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenAssistance: () => void;
  residenceAddress: string;
  onSaveResidenceAddress: (address: string) => void;
  boundElders: BoundElder[];
  currentElderId: string | null;
  bindingScenario: ElderBindingScenario;
  bindingState: BindingState;
  bindingDispatch: React.Dispatch<BindingAction>;
  onSwitchElder: (elderId: string) => void;
  onEnterElderHome: (elderId: string) => void;
}

export const H5ProfileTab: React.FC<H5ProfileTabProps> = ({
  isLoggedIn,
  onLogin,
  onLogout,
  onOpenAssistance,
  residenceAddress,
  onSaveResidenceAddress,
  boundElders,
  currentElderId,
  bindingScenario,
  bindingState,
  bindingDispatch,
  onSwitchElder,
  onEnterElderHome
}) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [profileView, setProfileView] = useState<'main' | 'address_edit' | 'elder_binding' | 'request_records'>('main');
  const [draftAddress, setDraftAddress] = useState(residenceAddress);
  const [addressSaved, setAddressSaved] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRequestId(null);
    setProfileView(bindingScenario === 'bound' || bindingScenario === 'relationship_removed' || bindingScenario === 'records_multiple' ? 'main' : 'elder_binding');
  }, [bindingScenario]);

  const handleSendCode = () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    setError('');
    setCodeSent(true);
  };

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    if (code !== '123456') {
      setError('请输入正确的验证码');
      return;
    }
    setError('');
    onLogin();
  };

  const handleLogout = () => {
    const confirmed = window.confirm('退出后将无法查看长辈信息、服务和订单，确定退出登录吗？');
    if (confirmed) {
      setPhone('');
      setCode('');
      setCodeSent(false);
      setError('');
      onLogout();
    }
  };

  const openAddressEditor = () => {
    setDraftAddress(residenceAddress);
    setAddressSaved(false);
    setProfileView('address_edit');
  };

  const saveAddress = () => {
    const value = draftAddress.trim();
    if (!value) return;
    onSaveResidenceAddress(value);
    setAddressSaved(true);
    setProfileView('main');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-full p-4 flex items-center justify-center bg-slate-50">
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4">
            <LogIn size={22} />
          </div>
          <h2 className="text-lg font-black text-slate-900">登录子女端</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            登录后可查看已绑定长辈的照护状态、服务和订单。
          </p>

          <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">手机号</span>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white">
                <Phone size={15} className="text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                  placeholder="请输入手机号"
                  className="w-full py-3 bg-transparent text-sm text-slate-900 outline-none"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">验证码</span>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white">
                  <KeyRound size={15} className="text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                    placeholder="6 位验证码"
                    className="w-full py-3 bg-transparent text-sm text-slate-900 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="shrink-0 px-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold"
                >
                  {codeSent ? '已发送' : '获取验证码'}
                </button>
              </div>
            </label>

            {codeSent && (
              <p className="text-xs text-emerald-600 font-semibold">请输入手机号对应的验证码</p>
            )}
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-extrabold shadow-xs hover:bg-blue-500 transition-colors"
            >
              登录
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (profileView === 'address_edit') {
    return (
      <div className="min-h-full bg-slate-50 p-4 pb-8">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setProfileView('main')} className="rounded-full bg-white p-2 text-slate-600 shadow-xs" aria-label="返回"><ArrowLeft size={18} /></button>
          <div><h2 className="text-base font-black text-slate-900">我的常住地址</h2><p className="text-[10px] text-slate-500">填写您作为子女本人的居住地址</p></div>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block rounded-2xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-slate-700">详细地址</span><textarea value={draftAddress} onChange={event => setDraftAddress(event.target.value)} rows={4} maxLength={120} placeholder="请输入国家、城市及详细地址" className="mt-3 w-full resize-none rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-900 outline-none focus:ring-2 focus:ring-blue-100" /><span className="mt-2 block text-right text-[10px] text-slate-400">{draftAddress.length}/120</span></label>
          <p className="rounded-xl bg-slate-100 p-3 text-[10px] leading-relaxed text-slate-500">此处保存的是子女本人的常住地址，不是老人的居住地址。修改后不会更改老人的地址。</p>
          <button type="button" disabled={!draftAddress.trim()} onClick={saveAddress} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white disabled:bg-slate-200 disabled:text-slate-400">保存地址</button>
        </div>
      </div>
    );
  }

  const requests = bindingState.requests.filter(request => request.applicantId === mockApplicantId);
  if (profileView === 'request_records') {
    return <div className="min-h-full space-y-4 bg-slate-50 p-4 pb-8">
      <div className="flex items-center gap-3"><button type="button" aria-label="返回我的" onClick={() => setProfileView('main')} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600"><ArrowLeft size={18} /></button><h2 className="text-base font-bold text-slate-900">申请记录</h2></div>
      {requests.length ? <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{[...requests].reverse().map(request => <button key={request.id} type="button" onClick={() => { setSelectedRequestId(request.id); setProfileView('elder_binding'); }} className="flex min-h-20 w-full items-center gap-3 p-4 text-left"><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{bindingCandidates.find(elder => elder.id === request.elderId)?.maskedName} · {request.relation}</strong><span className="mt-1 block text-xs text-slate-400">{request.id}</span></span><span className="text-xs font-semibold text-blue-600">{bindingStatusLabels[request.status]}</span><ChevronRight size={16} className="text-slate-300" /></button>)}</div> : <div className="rounded-2xl bg-white px-4 py-10 text-center"><ClipboardList size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-500">暂无申请记录</p></div>}
    </div>;
  }

  if (profileView === 'elder_binding') {
    return (
      <H5ElderBindingFlow
        key={bindingScenario}
        scenario={bindingScenario}
        state={bindingState}
        dispatch={bindingDispatch}
        initialRequestId={selectedRequestId}
        onCancel={() => setProfileView(selectedRequestId ? 'request_records' : 'main')}
        onEnterHome={onEnterElderHome}
        onCompleteAddress={() => setProfileView('address_edit')}
      />
    );
  }

  const visibleElders = boundElders;

  return (
    <div className="p-4 pb-8 space-y-4 bg-slate-50 min-h-full">
      <section className="px-1 py-3 text-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserRound size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black">张女士</h2>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">
                已登录
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">138****8899</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="family-management-heading" className="space-y-3">
        <h2 id="family-management-heading" className="px-1 text-sm font-extrabold text-slate-900">我的家人</h2>
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {visibleElders.map(elder => {
            return (
              <div key={elder.id} className="flex items-center gap-3 p-4">
                <img src={elder.avatar} alt={elder.name} className="h-12 w-12 rounded-full border border-slate-200 object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-extrabold text-slate-900">{elder.name}</p>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{elder.relation}</span>
                  </div>
                  <p className={`mt-1 break-words text-xs leading-relaxed ${elder.relationshipStatus === 'removed' ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>
                    {elder.relationshipStatus === 'removed' ? '家庭关系已解除' : elder.project}
                  </p>
                </div>
                {elder.relationshipStatus === 'removed' && (
                  <button type="button" onClick={() => { setSelectedRequestId(null); setProfileView('elder_binding'); }} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-600">重新申请</button>
                )}
              </div>
            );
          })}
          {visibleElders.length === 0 && <p className="p-4 text-xs text-slate-500">暂无已绑定老人，请添加家人并等待老人确认。</p>}
          <button type="button" onClick={() => { setSelectedRequestId(null); setProfileView('elder_binding'); }} className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold text-blue-600">
            <span>添加家人</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </section>


      </section>

      <section aria-label="快捷入口" className="space-y-3">
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">{[
          { label: '我的常住地址', Icon: MapPin, action: openAddressEditor },
          { label: '申请记录', Icon: ClipboardList, action: () => setProfileView('request_records') },
          { label: '家人在线协助', Icon: Headphones, action: onOpenAssistance }
        ].map(({ label, Icon, action }) => <button key={label} type="button" onClick={action} className="flex min-h-18 w-full items-center gap-3 p-4 text-left"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={19} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{label}</strong></span><ChevronRight size={17} className="text-slate-300" /></button>)}</div>
        {addressSaved && <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700"><CheckCircle size={15} />我的常住地址已更新</div>}
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-4 text-slate-500 text-xs font-semibold flex items-center justify-center gap-2 hover:text-rose-600 transition-colors"
      >
        <LogOut size={16} />
        退出登录
      </button>
    </div>
  );
};
