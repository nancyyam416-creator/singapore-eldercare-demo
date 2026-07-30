import React, { useState, useEffect } from "react";
import { Sun, CloudRain, CloudSun, ChevronRight, Phone, Siren, XCircle, UserRound, UsersRound, Wind, X, MapPin, HeartHandshake, RotateCcw, AlertTriangle } from "lucide-react";

interface HeaderBarProps {
  onTriggerSOS: () => void;
  onResetActivation: () => void;
}

const familyWeather = [
  { id: "xiaomin", name: "小敏", relation: "大女儿", city: "杭州", temperature: "25°C", condition: "下午有雨", note: "出门记得带伞", weather: "rain" },
  { id: "xiaogang", name: "小刚", relation: "儿子", city: "上海", temperature: "30°C", condition: "多云", note: "傍晚天气有些闷热", weather: "cloudy" },
  { id: "xiaoqin", name: "小琴", relation: "小女儿", city: "广州", temperature: "32°C", condition: "雷阵雨", note: "晚间雨势可能较大", weather: "rain" },
];

export default function HeaderBar({ onTriggerSOS, onResetActivation }: HeaderBarProps) {
  const [time, setTime] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showActivationConfirm, setShowActivationConfirm] = useState(false);
  const [showFamilyWeather, setShowFamilyWeather] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeString = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatFullDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return date.toLocaleDateString("zh-CN", options);
  };

  return (
    <div className="flex items-center justify-between w-full h-[140px] px-10 bg-[#FAF8F5] border-b border-[#EBE6DD] shrink-0 relative">
      {/* 1. SOS and current elder identity */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowConfirm(true)}
          aria-label="发起紧急求助"
          className="h-[66px] flex items-center gap-3 px-5 bg-white hover:bg-[#FFF7F5] text-[#8E3932] border-2 border-[#E8D7D3] rounded-full shadow-sm transition-all duration-200 active:scale-95 group cursor-pointer"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FCE9E6] shrink-0">
            <Phone className="w-5 h-5 text-[#C34B41] fill-current group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[20px] font-black tracking-wide leading-none">紧急求助</span>
        </button>

        <button
          type="button"
          onClick={() => setShowProfile(true)}
          aria-label="查看王建国的个人信息"
          className="relative w-[66px] h-[66px] rounded-full bg-[#EAF6EF] border-[3px] border-white shadow-[0_3px_12px_rgba(20,83,60,0.18)] ring-2 ring-[#B8D9C7] text-[#14533C] flex items-center justify-center hover:bg-[#DDEFE5] active:scale-95 transition-all cursor-pointer"
        >
          <UserRound className="w-8 h-8" />
          <span className="absolute right-0 bottom-0 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-white" aria-hidden="true" />
        </button>
      </div>

      {/* 2. Large Clock and Calendar - Center aligned */}
      <div className="flex items-center gap-5">
        <span className="text-7xl font-extrabold font-display text-[#1C2C24] tracking-tight">
          {formatTimeString(time)}
        </span>
        <div className="flex flex-col text-left">
          <span className="text-[20px] font-black text-[#1C2C24] tracking-wide leading-tight">
            {formatFullDate(time)}
          </span>
          <span className="text-[15px] font-bold text-[#256F4F] mt-1 block">
            今天也慢慢来，过得舒心最重要
          </span>
        </div>
      </div>

      {/* 3. Local and family weather */}
      <div className="flex items-stretch bg-white rounded-2xl px-4 py-3 border-2 border-[#EBE6DD] shadow-sm min-w-[530px]">
        <div className="flex items-center gap-3 pr-4 border-r-2 border-[#EEE9E1] min-w-[235px]">
          <div className="p-2 bg-amber-50 rounded-xl">
            <Sun className="w-8 h-8 text-amber-500" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-[14px] font-black text-[#256F4F]">
              <MapPin className="w-4 h-4" />
              <span>我这里 · 北京</span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-[24px] font-black text-[#1C2C24]">28°C</span>
              <span className="text-[16px] font-black text-gray-600">晴朗</span>
            </div>
            <div className="flex items-center gap-1 text-[13px] font-bold text-gray-500 mt-0.5">
              <Wind className="w-4 h-4" />空气优，上午适合散步
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFamilyWeather(true)}
          aria-label="查看全部家人天气"
          className="flex items-center gap-3 pl-4 flex-1 text-left hover:bg-[#F5FAF7] -my-3 -mr-4 pr-4 rounded-r-2xl transition-colors active:bg-[#EAF6EF]"
        >
          <div className="p-2 bg-sky-50 rounded-xl shrink-0">
            <UsersRound className="w-8 h-8 text-[#376A94]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-black text-[#256F4F]">家人天气 · {familyWeather.length}人</span>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </div>
            <div className="text-[17px] font-black text-[#1C2C24] mt-1">杭州、广州有雨</div>
            <div className="text-[13px] font-bold text-gray-500 mt-0.5">点开看看儿女所在城市</div>
          </div>
        </button>
      </div>

      {showFamilyWeather && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[10000] flex items-center justify-center p-8 animate-fade-in select-none">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="family-weather-title"
            className="bg-[#FAF8F5] border-2 border-[#E1DBD1] rounded-[32px] p-8 w-full max-w-[880px] max-h-[820px] text-left shadow-2xl flex flex-col"
          >
            <header className="flex items-start justify-between gap-6 pb-6 border-b-2 border-[#E7E1D7] shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#EAF2FB] text-[#376A94] flex items-center justify-center">
                  <CloudSun className="w-9 h-9" />
                </div>
                <div>
                  <h2 id="family-weather-title" className="text-[30px] font-black text-[#1C2C24]">家人所在城市天气</h2>
                  <p className="text-[17px] font-bold text-gray-500 mt-1">共 {familyWeather.length} 位家人，按联系人查看更清楚</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFamilyWeather(false)}
                aria-label="关闭家人天气"
                className="w-12 h-12 rounded-full bg-white hover:bg-[#EDE8E0] border border-[#DDD7CE] text-gray-600 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="overflow-y-auto custom-scroll bg-white border-2 border-[#E7E1D7] rounded-2xl mt-6 divide-y divide-[#E7E1D7]">
              {familyWeather.map((person) => (
                <div key={person.id} className="flex items-center gap-5 px-6 py-5">
                  <div className="w-14 h-14 rounded-full bg-[#EAF6EF] text-[#14533C] flex items-center justify-center shrink-0">
                    <UserRound className="w-7 h-7" />
                  </div>
                  <div className="w-[190px] shrink-0">
                    <div className="text-[20px] font-black text-[#1C2C24]">{person.relation} · {person.name}</div>
                    <div className="flex items-center gap-1 text-[15px] font-bold text-gray-500 mt-1">
                      <MapPin className="w-4 h-4" />{person.city}
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    {person.weather === "rain" ? <CloudRain className="w-8 h-8" /> : <CloudSun className="w-8 h-8" />}
                  </div>
                  <div className="w-[155px] shrink-0">
                    <div className="text-[24px] font-black text-[#1C2C24]">{person.temperature}</div>
                    <div className="text-[16px] font-black text-gray-600 mt-0.5">{person.condition}</div>
                  </div>
                  <div className="flex-1 min-w-0 text-[16px] font-bold text-[#376A94]">{person.note}</div>
                </div>
              ))}
            </div>

            <p className="text-[15px] font-bold text-gray-500 mt-5 text-center shrink-0">
              首页只提示需要留意的天气变化，完整情况在这里查看。
            </p>
          </section>
        </div>
      )}

      {/* Accidental touch preventer Double-Confirmation Modal overlay */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-8 animate-fade-in select-none">
          <div className="bg-white border-4 border-[#E13B30] rounded-3xl p-10 max-w-2xl w-full text-center shadow-2xl relative">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Siren className="w-12 h-12 text-[#E13B30] animate-bounce" />
            </div>
            
            <h3 className="text-[32px] font-black text-[#1C2C24] mb-4">🚨 确认要发出紧急求助吗？</h3>
            <p className="text-[20px] font-bold text-gray-600 leading-relaxed mb-8">
              系统将立即联系您的子女家人、清华园居委会医疗站、120急救专线。非紧急情况请点击取消。
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  onTriggerSOS();
                }}
                className="w-full py-5 bg-[#E13B30] hover:bg-[#C92F26] text-white font-black text-[24px] rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3"
              >
                <Phone className="w-7 h-7 fill-current" />
                <span>是的，立即紧急求助！</span>
              </button>
              
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-[22px] rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <XCircle className="w-7 h-7" />
                <span>点错了，取消呼救</span>
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mt-6 font-semibold">
              提示：如果是日常杂事、找人聊天，请按“取消”后点击底部的【联系人】或【问小U】。
            </p>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[10000] flex items-center justify-center p-8 animate-fade-in select-none">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            className="bg-white border-2 border-[#E1DBD1] rounded-[32px] p-9 w-full max-w-[720px] text-left shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setShowProfile(false)}
              aria-label="关闭个人信息"
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-[#F4F1EB] hover:bg-[#E9E4DC] text-gray-600 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-5 pr-16 pb-7 border-b-2 border-[#EEE9E1]">
              <div className="w-[92px] h-[92px] rounded-full bg-[#EAF6EF] border-[4px] border-white ring-2 ring-[#B8D9C7] text-[#14533C] flex items-center justify-center shrink-0">
                <UserRound className="w-12 h-12" />
              </div>
              <div>
                <p className="text-[16px] font-black text-[#256F4F]">当前平板使用人</p>
                <h2 id="profile-title" className="text-[34px] font-black text-[#1C2C24] mt-1">王建国</h2>
                <p className="text-[18px] font-bold text-gray-600 mt-1">清华园社区养老服务项目</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 py-7">
              <div>
                <dt className="text-[15px] font-bold text-gray-500 flex items-center gap-2"><MapPin className="w-4 h-4" />居住信息</dt>
                <dd className="text-[19px] font-black text-[#1C2C24] mt-2">12号楼 · **01室</dd>
              </div>
              <div>
                <dt className="text-[15px] font-bold text-gray-500 flex items-center gap-2"><HeartHandshake className="w-4 h-4" />服务顾问</dt>
                <dd className="text-[19px] font-black text-[#1C2C24] mt-2">陈老师 · 136****2088</dd>
              </div>
              <div>
                <dt className="text-[15px] font-bold text-gray-500">紧急联系人</dt>
                <dd className="text-[19px] font-black text-[#1C2C24] mt-2">女儿 王小敏</dd>
              </div>
              <div>
                <dt className="text-[15px] font-bold text-gray-500">联系电话</dt>
                <dd className="text-[19px] font-black text-[#1C2C24] mt-2">138****5201</dd>
              </div>
            </dl>

            <div className="flex items-center justify-between gap-5 pt-6 border-t-2 border-[#EEE9E1]">
              <div>
                <p className="text-[16px] font-bold text-gray-500">如信息不正确，请联系服务顾问在后台修改。</p>
                <button
                  type="button"
                  onClick={() => setShowActivationConfirm(true)}
                  className="mt-3 inline-flex items-center gap-2 text-[16px] font-black text-[#8E554E] hover:text-[#B33E34] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  返回激活页面
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="w-[150px] h-[58px] rounded-2xl bg-[#14533C] hover:bg-[#0E3D2B] text-white text-[19px] font-black shrink-0 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivationConfirm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[10001] flex items-center justify-center p-8 animate-fade-in select-none">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="activation-reset-title"
            className="bg-white border-2 border-[#E8D7D3] rounded-[30px] p-9 w-full max-w-[620px] text-center shadow-2xl"
          >
            <div className="w-20 h-20 rounded-full bg-[#FCE9E6] text-[#B33E34] flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 id="activation-reset-title" className="text-[30px] font-black text-[#1C2C24]">返回激活页面？</h2>
            <p className="text-[19px] font-bold text-gray-600 leading-relaxed mt-4">
              返回后，本机需要重新输入激活码并确认使用人，当前家庭资料不会被删除。
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                type="button"
                onClick={() => setShowActivationConfirm(false)}
                className="h-[62px] rounded-2xl bg-[#F2EFEA] hover:bg-[#E8E4DD] text-gray-700 text-[20px] font-black transition-colors"
              >
                继续使用
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowActivationConfirm(false);
                  setShowProfile(false);
                  onResetActivation();
                }}
                className="h-[62px] rounded-2xl bg-[#B33E34] hover:bg-[#97332B] text-white text-[20px] font-black transition-colors"
              >
                确认返回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
