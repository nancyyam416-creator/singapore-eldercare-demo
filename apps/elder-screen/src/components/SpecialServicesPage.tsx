import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronLeft,
  Clock3,
  HandHeart,
  HeartPulse,
  Home,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  WifiOff,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { speakText } from "../audio/speech";
import type { SpecialServiceBooking } from "../types";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./special-services-page.css";

interface ServiceSlot {
  id: string;
  label: string;
}

interface SpecialServiceItem {
  id: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  provider: string;
  price: string;
  duration: string;
  notice?: string;
  slots: ServiceSlot[];
  Icon: LucideIcon;
}

interface SpecialServicesPageProps {
  isOpen: boolean;
  bookings: SpecialServiceBooking[];
  onClose: () => void;
  onBook: (booking: SpecialServiceBooking) => void;
  onCancelBooking: (bookingId: string) => void;
  initialServiceId?: string | null;
}

type PageView = "list" | "detail" | "confirm" | "success" | "bookings";

const services: SpecialServiceItem[] = [
  {
    id: "cleaning",
    name: "家政保洁",
    category: "居家服务",
    summary: "专业人员上门进行客厅、卧室和厨卫基础清洁。",
    description: "服务人员将按预约时间上门，完成地面清洁、家具表面除尘、厨房台面整理和卫生间基础清洁。服务开始前会再次电话确认，不会临时增加未经确认的收费项目。",
    provider: "安心到家社区服务中心",
    price: "参考价 120 元起",
    duration: "约 2 小时",
    notice: "贵重物品请提前收好，服务人员上门时请先核对工作证。",
    slots: [
      { id: "clean-tomorrow-am", label: "明天上午 09:00—11:00" },
      { id: "clean-tomorrow-pm", label: "明天下午 14:00—16:00" },
      { id: "clean-after-am", label: "后天上午 09:00—11:00" },
    ],
    Icon: Sparkles,
  },
  {
    id: "repair",
    name: "上门维修",
    category: "居家服务",
    summary: "水电、小家电及居家设施问题，由社区认证师傅上门查看。",
    description: "预约后，服务站会先电话了解需要维修的内容，再安排经过实名认证的维修人员上门。现场检查后，涉及配件或额外费用时会先向您说明，得到确认后才开始维修。",
    provider: "社区便民维修站",
    price: "上门检查费 30 元",
    duration: "根据维修内容确定",
    notice: "如有漏水、冒烟或燃气异味，请直接使用紧急呼叫，不要等待普通预约。",
    slots: [
      { id: "repair-today-pm", label: "今天下午 15:00—17:00" },
      { id: "repair-tomorrow-am", label: "明天上午 09:00—11:00" },
      { id: "repair-tomorrow-pm", label: "明天下午 14:00—16:00" },
    ],
    Icon: Wrench,
  },
  {
    id: "medical-companion",
    name: "陪诊服务",
    category: "健康服务",
    summary: "陪同就医、协助取号缴费，并帮助记录医生交代事项。",
    description: "陪诊人员会提前联系确认医院、科室和就诊时间，并在约定地点等候。服务包含陪同取号、候诊、检查引导和记录医生交代事项，不代替医生提供诊断或治疗建议。",
    provider: "社区健康管家中心",
    price: "参考价 180 元起",
    duration: "半天",
    notice: "请准备身份证、医保卡、预约凭证和正在服用的药物清单。",
    slots: [
      { id: "medical-tomorrow-am", label: "明天上午 07:30—12:00" },
      { id: "medical-after-am", label: "后天上午 07:30—12:00" },
      { id: "medical-after-pm", label: "后天下午 13:00—17:30" },
    ],
    Icon: HeartPulse,
  },
  {
    id: "care",
    name: "助老生活照护",
    category: "照护服务",
    summary: "提供助浴、理发、代购等日常生活协助。",
    description: "由经过培训的助老服务人员提供日常生活协助。预约时可说明需要助浴、理发、代购或其他帮助，服务站会根据实际需求匹配合适的工作人员。",
    provider: "社区综合助老服务站",
    price: "根据服务内容确认",
    duration: "约 1—2 小时",
    slots: [
      { id: "care-tomorrow-am", label: "明天上午 09:30—11:30" },
      { id: "care-tomorrow-pm", label: "明天下午 14:30—16:30" },
      { id: "care-after-am", label: "后天上午 09:30—11:30" },
    ],
    Icon: HandHeart,
  },
];

export default function SpecialServicesPage({
  isOpen,
  bookings,
  onClose,
  onBook,
  onCancelBooking,
  initialServiceId = null,
}: SpecialServicesPageProps) {
  const [view, setView] = useState<PageView>("list");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [latestBookingId, setLatestBookingId] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedSlot = selectedService?.slots.find((slot) => slot.id === selectedSlotId) ?? null;
  const latestBooking = bookings.find((booking) => booking.id === latestBookingId) ?? null;
  const selectedServiceBookings = selectedService
    ? activeBookings.filter((booking) => booking.serviceId === selectedService.id)
    : [];
  const reservedSlotIds = new Set(selectedServiceBookings.map((booking) => booking.slotId));
  const cancelTarget = bookings.find((booking) => booking.id === cancelTargetId) ?? null;

  const serviceBookingCounts = useMemo(
    () => activeBookings.reduce<Record<string, number>>((counts, booking) => ({
      ...counts,
      [booking.serviceId]: (counts[booking.serviceId] ?? 0) + 1,
    }), {}),
    [activeBookings],
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setView("list");
      setSelectedServiceId(null);
      setSelectedSlotId(null);
      setLatestBookingId(null);
      setCancelTargetId(null);
      return;
    }
    if (initialServiceId && services.some((service) => service.id === initialServiceId)) {
      setSelectedServiceId(initialServiceId);
      setSelectedSlotId(null);
      setView("detail");
    }
  }, [initialServiceId, isOpen]);

  const openService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedSlotId(null);
    setView("detail");
  };

  const confirmBooking = () => {
    if (!selectedService || !selectedSlot || !isOnline) return;
    if (activeBookings.some((booking) => (
      booking.serviceId === selectedService.id && booking.slotId === selectedSlot.id
    ))) return;
    const booking: SpecialServiceBooking = {
      id: `service-booking-${Date.now()}`,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      provider: selectedService.provider,
      slotId: selectedSlot.id,
      slotLabel: selectedSlot.label,
      status: "booked",
      createdAt: new Date().toISOString(),
    };
    onBook(booking);
    setLatestBookingId(booking.id);
    setView("success");

    speakText(
      `${selectedService.name}已经预约成功，服务人员将在${selectedSlot.label}上门，开始前会再次联系您。`,
      {
        fallbackKey: "service-booked",
        rate: 0.88,
      },
    );
  };

  if (!isOpen) return null;

  return (
    <main className="special-services-page" aria-label="特约服务">
      <SecondaryPageHeader
        title="特约服务"
        icon={<HandHeart aria-hidden="true" />}
        onBack={onClose}
        actions={(
          <button type="button" className="special-services-bookings-entry" onClick={() => setView("bookings")}>
            <CalendarClock aria-hidden="true" />
            我的预约
            {activeBookings.length > 0 && <span>{activeBookings.length}</span>}
          </button>
        )}
      />

      {view === "list" && (
        <div className="special-services-list-view">
          <section className="special-services-intro">
            <div>
              <ShieldCheck aria-hidden="true" />
              <div>
                <h2>社区认证服务</h2>
                <p>选择需要的服务，确认时间后即可预约</p>
              </div>
            </div>
            {!isOnline && (
              <p role="status"><WifiOff aria-hidden="true" />网络异常，暂时不能提交预约</p>
            )}
          </section>

          <div className="special-services-grid">
            {services.map((service) => {
              const bookingCount = serviceBookingCounts[service.id] ?? 0;
              return (
                <article key={service.id} className={`special-service-card${bookingCount > 0 ? " is-booked" : ""}`}>
                  <span className="special-service-card__icon"><service.Icon aria-hidden="true" /></span>
                  <div className="special-service-card__copy">
                    <span>{service.category}</span>
                    <h3>{service.name}</h3>
                    <p>{service.summary}</p>
                    <small>{service.provider}</small>
                  </div>
                  <div className="special-service-card__aside">
                    <strong>{service.price}</strong>
                    <small>{bookingCount > 0 ? `已有 ${bookingCount} 个预约，可继续预约` : service.slots[0]?.label}</small>
                    <button type="button" onClick={() => openService(service.id)}>
                      <ChevronLeft aria-hidden="true" />
                      {bookingCount > 0 ? "再次预约" : "查看并预约"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {view === "detail" && selectedService && (
        <div className="special-services-detail-view">
          <button
            type="button"
            className="special-services-back"
            onClick={() => initialServiceId ? onClose() : setView("list")}
          >
            <ChevronLeft aria-hidden="true" />
            {initialServiceId ? "返回首页" : "返回服务列表"}
          </button>

          <div className="special-services-detail-layout">
            <article className="special-services-detail">
              <header>
                <span className="special-services-detail__icon"><selectedService.Icon aria-hidden="true" /></span>
                <div>
                  <span>{selectedService.category}</span>
                  <h2>{selectedService.name}</h2>
                  <p>{selectedService.summary}</p>
                </div>
              </header>
              <section className="special-services-detail__description">
                <h3>服务说明</h3>
                <p>{selectedService.description}</p>
              </section>
              <div className="special-services-detail__facts">
                <p><ShieldCheck aria-hidden="true" /><span><small>服务机构</small><strong>{selectedService.provider}</strong></span></p>
                <p><Clock3 aria-hidden="true" /><span><small>服务时长</small><strong>{selectedService.duration}</strong></span></p>
                <p><HandHeart aria-hidden="true" /><span><small>价格说明</small><strong>{selectedService.price}</strong></span></p>
              </div>
              {selectedService.notice && (
                <p className="special-services-detail__notice"><ShieldCheck aria-hidden="true" />{selectedService.notice}</p>
              )}
            </article>

            <aside className="special-services-slots">
              <h3><CalendarClock aria-hidden="true" />选择上门时间</h3>
              {selectedServiceBookings.length > 0 && (
                <p className="special-services-slot-booked-summary">
                  <Check aria-hidden="true" />
                  这项服务已有 {selectedServiceBookings.length} 个预约，还可以继续选择其他时间
                </p>
              )}
              <div>
                {selectedService.slots.map((slot) => {
                  const reserved = reservedSlotIds.has(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      className={selectedSlotId === slot.id ? "is-selected" : ""}
                      disabled={reserved}
                      onClick={() => setSelectedSlotId(slot.id)}
                      aria-pressed={selectedSlotId === slot.id}
                    >
                      <CalendarClock aria-hidden="true" />
                      {slot.label}{reserved ? "（已预约）" : ""}
                      {selectedSlotId === slot.id && <Check aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
              {!isOnline && <p><WifiOff aria-hidden="true" />请连接网络后预约</p>}
              <button
                type="button"
                className="special-services-next"
                disabled={!selectedSlot || !isOnline}
                onClick={() => setView("confirm")}
              >
                下一步：确认预约
              </button>
            </aside>
          </div>
        </div>
      )}

      {view === "confirm" && selectedService && selectedSlot && (
        <div className="special-services-confirm-view">
          <button type="button" className="special-services-back" onClick={() => setView("detail")}>
            <ChevronLeft aria-hidden="true" />
            返回修改时间
          </button>
          <section className="special-services-confirm-card">
            <header>
              <ShieldCheck aria-hidden="true" />
              <div><h2>请确认预约信息</h2><p>信息正确后，按“确认预约”即可</p></div>
            </header>
            <dl>
              <div><dt><HandHeart aria-hidden="true" />预约服务</dt><dd>{selectedService.name}</dd></div>
              <div><dt><CalendarClock aria-hidden="true" />上门时间</dt><dd>{selectedSlot.label}</dd></div>
              <div><dt><MapPin aria-hidden="true" />服务地址</dt><dd>北京市海淀区清华园街道 · 王奶奶家</dd></div>
              <div><dt><Phone aria-hidden="true" />联系电话</dt><dd>138****6028</dd></div>
              <div><dt><UserRound aria-hidden="true" />服务机构</dt><dd>{selectedService.provider}</dd></div>
              <div><dt><HandHeart aria-hidden="true" />价格说明</dt><dd>{selectedService.price}</dd></div>
            </dl>
            <p><ShieldCheck aria-hidden="true" />提交预约不会产生在线支付，服务机构会在上门前再次确认。</p>
            <div>
              <button type="button" onClick={() => setView("detail")}>返回修改</button>
              <button type="button" className="is-confirm" onClick={confirmBooking}>
                <Check aria-hidden="true" />
                确认预约
              </button>
            </div>
          </section>
        </div>
      )}

      {view === "success" && latestBooking && (
        <div className="special-services-success-view">
          <section>
            <span><Check aria-hidden="true" /></span>
            <h2>预约成功</h2>
            <strong>{latestBooking.serviceName}</strong>
            <p>{latestBooking.slotLabel}</p>
            <small>服务人员上门前会再次联系您，请安心等待。</small>
            <div>
              <button type="button" onClick={() => setView("list")}><Home aria-hidden="true" />继续查看服务</button>
              <button type="button" className="is-primary" onClick={() => setView("bookings")}>
                <CalendarClock aria-hidden="true" />
                查看我的预约
              </button>
            </div>
          </section>
        </div>
      )}

      {view === "bookings" && (
        <div className="special-services-bookings-view">
          <button type="button" className="special-services-back" onClick={() => setView("list")}>
            <ChevronLeft aria-hidden="true" />
            返回服务列表
          </button>
          <section>
            <header><CalendarClock aria-hidden="true" /><div><h2>我的预约</h2><p>查看已经提交的服务预约</p></div></header>
            {activeBookings.length === 0 ? (
              <div className="special-services-bookings-empty">
                <CalendarClock aria-hidden="true" />
                <strong>目前没有预约</strong>
                <span>可以返回服务列表选择需要的服务</span>
              </div>
            ) : (
              <div className="special-services-bookings-list">
                {activeBookings.map((booking) => (
                  <article key={booking.id}>
                    <span><Check aria-hidden="true" /></span>
                    <div><small>已预约</small><h3>{booking.serviceName}</h3><p>{booking.slotLabel}</p><em>{booking.provider}</em></div>
                    <button type="button" onClick={() => setCancelTargetId(booking.id)}>取消预约</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {cancelTarget && (
        <div className="special-services-cancel-overlay">
          <section role="dialog" aria-modal="true" aria-labelledby="cancel-service-title">
            <button type="button" className="special-services-cancel-close" onClick={() => setCancelTargetId(null)} aria-label="关闭取消预约确认">
              <X aria-hidden="true" />
            </button>
            <CalendarClock aria-hidden="true" />
            <h2 id="cancel-service-title">确定取消这项预约吗？</h2>
            <strong>{cancelTarget.serviceName}</strong>
            <p>{cancelTarget.slotLabel}</p>
            <div>
              <button type="button" onClick={() => setCancelTargetId(null)}>保留预约</button>
              <button
                type="button"
                className="is-cancel"
                onClick={() => {
                  onCancelBooking(cancelTarget.id);
                  setCancelTargetId(null);
                }}
              >
                确认取消
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
