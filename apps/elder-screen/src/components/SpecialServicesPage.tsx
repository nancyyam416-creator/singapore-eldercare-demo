import { useEffect, useMemo, useState } from "react";
import {
  Accessibility,
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
  UtensilsCrossed,
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

export type SpecialServicesAcceptanceScenario =
  | "default"
  | "no-services"
  | "filter-empty"
  | "category-load-failure"
  | "category-disabled";

type ServiceCategoryCode = "home" | "care" | "meal" | "health" | "safety";

interface ServiceCategoryItem {
  id: string;
  code: ServiceCategoryCode;
  name: string;
  description: string;
  displayOrder: number;
  status: "active" | "disabled";
  Icon: LucideIcon;
}

interface SpecialServiceItem {
  id: string;
  name: string;
  categoryId: string;
  categoryCode: ServiceCategoryCode;
  categoryName: string;
  summary: string;
  description: string;
  provider: string;
  price: string;
  duration: string;
  notice?: string;
  slots: ServiceSlot[];
  status: "active" | "disabled";
  isBookable: boolean;
  applicableToElder: boolean;
  Icon: LucideIcon;
}

interface SpecialServicesPageProps {
  isOpen: boolean;
  bookings: SpecialServiceBooking[];
  onClose: () => void;
  onBook: (booking: SpecialServiceBooking) => void;
  onCancelBooking: (bookingId: string) => void;
  initialServiceId?: string | null;
  acceptanceScenario?: SpecialServicesAcceptanceScenario;
}

type PageView = "list" | "detail" | "confirm" | "success" | "bookings";

const serviceCategories: ServiceCategoryItem[] = [
  { id: "category-home", code: "home", name: "居家服务", description: "居家清洁与日常维修", displayOrder: 1, status: "active", Icon: Home },
  { id: "category-care", code: "care", name: "照护服务", description: "日常生活照料与陪伴", displayOrder: 2, status: "active", Icon: HandHeart },
  { id: "category-meal", code: "meal", name: "助餐服务", description: "社区助餐与送餐上门", displayOrder: 3, status: "active", Icon: UtensilsCrossed },
  { id: "category-health", code: "health", name: "健康服务", description: "陪诊与健康支持", displayOrder: 4, status: "active", Icon: HeartPulse },
  { id: "category-safety", code: "safety", name: "适老安全", description: "居家安全检查与改善", displayOrder: 5, status: "active", Icon: Accessibility },
];

const services: SpecialServiceItem[] = [
  {
    id: "cleaning",
    name: "家政保洁",
    categoryId: "category-home",
    categoryCode: "home",
    categoryName: "居家服务",
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
    status: "active",
    isBookable: true,
    applicableToElder: true,
    Icon: Sparkles,
  },
  {
    id: "repair",
    name: "上门维修",
    categoryId: "category-home",
    categoryCode: "home",
    categoryName: "居家服务",
    summary: "水电、小家电及居家设施问题，由社区认证师傅上门查看。",
    description: "预约后，服务站会先电话了解需要维修的内容，再安排经过实名认证的维修人员上门。现场检查后，涉及配件或额外费用时会先向您说明，得到确认后才开始维修。",
    provider: "社区便民维修站",
    price: "上门检查费 30 元",
    duration: "根据维修内容确定",
    notice: "如有漏水、冒烟或燃气异味，请直接使用紧急求助，不要等待普通预约。",
    slots: [
      { id: "repair-today-pm", label: "今天下午 15:00—17:00" },
      { id: "repair-tomorrow-am", label: "明天上午 09:00—11:00" },
      { id: "repair-tomorrow-pm", label: "明天下午 14:00—16:00" },
    ],
    status: "active",
    isBookable: true,
    applicableToElder: true,
    Icon: Wrench,
  },
  {
    id: "medical-companion",
    name: "陪诊服务",
    categoryId: "category-health",
    categoryCode: "health",
    categoryName: "健康服务",
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
    status: "active",
    isBookable: true,
    applicableToElder: true,
    Icon: HeartPulse,
  },
  {
    id: "care",
    name: "助老生活照护",
    categoryId: "category-care",
    categoryCode: "care",
    categoryName: "照护服务",
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
    status: "active",
    isBookable: true,
    applicableToElder: true,
    Icon: HandHeart,
  },
  {
    id: "meal-delivery",
    name: "社区助餐配送",
    categoryId: "category-meal",
    categoryCode: "meal",
    categoryName: "助餐服务",
    summary: "适合老人的热餐按约定时间送到家。",
    description: "社区助餐点根据当日菜单配餐，工作人员会在预约后联系确认送餐地址和忌口信息。本服务不代替医疗营养方案。",
    provider: "社区助餐服务站",
    price: "参考价 18 元起",
    duration: "按餐次配送",
    notice: "如有特殊忌口或医生交代的饮食限制，请在确认时说明。",
    slots: [
      { id: "meal-today-noon", label: "今天中午 11:30—12:30" },
      { id: "meal-today-evening", label: "今天晚餐 17:30—18:30" },
      { id: "meal-tomorrow-noon", label: "明天中午 11:30—12:30" },
    ],
    status: "active",
    isBookable: true,
    applicableToElder: true,
    Icon: UtensilsCrossed,
  },
  {
    id: "home-safety-check",
    name: "居家适老安全检查",
    categoryId: "category-safety",
    categoryCode: "safety",
    categoryName: "适老安全",
    summary: "上门查看浴室防滑、走道照明和扶手需求。",
    description: "服务人员会对家中容易发生跌倒的位置进行基础检查，现场说明可以改善的地方。检查本身不包含施工，任何后续费用都需再次确认。",
    provider: "社区居家安全服务站",
    price: "基础检查免费",
    duration: "约 40 分钟",
    notice: "工作人员上门时请先核对工作证，不会当场要求支付改造费用。",
    slots: [
      { id: "safety-tomorrow-am", label: "明天上午 10:00—11:00" },
      { id: "safety-tomorrow-pm", label: "明天下午 15:00—16:00" },
      { id: "safety-after-am", label: "后天上午 10:00—11:00" },
    ],
    status: "active",
    isBookable: true,
    applicableToElder: true,
    Icon: Accessibility,
  },
];

export default function SpecialServicesPage({
  isOpen,
  bookings,
  onClose,
  onBook,
  onCancelBooking,
  initialServiceId = null,
  acceptanceScenario = "default",
}: SpecialServicesPageProps) {
  const [view, setView] = useState<PageView>("list");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [latestBookingId, setLatestBookingId] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<"all" | ServiceCategoryCode>("all");
  const [categoryRetrySucceeded, setCategoryRetrySucceeded] = useState(false);
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedSlot = selectedService?.slots.find((slot) => slot.id === selectedSlotId) ?? null;
  const latestBooking = bookings.find((booking) => booking.id === latestBookingId) ?? null;
  const selectedServiceBookings = selectedService
    ? activeBookings.filter((booking) => booking.serviceId === selectedService.id)
    : [];
  const reservedSlotIds = new Set(selectedServiceBookings.map((booking) => booking.slotId));
  const cancelTarget = bookings.find((booking) => booking.id === cancelTargetId) ?? null;

  const effectiveAcceptanceScenario = categoryRetrySucceeded && acceptanceScenario === "category-load-failure"
    ? "default"
    : acceptanceScenario;
  const eligibleServices = useMemo(() => services.filter((service) => {
    if (service.status !== "active" || !service.isBookable || !service.applicableToElder) return false;
    if (effectiveAcceptanceScenario === "no-services") return false;
    if (effectiveAcceptanceScenario === "filter-empty" && service.categoryCode === "meal") return false;
    if (effectiveAcceptanceScenario === "category-disabled" && service.categoryCode === "safety") return false;
    return true;
  }), [effectiveAcceptanceScenario]);
  const availableCategories = useMemo(() => serviceCategories
    .filter((category) => category.status === "active")
    .filter((category) => !(effectiveAcceptanceScenario === "category-disabled" && category.code === "safety"))
    .map((category) => ({
      ...category,
      availableServiceCount: eligibleServices.filter((service) => service.categoryCode === category.code).length,
    }))
    .filter((category) => category.availableServiceCount > 0 || (
      effectiveAcceptanceScenario === "filter-empty" && category.code === selectedCategoryCode
    ))
    .sort((a, b) => a.displayOrder - b.displayOrder), [effectiveAcceptanceScenario, eligibleServices, selectedCategoryCode]);
  const visibleServices = selectedCategoryCode === "all"
    ? eligibleServices
    : eligibleServices.filter((service) => service.categoryCode === selectedCategoryCode);

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

  useEffect(() => {
    setCategoryRetrySucceeded(false);
    setView("list");
    setSelectedServiceId(null);
    setSelectedSlotId(null);
    setLatestBookingId(null);
    setCancelTargetId(null);
    if (acceptanceScenario === "filter-empty") {
      setSelectedCategoryCode("meal");
      return;
    }
    if (acceptanceScenario === "no-services" || acceptanceScenario === "category-load-failure") {
      setSelectedCategoryCode("all");
      return;
    }
    if (acceptanceScenario === "category-disabled") {
      setSelectedCategoryCode((current) => current === "safety" ? "all" : current);
    }
  }, [acceptanceScenario]);

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
      categoryCode: selectedService.categoryCode,
      categoryName: selectedService.categoryName,
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
          <div className="special-services-catalog-layout">
            <aside className="special-services-sidebar" aria-label="服务分类">
              {effectiveAcceptanceScenario !== "category-load-failure" && (
              <nav className="special-services-categories" aria-label="服务分类">
                <button
                  type="button"
                  className={selectedCategoryCode === "all" ? "is-active" : ""}
                  onClick={() => setSelectedCategoryCode("all")}
                  aria-pressed={selectedCategoryCode === "all"}
                >
                  <span className="special-service-category__icon"><Sparkles aria-hidden="true" /></span>
                  <strong>全部</strong>
                </button>
                {availableCategories.map((category) => {
                  const CategoryIcon = category.Icon;
                  return (
                    <button
                      key={category.code}
                      type="button"
                      className={selectedCategoryCode === category.code ? "is-active" : ""}
                      onClick={() => setSelectedCategoryCode(category.code)}
                      aria-pressed={selectedCategoryCode === category.code}
                      title={category.description}
                    >
                      <span className="special-service-category__icon"><CategoryIcon aria-hidden="true" /></span>
                      <strong>{category.name}</strong>
                    </button>
                  );
                })}
              </nav>
              )}
            </aside>

            <section className="special-services-content" aria-live="polite">
              {!isOnline && (
                <p className="special-services-offline-banner" role="status">
                  <WifiOff aria-hidden="true" />
                  网络异常，暂时不能提交预约
                </p>
              )}
              {effectiveAcceptanceScenario === "category-load-failure" ? (
                <section className="special-services-state" role="status">
                  <WifiOff aria-hidden="true" />
                  <h2>服务分类暂时加载失败</h2>
                  <p>请检查网络后重新加载，其他功能不受影响。</p>
                  <button type="button" onClick={() => setCategoryRetrySucceeded(true)}>重新加载</button>
                </section>
              ) : visibleServices.length === 0 ? (
                <section className="special-services-state" role="status">
                  <HandHeart aria-hidden="true" />
                  <h2>{selectedCategoryCode === "all" ? "当前暂无可预约服务" : "该分类暂时没有可预约服务"}</h2>
                  <p>可以稍后再来看看。</p>
                  {selectedCategoryCode !== "all" && (
                    <button type="button" onClick={() => setSelectedCategoryCode("all")}>返回全部服务</button>
                  )}
                </section>
              ) : (
                <div className="special-services-grid">
                  {visibleServices.map((service) => {
                    const bookingCount = serviceBookingCounts[service.id] ?? 0;
                    return (
                      <article key={service.id} className={`special-service-card${bookingCount > 0 ? " is-booked" : ""}`}>
                        <span className="special-service-card__icon"><service.Icon aria-hidden="true" /></span>
                        <div className="special-service-card__copy">
                          <span>{service.categoryName}</span>
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
              )}
            </section>
          </div>
        </div>
      )}

      {view === "detail" && selectedService && (
        <section
          className="special-services-detail-view"
          role="dialog"
          aria-modal="true"
          aria-label={`查看服务：${selectedService.name}`}
        >
          <header className="special-services-flow-header">
            <button
              type="button"
              className="special-services-flow-nav"
              onClick={() => initialServiceId ? onClose() : setView("list")}
            >
              <X aria-hidden="true" />
              <strong>收起</strong>
            </button>
            <strong>特约服务</strong>
          </header>

          <div className="special-services-detail-layout">
            <article className="special-services-detail">
              <header>
                <span className="special-services-detail__icon"><selectedService.Icon aria-hidden="true" /></span>
                <div>
                  <span>{selectedService.categoryName}</span>
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
        </section>
      )}

      {view === "confirm" && selectedService && selectedSlot && (
        <section
          className="special-services-confirm-view"
          role="dialog"
          aria-modal="true"
          aria-label="确认预约"
        >
          <header className="special-services-flow-header">
            <button type="button" className="special-services-flow-nav" onClick={() => setView("detail")}>
              <ChevronLeft aria-hidden="true" />
              <strong>返回修改</strong>
            </button>
            <strong>确认预约</strong>
          </header>
          <div className="special-services-confirm-body">
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
                <button type="button" className="is-confirm" onClick={confirmBooking}>
                  <Check aria-hidden="true" />
                  确认预约
                </button>
              </div>
            </section>
          </div>
        </section>
      )}

      {view === "success" && latestBooking && (
        <section
          className="special-services-success-view"
          role="dialog"
          aria-modal="true"
          aria-label="预约结果"
        >
          <header className="special-services-flow-header">
            <button type="button" className="special-services-flow-nav" onClick={() => setView("list")}>
              <X aria-hidden="true" />
              <strong>收起</strong>
            </button>
            <strong>预约结果</strong>
          </header>
          <div className="special-services-success-body">
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
        </section>
      )}

      {view === "bookings" && (
        <section
          className="special-services-bookings-view"
          role="dialog"
          aria-modal="true"
          aria-label="我的预约"
        >
          <header className="special-services-flow-header">
            <button type="button" className="special-services-flow-nav" onClick={() => setView("list")}>
              <X aria-hidden="true" />
              <strong>收起</strong>
            </button>
            <strong>我的预约</strong>
          </header>
          <div className="special-services-bookings-body">
            <section>
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
                    <div><small>{booking.categoryName ?? "已预约"}</small><h3>{booking.serviceName}</h3><p>{booking.slotLabel}</p><em>{booking.provider}</em></div>
                    <button type="button" onClick={() => setCancelTargetId(booking.id)}>取消预约</button>
                  </article>
                ))}
              </div>
            )}
            </section>
          </div>
        </section>
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
