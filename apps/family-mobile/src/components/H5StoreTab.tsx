/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Star, 
  MapPin, 
  Calendar, 
  Clock, 
  Check, 
  ChevronRight, 
  X,
  CreditCard,
  Shield,
  ThumbsUp,
  User,
  HeartHandshake
} from 'lucide-react';
import { ServiceProduct, Order } from '../types';
import { serviceCatalog } from '../data/mockData';

interface H5StoreTabProps {
  parentProfile: typeof import('../data/mockData').initialParentProfile;
  onAddOrder: (newOrder: Order) => void;
  onSwitchToOrders: () => void;
}

type StoreView = 'list' | 'detail' | 'checkout' | 'success';

export const H5StoreTab: React.FC<H5StoreTabProps> = ({
  parentProfile,
  onAddOrder,
  onSwitchToOrders
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'care' | 'food' | 'safety' | 'medical'>('all');
  const [selectedService, setSelectedService] = useState<ServiceProduct | null>(null);
  const [viewState, setViewState] = useState<StoreView>('list');
  
  // Checkout Forms
  const [scheduledDate, setScheduledDate] = useState('2026-07-03');
  const [scheduledTime, setScheduledTime] = useState('14:00-16:00');
  const [recipientName, setRecipientName] = useState(parentProfile.name);
  const [recipientAddress, setRecipientAddress] = useState(parentProfile.address);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [isPaying, setIsPaying] = useState(false);
  const [latestPlacedOrder, setLatestPlacedOrder] = useState<Order | null>(null);

  // Filter Catalog
  const filteredCatalog = serviceCatalog.filter(srv => {
    if (activeCategory === 'all') return true;
    return srv.category === activeCategory;
  });

  const handleOpenDetail = (srv: ServiceProduct) => {
    setSelectedService(srv);
    setViewState('detail');
  };

  const handleOpenCheckout = () => {
    setViewState('checkout');
  };

  const handlePay = () => {
    if (!selectedService) return;
    setIsPaying(true);
    
    setTimeout(() => {
      const now = new Date();
      const orderId = `ord-${Date.now().toString().slice(-6)}`;
      const orderTimeStr = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0');

      const newOrder: Order = {
        id: orderId,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        serviceDate: scheduledDate,
        serviceTime: scheduledTime,
        parentName: recipientName,
        parentAddress: recipientAddress,
        status: 'paid',
        statusLogs: [
          { time: orderTimeStr, text: '订单下单成功，子女在线全额支付' },
          { time: orderTimeStr, text: '养老服务网关对接成功，正在调度指派服务人员' }
        ],
        orderTime: orderTimeStr,
        paymentMethod: paymentMethod === 'wechat' ? '微信支付' : '支付宝'
      };

      onAddOrder(newOrder);
      setLatestPlacedOrder(newOrder);
      setIsPaying(false);
      setViewState('success');
    }, 1500); // Payment loading simulation
  };

  const handleCloseStoreFlow = () => {
    setSelectedService(null);
    setViewState('list');
  };

  return (
    <div className="p-4 pb-6" id="h5-store-tab">
      {/* ================= VIEW 1: SERVICE LIST ================= */}
      {viewState === 'list' && (
        <div className="space-y-4">
          {/* Market Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-2xl shadow-xs relative overflow-hidden animate-scale-in">
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-400/30 rounded-full blur-xl"></div>
            <div className="relative z-10 space-y-1">
              <span className="text-5xs uppercase font-bold tracking-wider bg-blue-800 text-blue-100 px-2 py-0.5 rounded-full">长辈专属服务商城</span>
              <h3 className="font-extrabold text-sm">儿女一键下单 • 爸妈安心享受</h3>
              <p className="text-5xs text-blue-100/90 leading-relaxed font-semibold">精选适老化安全改造、生活照料及医疗级专业居家护理</p>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {[
              { id: 'all', label: '全部' },
              { id: 'care', label: '居家照护' },
              { id: 'food', label: '生活送餐' },
              { id: 'safety', label: '适老安全' },
              { id: 'medical', label: '医疗护理' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`text-3xs px-3.5 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-colors font-extrabold ${activeCategory === cat.id ? 'bg-blue-600 text-white shadow-3xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Service Items Grid */}
          <div className="space-y-3">
            {filteredCatalog.map(srv => (
              <div 
                key={srv.id} 
                onClick={() => handleOpenDetail(srv)}
                className="bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden flex cursor-pointer hover:border-blue-200 hover:shadow-2xs transition-all duration-200"
              >
                <img 
                  src={srv.image} 
                  alt={srv.name} 
                  className="w-24 h-24 object-cover shrink-0"
                />
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-5xs font-black px-1.5 py-0.2 rounded uppercase ${
                        srv.category === 'care' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        srv.category === 'food' ? 'bg-orange-50 text-orange-650 border border-orange-100' :
                        srv.category === 'safety' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {srv.category === 'care' ? '居家照料' : srv.category === 'food' ? '健康送餐' : srv.category === 'safety' ? '适老改造' : '医疗护理'}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-500 text-3xs font-black">
                        <Star size={10} className="fill-amber-500" />
                        <span>{srv.rating}</span>
                      </div>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1 leading-snug">{srv.name}</h4>
                    <p className="text-4xs text-slate-400 line-clamp-1 font-semibold">{srv.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-blue-600 font-extrabold text-xs">￥{srv.price}</span>
                      <span className="text-4xs text-slate-400 font-bold">/{srv.unit}</span>
                    </div>
                    <span className="text-4xs text-slate-450 font-bold">已售 {srv.sales}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: SERVICE DETAIL ================= */}
      {viewState === 'detail' && selectedService && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 animate-scale-in">
          <div className="relative">
            <img 
              src={selectedService.image} 
              alt={selectedService.name} 
              className="w-full h-40 object-cover"
            />
            <button 
              onClick={handleCloseStoreFlow}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-4xs bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded-full border border-blue-100">
                  专业养老服务认证
                </span>
                <div className="flex items-center gap-1 text-slate-500 text-3xs font-extrabold uppercase">
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                  <span>{selectedService.rating} 评分</span>
                </div>
              </div>
              
              <h3 className="text-sm font-extrabold text-slate-800 leading-snug">{selectedService.name}</h3>
              
              <div className="flex items-baseline gap-1">
                <span className="text-blue-600 font-black text-base">￥{selectedService.price}</span>
                <span className="text-3xs text-slate-400 font-bold">/{selectedService.unit}</span>
              </div>
            </div>

            <div className="border-t border-b border-slate-100 py-3 space-y-2">
              <h4 className="text-3xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Shield size={14} className="text-blue-600" />
                服务保障特色
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedService.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-3xs text-slate-600 font-semibold">
                    <Check size={12} className="text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-3xs font-extrabold text-slate-800 uppercase tracking-wider">服务详情介绍</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{selectedService.longDescription}</p>
            </div>

            {/* Quick Customer Review Mock */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <div className="flex justify-between items-center text-4xs text-slate-400 font-bold">
                <span className="font-extrabold text-slate-600 flex items-center gap-1">
                  <User size={10} />
                  子女评价 (王*英)
                </span>
                <span>2026-06-25</span>
              </div>
              <p className="text-4xs text-slate-600 leading-normal font-semibold">
                “上门服务的师傅特别专业，服务态度简直太好了。老人年纪大了洗澡不方便，以前洗一次惊心动魄，今天用这个服务，老人非常开心也洗得很干净。极力推荐！”
              </p>
            </div>

            {/* Checkout CTAs */}
            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleCloseStoreFlow}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors text-center cursor-pointer"
              >
                返回
              </button>
              <button 
                onClick={handleOpenCheckout}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold py-2.5 rounded-xl transition-colors text-center shadow-3xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShoppingBag size={14} />
                立即在线购买
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: CHECKOUT FLOW ================= */}
      {viewState === 'checkout' && selectedService && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4 animate-scale-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">服务购买结算</h3>
            <button onClick={() => setViewState('detail')} className="text-slate-400 hover:text-slate-650 cursor-pointer">
              <X size={16} />
            </button>
          </div>

          {/* Simple Product Summary Card */}
          <div className="flex gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <img src={selectedService.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1 flex flex-col justify-between">
              <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1 leading-tight">{selectedService.name}</h4>
              <div className="flex justify-between items-baseline">
                <span className="text-blue-600 font-extrabold text-xs">￥{selectedService.price}</span>
                <span className="text-4xs text-slate-400 font-bold">数量: 1</span>
              </div>
            </div>
          </div>

          {/* Order Configuration form */}
          <div className="space-y-3">
            {/* 1. Address Block */}
            <div className="space-y-1">
              <label className="text-4xs text-slate-400 block font-extrabold uppercase">1. 选择服务长辈与地址</label>
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 relative">
                <div className="flex justify-between text-xs font-extrabold text-slate-800">
                  <span>服务对象: {recipientName}</span>
                  <span>{parentProfile.contact}</span>
                </div>
                <p className="text-3xs text-slate-500 flex items-center gap-1 font-semibold">
                  <MapPin size={10} className="text-slate-450 shrink-0" />
                  {recipientAddress}
                </p>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                  <ChevronRight size={16} />
                </span>
              </div>
            </div>

            {/* 2. Schedule Date & Time */}
            <div className="space-y-1">
              <label className="text-4xs text-slate-400 block font-extrabold uppercase">2. 选择服务上门时间</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="relative">
                    <select 
                      value={scheduledDate} 
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-3xs text-slate-700 font-bold appearance-none focus:outline-none focus:border-blue-600"
                    >
                      <option value="2026-07-02">明天 (07月02日)</option>
                      <option value="2026-07-03">后天 (07月03日)</option>
                      <option value="2026-07-04">周六 (07月04日)</option>
                      <option value="2026-07-05">周日 (07月05日)</option>
                    </select>
                    <Calendar size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <select 
                      value={scheduledTime} 
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-3xs text-slate-700 font-bold appearance-none focus:outline-none focus:border-blue-600"
                    >
                      <option value="09:00-11:00">早上 09:00 - 11:00</option>
                      <option value="11:00-13:00">中午 11:00 - 13:00</option>
                      <option value="14:00-16:00">下午 14:00 - 16:00</option>
                      <option value="16:00-18:00">傍晚 16:00 - 18:00</option>
                    </select>
                    <Clock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Payment Option */}
            <div className="space-y-1">
              <label className="text-4xs text-slate-400 block font-extrabold uppercase">3. 支付方式</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wechat')}
                  className={`border rounded-xl p-2.5 flex items-center justify-between transition-all cursor-pointer ${paymentMethod === 'wechat' ? 'border-emerald-500 bg-emerald-50/20 text-slate-800 font-extrabold' : 'border-slate-200 bg-white text-slate-500'}`}
                >
                  <span className="text-3xs flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-3xs">微</span>
                    微信支付
                  </span>
                  {paymentMethod === 'wechat' && <Check size={12} className="text-emerald-500" />}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('alipay')}
                  className={`border rounded-xl p-2.5 flex items-center justify-between transition-all cursor-pointer ${paymentMethod === 'alipay' ? 'border-blue-500 bg-blue-50/20 text-slate-800 font-extrabold' : 'border-slate-200 bg-white text-slate-500'}`}
                >
                  <span className="text-3xs flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-3xs">支</span>
                    支付宝
                  </span>
                  {paymentMethod === 'alipay' && <Check size={12} className="text-blue-500" />}
                </button>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-slate-100 pt-3 space-y-1.5">
            <div className="flex justify-between text-4xs text-slate-450 font-bold">
              <span>商品/服务总额</span>
              <span>￥{selectedService.price}</span>
            </div>
            <div className="flex justify-between text-4xs text-slate-450 font-bold">
              <span>上门派单服务费</span>
              <span className="text-emerald-600 font-extrabold bg-emerald-50 px-1 rounded">免上门派单费</span>
            </div>
            <div className="flex justify-between text-xs font-extrabold text-slate-800 pt-1 border-t border-dashed border-slate-200">
              <span>实付总额</span>
              <span className="text-blue-600 text-sm font-black">￥{selectedService.price}</span>
            </div>
          </div>

          {/* Submit Pay button */}
          <div className="pt-1">
            {isPaying ? (
              <button 
                disabled 
                className="w-full bg-blue-400 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                模拟支付安全盾处理中...
              </button>
            ) : (
              <button 
                onClick={handlePay}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold py-3 rounded-xl shadow-3xs transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
              >
                <CreditCard size={14} />
                确认支付 ￥{selectedService.price}
              </button>
            )}
            <p className="text-4xs text-slate-400 text-center mt-2.5 flex items-center justify-center gap-1 font-bold">
              <Shield size={10} className="text-emerald-500" />
              民政平台资金托管保障：完成服务后服务人员方可解冻提现
            </p>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: SUCCESS RECEIPT ================= */}
      {viewState === 'success' && latestPlacedOrder && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center space-y-5 animate-scale-in">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Check size={26} className="stroke-[3]" />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-slate-800">支付成功</h3>
            <p className="text-2xs text-slate-500 font-bold">养老照护服务已经下发，即将上门</p>
          </div>

          {/* Receipt details */}
          <div className="bg-slate-50 rounded-xl p-3 text-left border border-slate-100 space-y-2">
            <div className="flex justify-between text-4xs border-b border-slate-100 pb-1.5 font-bold">
              <span className="text-slate-400">订单单号</span>
              <span className="font-mono text-slate-700">{latestPlacedOrder.id}</span>
            </div>
            <div className="flex justify-between text-4xs font-bold">
              <span className="text-slate-400">服务项目</span>
              <span className="text-slate-800">{latestPlacedOrder.serviceName}</span>
            </div>
            <div className="flex justify-between text-4xs font-bold">
              <span className="text-slate-400">上门时间</span>
              <span className="text-slate-700">{latestPlacedOrder.serviceDate} ({latestPlacedOrder.serviceTime})</span>
            </div>
            <div className="flex justify-between text-4xs font-bold">
              <span className="text-slate-400">服务长辈</span>
              <span className="text-slate-700">{latestPlacedOrder.parentName}</span>
            </div>
            <div className="flex justify-between text-4xs font-bold">
              <span className="text-slate-400">服务地址</span>
              <span className="text-slate-700 max-w-40 text-right truncate font-semibold" title={latestPlacedOrder.parentAddress}>
                {latestPlacedOrder.parentAddress}
              </span>
            </div>
          </div>

          {/* Next Steps Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button 
              onClick={() => setViewState('list')}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-3xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              继续逛商城
            </button>
            <button 
              onClick={onSwitchToOrders}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-3xs font-extrabold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <HeartHandshake size={12} />
              查看照护进度
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
