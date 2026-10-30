import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
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
import { elderProfileMock } from "../elder-profile";
import {
  unifiedServiceCatalog,
  unifiedServiceCategories,
} from "../../../产品理解/90 原型与Mock素材/mock/统一服务目录.js";
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
type AssistanceStage = "idle" | "pending" | "handled" | "completed" | "reviewed";

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

interface SpecialServicesPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: string | null;
  acceptanceScenario?: SpecialServicesAcceptanceScenario;
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

const statusLabel: Record<AssistanceStage, string> = {
  idle: "尚未请求",
  pending: "待处理",
  handled: "已处理",
  completed: "服务已完成",
  reviewed: "已评价",
};

export default function SpecialServicesPage({
  isOpen,
  onClose,
  initialServiceId = null,
  acceptanceScenario = "default",
}: SpecialServicesPageProps) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<"all" | ServiceCategoryCode>("all");
  const [categoryRetrySucceeded, setCategoryRetrySucceeded] = useState(false);
  const [assistance, setAssistance] = useState<AssistanceRecord>({ stage: "idle" });
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [familyHelpConfirmOpen, setFamilyHelpConfirmOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

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

  useEffect(() => {
    if (!isOpen) {
      setView("list");
      setSelectedServiceId(null);
      setAssistance({ stage: "idle" });
      setFamilyHelpConfirmOpen(false);
      setContactModalOpen(false);
      return;
    }
    if (initialServiceId && services.some((service) => service.id === initialServiceId)) {
      setSelectedServiceId(initialServiceId);
      setView("detail");
    }
  }, [initialServiceId, isOpen]);

  useEffect(() => {
    setCategoryRetrySucceeded(false);
    setRating(5);
    setReviewText("");
    setFamilyHelpConfirmOpen(false);
    setContactModalOpen(false);
    if (acceptanceScenario === "filter-empty") {
      setSelectedCategoryCode("water");
      setView("list");
      setSelectedServiceId(null);
      setAssistance({ stage: "idle" });
      return;
    }
    if (["family-help-idle", "family-help-confirm", "family-help-pending", "family-help-handled", "service-completed", "service-reviewed"].includes(acceptanceScenario)) {
      setSelectedCategoryCode("all");
      setSelectedServiceId(services[0].id);
      setAssistance(scenarioRecord(acceptanceScenario));
      setFamilyHelpConfirmOpen(acceptanceScenario === "family-help-confirm");
      setView("detail");
      return;
    }
    setSelectedCategoryCode("all");
    setSelectedServiceId(null);
    setAssistance({ stage: "idle" });
    setView("list");
  }, [acceptanceScenario]);

  const openService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setAssistance({ stage: "idle" });
    setRating(5);
    setReviewText("");
    setFamilyHelpConfirmOpen(false);
    setContactModalOpen(false);
    setView("detail");
  };

  const requestFamilyHelp = () => setFamilyHelpConfirmOpen(true);
  const confirmFamilyHelp = () => {
    setFamilyHelpConfirmOpen(false);
    setAssistance({ stage: "pending", requestedAt: "刚刚" });
  };
  const submitReview = () => {
    if (assistance.stage !== "completed") return;
    setAssistance({ ...assistance, stage: "reviewed", review: { rating, text: reviewText.trim(), submittedAt: "刚刚" } });
  };

  if (!isOpen) return null;

  return (
    <main className="special-services-page" aria-label="特约服务">
      <SecondaryPageHeader title="特约服务" icon={<HandHeart aria-hidden="true" />} onBack={onClose} />

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

              {assistance.stage === "idle" && <>
                <div className="special-services-assistance__or"><span>或</span></div>
                <button type="button" className="special-services-family-option" onClick={requestFamilyHelp}>
                  <span><HandHeart aria-hidden="true" /></span>
                  <span><strong>请家人帮忙</strong><small>协助确认上门时间和费用</small></span>
                  <ChevronRight aria-hidden="true" />
                </button>
              </>}

              {assistance.stage !== "idle" && <section className="special-services-family-progress" aria-label="家人协助进度">
                <header><HandHeart aria-hidden="true" /><h3>家人协助进度</h3></header>
                <div className={`special-services-assistance-status is-${assistance.stage}`}>
                <span>{statusLabel[assistance.stage]}</span>
                {assistance.stage === "pending" && <strong>已通知家人，请等待联系</strong>}
                {(assistance.stage === "handled" || assistance.stage === "completed" || assistance.stage === "reviewed") && <><strong>家人已处理</strong><p>{assistance.handledBy} · {assistance.handledAt}</p><small>{assistance.resultSummary}</small></>}
                {(assistance.stage === "completed" || assistance.stage === "reviewed") && <p className="special-services-completed"><CheckCircle2 aria-hidden="true" />服务完成于 {assistance.completedAt}</p>}
                </div>
              </section>}

              {assistance.stage === "handled" && <p className="special-services-waiting-note">家人已完成联系；服务完成后，这里会出现评价入口。</p>}

              {assistance.stage === "completed" && <section className="special-services-review" aria-label="服务评价"><h3>评价本次服务</h3><p>请选择 1–5 星，文字评价可以不填。</p><div role="radiogroup" aria-label="服务星级">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={value <= rating ? "is-active" : ""} role="radio" aria-checked={rating === value} aria-label={`${value} 星`} onClick={() => setRating(value)}><Star aria-hidden="true" /></button>)}</div><textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} maxLength={120} placeholder="可以填写想说的话（选填）" /><button type="button" className="special-services-family-action" onClick={submitReview}>提交评价</button></section>}

              {assistance.stage === "reviewed" && assistance.review && <section className="special-services-reviewed"><CheckCircle2 aria-hidden="true" /><div><h3>评价已提交</h3><p>{"★".repeat(assistance.review.rating)}{"☆".repeat(5 - assistance.review.rating)}</p>{assistance.review.text && <blockquote>{assistance.review.text}</blockquote>}<small>{assistance.review.submittedAt}</small></div></section>}
            </div>

          </aside>
        </div>
      </section>}

      {familyHelpConfirmOpen && <div className="special-services-family-confirm-overlay" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="special-services-family-confirm-title">
          <span><HandHeart aria-hidden="true" /></span>
          <h2 id="special-services-family-confirm-title">请家人帮您联系？</h2>
          <p>家人会帮您联系服务商，并确认上门时间和费用。</p>
          <div>
            <button type="button" className="is-primary" onClick={confirmFamilyHelp}>通知家人</button>
            <button type="button" onClick={() => setFamilyHelpConfirmOpen(false)}>暂不</button>
          </div>
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
    </main>
  );
}
