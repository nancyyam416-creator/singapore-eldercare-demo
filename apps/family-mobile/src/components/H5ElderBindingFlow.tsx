/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Keyboard,
  MapPin,
  ScanLine,
  ShieldCheck,
  UsersRound
} from 'lucide-react';
import { BoundElder, ElderBindingScenario, ElderRelation } from '../types';
import { mockBindingCandidate } from '../data/mockData';

type BindingStep = 'guide' | 'code' | 'preview' | 'success';

interface H5ElderBindingFlowProps {
  scenario: ElderBindingScenario;
  existingElderIds: string[];
  canCancel: boolean;
  onCancel: () => void;
  onBound: (elder: BoundElder) => boolean;
  onEnterHome: (elderId: string) => void;
  onCompleteAddress: () => void;
}

const relations: ElderRelation[] = ['儿子', '女儿', '儿媳', '女婿', '孙辈', '其他家属'];

const scenarioCodes: Partial<Record<ElderBindingScenario, string>> = {
  code_error: '111111',
  code_expired: '222222',
  invitation_ended: '333333',
  invitation_invalidated: '444444',
  already_bound: '555555',
  tablet_code: '888888',
  network_error: '999999'
};

const validationMessages: Record<string, string> = {
  '111111': '家庭绑定码错误，请核对后重新输入。',
  '222222': '家庭绑定码已过期，请让老人在屏幕上重新生成。',
  '333333': '这次邀请已结束，请使用老人屏幕上的新邀请。',
  '444444': '这次邀请已被后台作废，请联系项目工作人员。',
  '555555': '你已经绑定了这位老人',
  '888888': '这不是家庭绑定码，请扫描老人屏幕上的邀请二维码。',
  '999999': '网络异常，暂时无法校验，请稍后重试。'
};

export const H5ElderBindingFlow: React.FC<H5ElderBindingFlowProps> = ({
  scenario,
  existingElderIds,
  canCancel,
  onCancel,
  onBound,
  onEnterHome,
  onCompleteAddress
}) => {
  const [step, setStep] = useState<BindingStep>('guide');
  const [bindingCode, setBindingCode] = useState('');
  const [relation, setRelation] = useState<ElderRelation | null>(null);
  const [error, setError] = useState('');
  const [boundElder, setBoundElder] = useState<BoundElder | null>(null);

  useEffect(() => {
    const presetCode = scenarioCodes[scenario] ?? '';
    setStep(presetCode ? 'code' : 'guide');
    setBindingCode(presetCode);
    setRelation(null);
    setError('');
    setBoundElder(null);
  }, [scenario]);

  const openCodeEntry = () => {
    setError('');
    setStep('code');
  };

  const simulateScan = () => {
    setError('');
    setStep('preview');
  };

  const validateCode = () => {
    if (bindingCode.length !== 6) {
      setError('请输入6位家庭绑定码');
      return;
    }
    const validationError = validationMessages[bindingCode];
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep('preview');
  };

  const confirmBinding = () => {
    if (!relation) {
      setError('请选择你与老人的关系');
      return;
    }
    if (existingElderIds.includes(mockBindingCandidate.id)) {
      setError('你已经绑定了这位老人');
      return;
    }
    const nextElder: BoundElder = {
      ...mockBindingCandidate,
      relation,
      relationshipStatus: 'active'
    };
    if (!onBound(nextElder)) {
      setError('你已经绑定了这位老人');
      return;
    }
    setBoundElder(nextElder);
    setError('');
    setStep('success');
  };

  if (step === 'success' && boundElder) {
    return (
      <div className="flex min-h-full flex-col bg-slate-50 p-4 pb-8">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={34} />
          </span>
          <h2 className="mt-4 text-xl font-black text-slate-900">绑定成功</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            已将{boundElder.name}添加到你的家庭守护列表
          </p>
          <div className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs">
            <img src={boundElder.avatar} alt={boundElder.name} className="h-14 w-14 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <strong className="text-sm text-slate-900">{boundElder.name}</strong>
              <p className="mt-1 text-xs text-slate-500">{boundElder.relation} · {boundElder.project}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          <button type="button" onClick={() => onEnterHome(boundElder.id)} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white">进入老人首页</button>
          <button type="button" onClick={onCompleteAddress} className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 text-sm font-extrabold text-blue-700">完善我的常住地址</button>
          <button type="button" onClick={() => onEnterHome(boundElder.id)} className="w-full py-2 text-xs font-bold text-slate-500">暂时跳过</button>
          <p className="text-center text-[10px] text-slate-400">常住地址不是绑定必填项，可稍后在“我的”中完善</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-8">
      <div className="flex items-center gap-3">
        {canCancel && (
          <button type="button" onClick={onCancel} className="rounded-full bg-white p-2 text-slate-600 shadow-xs" aria-label="返回">
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h2 className="text-base font-black text-slate-900">绑定老人</h2>
          <p className="mt-0.5 text-[10px] text-slate-500">使用老人屏幕上的家庭绑定邀请</p>
        </div>
      </div>

      {step === 'guide' && (
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-blue-600 p-5 text-white">
            <UsersRound size={26} />
            <h3 className="mt-3 text-lg font-black">开始家庭守护</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-blue-100">绑定后即可查看老人的照护状态，并使用亲情留言和家庭影像。</p>
          </div>
          <button type="button" onClick={simulateScan} className="flex w-full items-center gap-3 rounded-2xl border border-blue-200 bg-white p-4 text-left shadow-xs">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ScanLine size={22} /></span>
            <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">扫描家庭绑定二维码</strong><span className="mt-1 block text-xs text-slate-500">L2 演示将模拟扫码成功</span></span>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
          <button type="button" onClick={openCodeEntry} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Keyboard size={21} /></span>
            <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">输入6位家庭绑定码</strong><span className="mt-1 block text-xs text-slate-500">绑定码显示在老人屏幕邀请页</span></span>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
          <p className="rounded-xl bg-slate-100 p-3 text-[10px] leading-relaxed text-slate-500">家庭绑定用于建立你与老人的守护关系。请勿使用平板激活码或将绑定码分享给无关人员。</p>
        </div>
      )}

      {step === 'code' && (
        <div className="mt-6">
          <label className="block">
            <span className="text-xs font-bold text-slate-700">6位家庭绑定码</span>
            <input
              value={bindingCode}
              onChange={event => {
                setBindingCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="请输入6位数字"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-relaxed text-rose-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button type="button" onClick={validateCode} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white">校验家庭绑定码</button>
          <button type="button" onClick={() => setStep('guide')} className="mt-2 w-full py-2 text-xs font-bold text-slate-500">返回选择其他方式</button>
        </div>
      )}

      {step === 'preview' && (
        <div className="mt-5 space-y-4">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-3 p-4">
              <img src={mockBindingCandidate.avatar} alt={mockBindingCandidate.name} className="h-14 w-14 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <strong className="text-base text-slate-900">{mockBindingCandidate.name}</strong>
                <p className="mt-1 text-xs text-slate-500">{mockBindingCandidate.age}岁 · {mockBindingCandidate.project}</p>
              </div>
              <ShieldCheck size={20} className="text-emerald-500" />
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <MapPin size={15} className="shrink-0 text-slate-400" />
              <span>{mockBindingCandidate.maskedAddress}</span>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-extrabold text-slate-900">你与老人的关系</h3>
            <p className="mt-1 text-[10px] text-slate-500">请选择真实关系，绑定后将显示在家庭成员中</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {relations.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setRelation(option);
                    setError('');
                  }}
                  aria-pressed={relation === option}
                  className={`rounded-xl border py-3 text-xs font-bold ${relation === option ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button type="button" onClick={confirmBinding} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white">确认并绑定</button>
          <p className="text-center text-[10px] text-slate-400">确认后直接完成绑定，无需后台审核或老人再次确认</p>
        </div>
      )}
    </div>
  );
};
