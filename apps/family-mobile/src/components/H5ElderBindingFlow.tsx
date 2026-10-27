import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3 } from 'lucide-react';
import { ElderBindingScenario, ElderRelation } from '../types';
import { BindingAction, BindingCandidate, BindingState, bindingCandidates, bindingStatusLabels, lookupBindingCandidate, mockApplicantId } from '../data/familyBinding';

interface H5ElderBindingFlowProps {
  scenario: ElderBindingScenario;
  state: BindingState;
  dispatch: React.Dispatch<BindingAction>;
  initialRequestId: string | null;
  onCancel: () => void;
  onEnterHome: (elderId: string) => void;
  onCompleteAddress: () => void;
}
const relations: ElderRelation[] = ['儿子', '女儿', '儿媳', '女婿', '孙辈', '其他家属', '看护人'];
const primary = 'w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white disabled:bg-slate-200 disabled:text-slate-400';
const secondary = 'w-full rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600';

export const H5ElderBindingFlow: React.FC<H5ElderBindingFlowProps> = ({ scenario, state, dispatch, initialRequestId, onCancel, onEnterHome, onCompleteAddress }) => {
  const [step, setStep] = useState<'phone' | 'preview' | 'request' | 'existing'>('phone');
  const [countryCode, setCountryCode] = useState<'+65' | '+86'>('+65');
  const [phone, setPhone] = useState('81230001');
  const [candidate, setCandidate] = useState<BindingCandidate | null>(null);
  const [relation, setRelation] = useState<ElderRelation | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [networkFailed, setNetworkFailed] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(initialRequestId);

  useEffect(() => {
    const father = scenario === 'already_bound' || scenario === 'relationship_removed';
    setCountryCode(father ? '+86' : '+65');
    setPhone(scenario === 'phone_error' ? '123' : scenario === 'not_registered' ? '81239999' : father ? '13800005678' : '81230001');
    setNetworkFailed(scenario === 'network_error'); setSubmitFailed(scenario === 'submit_failed');
    setError(''); setNotice(''); setRelation(null); setCandidate(null);
    const preset = initialRequestId ?? (['pending', 'rejected', 'expired'].includes(scenario) ? 'request-1' : null);
    setRequestId(preset); setStep(preset ? 'request' : 'phone');
  }, [scenario, initialRequestId]);

  const currentRequests = state.requests.filter(item => item.applicantId === mockApplicantId);
  const request = requestId ? currentRequests.find(item => item.id === requestId) :
    [...currentRequests].reverse().find(item => item.elderId === candidate?.id);
  const requestElder = bindingCandidates.find(item => item.id === request?.elderId);
  const showCandidate = (elder: BindingCandidate) => {
    setCandidate(elder); setError(''); setNotice(''); setRelation(null);
    const active = state.relationships.some(item => item.applicantId === mockApplicantId && item.elderId === elder.id && item.status === 'active');
    const pending = currentRequests.find(item => item.elderId === elder.id && item.status === 'pending');
    if (active) { setStep('existing'); return; }
    if (pending) { setRequestId(pending.id); setNotice('已有待确认申请，请勿重复提交。'); setStep('request'); return; }
    setRequestId(null); setStep('preview');
  };
  const lookup = () => {
    if (networkFailed) { setError('网络异常，暂时无法查找老人。未创建申请或家庭关系。'); return; }
    const result = lookupBindingCandidate(countryCode, phone);
    if (!result.candidate) { setError(result.error ?? '查找失败'); return; }
    showCandidate(result.candidate);
  };
  const submit = () => {
    if (!candidate || !relation) return;
    if (submitFailed) { setError('申请提交失败，未创建申请或家庭关系。信息已保留，可重试。'); return; }
    if (state.relationships.some(item => item.applicantId === mockApplicantId && item.elderId === candidate.id && item.status === 'active')) { setStep('existing'); return; }
    const pending = currentRequests.find(item => item.elderId === candidate.id && item.status === 'pending');
    if (pending) { setRequestId(pending.id); setNotice('已有待确认申请，请勿重复提交。'); }
    else { dispatch({ type: 'submit', applicantId: mockApplicantId, elderId: candidate.id, relation }); setRequestId(null); setNotice(''); }
    setError(''); setStep('request');
  };
  const restart = () => {
    if (requestElder) { setCandidate(requestElder); setCountryCode(requestElder.countryCode); setPhone(requestElder.phone); }
    setRequestId(null); setRelation(null); setError(''); setNotice(''); setStep('preview');
  };

  return <div className="min-h-full space-y-4 bg-slate-50 p-4 pb-8">
    <div className="flex items-center gap-3">
      <button type="button" onClick={onCancel} aria-label="返回家人管理" className="rounded-full bg-white p-2 text-slate-600"><ArrowLeft size={18} /></button>
      <h2 className="text-base font-black text-slate-900">添加家人</h2>
    </div>
    {notice && <p role="status" className="text-xs font-bold text-blue-600">{notice}</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-600">{error}</p>}
    {step === 'phone' && <>
      <div><h3 className="font-bold text-slate-900">邀请老人确认</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">输入老人注册手机端的手机号，核对信息后提交申请。无需老人拥有平板。</p></div>
      <div className="flex gap-2">
        <select aria-label="老人手机号区号" value={countryCode} onChange={event => { setCountryCode(event.target.value as '+65' | '+86'); setPhone(''); setError(''); }} className="rounded-xl border border-slate-200 bg-white px-2 text-sm"><option value="+65">+65</option><option value="+86">+86</option></select>
        <input aria-label="老人手机号" type="tel" value={phone} maxLength={countryCode === '+65' ? 8 : 11} onChange={event => { setPhone(event.target.value.replace(/\D/g, '')); setError(''); }} placeholder="请输入老人手机号" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3 text-sm" />
      </div>
      <button type="button" onClick={lookup} className={primary}>查找老人</button>
      {networkFailed && <button type="button" onClick={() => { setNetworkFailed(false); setError(''); setNotice('网络已恢复，请重新查找。'); }} className={secondary}>恢复网络</button>}
      <p className="text-[10px] leading-relaxed text-slate-500">购买套餐、支付成功或设备激活均不会自动建立家庭关系。</p>
    </>}
    {step === 'preview' && candidate && <>
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold">请核对老人信息</h3><p className="mt-3 text-lg font-black">{candidate.maskedName}</p>
        <p className="mt-1 text-xs text-slate-500">{candidate.countryCode} {candidate.phone.slice(0, 3)}****{candidate.phone.slice(-2)}</p>
        <p className="mt-2 text-xs text-slate-500">{candidate.project} · {candidate.maskedAddress}</p>
        <button type="button" onClick={() => { setStep('phone'); setError(''); setRelation(null); }} className="mt-3 text-xs font-bold text-blue-600">不是这位老人，重新查找</button>
      </section>
      <section><h3 className="text-sm font-bold">你与老人的关系</h3><div className="mt-3 grid grid-cols-3 gap-2">{relations.map(option => <button key={option} type="button" aria-pressed={relation === option} onClick={() => setRelation(option)} className={relation === option ? 'rounded-xl border border-blue-500 bg-blue-50 py-3 text-xs font-bold text-blue-700' : 'rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600'}>{option}</button>)}</div></section>
      <p className="text-xs leading-relaxed text-slate-500">提交后需要老人本人在手机端，或已绑定本人档案的平板端确认。老人只需确认或拒绝，无需选择关系。</p>
      <button type="button" disabled={!relation} onClick={submit} className={primary}>提交绑定申请</button>
      {submitFailed && error && <button type="button" onClick={() => { setSubmitFailed(false); setError(''); setNotice('提交服务已恢复，请重新提交。'); }} className={secondary}>恢复提交服务</button>}
    </>}
    {step === 'existing' && candidate && <section className="space-y-4 rounded-2xl bg-white p-5 text-center">
      <CheckCircle2 className="mx-auto text-emerald-500" size={32} /><h3 className="font-bold">你已经绑定了这位老人</h3><p className="text-xs text-slate-500">未重复创建申请或关系。</p>
      <button type="button" onClick={() => onEnterHome(candidate.id)} className={primary}>进入现有老人首页</button>
      <button type="button" onClick={() => setStep('phone')} className={secondary}>添加其他老人</button>
    </section>}
    {step === 'request' && request && requestElder && <>
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-center">
        {request.status === 'accepted' ? <CheckCircle2 className="mx-auto text-emerald-500" size={32} /> : <Clock3 className="mx-auto text-blue-600" size={32} />}
        <h3 className="text-lg font-black">{bindingStatusLabels[request.status]}</h3>
        <p className="text-sm">{request.status === 'accepted' ? requestElder.name : requestElder.maskedName} · 你是老人的{request.relation}</p>
        <p className="text-xs leading-relaxed text-slate-500">{request.status === 'pending' ? '需要老人本人确认。老人可在手机端，或已绑定本人档案的平板端确认。确认前不会建立家庭关系，也无法访问该老人的照护数据。' : request.status === 'accepted' ? '老人已确认，家庭关系已生效。' : '本次申请未建立家庭关系，可重新核对信息后发起申请。'}</p>
        {request.confirmationChannel && <p className="text-xs font-bold text-blue-600">处理渠道：{request.confirmationChannel === 'elder_mobile' ? '老人手机端' : '老人平板端'}</p>}
        <p className="text-[10px] text-slate-400">申请编号：{request.id} · {requestElder.countryCode} {requestElder.phone.slice(0, 3)}****{requestElder.phone.slice(-2)}</p>
      </section>
      {request.status === 'pending' ? <>
        <button type="button" onClick={() => { dispatch({ type: 'remind', requestId: request.id }); setNotice('已记录本次提醒。'); }} className={primary}>重新提醒老人{request.reminders > 0 ? '（已提醒' + request.reminders + '次）' : ''}</button>
        <button type="button" onClick={() => { dispatch({ type: 'resolve', requestId: request.id, status: 'cancelled' }); setNotice('申请已取消，老人后续确认不会使本次申请生效。'); }} className={secondary}>取消申请</button>
        <details className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-3 text-xs">
          <summary className="cursor-pointer font-bold text-blue-700">老人确认结果</summary>
          <p className="mt-3 text-[10px] text-slate-500">以下操作仅影响当前申请。</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(['elder_mobile', 'elder_tablet'] as const).map(channel => <button key={channel} type="button" onClick={() => { dispatch({ type: 'resolve', requestId: request.id, status: 'accepted', channel }); setNotice(''); }} className="rounded-lg border border-blue-200 bg-white px-3 py-2 font-bold text-blue-700">{channel === 'elder_mobile' ? '手机端确认' : '平板端确认'}</button>)}
            <button type="button" onClick={() => { dispatch({ type: 'resolve', requestId: request.id, status: 'rejected', channel: 'elder_mobile' }); setNotice(''); }} className={secondary}>老人拒绝</button>
            <button type="button" onClick={() => { dispatch({ type: 'resolve', requestId: request.id, status: 'expired' }); setNotice(''); }} className={secondary}>申请过期</button>
          </div>
        </details>
      </> : request.status === 'accepted' ? <>
        <button type="button" onClick={() => onEnterHome(requestElder.id)} className={primary}>进入老人首页</button>
        <button type="button" onClick={onCompleteAddress} className={secondary}>完善我的常住地址（选填）</button>
        <button type="button" onClick={onCancel} className={secondary}>返回家人管理</button>
      </> : <button type="button" onClick={restart} className={primary}>重新发起申请</button>}
    </>}
  </div>;
};
