import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  HandHeart,
  MapPinOff,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  WifiOff,
  X,
} from "lucide-react";
import SecondaryPageHeader from "./SecondaryPageHeader";
import { elderProfileMock, getActiveFamilyRelationships } from "../elder-profile";
import {
  readUnifiedServiceDirectoryRuntime,
  resolveUnifiedServiceId,
  resolveUnifiedServiceDirectory,
  subscribeUnifiedServiceDirectoryRuntime,
  unifiedServiceCatalog,
} from "../../../产品理解/90 原型与Mock素材/mock/统一服务目录.js";
import {
  answerSharedServiceContact,
  canReviewServiceAssistance,
  getLatestServiceAssistanceRecord,
  getServiceReviewSummary,
  getServiceAssistanceConfirmationCopy,
  isActiveServiceAssistance,
  isFamilyAssistanceRecord,
  isPendingServiceContact,
  isPendingServiceContactInquiry,
  readSharedServiceAssistanceRecords,
  requestSharedServiceAssistance,
  serviceAssistanceExpiryMessage,
  serviceContactAnswers,
  servicePhoneActionTypes,
  startSharedServiceContact,
  submitSharedServiceReview,
} from "../../../产品理解/90 原型与Mock素材/mock/服务协助记录共享Mock.js";
import "./special-services-page.css";

export type SpecialServicesAcceptanceScenario =
  | "default"
  | "no-services"
  | "contact-family-inquiry"
  | "contact-confirmed"
  | "family-help-idle"
  | "family-help-confirm"
  | "family-help-pending"
  | "family-help-handling"
  | "family-help-not-appointed"
  | "family-help-handled"
  | "service-completed"
  | "service-reviewed";

type AssistanceStage = "idle" | "pending" | "handling" | "expired" | "handled" | "completed" | "reviewed";

interface SpecialServiceItem {
  id: string;
  name: string;
  legacyServiceIds: string[];
  categoryCode: string;
  categoryName: string;
  provider: string;
  providerPhone: string;
  businessHours: string;
  priceRange: string;
  description: string;
  serviceContent: string;
  serviceItems: Array<{
    id: string;
    legacyServiceId: string;
    name: string;
    content: string;
    priceText: string;
  }>;
  precautions: string[];
  coverImage: string;
  detailImages: string[];
  coverageMode?: "all" | "specified";
  coverageCommunityIds?: string[];
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
  familyHandlingStatus?: "not_completed" | "completed";
  handlingCompletedAt?: string | null;
  handlingCompletedBy?: string | null;
  /** 迁移期旧字段，同样只表示家人协助工单完成。 */
  serviceStatus: "not_completed" | "completed";
  completedAt: string | null;
  completedBy?: string | null;
  reminderTimes?: string[];
  lastRemindedAt?: string;
  review: { rating: number; text: string; elderId?: string; submittedAt: string; edited?: boolean } | null;
  workflowStage?: "contact_pending_confirmation" | "appointment_confirmed" | "family_help_pending" | "family_help_handling" | "family_help_handled" | "family_help_completed" | "cancelled" | "expired";
  contactStartedAt?: string;
  contactStartedBy?: { type: string; id?: string | null; name?: string | null };
  phoneActionType?: "phone_viewed" | "call_started";
  contactSource?: string;
  appointmentOutcome?: "appointment_confirmed" | "family_help_requested" | null;
  appointmentOutcomeAt?: string | null;
  familyHelpRequestedAt?: string | null;
  familyHelpRequestedBy?: { type: string; id?: string | null; name?: string | null } | null;
  familyHelpInquiry?: { askedAt: string; askedBy: { type: string; id?: string | null; name?: string | null } };
  claimedAt?: string | null;
  familyContactStatus?: "contacting" | "appointment_confirmed" | "not_appointed" | null;
  familyContactBy?: { type: string; id?: string | null; name?: string | null } | null;
  familyContactStartedAt?: string | null;
  familyContactResult?: "appointment_confirmed" | "not_appointed" | null;
  familyContactResultAt?: string | null;
  appointmentAt?: string;
  feeText?: string;
  lastFamilyContactBy?: { type: string; id?: string | null; name?: string | null } | null;
  lastFamilyContactAt?: string | null;
  workflowEvents?: Array<{ id: string; type: string; createdAt: string; actorType: string; actorId?: string | null; actorName?: string | null; payload?: Record<string, unknown> }>;
}

interface SpecialServicesPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: string | null;
  acceptanceScenario?: SpecialServicesAcceptanceScenario;
  acceptanceActionSignal?: number;
}

const toSpecialServiceItem = (service: any): SpecialServiceItem => {
  const serviceItems = service.serviceItems ?? [];
  const firstPriceText = serviceItems.find((item: any) => String(item.priceText ?? "").trim())?.priceText;
  return {
    ...service,
    legacyServiceIds: service.legacyServiceIds ?? [],
    categoryCode: service.categoryCode ?? "",
    categoryName: service.categoryName ?? service.category ?? "",
    serviceItems,
    priceRange: firstPriceText ?? service.priceRange ?? "",
    precautions: Array.isArray(service.precautions)
      ? service.precautions
      : String(service.precautions ?? "").split("\n").filter(Boolean),
  };
};

const services: SpecialServiceItem[] = unifiedServiceCatalog.map(toSpecialServiceItem);

const scenarioRecord = (scenario: SpecialServicesAcceptanceScenario): AssistanceRecord => {
  if (scenario === "family-help-pending") return { stage: "pending", requestedAt: "今天 09:20" };
  if (scenario === "family-help-handling") return { stage: "handling", requestedAt: "今天 09:20", handledBy: "张晓燕" };
  if (scenario === "family-help-not-appointed") return { stage: "pending", requestedAt: "今天 09:20" };
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
  if (!["contact-family-inquiry", "contact-confirmed", "family-help-pending", "family-help-handling", "family-help-not-appointed", "family-help-handled", "service-completed", "service-reviewed"].includes(scenario)) return null;
  const service = services[0];
  const isContactScenario = scenario.startsWith("contact-");
  const contactConfirmed = scenario === "contact-confirmed";
  const familyContactHandling = scenario === "family-help-handling";
  const familyContactNotAppointed = scenario === "family-help-not-appointed";
  const familyContactHandled = ["family-help-handled", "service-completed", "service-reviewed"].includes(scenario);
  const familyHandlingCompleted = scenario === "service-completed" || scenario === "service-reviewed";
  return {
    id: `${isContactScenario ? "CALL" : "HELP"}-MOCK-${scenario.toUpperCase()}`,
    projectId: "PRJ-001",
    communityId: elderProfileMock.communityId ?? "COM-001",
    elder: {
      id: elderProfileMock.id ?? "elder-wang-jianguo",
      name: elderProfileMock.name,
      phone: elderProfileMock.phone ?? "+65 8603 2918",
    },
    service: { id: service.id, name: service.name, categoryName: service.categoryName },
    provider: { name: service.provider, phone: service.providerPhone },
    requestReason: isContactScenario ? "老人直接拨打服务电话" : "请家人协助联系服务商",
    requestedAt: "2026-10-30T09:20:00+08:00",
    status: isContactScenario ? (contactConfirmed ? "handled" : "pending") : familyContactHandling ? "handling" : familyContactHandled ? "handled" : "pending",
    recipientIds: ["child-zhang-xiaoyan", "child-zhang-jianping"],
    handledBy: !isContactScenario && (familyContactHandling || familyContactHandled) ? "张晓燕" : null,
    handledAt: !isContactScenario && familyContactHandled ? "2026-10-30T09:42:00+08:00" : null,
    resultSummary: contactConfirmed ? "老人确认已约好" : !isContactScenario && familyContactHandled ? "已联系服务商并约好" : null,
    familyHandlingStatus: familyHandlingCompleted ? "completed" : "not_completed",
    handlingCompletedAt: familyHandlingCompleted ? "2026-10-30T16:30:00+08:00" : null,
    handlingCompletedBy: familyHandlingCompleted ? "张晓燕" : null,
    // 迁移期兼容旧消费者；旧字段也只表示家人协助工单处理完成。
    serviceStatus: familyHandlingCompleted ? "completed" : "not_completed",
    completedAt: familyHandlingCompleted ? "2026-10-30T16:30:00+08:00" : null,
    completedBy: familyHandlingCompleted ? "张晓燕" : null,
    review: scenario === "service-reviewed"
      ? { rating: 5, text: "师傅很耐心，问题已经处理好了。", elderId: elderProfileMock.id, submittedAt: "2026-10-30T17:10:00+08:00", edited: false }
      : null,
    workflowStage: isContactScenario
      ? (contactConfirmed ? "appointment_confirmed" : "contact_pending_confirmation")
      : familyContactHandling
        ? "family_help_handling"
        : familyContactHandled
          ? "family_help_handled"
          : "family_help_pending",
    contactStartedAt: isContactScenario ? "2026-10-30T09:20:00+08:00" : undefined,
    contactStartedBy: isContactScenario ? { type: "elder", id: elderProfileMock.id, name: elderProfileMock.name } : undefined,
    appointmentOutcome: contactConfirmed ? "appointment_confirmed" : null,
    appointmentOutcomeAt: contactConfirmed ? "2026-10-30T09:24:00+08:00" : null,
    familyHelpInquiry: ["contact-family-inquiry", "contact-confirmed"].includes(scenario)
      ? { askedAt: "2026-10-30T09:25:00+08:00", askedBy: { type: "child", id: "child-zhang-xiaoyan", name: "张晓燕" } }
      : undefined,
    claimedAt: familyContactHandling ? "2026-10-30T09:35:00+08:00" : null,
    familyContactStatus: familyContactHandling ? "contacting" : familyContactNotAppointed ? "not_appointed" : familyContactHandled ? "appointment_confirmed" : null,
    familyContactBy: !isContactScenario && (familyContactHandling || familyContactNotAppointed || familyContactHandled)
      ? { type: "child", id: "child-zhang-xiaoyan", name: "张晓燕" }
      : null,
    familyContactStartedAt: familyContactHandling || familyContactHandled ? "2026-10-30T09:35:00+08:00" : null,
    familyContactResult: familyContactNotAppointed ? "not_appointed" : familyContactHandled ? "appointment_confirmed" : null,
    familyContactResultAt: familyContactNotAppointed || familyContactHandled ? "2026-10-30T09:42:00+08:00" : null,
    appointmentAt: familyContactHandled ? "2026年10月31日 14:00" : "",
    feeText: familyContactHandled ? "约 S$45" : "",
    lastFamilyContactBy: familyContactNotAppointed ? { type: "child", id: "child-zhang-xiaoyan", name: "张晓燕" } : null,
    lastFamilyContactAt: familyContactNotAppointed ? "2026-10-30T09:42:00+08:00" : null,
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

const isFamilyHandlingCompleted = (record: Pick<SharedAssistanceRecord, "familyHandlingStatus" | "serviceStatus">) => (record.familyHandlingStatus ?? record.serviceStatus) === "completed";
const getFamilyHandlingCompletedAt = (record: Pick<SharedAssistanceRecord, "handlingCompletedAt" | "completedAt">) => record.handlingCompletedAt ?? record.completedAt;
const serviceIdsMatch = (firstId: string, secondId: string) => resolveUnifiedServiceId(firstId) === resolveUnifiedServiceId(secondId);
const isContactRecord = (record: SharedAssistanceRecord) => !isFamilyAssistanceRecord(record);

const toAssistanceRecord = (record: SharedAssistanceRecord): AssistanceRecord => {
  const stage: AssistanceStage = record.review
    ? "reviewed"
    : isFamilyHandlingCompleted(record)
      ? "completed"
      : record.status === "expired"
        ? "expired"
        : record.status === "handled"
          ? "handled"
          : record.status === "handling"
            ? "handling"
            : "pending";
  return {
    stage,
    recordId: record.id,
    requestedAt: formatAssistanceTime(record.requestedAt),
    handledBy: record.handledBy ?? undefined,
    handledAt: formatAssistanceTime(record.handledAt),
    resultSummary: record.resultSummary ?? undefined,
    completedAt: formatAssistanceTime(getFamilyHandlingCompletedAt(record)),
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
    && serviceIdsMatch(record.service?.id, serviceId)
  )) as SharedAssistanceRecord | undefined;

const readCurrentElderRecords = () => (readSharedServiceAssistanceRecords() as SharedAssistanceRecord[])
  .filter((record) => record.elder?.id === (elderProfileMock.id ?? "elder-wang-jianguo"))
  .sort((first, second) => second.requestedAt.localeCompare(first.requestedAt));

const readAllSharedRecords = () => (readSharedServiceAssistanceRecords() as SharedAssistanceRecord[])
  .sort((first, second) => second.requestedAt.localeCompare(first.requestedAt));

const getSharedRecordStatus = (record: SharedAssistanceRecord) => {
  if (isPendingServiceContactInquiry(record)) return "等待您确认";
  if (record.phoneActionType === servicePhoneActionTypes.phoneViewed && isPendingServiceContact(record)) return "已查看联系电话";
  if (isPendingServiceContact(record)) return "已记录联系动态";
  if (record.workflowStage === "appointment_confirmed") return "已约好";
  if (record.review) return "已评价";
  if (isFamilyHandlingCompleted(record)) return "家人协助已完成";
  if (record.familyContactStatus === "contacting" || record.status === "handling") return `${record.familyContactBy?.name || record.handledBy || "家人"}正在联系`;
  if (record.familyContactResult === "appointment_confirmed") return "已约好";
  if (record.familyContactResult === "not_appointed") return "暂未约好";
  if (record.status === "handled") return "家人已反馈";
  if (record.status === "cancelled") return "已取消";
  if (record.status === "expired") return "已失效";
  return "等待家人联系";
};

const getLatestPendingContactInquiry = (records: SharedAssistanceRecord[]) => records
  .filter((record) => isPendingServiceContactInquiry(record))
  .sort((first, second) => (second.familyHelpInquiry?.askedAt ?? second.requestedAt).localeCompare(first.familyHelpInquiry?.askedAt ?? first.requestedAt))[0] ?? null;

export default function SpecialServicesPage({
  isOpen,
  onClose,
  initialServiceId = null,
  acceptanceScenario = "default",
  acceptanceActionSignal = 0,
}: SpecialServicesPageProps) {
  const [view, setView] = useState<"list" | "detail" | "records">("list");
  const [detailTab, setDetailTab] = useState<"details" | "reviews">("details");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<AssistanceRecord>({ stage: "idle" });
  const [familyHelpConfirmOpen, setFamilyHelpConfirmOpen] = useState(false);
  const [familyHelpConfirmation, setFamilyHelpConfirmation] = useState(() => getServiceAssistanceConfirmationCopy(null));
  const [familyHelpFeedback, setFamilyHelpFeedback] = useState<"notified" | "reminded" | "notify-error" | "remind-error" | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactIntentFeedback, setContactIntentFeedback] = useState<"notified" | "existing" | "error" | null>(null);
  const [activeContactRecord, setActiveContactRecord] = useState<SharedAssistanceRecord | null>(() => getLatestPendingContactInquiry(readCurrentElderRecords()));
  const [contactOutcomeFeedback, setContactOutcomeFeedback] = useState<"confirmed" | "error" | null>(null);
  const [sharedRecords, setSharedRecords] = useState<SharedAssistanceRecord[]>(readCurrentElderRecords);
  const [allSharedRecords, setAllSharedRecords] = useState<SharedAssistanceRecord[]>(readAllSharedRecords);
  const [reviewingRecord, setReviewingRecord] = useState<SharedAssistanceRecord | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [acceptanceReview, setAcceptanceReview] = useState<SharedAssistanceRecord["review"]>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [serviceDirectoryContract, setServiceDirectoryContract] = useState(() => readUnifiedServiceDirectoryRuntime());
  const submissionGuardRef = useRef(false);

  const effectiveScenario = acceptanceScenario;
  const serviceDirectory = useMemo(() => resolveUnifiedServiceDirectory({
    communityId: elderProfileMock.communityId ?? "",
    settings: { ...serviceDirectoryContract.categorySettings, enabled: false },
    categories: serviceDirectoryContract.categories,
    services: serviceDirectoryContract.services,
  }), [serviceDirectoryContract]);
  const directoryServices = useMemo(
    () => serviceDirectory.services.map(toSpecialServiceItem),
    [serviceDirectory],
  );
  const serviceReviewTargets = directoryServices.length > 0 || effectiveScenario === "default" ? directoryServices : services;
  const selectedService = serviceReviewTargets.find((service) => service.id === selectedServiceId) ?? null;
  const visibleServices = useMemo(() => {
    if (effectiveScenario === "no-services") return [];
    return directoryServices;
  }, [directoryServices, effectiveScenario]);
  const acceptanceRecord = useMemo(() => createAcceptanceSharedRecord(effectiveScenario), [effectiveScenario]);
  const visibleRecords = acceptanceRecord
    ? [{ ...acceptanceRecord, review: acceptanceReview ?? acceptanceRecord.review }]
    : sharedRecords;
  const reviewSourceRecords = effectiveScenario === "service-reviewed" && acceptanceRecord
    ? [{ ...acceptanceRecord, review: acceptanceReview ?? acceptanceRecord.review }]
    : allSharedRecords;
  const serviceReviewSummary = useMemo(() => {
    const compatibleRecords = reviewSourceRecords.map((record) => ({
      ...record,
      service: { ...record.service, id: resolveUnifiedServiceId(record.service.id) },
    }));
    return new Map(serviceReviewTargets.map((service) => [service.id, getServiceReviewSummary(service.id, compatibleRecords)]));
  }, [reviewSourceRecords, serviceReviewTargets]);
  const selectedServiceReviewSummary = selectedService
    ? serviceReviewSummary.get(selectedService.id)
    : undefined;

  useEffect(() => subscribeUnifiedServiceDirectoryRuntime(setServiceDirectoryContract), []);

  useEffect(() => {
    if (!isOpen) {
      setView("list");
      setDetailTab("details");
      setSelectedServiceId(null);
      setAssistance({ stage: "idle" });
      setFamilyHelpConfirmOpen(false);
      setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(null));
      setFamilyHelpFeedback(null);
      setContactModalOpen(false);
      setContactIntentFeedback(null);
      setActiveContactRecord(null);
      setContactOutcomeFeedback(null);
      setReviewingRecord(null);
      setAcceptanceReview(null);
      return;
    }
    const resolvedInitialServiceId = initialServiceId ? resolveUnifiedServiceId(initialServiceId) : null;
    if (resolvedInitialServiceId && serviceReviewTargets.some((service) => service.id === resolvedInitialServiceId)) {
      setSelectedServiceId(resolvedInitialServiceId);
      setDetailTab("details");
      const storedRecord = findSharedRecord(resolvedInitialServiceId);
      setAssistance(storedRecord ? toAssistanceRecord(storedRecord) : { stage: "idle" });
      setView("detail");
    }
  }, [initialServiceId, isOpen, serviceReviewTargets]);

  useEffect(() => {
    setFamilyHelpConfirmOpen(false);
    setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(null));
    setFamilyHelpFeedback(null);
    setContactModalOpen(false);
    setContactIntentFeedback(null);
    setActiveContactRecord(null);
    setContactOutcomeFeedback(null);
    setReviewingRecord(null);
    setAcceptanceReview(null);
    setReviewSubmitError("");
    if (["family-help-pending", "family-help-handling", "family-help-not-appointed", "family-help-handled", "service-completed", "service-reviewed"].includes(acceptanceScenario)) {
      setSelectedServiceId(services[0].id);
      setAssistance(scenarioRecord(acceptanceScenario));
      setView("records");
      return;
    }
    if (["contact-family-inquiry", "contact-confirmed"].includes(acceptanceScenario)) {
      const contactRecord = createAcceptanceSharedRecord(acceptanceScenario);
      setSelectedServiceId(services[0].id);
      setAssistance({ stage: contactRecord?.workflowStage === "appointment_confirmed" ? "handled" : "pending" });
      setActiveContactRecord(contactRecord && isPendingServiceContactInquiry(contactRecord) ? contactRecord : null);
      setView(contactRecord?.workflowStage === "appointment_confirmed" ? "records" : "detail");
      return;
    }
    if (["family-help-idle", "family-help-confirm"].includes(acceptanceScenario)) {
      setSelectedServiceId(services[0].id);
      setAssistance(scenarioRecord(acceptanceScenario));
      setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(null));
      setFamilyHelpConfirmOpen(acceptanceScenario === "family-help-confirm");
      setView("detail");
      return;
    }
    setSelectedServiceId(null);
    setAssistance({ stage: "idle" });
    setView("list");
  }, [acceptanceActionSignal, acceptanceScenario, isOpen]);

  useEffect(() => {
    if (!isOpen || acceptanceScenario !== "default") return undefined;
    const syncStoredRecord = () => {
      const nextRecords = readCurrentElderRecords();
      setSharedRecords(nextRecords);
      setAllSharedRecords(readAllSharedRecords());
      setActiveContactRecord(getLatestPendingContactInquiry(nextRecords));
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
    const resolvedServiceId = resolveUnifiedServiceId(serviceId);
    setSelectedServiceId(resolvedServiceId);
    setDetailTab("details");
    const storedRecord = findSharedRecord(resolvedServiceId);
    setAssistance(storedRecord ? toAssistanceRecord(storedRecord) : { stage: "idle" });
    setFamilyHelpConfirmOpen(false);
    setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(null));
    setFamilyHelpFeedback(null);
    setContactModalOpen(false);
    setContactOutcomeFeedback(null);
    setView("detail");
  };

  const requestFamilyHelp = () => {
    const latestRecord = effectiveScenario === "default" && selectedService
      ? getLatestServiceAssistanceRecord(sharedRecords.map((record) => ({
        ...record,
        service: { ...record.service, id: resolveUnifiedServiceId(record.service.id) },
      })), elderProfileMock.id, selectedService.id)
      : assistance.stage === "idle"
        ? null
        : { status: assistance.stage === "completed" || assistance.stage === "reviewed" ? "handled" : assistance.stage };
    setFamilyHelpConfirmation(getServiceAssistanceConfirmationCopy(latestRecord));
    setFamilyHelpConfirmOpen(true);
  };
  const viewProviderPhone = () => {
    if (!selectedService) return;
    const now = new Date().toISOString();
    const candidate: SharedAssistanceRecord = {
      id: `CALL-VIEW-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
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
      requestReason: "查看服务商号码，记录联系意向",
      requestedAt: now,
      status: "pending",
      recipientIds: getActiveFamilyRelationships().map((relationship) => relationship.id),
      handledBy: null,
      handledAt: null,
      resultSummary: null,
      familyHandlingStatus: "not_completed",
      serviceStatus: "not_completed",
      completedAt: null,
      review: null,
      contactStartedAt: now,
      contactStartedBy: {
        type: "elder",
        id: elderProfileMock.id ?? "elder-wang-jianguo",
        name: elderProfileMock.name,
      },
      phoneActionType: "phone_viewed",
      contactSource: "elder",
    };
    try {
      const result = startSharedServiceContact(candidate) as { record: SharedAssistanceRecord | null; created: boolean; reason?: string };
      if (!result.record) throw new Error("contact intent failed");
      setSharedRecords(readCurrentElderRecords());
      setAllSharedRecords(readAllSharedRecords());
      setContactIntentFeedback(result.created ? "notified" : "existing");
    } catch {
      setContactIntentFeedback("error");
    } finally {
      setContactModalOpen(true);
    }
  };
  const answerServiceContact = (answer: "appointment_confirmed" | "family_help_requested") => {
    if (!activeContactRecord) return;
    try {
      let updatedRecord: SharedAssistanceRecord | null;
      if (activeContactRecord.id.startsWith("CALL-MOCK-")) {
        const answeredAt = new Date().toISOString();
        updatedRecord = answer === serviceContactAnswers.appointmentConfirmed
          ? { ...activeContactRecord, workflowStage: "appointment_confirmed", appointmentOutcome: "appointment_confirmed", appointmentOutcomeAt: answeredAt, status: "handled", handledAt: answeredAt, resultSummary: "老人确认已约好" }
          : { ...activeContactRecord, workflowStage: "family_help_pending", appointmentOutcome: "family_help_requested", appointmentOutcomeAt: answeredAt, familyHelpRequestedAt: answeredAt, status: "pending", requestReason: "没约好，请家人帮忙" };
      } else {
        const result = answerSharedServiceContact(activeContactRecord.id, answer, {
          type: "elder",
          id: elderProfileMock.id ?? "elder-wang-jianguo",
          name: elderProfileMock.name,
        }) as { record: SharedAssistanceRecord | null; updated: boolean };
        updatedRecord = result.record;
      }
      if (!updatedRecord) throw new Error("contact answer failed");
      setSharedRecords((current) => current.map((item) => item.id === updatedRecord!.id ? updatedRecord! : item));
      setAllSharedRecords((current) => current.map((item) => item.id === updatedRecord!.id ? updatedRecord! : item));
      setAssistance(toAssistanceRecord(updatedRecord));
      setActiveContactRecord(null);
      if (answer === serviceContactAnswers.appointmentConfirmed) {
        setContactOutcomeFeedback("confirmed");
      } else {
        setFamilyHelpFeedback("notified");
      }
    } catch {
      setContactOutcomeFeedback("error");
    }
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
        setAllSharedRecords(readAllSharedRecords());
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
    const activeCompatibleRecord = sharedRecords.find((item) => (
      item.elder?.id === (elderProfileMock.id ?? "elder-wang-jianguo")
      && serviceIdsMatch(item.service?.id, selectedService.id)
      && isActiveServiceAssistance(item)
    ));
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
        id: activeCompatibleRecord?.service.id ?? selectedService.id,
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
      familyHandlingStatus: "not_completed",
      handlingCompletedAt: null,
      handlingCompletedBy: null,
      serviceStatus: "not_completed",
      completedAt: null,
      review: null,
    };
    try {
      const result = requestSharedServiceAssistance(record) as { record: SharedAssistanceRecord; reminded: boolean; message: string };
      setAssistance(toAssistanceRecord(result.record));
      setSharedRecords((current) => result.reminded
        ? current.map((item) => item.id === result.record.id ? result.record : item)
        : [result.record, ...current.filter((item) => item.id !== result.record.id)]);
      setFamilyHelpFeedback(result.reminded ? "reminded" : "notified");
    } catch {
      setFamilyHelpFeedback(familyHelpConfirmation.confirmLabel === "再次提醒" ? "remind-error" : "notify-error");
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
          <div className="special-services-catalog-layout is-flat">
            <section className="special-services-content" aria-live="polite">
              {!elderProfileMock.communityId ? <section className="special-services-state" role="status"><MapPinOff aria-hidden="true" /><h2>社区未设置</h2><p>请先完成社区资料设置。</p></section>
                : visibleServices.length === 0 ? <section className="special-services-state" role="status"><HandHeart aria-hidden="true" /><h2>当前暂无可用服务</h2><p>可以稍后再来看看。</p></section>
                  : <div className="special-services-grid">{visibleServices.map((service) => {
                    const reviewSummary = serviceReviewSummary.get(service.id);
                    const hasReviews = Boolean(reviewSummary && reviewSummary.count > 0 && reviewSummary.average !== null);
                    return <article key={service.id} className="special-service-card"><img className="special-service-card__image" src={service.coverImage} alt={`${service.name}服务场景`} /><div className="special-service-card__copy"><h3>{service.name}</h3><p>{service.description}</p><div className="special-service-card__provider"><span><UserRound aria-hidden="true" />服务商</span><strong>{service.provider}</strong></div></div><div className="special-service-card__aside"><strong>{service.priceRange}</strong><small>{service.businessHours}</small><div className={`special-service-card__rating${hasReviews ? " has-reviews" : ""}`}><Star aria-hidden="true" /><span>{hasReviews ? `${reviewSummary!.average!.toFixed(1)} · ${reviewSummary!.count}条评价` : "暂无评价"}</span></div><button type="button" onClick={() => openService(service.id)}>查看服务<ChevronRight aria-hidden="true" /></button></div></article>;
                  })}</div>}
            </section>
          </div>
        </div>
      )}

      {view === "records" && <div className="special-services-records-view">
        <section aria-label="服务记录">
          <header>
            <div><span>服务记录</span><h2>查看联系与家人协助进度</h2></div>
            <p>共 {visibleRecords.length} 条</p>
          </header>
          {visibleRecords.length === 0
            ? <div className="special-services-records-empty"><ClipboardList aria-hidden="true" /><strong>暂无服务记录</strong><p>在老人移动端联系服务商，或在这里请家人帮忙后，记录会显示在这里。</p></div>
            : <div className="special-services-records-list">{visibleRecords.map((record) => <article key={record.id}>
              <span className={isContactRecord(record) ? "is-contact" : undefined}>{isContactRecord(record) ? <Phone aria-hidden="true" /> : <HandHeart aria-hidden="true" />}</span>
              <div>
                <div>{record.service.categoryName && <small>{record.service.categoryName}</small>}<strong>{getSharedRecordStatus(record)}</strong></div>
                <h3>{record.service.name}</h3>
                <p>{record.provider.name} · {record.provider.phone}</p>
                <time>{record.phoneActionType === servicePhoneActionTypes.phoneViewed ? "查看号码于" : isContactRecord(record) ? "拨号于" : "请求于"} {formatAssistanceTime(record.contactStartedAt ?? record.requestedAt)}</time>
                {record.familyHelpInquiry && isPendingServiceContact(record) && <em>{record.familyHelpInquiry.askedBy.name || "家人"}正在等待您确认是否需要帮忙</em>}
                {record.workflowStage === "appointment_confirmed" && <em>您已确认约好，本次联系结果已同步给家人。</em>}
                {record.lastRemindedAt && <em>最近提醒于 {formatAssistanceTime(record.lastRemindedAt)}</em>}
                {record.status === "expired" && <em>{serviceAssistanceExpiryMessage}</em>}
                {(record.familyContactStatus === "contacting" || record.status === "handling") && <em>{record.familyContactBy?.name || record.handledBy || "家人"}正在联系服务商{record.familyContactStartedAt || record.claimedAt ? ` · 开始于 ${formatAssistanceTime(record.familyContactStartedAt ?? record.claimedAt)}` : ""}</em>}
                {record.familyContactResult === "not_appointed" && <em>{record.lastFamilyContactBy?.name || record.familyContactBy?.name || "家人"}已返回结果：还没约好{record.lastFamilyContactAt || record.familyContactResultAt ? ` · ${formatAssistanceTime(record.lastFamilyContactAt ?? record.familyContactResultAt)}` : ""}</em>}
                {record.handledBy && record.handledAt && <em>{record.handledBy} 于 {formatAssistanceTime(record.handledAt)} 返回联系结果</em>}
                {record.resultSummary && <em>联系结果：{record.resultSummary}</em>}
                {record.appointmentAt && <em>预约时间：{record.appointmentAt}</em>}
                {record.feeText && <em>参考费用：{record.feeText}</em>}
                {getFamilyHandlingCompletedAt(record) && <em>家人协助完成于 {formatAssistanceTime(getFamilyHandlingCompletedAt(record))}</em>}
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
            <header><img className="special-services-detail__header-image" src={selectedService.coverImage} alt={`${selectedService.name}服务场景`} /><div>{selectedService.categoryName && <span>{selectedService.categoryName}</span>}<h2>{selectedService.name}</h2><p>{selectedService.description}</p></div></header>
            <nav className="special-services-detail__tabs" aria-label="服务详情内容" role="tablist">
              <button type="button" role="tab" aria-selected={detailTab === "details"} className={detailTab === "details" ? "is-active" : ""} onClick={() => setDetailTab("details")}>服务详情</button>
              <button type="button" role="tab" aria-selected={detailTab === "reviews"} className={detailTab === "reviews" ? "is-active" : ""} onClick={() => setDetailTab("reviews")}>服务评价{selectedServiceReviewSummary?.count ? ` (${selectedServiceReviewSummary.count})` : ""}</button>
            </nav>
            {detailTab === "details" ? <div className="special-services-detail__tab-panel" role="tabpanel">
              <section className="special-services-detail__description">
                <div className="special-services-intro-section"><h4>服务内容与价格</h4><div className="special-services-detail__items">{selectedService.serviceItems.map((item) => <article key={item.id}><div><strong>{item.name}</strong><span>{item.priceText}</span></div><p>{item.content}</p></article>)}</div></div>
                <div className="special-services-intro-section is-notice"><h4>注意事项</h4><ul>{selectedService.precautions.map((precaution) => <li key={precaution}>{precaution}</li>)}</ul></div>
              </section>
              <div className="special-services-detail__facts">
                <p><UserRound aria-hidden="true" /><span><small>服务商</small><strong>{selectedService.provider}</strong></span></p>
                <p><Clock3 aria-hidden="true" /><span><small>营业时间</small><strong>{selectedService.businessHours}</strong></span></p>
                <p><Phone aria-hidden="true" /><span><small>服务电话</small><strong>{selectedService.providerPhone}</strong></span></p>
              </div>
              <section className="special-services-detail__gallery" aria-label="服务详情">
                <h3>服务详情图示</h3>
                <div>{selectedService.detailImages.map((image, index) => <img key={image} src={image} alt={`${selectedService.name}服务详情 ${index + 1}`} />)}</div>
              </section>
            </div> : <section className="special-services-detail__reviews is-tab-panel" aria-label="服务评价" role="tabpanel">
              <header>
                <h3>服务评价</h3>
                {selectedServiceReviewSummary && selectedServiceReviewSummary.average !== null && <strong><Star aria-hidden="true" />{selectedServiceReviewSummary.average.toFixed(1)} · {selectedServiceReviewSummary.count}条评价</strong>}
              </header>
              {!selectedServiceReviewSummary || selectedServiceReviewSummary.reviews.length === 0
                ? <div className="special-services-detail__reviews-empty"><Star aria-hidden="true" /><span><strong>暂无评价</strong><small>当前还没有用户评价这项服务。</small></span></div>
                : <div className="special-services-detail__review-list">{selectedServiceReviewSummary.reviews.map((review) => <article key={review.recordId}><div><strong>{"★".repeat(review.rating)}</strong><time>{formatAssistanceTime(review.submittedAt)}</time></div><p>{review.text || "未填写文字评价"}</p><small>评价人：{review.reviewerName}</small></article>)}</div>}
            </section>}
          </article>

          <aside className="special-services-assistance">
            <div className="special-services-assistance__scroll">
              <header className="special-services-assistance__heading">
                <span>服务操作</span>
                <h3>需要帮助时，可以选择以下方式</h3>
              </header>

              <button type="button" className="special-services-contact-action" onClick={viewProviderPhone}>
                <span><Phone aria-hidden="true" /></span>
                <span><strong>查看联系电话</strong><small>查看号码并通知家人</small></span>
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
            <button type="button" className="is-primary" onClick={confirmFamilyHelp}>{familyHelpConfirmation.confirmLabel}</button>
            <button type="button" onClick={() => setFamilyHelpConfirmOpen(false)}>暂不</button>
          </div>
        </section>
      </div>}

      {familyHelpFeedback && <div className="special-services-family-confirm-overlay" role="presentation">
        <section className="is-feedback" role="dialog" aria-modal="true" aria-labelledby="special-services-family-feedback-title">
          <span>{familyHelpFeedback === "notified" || familyHelpFeedback === "reminded" ? <CheckCircle2 aria-hidden="true" /> : <WifiOff aria-hidden="true" />}</span>
          <h2 id="special-services-family-feedback-title">{familyHelpFeedback === "reminded" ? "已提醒家人" : familyHelpFeedback === "notified" ? "已通知家人" : familyHelpFeedback === "remind-error" ? "提醒失败" : "通知失败"}</h2>
          <p>{familyHelpFeedback === "reminded" ? "已沿用原协助记录提醒家人，处理时限不变。" : familyHelpFeedback === "notified" ? "家人可以在手机端查看协助请求，并帮您联系服务商。" : "暂时无法完成操作，请稍后重试。"}</p>
          <div><button type="button" className="is-primary" onClick={() => setFamilyHelpFeedback(null)}>我知道了</button></div>
        </section>
      </div>}

      {contactModalOpen && selectedService && <div className="special-services-contact-overlay" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="special-services-contact-title">
          <span><Phone aria-hidden="true" /></span>
          <h2 id="special-services-contact-title">服务商联系电话</h2>
          <small>{selectedService.provider}</small>
          <strong>{selectedService.providerPhone}</strong>
          <p>{contactIntentFeedback === "error" ? "联系意向暂未同步，请稍后重试。" : "请用手机拨打以上号码，家人已收到提醒。"}</p>
          <button type="button" onClick={() => setContactModalOpen(false)}>返回服务详情</button>
        </section>
      </div>}

      {activeContactRecord && <div className="special-services-contact-inquiry-overlay" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="special-services-contact-inquiry-title">
          <span><Phone aria-hidden="true" /></span>
          <small>{activeContactRecord.familyHelpInquiry?.askedBy.name || "家人"}想和您确认</small>
          <h2 id="special-services-contact-inquiry-title">联系服务商后，结果怎么样？</h2>
          <p>{activeContactRecord.service.name} · {activeContactRecord.provider.name}</p>
          <div>
            <button type="button" className="is-primary" onClick={() => answerServiceContact("appointment_confirmed")}><CheckCircle2 aria-hidden="true" />约好了</button>
            <button type="button" onClick={() => answerServiceContact("family_help_requested")}><HandHeart aria-hidden="true" />没约好，请家人帮忙</button>
          </div>
        </section>
      </div>}

      {contactOutcomeFeedback && <div className="special-services-family-confirm-overlay special-services-contact-feedback-overlay" role="presentation">
        <section className="is-feedback" role="dialog" aria-modal="true" aria-labelledby="special-services-contact-feedback-title">
          <span>{contactOutcomeFeedback === "confirmed" ? <CheckCircle2 aria-hidden="true" /> : <WifiOff aria-hidden="true" />}</span>
          <h2 id="special-services-contact-feedback-title">{contactOutcomeFeedback === "confirmed" ? "已记录：您已经约好了" : "暂时无法记录"}</h2>
          <p>{contactOutcomeFeedback === "confirmed" ? "本次联系已结束，结果也已同步给家人。" : "请稍后再试。"}</p>
          <div><button type="button" className="is-primary" onClick={() => setContactOutcomeFeedback(null)}>我知道了</button></div>
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
