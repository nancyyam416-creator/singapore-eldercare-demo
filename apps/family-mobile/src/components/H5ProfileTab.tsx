/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
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

interface H5ProfileTabProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  residenceAddress: string;
  onSaveResidenceAddress: (address: string) => void;
  boundElders: BoundElder[];
  currentElderId: string | null;
  bindingScenario: ElderBindingScenario;
  onBindElder: (elder: BoundElder) => boolean;
  onSwitchElder: (elderId: string) => void;
  onEnterElderHome: (elderId: string) => void;
}

export const H5ProfileTab: React.FC<H5ProfileTabProps> = ({
  isLoggedIn,
  onLogin,
  onLogout,
  residenceAddress,
  onSaveResidenceAddress,
  boundElders,
  currentElderId,
  bindingScenario,
  onBindElder,
  onSwitchElder,
  onEnterElderHome
}) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [profileView, setProfileView] = useState<'main' | 'address_edit' | 'elder_binding'>('main');
  const [draftAddress, setDraftAddress] = useState(residenceAddress);
  const [addressSaved, setAddressSaved] = useState(false);

  useEffect(() => {
    if (bindingScenario === 'bound') return;
    setProfileView(bindingScenario === 'relationship_removed' ? 'main' : 'elder_binding');
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
              <p className="text-xs text-emerald-600 font-semibold">演示验证码：123456</p>
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
          <div><h2 className="text-base font-black text-slate-900">常住地址</h2><p className="text-[10px] text-slate-500">完善个人资料，便于家庭成员识别</p></div>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block rounded-2xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-slate-700">详细地址</span><textarea value={draftAddress} onChange={event => setDraftAddress(event.target.value)} rows={4} maxLength={120} placeholder="请输入国家、城市及详细地址" className="mt-3 w-full resize-none rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-900 outline-none focus:ring-2 focus:ring-blue-100" /><span className="mt-2 block text-right text-[10px] text-slate-400">{draftAddress.length}/120</span></label>
          <p className="rounded-xl bg-slate-100 p-3 text-[10px] leading-relaxed text-slate-500">常住地址属于个人资料，可随时修改。家庭成员仅在获得相应权限后查看。</p>
          <button type="button" disabled={!draftAddress.trim()} onClick={saveAddress} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white disabled:bg-slate-200 disabled:text-slate-400">保存地址</button>
        </div>
      </div>
    );
  }

  if (profileView === 'elder_binding' || boundElders.length === 0) {
    return (
      <H5ElderBindingFlow
        scenario={bindingScenario === 'bound' ? 'no_elder' : bindingScenario}
        existingElderIds={boundElders.map(elder => elder.id)}
        canCancel={boundElders.length > 0}
        onCancel={() => setProfileView('main')}
        onBound={onBindElder}
        onEnterHome={onEnterElderHome}
        onCompleteAddress={() => setProfileView('address_edit')}
      />
    );
  }

  const visibleElders = bindingScenario === 'relationship_removed'
    ? boundElders.map((elder, index) => index === 0 ? { ...elder, relationshipStatus: 'removed' as const } : elder)
    : boundElders;

  return (
    <div className="p-4 pb-8 space-y-4 bg-slate-50 min-h-full">
      <section className="bg-blue-600 rounded-2xl p-5 text-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
            <UserRound size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black">张女士</h2>
              <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 rounded-full px-2 py-0.5">
                已登录
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-1">138****8899</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Link2 size={16} className="text-blue-600" />
          <h3 className="text-sm font-extrabold text-slate-900">已绑定老人</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {visibleElders.map(elder => {
            const isCurrent = elder.id === currentElderId && elder.relationshipStatus === 'active';
            return (
              <div key={elder.id} className="flex items-center gap-3 p-4">
                <img src={elder.avatar} alt={elder.name} className="h-12 w-12 rounded-full border border-slate-200 object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-slate-900">{elder.name}</p>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{elder.relation}</span>
                    {isCurrent && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600">当前</span>}
                  </div>
                  <p className={`mt-1 text-xs ${elder.relationshipStatus === 'removed' ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>
                    {elder.relationshipStatus === 'removed' ? '家庭关系已解除' : elder.project}
                  </p>
                </div>
                {elder.relationshipStatus === 'active' && (
                  isCurrent
                    ? <CheckCircle size={18} className="text-emerald-500" />
                    : <button type="button" onClick={() => onSwitchElder(elder.id)} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-600">切换</button>
                )}
                {elder.relationshipStatus === 'removed' && (
                  <button type="button" onClick={() => setProfileView('elder_binding')} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-600">重新绑定</button>
                )}
              </div>
            );
          })}
          <button type="button" onClick={() => setProfileView('elder_binding')} className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold text-blue-600">
            <span>绑定另一位老人</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      <button type="button" onClick={openAddressEditor} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MapPin size={19} /></span>
        <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">常住地址</strong><span className="mt-1 block truncate text-xs text-slate-500">{residenceAddress || '待完善'}</span></span>
        <ChevronRight size={17} className="text-slate-300" />
      </button>

      {addressSaved && <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700"><CheckCircle size={15} />常住地址已更新</div>}

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600" />
          <h3 className="text-sm font-extrabold text-slate-900">账号信息</h3>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-slate-500">登录方式</span>
            <span className="font-bold text-slate-800">手机号验证码</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-slate-500">账号状态</span>
            <span className="font-bold text-emerald-600">正常</span>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3 rounded-xl bg-white border border-rose-200 text-rose-600 text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors"
      >
        <LogOut size={16} />
        退出登录
      </button>
    </div>
  );
};
