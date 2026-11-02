import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Droplets,
  HandHeart,
  MapPinOff,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  WifiOff,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import SecondaryPageHeader from "./SecondaryPageHeader";
import { elderProfileMock, getActiveFamilyRelationships } from "../elder-profile";
import {
  unifiedServiceCatalog,
  unifiedServiceCategories,
} from "../../../产品理解/90 原型与Mock素材/mock/统一服务目录.js";
import {
  canReviewServiceAssistance,
  getLatestServiceAssistanceRecord,
  getServiceAssistanceConfirmationCopy,
  readSharedServiceAssistanceRecords,
  serviceAssistanceExpiryMessage,
  submitSharedServiceReview,
  upsertSharedServiceAssistanceRecord,
} from "../../../产品理解/90 原型与Mock素材/mock/服务协助记录共享Mock.js";
import "./special-services-page.css";

export type SpecialServicesAcceptanceScenario =
  | "default"
  | "no-services"
  | "filter-empty"
  | "category-load-failure"
  | "category-disabled"
  | "family-help-idle"
  | "family-help-confirm"
  | "family-help-pending"
  | "family-help-handled"
  | "service-completed"
  | "service-reviewed";

type ServiceCategoryCode = "electric" | "water" | "basic";
type AssistanceStage = "idle" | "pending" | "expired" | "handled" | "completed" | "reviewed";

interface ServiceCategoryItem {
  code: ServiceCategoryCode;
  name: string;
  description: string;
  Icon: LucideIcon;
}

interface SpecialServiceItem {
  id: string;
  name: string;
  categoryCode: ServiceCategoryCode;
  categoryName: string;
  provider: string;
  providerPhone: string;
  businessHours: string;
  priceRange: string;
  description: string;
  serviceContent: string;
  precautions: string[];
  coverImage: string;
  detailImages: string[];
  coverageMode?: "all" | "specified";
  coverageCommunityIds?: string[];
  Icon: LucideIcon;
}

interface AssistanceRecord {
  stage: AssistanceStage;
  recordId?: string;
  requestedAt?: string;
  handledBy?: string;
  handledAt?: string;
  resultSummary?: string;
  completedAt?: string;
  review?: {
    rating: number;
    text: string;
    submittedAt: string;
  };
}

interface SharedAssistanceRecord {
  id: string;
  projectId: string;
  communityId: string;
  elder: { id: string; name: string; phone: string };
  service: { id: string; name: string; categoryName: string };
  provider: { name: string; phone: string };
  requestReason: string;
  requestedAt: string;
  status: "pending" | "handling" | "handled" | "cancelled" | "expired";
  expiredAt?: string | null;
  recipientIds: string[];
  handledBy: string | null;
  handledAt: string | null;
  resultSummary: string | null;
  serviceStatus: "not_completed" | "completed";
  completedAt: string | null;
  completedBy?: string | null;
  review: { rating: number; text: string; elderId?: string; submittedAt: string; edited?: boolean } | null;
}

interface SpecialServicesPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: string | null;
  acceptanceScenario?: SpecialServicesAcceptanceScenario;
  acceptanceActionSignal?: number;
}

const categoryPresentation: Record<ServiceCategoryCode, { description: string; Icon: LucideIcon }> = {
  electric: { description: "灯具、开关及家庭电路检查", Icon: Zap },
  water: { description: "水龙头及常见漏水问题检查", Icon: Droplets },
  basic: { description: "门锁、把手与家具小修", Icon: Wrench },
};

const serviceCategories: ServiceCategoryItem[] = unifiedServiceCategories.map((category) => ({
  code: category.code as ServiceCategoryCode,
  name: category.name,
  ...categoryPresentation[category.code as ServiceCategoryCode],
}));

const services: SpecialServiceItem[] = unifiedServiceCatalog.map((service) => ({
  ...service,
  categoryCode: service.categoryCode as ServiceCategoryCode,
  categoryName: service.category,
  precautions: service.precautions.split("\n"),
  Icon: categoryPresentation[service.categoryCode as ServiceCategoryCode].Icon,
}));

const servicesForCurrentCommunity = services.filter((service) => (
  !service.coverageMode
  || service.coverageMode === "all"
  || Boolean(elderProfileMock.communityId && service.coverageCommunityIds?.includes(elderProfileMock.communityId))
));

const scenarioRecord = (scenario: SpecialServicesAcceptanceScenario): AssistanceRecord => {
  if (scenario === "family-help-pending") return { stage: "pending", requestedAt: "今天 09:20" };
  if (scenario === "family-help-handled") return {
    stage: "handled",
    requestedAt: "今天 09:20",
    handledBy: "张晓燕",
    handledAt: "今天 09:42",
    resultSummary: "已联系服务商，对方将于今日下午再电话确认上门时间。",
  };
  if (scenario === "service-completed") return {
    stage: "completed",
    requestedAt: "今天 09:20",
    handledBy: "张晓燕",
    handledAt: "今天 09:42",
    resultSummary: "已联系服务商，对方将于今日下午再电话确认上门时间。",
    completedAt: "今天 16:30",
  };
  if (scenario === "service-reviewed") return {
    stage: "reviewed",
    requestedAt: "今天 09:20",
    handledBy: "张晓燕",
    handledAt: "今天 09:42",
    resultSummary: "已联系服务商，对方将于今日下午再电话确认上门时间。",
    completedAt: "今天 16:30",
    review: { rating: 5, text: "师傅很耐心，问题已经处理好了。", submittedAt: "今天 17:10" },
  };
  return { stage: "idle" };
};

const createAcceptanceSharedRecord = (scenario: SpecialServicesAcceptanceScenario): SharedAssistanceRecord | null => {
  if (!["family-help-pending", "family-help-handled", "service-completed", "service-reviewed"].includes(scenario)) return null;
  const service = services[0];
  const handled = scenario !== "family-help-pending";
  const completed = scenario === "service-completed" || scenario === "service-reviewed";
  return {
    id: `HELP-MOCK-${scenario.toUpperCase()}`,
    projectId: "PRJ-001",
    communityId: elderProfileMock.communityId ?? "COM-001",
    elder: {
      id: elderProfileMock.id ?? "elder-wang-jianguo",
      name: elderProfileMock.name,
      phone: elderProfileMock.phone ?? "+65 8603 2918",
    },
    service: { id: service.id, name: service.name, categoryName: service.categoryName },
    provider: { name: service.provider, phone: service.providerPhone },
    requestReason: "请家人协助联系服务商",
    requestedAt: "2026-10-30T09:20:00+08:00",
    status: handled ? "handled" : "pending",
    recipientIds: ["child-zhang-xiaoyan", "child-zhang-jianping"],
    handledBy: handled ? "张晓燕" : null,
    handledAt: handled ? "2026-10-30T09:42:00+08:00" : null,
    resultSummary: handled ? "已联系服务商，对方将于今日下午再电话确认上门时间。" : null,
    serviceStatus: completed ? "completed" : "not_completed",
    completedAt: completed ? "2026-10-30T16:30:00+08:00" : null,
    completedBy: completed ? "张晓燕" : null,
    review: scenario === "service-reviewed"
      ? { rating: 5, text: "师傅很耐心，问题已经处理好了。", elderId: elderProfileMock.id, submittedAt: "2026-10-30T17:10:00+08:00", edited: false }
      : null,
  };
};

const formatAssistanceTime = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const toAssistanceRecord = (record: SharedAssistanceRecord): AssistanceRecord => {
  const stage: AssistanceStage = record.review
    ? "reviewed"
    : record.serviceStatus === "completed"
      ? "completed"
      : record.status === "expired"
        ? "expired"
      : record.status === "handled"
        ? "handled"
        : "pending";
  return {
    stage,
    recordId: record.id,
    requestedAt: formatAssistanceTime(record.requestedAt),
    handledBy: record.handledBy ?? undefined,
    handledAt: formatAssistanceTime(record.handledAt),
    resultSummary: record.resultSummary ?? undefined,
    completedAt: formatAssistanceTime(record.completedAt),
    review: record.review ? {
      rating: record.review.rating,
      text: record.review.text,
      submittedAt: formatAssistanceTime(record.review.submittedAt) ?? record.review.submittedAt,
    } : undefined,
  };
};

const findSharedRecord = (serviceId: string) => readSharedServiceAssistanceRecords()
  .find((record: SharedAssistanceRecord) => (
    record.elder?.id === (elderProfileMock.id ?? "elder-wang-jianguo")
    && record.service?.id === serviceId
  )) as SharedAssistanceRecord | undefined;

const readCurrentElderRecords = () => (readSharedServiceAssistanceRecords() as SharedAssistanceRecord[])
  .filter((record) => record.elder?.id === (elderProfileMock.id ?? "elder-wang-jianguo"))
  .sort((first, second) => second.requestedAt.localeCompare(first.requestedAt));

const getSharedRecordStatus = (record: SharedAssistanceRecord) => {
  if (record.review) return "已评价";
  if (record.serviceStatus === "completed") return "服务已完成";
  if (record.status === "handled") return "家人已处理";
  if (record.status === "handling") return "家人处理中";
  if (record.status === "cancelled") return "已取消";
  if (record.status === "expired") return "已失效";
  return "等待家人联系";
};

export default function SpecialServicesPage({
  isOpen,
  onClose,
  initialServiceId = null,
  acceptanceScenario = "default",
  acceptanceActionSignal = 0,
}: SpecialServicesPageProps) {
  const [view, setView] = useState<"list" | "detail" | "records">("list");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<"all" | ServiceCategoryCode>("all");
  const [categoryRetrySucceeded, setCategoryRetrySucceeded] = useState(false);
  const [assistance, setAssistance] = useState<AssistanceRecord>({ stage: "idle" });
  const [familyHelpConfirmOpen, setFamilyHelpConfirmOpen] = useState(false);
  const [familyHelpConfirmation, setFamilyHelpConfirmation] = useState(() => getServiceAssistanceConfirmationCopy(null));
  const [familyHelpFeedback, setFamilyHelpFeedback] = useState<"success" | "error" | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [sharedRecords, setSharedRecords] = useState<SharedAssistanceRecord[]>(readCurrentElderRecords);
  const [reviewingRecord, setReviewingRecord] = useState<SharedAssistanceRecord | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [acceptanceReview, setAcceptanceReview] = useState<SharedAssistanceRecord["review"]>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const submissionGuardRef = useRef(false);

  const effectiveScenario = categoryRetrySucceeded && acceptanceScenario === "category-load-failure" ? "default" : acceptanceScenario;
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const visibleServices = useMemo(() => {
    if (effectiveScenario === "no-services") return [];
    if (selectedCategoryCode === "all") return servicesForCurrentCommunity;
    if (effectiveScenario === "filter-empty" && selectedCategoryCode === "water") return [];
    return servicesForCurrentCommunity.filter((service) => service.categoryCode === selectedCategoryCode);
  }, [effectiveScenario, selectedCategoryCode]);
  const availableCategories = effectiveScenario === "category-disabled"
    ? serviceCategories.filter((category) => category.code !== "basic")
    : serviceCategories;
  const acceptanceRecord = useMemo(() => createAcceptanceSharedRecord(effectiveScenario), [effectiveScenario]);
  const visibleRecords = acceptanceRecord
    ? [{ ...acceptanceRecord, review: acceptanceReview ?? acceptanceRecord.review }]
    : sharedRecords;

  useEffect(() => {
    if (!isOpen) {
      setView("list");
      setSelectedServiceId(null);
      setAssistance({ stage: "idle" });
      setFamilyHelpConfirmOpen(false);
      setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(null));
      setFamilyHelpFeedback(null);
      setContactModalOpen(false);
      setReviewingRecord(null);
      setAcceptanceReview(null);
      return;
    }
    if (initialServiceId && services.some((service) => service.id === initialServiceId)) {
      setSelectedServiceId(initialServiceId);
      const storedRecord = findSharedRecord(initialServiceId);
      setAssistance(storedRecord ? toAssistanceRecord(storedRecord) : { stage: "idle" });
      setView("detail");
    }
  }, [initialServiceId, isOpen]);

  useEffect(() => {
    setCategoryRetrySucceeded(false);
    setFamilyHelpConfirmOpen(false);
    setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(null));
    setFamilyHelpFeedback(null);
    setContactModalOpen(false);
    setReviewingRecord(null);
    setAcceptanceReview(null);
    setReviewSubmitError("");
    if (acceptanceScenario === "filter-empty") {
      setSelectedCategoryCode("water");
      setView("list");
      setSelectedServiceId(null);
      setAssistance({ stage: "idle" });
      return;
    }
    if (["family-help-pending", "family-help-handled", "service-completed", "service-reviewed"].includes(acceptanceScenario)) {
      setSelectedCategoryCode("all");
      setSelectedServiceId(services[0].id);
      setAssistance(scenarioRecord(acceptanceScenario));
      setView("records");
      return;
    }
    if (["family-help-idle", "family-help-confirm"].includes(acceptanceScenario)) {
      setSelectedCategoryCode("all");
      setSelectedServiceId(services[0].id);
      setAssistance(scenarioRecord(acceptanceScenario));
      setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(null));
      setFamilyHelpConfirmOpen(acceptanceScenario === "family-help-confirm");
      setView("detail");
      return;
    }
    setSelectedCategoryCode("all");
    setSelectedServiceId(null);
    setAssistance({ stage: "idle" });
    setView("list");
  }, [acceptanceActionSignal, acceptanceScenario, isOpen]);

  useEffect(() => {
    if (!isOpen || acceptanceScenario !== "default") return undefined;
    const syncStoredRecord = () => {
      setSharedRecords(readCurrentElderRecords());
      if (selectedServiceId) {
        const storedRecord = findSharedRecord(selectedServiceId);
        if (storedRecord) setAssistance(toAssistanceRecord(storedRecord));
      }
    };
    syncStoredRecord();
    const timer = window.setInterval(syncStoredRecord, 1200);
    return () => window.clearInterval(timer);
  }, [acceptanceScenario, isOpen, selectedServiceId]);

  const openService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const storedRecord = findSharedRecord(serviceId);
    setAssistance(storedRecord ? toAssistanceRecord(storedRecord) : { stage: "idle" });
    setFamilyHelpConfirmOpen(false);
    setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(null));
    setFamilyHelpFeedback(null);
    setContactModalOpen(false);
    setView("detail");
  };

  const requestFamilyHelp = () => {
    const latestRecord = effectiveScenario === "default" && selectedService
      ? getLatestServiceAssistanceRecord(sharedRecords, elderProfileMock.id, selectedService.id)
      : assistance.stage === "idle"
        ? null
        : { status: assistance.stage === "completed" || assistance.stage === "reviewed" ? "handled" : assistance.stage };
    setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(latestRecord));
    setFamilyHelpConfirmOpen(true);
  };
  const openServiceReview = (record: SharedAssistanceRecord) => {
    if (!canReviewServiceAssistance(record, elderProfileMock.id)) return;
    setReviewingRecord(record);
    setReviewRating(5);
    setReviewText("");
    setReviewSubmitError("");
  };
  const submitServiceReview = () => {
    if (!reviewingRecord || !canReviewServiceAssistance(reviewingRecord, elderProfileMock.id) || reviewSubmitting) return;
    const review = {
      rating: reviewRating,
      text: reviewText.trim(),
      submittedAt: new Date().toISOString(),
      edited: false,
    };
    setReviewSubmitting(true);
    setReviewSubmitError("");
    try {
      if (reviewingRecord.id.startsWith("HELP-MOCK-")) {
        setAcceptanceReview({ ...review, elderId: elderProfileMock.id });
      } else {
        const updated = submitSharedServiceReview(reviewingRecord.id, elderProfileMock.id, { rating: reviewRating, text: reviewText });
        if (!updated) throw new Error("review update failed");
        setSharedRecords(readCurrentElderRecords());
      }
      setReviewingRecord(null);
    } catch {
      setReviewSubmitError("评价提交失败，请稍后重试。");
    } finally {
      setReviewSubmitting(false);
    }
  };
  const confirmFamilyHelp = () => {
    if (submissionGuardRef.current) return;
    submissionGuardRef.current = true;
    setFamilyHelpConfirmOpen(false);
    if (!selectedService) {
      submissionGuardRef.current = false;
      return;
    }
    const now = new Date().toISOString();
    const record: SharedAssistanceRecord = {
      id: `HELP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      projectId: "PRJ-001",
      communityId: elderProfileMock.communityId ?? "COM-001",
      elder: {
        id: elderProfileMock.id ?? "elder-wang-jianguo",
        name: elderProfileMock.name,
        phone: elderProfileMock.phone ?? "+65 8603 2918",
      },
      service: {
        id: selectedService.id,
        name: selectedService.name,
        categoryName: selectedService.categoryName,
      },
      provider: { name: selectedService.provider, phone: selectedService.providerPhone },
      requestReason: "请家人协助联系服务商",
      requestedAt: now,
      status: "pending",
      recipientIds: getActiveFamilyRelationships().map((relationship) => relationship.id),
      handledBy: null,
      handledAt: null,
      resultSummary: null,
      serviceStatus: "not_completed",
      completedAt: null,
      review: null,
    };
    try {
      const savedRecord = upsertSharedServiceAssistanceRecord(record) as SharedAssistanceRecord;
      setAssistance(toAssistanceRecord(savedRecord));
      setSharedRecords(readCurrentElderRecords());
      setFamilyHelpFeedback("success");
    } catch {
      setFamilyHelpFeedback("error");
    } finally {
      window.setTimeout(() => {
        submissionGuardRef.current = false;
      }, 800);
    }
  };
  if (!isOpen) return null;

  return (
    <main className="special-services-page" aria-label="特约服务">
      <SecondaryPageHeader
        title="特约服务"
        icon={<HandHeart aria-hidden="true" />}
        onBack={view === "records" ? () => setView("list") : onClose}
        backLabel={view === "records" ? "返回服务目录" : "返回首页"}
        actions={view === "records"
          ? undefined
          : <button type="button" className="special-services-bookings-entry" onClick={() => setView("records")}><ClipboardList aria-hidden="true" />服务记录{sharedRecords.length > 0 && <span>{sharedRecords.length}</span>}</button>}
      />

      {view === "list" && (
        <div className="special-services-list-view">
          <div className="special-services-catalog-layout">
            <aside className="special-services-sidebar" aria-label="服务分类">
              {effectiveScenario !== "category-load-failure" && <nav className="special-services-categories" aria-label="服务分类">
                <button type="button" className={selectedCategoryCode === "all" ? "is-active" : ""} onClick={() => setSelectedCategoryCode("all")}><span className="special-service-category__icon"><Sparkles aria-hidden="true" /></span><strong>全部</strong></button>
                {availableCategories.map((category) => <button key={category.code} type="button" className={selectedCategoryCode === category.code ? "is-active" : ""} onClick={() => setSelectedCategoryCode(category.code)} title={category.description}><span className="special-service-category__icon"><category.Icon aria-hidden="true" /></span><strong>{category.name}</strong></button>)}
              </nav>}
            </aside>

            <section className="special-services-content" aria-live="polite">
              {!elderProfileMock.communityId ? <section className="special-services-state" role="status"><MapPinOff aria-hidden="true" /><h2>社区未设置</h2><p>请先完成社区资料设置。</p></section>
                : effectiveScenario === "category-load-failure" ? <section className="special-services-state" role="status"><WifiOff aria-hidden="true" /><h2>服务分类暂时加载失败</h2><p>请检查网络后重新加载，其他功能不受影响。</p><button type="button" onClick={() => setCategoryRetrySucceeded(true)}>重新加载</button></section>
                : visibleServices.length === 0 ? <section className="special-services-state" role="status"><HandHeart aria-hidden="true" /><h2>{selectedCategoryCode === "all" ? "当前暂无可用服务" : "该分类暂时没有可用服务"}</h2><p>可以稍后再来看看。</p>{selectedCategoryCode !== "all" && <button type="button" onClick={() => setSelectedCategoryCode("all")}>返回全部服务</button>}</section>
                  : <div className="special-services-grid">{visibleServices.map((service) => <article key={service.id} className="special-service-card"><img className="special-service-card__image" src={service.coverImage} alt={`${service.name}服务场景`} /><div className="special-service-card__copy"><span>{service.categoryName}</span><h3>{service.name}</h3><p>{service.description}</p><div className="special-service-card__provider"><span><UserRound aria-hidden="true" />服务商</span><strong>{service.provider}</strong></div></div><div className="special-service-card__aside"><strong>{service.priceRange}</strong><small>{service.businessHours}</small><button type="button" onClick={() => openService(service.id)}>查看服务<ChevronRight aria-hidden="true" /></button></div></article>)}</div>}
            </section>
          </div>
        </div>
      )}

      {view === "records" && <div className="special-services-records-view">
        <section aria-label="服务记录">
          <header>
            <div><span>服务记录</span><h2>查看家人协助进度</h2></div>
            <p>共 {visibleRecords.length} 条</p>
          </header>
          {visibleRecords.length === 0
            ? <div className="special-services-records-empty"><ClipboardList aria-hidden="true" /><strong>暂无服务记录</strong><p>在服务详情中选择“请家人帮忙”后，记录会显示在这里。</p></div>
            : <div className="special-services-records-list">{visibleRecords.map((record) => <article key={record.id}>
              <span><HandHeart aria-hidden="true" /></span>
              <div>
                <div><small>{record.service.categoryName}</small><strong>{getSharedRecordStatus(record)}</strong></div>
                <h3>{record.service.name}</h3>
                <p>{record.provider.name} · {record.provider.phone}</p>
                <time>请求于 {formatAssistanceTime(record.requestedAt)}</time>
                {record.status === "expired" && <em>{serviceAssistanceExpiryMessage}</em>}
                {record.handledBy && record.handledAt && <em>由 {record.handledBy} 于 {formatAssistanceTime(record.handledAt)} 处理</em>}
                {record.resultSummary && <em>处理结果：{record.resultSummary}</em>}
                {record.completedAt && <em>服务完成于 {formatAssistanceTime(record.completedAt)}</em>}
                {record.review && <em>我的评价：{"★".repeat(record.review.rating)}{record.review.text ? ` · ${record.review.text}` : ""}<br />评价人：{record.elder.name} · {formatAssistanceTime(record.review.submittedAt)}</em>}
                {canReviewServiceAssistance(record, elderProfileMock.id) && <button type="button" className="special-services-review-entry" onClick={() => openServiceReview(record)}><Star aria-hidden="true" />评价服务</button>}
              </div>
            </article>)}</div>}
        </section>
      </div>}

      {view === "detail" && selectedService && <section className="special-services-detail-view" role="dialog" aria-modal="true" aria-label={`查看服务：${selectedService.name}`}>
        <header className="special-services-flow-header"><button type="button" className="special-services-flow-nav" onClick={() => initialServiceId ? onClose() : setView("list")}><X aria-hidden="true" /><strong>收起</strong></button><strong>特约服务</strong></header>
        <div className="special-services-detail-layout">
          <article className="special-services-detail">
            <header><img className="special-services-detail__header-image" src={selectedService.coverImage} alt={`${selectedService.name}服务场景`} /><div><span>{selectedService.categoryName}</span><h2>{selectedService.name}</h2><p>{selectedService.description}</p><div className="special-services-detail__price"><small>参考价格</small><strong>{selectedService.priceRange}</strong></div></div></header>
            <section className="special-services-detail__description">
              <div className="special-services-intro-section"><h4>服务内容</h4><p>{selectedService.serviceContent}</p></div>
              <div className="special-services-intro-section is-notice"><h4>注意事项</h4><ul>{selectedService.precautions.map((precaution) => <li key={precaution}>{precaution}</li>)}</ul></div>
            </section>
            <div className="special-services-detail__facts">
              <p><UserRound aria-hidden="true" /><span><small>服务商</small><strong>{selectedService.provider}</strong></span></p>
              <p><Clock3 aria-hidden="true" /><span><small>营业时间</small><strong>{selectedService.businessHours}</strong></span></p>
              <p><Phone aria-hidden="true" /><span><small>服务电话</small><strong>{selectedService.providerPhone}</strong></span></p>
            </div>
            <section className="special-services-detail__gallery" aria-label="服务详情">
              <h3>服务详情</h3>
              <div>{selectedService.detailImages.map((image, index) => <img key={image} src={image} alt={`${selectedService.name}服务详情 ${index + 1}`} />)}</div>
            </section>
          </article>

          <aside className="special-services-assistance">
            <div className="special-services-assistance__scroll">
              <header className="special-services-assistance__heading">
                <span>服务操作</span>
                <h3>需要帮助时，可以选择以下方式</h3>
              </header>

              <button type="button" className="special-services-contact-action" onClick={() => setContactModalOpen(true)}>
                <span><Phone aria-hidden="true" /></span>
                <span><strong>联系服务商</strong><small>查看联系电话，使用手机拨打</small></span>
                <ChevronRight aria-hidden="true" />
              </button>

              <div className="special-services-assistance__or"><span>或</span></div>

              <button type="button" className="special-services-family-option" onClick={requestFamilyHelp}>
                <span><HandHeart aria-hidden="true" /></span>
                <span><strong>请家人帮忙</strong><small>协助确认上门时间和费用</small></span>
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </aside>
        </div>
      </section>}

      {familyHelpConfirmOpen && <div className="special-services-family-confirm-overlay" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="special-services-family-confirm-title">
          <span><HandHeart aria-hidden="true" /></span>
          <h2 id="special-services-family-confirm-title">{familyHelpConfirmation.title}</h2>
          <p>{familyHelpConfirmation.description}</p>
          <small>{familyHelpConfirmation.hint}</small>
          <div>
            <button type="button" className="is-primary" onClick={confirmFamilyHelp}>通知家人</button>
            <button type="button" onClick={() => setFamilyHelpConfirmOpen(false)}>暂不</button>
          </div>
        </section>
      </div>}

      {familyHelpFeedback && <div className="special-services-family-confirm-overlay" role="presentation">
        <section className="is-feedback" role="dialog" aria-modal="true" aria-labelledby="special-services-family-feedback-title">
          <span>{familyHelpFeedback === "success" ? <CheckCircle2 aria-hidden="true" /> : <WifiOff aria-hidden="true" />}</span>
          <h2 id="special-services-family-feedback-title">{familyHelpFeedback === "success" ? "已通知家人" : "通知失败"}</h2>
          <p>{familyHelpFeedback === "success" ? "家人可以在手机端查看协助请求，并帮您联系服务商。" : "暂时无法通知家人，请稍后重试。"}</p>
          <div><button type="button" className="is-primary" onClick={() => setFamilyHelpFeedback(null)}>我知道了</button></div>
        </section>
      </div>}

      {contactModalOpen && selectedService && <div className="special-services-contact-overlay" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="special-services-contact-title">
          <span><Phone aria-hidden="true" /></span>
          <h2 id="special-services-contact-title">联系服务商</h2>
          <small>{selectedService.provider}</small>
          <strong>{selectedService.providerPhone}</strong>
          <p>请使用手机拨打</p>
          <button type="button" onClick={() => setContactModalOpen(false)}>我知道了</button>
        </section>
      </div>}

      {reviewingRecord && <div className="special-services-family-confirm-overlay special-services-review-overlay" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="special-services-review-title">
          <span><Star aria-hidden="true" /></span>
          <h2 id="special-services-review-title">评价服务</h2>
          <p>{reviewingRecord.service.name}</p>
          <div className="special-services-review-stars" role="radiogroup" aria-label="服务评分">
            {[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" className={rating <= reviewRating ? "is-active" : ""} onClick={() => setReviewRating(rating)} aria-label={`${rating}星`} aria-checked={reviewRating === rating} role="radio"><Star aria-hidden="true" /></button>)}
          </div>
          <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} maxLength={100} placeholder="写下评价（选填）" />
          {reviewSubmitError && <small className="is-error" role="alert">{reviewSubmitError}</small>}
          <div className="special-services-review-actions">
            <button type="button" onClick={() => setReviewingRecord(null)} disabled={reviewSubmitting}>取消</button>
            <button type="button" className="is-primary" onClick={submitServiceReview} disabled={reviewSubmitting}>{reviewSubmitting ? "提交中…" : "提交评价"}</button>
          </div>
        </section>
      </div>}

    </main>
  );
}
