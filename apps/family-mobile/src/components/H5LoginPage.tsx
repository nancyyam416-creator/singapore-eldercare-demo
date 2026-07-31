/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  LockKeyhole,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { ChildLoginScenario } from '../types';

type CountryCode = '+65' | '+86';

interface H5LoginPageProps {
  scenario: ChildLoginScenario;
  onLoginSuccess: () => void;
}

const scenarioDefaults: Record<ChildLoginScenario, { countryCode: CountryCode; phone: string; code: string; codeSent: boolean }> = {
  default: { countryCode: '+65', phone: '', code: '', codeSent: false },
  code_sent: { countryCode: '+65', phone: '81234567', code: '', codeSent: true },
  invalid_phone: { countryCode: '+65', phone: '123', code: '', codeSent: false },
  invalid_code: { countryCode: '+65', phone: '81234567', code: '000000', codeSent: true },
  code_expired: { countryCode: '+86', phone: '13800008899', code: '654321', codeSent: true },
  send_failed: { countryCode: '+65', phone: '86666666', code: '', codeSent: false },
  network_error: { countryCode: '+86', phone: '13800008899', code: '999999', codeSent: true }
};

const validatePhone = (countryCode: CountryCode, phone: string) => {
  if (countryCode === '+65') return /^[89]\d{7}$/.test(phone);
  return /^1\d{10}$/.test(phone);
};

export const H5LoginPage: React.FC<H5LoginPageProps> = ({ scenario, onLoginSuccess }) => {
  const defaults = scenarioDefaults[scenario];
  const [countryCode, setCountryCode] = useState<CountryCode>(defaults.countryCode);
  const [phone, setPhone] = useState(defaults.phone);
  const [code, setCode] = useState(defaults.code);
  const [codeSent, setCodeSent] = useState(defaults.codeSent);
  const [error, setError] = useState('');

  useEffect(() => {
    const next = scenarioDefaults[scenario];
    setCountryCode(next.countryCode);
    setPhone(next.phone);
    setCode(next.code);
    setCodeSent(next.codeSent);
    setError('');
  }, [scenario]);

  const phonePlaceholder = countryCode === '+65' ? '请输入8位手机号' : '请输入11位手机号';
  const phoneMaxLength = countryCode === '+65' ? 8 : 11;
  const canSubmit = validatePhone(countryCode, phone) && code.length === 6;
  const maskedTarget = useMemo(() => {
    if (!validatePhone(countryCode, phone)) return '';
    return `${countryCode} ${phone.slice(0, 3)}****${phone.slice(-2)}`;
  }, [countryCode, phone]);

  const sendCode = () => {
    if (!validatePhone(countryCode, phone)) {
      setError(countryCode === '+65' ? '请输入正确的8位新加坡手机号' : '请输入正确的11位中国手机号');
      return;
    }
    if (scenario === 'send_failed') {
      setError('验证码发送失败，请检查网络后重试');
      return;
    }
    setError('');
    setCodeSent(true);
  };

  const submitLogin = (event: FormEvent) => {
    event.preventDefault();
    if (!validatePhone(countryCode, phone)) {
      setError(countryCode === '+65' ? '请输入正确的8位新加坡手机号' : '请输入正确的11位中国手机号');
      return;
    }
    if (!codeSent) {
      setError('请先获取验证码');
      return;
    }
    if (scenario === 'network_error' || code === '999999') {
      setError('网络异常，暂时无法登录，请稍后重试');
      return;
    }
    if (scenario === 'code_expired' || code === '654321') {
      setError('验证码已过期，请重新获取');
      return;
    }
    if (code !== '123456') {
      setError('验证码不正确，请重新输入');
      return;
    }
    setError('');
    onLoginSuccess();
  };

  return (
    <div className="flex min-h-full flex-col bg-slate-50 px-5 pb-8 pt-8">
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <ShieldCheck size={27} />
        </div>
        <p className="mt-7 text-xs font-extrabold tracking-wide text-blue-600">子女手机端</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">登录后，继续守护家人</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">使用手机号验证码登录，查看已绑定老人的照护与亲情互动。</p>

        <form onSubmit={submitLogin} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-extrabold text-slate-700">手机号</span>
            <div className="mt-2 flex h-13 items-center rounded-2xl border border-slate-200 bg-white shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <label className="relative flex h-full shrink-0 items-center border-r border-slate-100 px-3">
                <span className="sr-only">国家或地区代码</span>
                <select
                  aria-label="国家或地区代码"
                  value={countryCode}
                  onChange={event => {
                    setCountryCode(event.target.value as CountryCode);
                    setPhone('');
                    setCode('');
                    setCodeSent(false);
                    setError('');
                  }}
                  className="appearance-none bg-transparent pr-5 text-sm font-extrabold text-slate-800 outline-none"
                >
                  <option value="+65">+65</option>
                  <option value="+86">+86</option>
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 text-slate-400" />
              </label>
              <Phone size={17} className="ml-3 shrink-0 text-slate-400" />
              <input
                aria-label="手机号"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={phoneMaxLength}
                value={phone}
                onChange={event => {
                  setPhone(event.target.value.replace(/\D/g, '').slice(0, phoneMaxLength));
                  setCode('');
                  setCodeSent(false);
                  setError('');
                }}
                placeholder={phonePlaceholder}
                className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-300"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700">验证码</span>
            <div className="mt-2 flex gap-2">
              <div className="flex h-13 min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-white px-3 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <KeyRound size={17} className="shrink-0 text-slate-400" />
                <input
                  aria-label="验证码"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={event => {
                    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="6位验证码"
                  className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-300"
                />
              </div>
              <button
                type="button"
                onClick={sendCode}
                className="w-27 shrink-0 rounded-2xl border border-blue-200 bg-blue-50 px-2 text-xs font-extrabold text-blue-700 transition-colors hover:bg-blue-100"
              >
                {codeSent ? '重新获取' : '获取验证码'}
              </button>
            </div>
          </label>

          {codeSent && !error && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span>验证码已发送至 {maskedTarget}，演示验证码为 <strong>123456</strong></span>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-relaxed text-rose-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/15 transition-colors hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <LockKeyhole size={16} />
            验证并登录
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-slate-400">验证码仅用于本次身份验证。L2 原型不调用真实短信或登录接口。</p>
    </div>
  );
};
