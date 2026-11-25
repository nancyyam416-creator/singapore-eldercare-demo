import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  HandHeart,
  MapPin,
  PhoneCall,
  Star,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";
import ElderPageHeader from "./ElderPageHeader";
import {
  appointmentCategoryName,
  appointmentServices,
  currentElderProfile,
  currentElderProjectId,
  getAppointmentServiceById,
  initialServiceAssistanceRecords,
  normalizeAppointmentServiceDirectoryContract,
  resolveAppointmentServiceId,
  resolveAppointmentServiceDirectory,
  type AppointmentServiceDirectoryContract,
  type AppointmentService,
  type ServiceAssistanceRecord,
} from "./appointmentData";
// 共享目录由普通 JS 维护；本端在消费入口将运行时数据收敛为强类型契约。
// @ts-expect-error 共享目录暂未提供 TypeScript 声明文件
import * as unifiedServiceDirectoryRuntime from "../../产品理解/90 原型与Mock素材/mock/统一服务目录.js";
const {
  readUnifiedServiceDirectoryRuntime,
  subscribeUnifiedServiceDirectoryRuntime,
} = unifiedServiceDirectoryRuntime;
import {
  answerSharedServiceContact,
  canReviewServiceAssistance,
  getLatestServiceAssistanceRecord,
  getServiceAssistanceConfirmationCopy,
  getServiceReviewSummary,
  isFamilyAssistanceRecord,
  isPendingServiceContact,
  normalizeServiceAssistanceRecord,
  readSharedServiceAssistanceRecords,
  requestSharedServiceAssistance,
  serviceAssistanceExpiryMessage,
  serviceContactAnswers,
  startSharedServiceContact,
  submitSharedServiceReview,
  subscribeSharedServiceAssistanceRecords,
  type ServiceReviewSummary,
} from "../../产品理解/90 原型与Mock素材/mock/服务协助记录共享Mock.js";

export type AppointmentScenario =
  | "default"
  | "detail"
  | "category_off"
  | "category_on"
  | "empty"
  | "family_inquiry"
  | "requested"
  | "handling"
  | "not_appointed"
  | "expired"
  | "cancelled"
  | "handled"
  | "completed"
  | "reviewed"
  | "record_contact_unasked"
  | "record_contact_inquiry"
  | "record_contact_answered"
  | "record_family_pending"
  | "record_family_handling"
  | "record_family_handled"
  | "record_family_expired"
  | "records";
export type AppointmentReturnTarget = "detail" | "records";
type View = "list" | "detail" | "result" | "records" | "record-detail";
type DetailTab = "detail" | "reviews";

const CHILD_NOTIFICATION_KEY = "u2g-child-service-assistance-notifications-v1";
const BOUND_FAMILY_IDS = ["child-zhang-xiaoyan", "child-zhang-jianping"];

const readRecords = () => {
  const shared =
    readSharedServiceAssistanceRecords() as ServiceAssistanceRecord[];
  return shared
    .map(
      (record) =>
        normalizeServiceAssistanceRecord(record) as ServiceAssistanceRecord,
    )
    .sort((first, second) =>
      second.requestedAt.localeCompare(first.requestedAt),
    );
};

const createScenarioRecord = (
  scenario:
    | "requested"
    | "handling"
    | "not_appointed"
    | "expired"
    | "cancelled"
    | "handled"
    | "completed"
    | "reviewed",
  service = appointmentServices[0],
): ServiceAssistanceRecord => ({
  id: `HELP-MOCK-${scenario.toUpperCase()}`,
  projectId: currentElderProjectId,
  elder: { id: "elder-wang-jianguo", name: "王建国", phone: "+65 8603 2918" },
  service: {
    id: service.id,
    name: service.name,
    categoryName: appointmentCategoryName(service.category) || service.name,
  },
  provider: { name: service.provider, phone: service.providerPhone },
  requestReason: "请家人协助联系服务商",
  requestedAt: "2026-10-30T09:20:00+08:00",
  status:
    scenario === "requested" || scenario === "not_appointed"
      ? "pending"
      : scenario === "handling"
        ? "handling"
        : scenario === "expired"
          ? "expired"
          : scenario === "cancelled"
            ? "cancelled"
            : "handled",
  expiredAt: scenario === "expired" ? "2026-11-01T09:20:00+08:00" : null,
  recipientIds: BOUND_FAMILY_IDS,
  handledBy:
    scenario === "requested" ||
    scenario === "not_appointed" ||
    scenario === "handling" ||
    scenario === "expired" ||
    scenario === "cancelled"
      ? null
      : "张晓燕",
  handledAt:
    scenario === "requested" ||
    scenario === "not_appointed" ||
    scenario === "handling" ||
    scenario === "expired" ||
    scenario === "cancelled"
      ? null
      : "2026-10-30T09:42:00+08:00",
  resultSummary:
    scenario === "requested" ||
    scenario === "not_appointed" ||
    scenario === "handling" ||
    scenario === "expired" ||
    scenario === "cancelled"
      ? null
      : "已联系服务商，对方将于今日下午再电话确认上门时间。",
  familyContactStatus:
    scenario === "handling"
      ? "contacting"
      : scenario === "not_appointed"
        ? "not_appointed"
        : scenario === "handled" || scenario === "completed" || scenario === "reviewed"
          ? "appointment_confirmed"
          : null,
  familyContactBy:
    scenario === "handling" || scenario === "handled" || scenario === "completed" || scenario === "reviewed"
      ? { type: "family", id: "child-zhang-xiaoyan", name: "张晓燕" }
      : null,
  familyContactResult: scenario === "not_appointed" ? "not_appointed" : scenario === "handled" || scenario === "completed" || scenario === "reviewed" ? "appointment_confirmed" : null,
  familyContactResultAt: scenario === "handled" || scenario === "completed" || scenario === "reviewed" ? "2026-10-30T09:42:00+08:00" : null,
  lastFamilyContactBy: scenario === "not_appointed" ? { type: "family", id: "child-zhang-xiaoyan", name: "张晓燕" } : null,
  lastFamilyContactAt: scenario === "not_appointed" ? "2026-10-30T09:42:00+08:00" : null,
  familyHandlingStatus:
    scenario === "completed" || scenario === "reviewed"
      ? "completed"
      : "not_completed",
  handlingCompletedAt:
    scenario === "completed" || scenario === "reviewed"
      ? "2026-10-30T16:30:00+08:00"
      : null,
  handlingCompletedBy:
    scenario === "completed" || scenario === "reviewed" ? "张晓燕" : null,
  serviceStatus:
    scenario === "completed" || scenario === "reviewed"
      ? "completed"
      : "not_completed",
  completedAt:
    scenario === "completed" || scenario === "reviewed"
      ? "2026-10-30T16:30:00+08:00"
      : null,
  completedBy:
    scenario === "completed" || scenario === "reviewed" ? "张晓燕" : null,
  review:
    scenario === "reviewed"
      ? {
          rating: 5,
          text: "师傅很耐心，问题已经处理好了。",
          elderId: "elder-wang-jianguo",
          submittedAt: "2026-10-30T17:10:00+08:00",
          edited: false,
        }
      : null,
});

const createRecordAcceptanceScenario = (
  scenario:
    | "record_contact_unasked"
    | "record_contact_inquiry"
    | "record_contact_answered"
    | "record_family_pending"
    | "record_family_handling"
    | "record_family_handled"
    | "record_family_expired",
): ServiceAssistanceRecord => {
  if (
    scenario === "record_contact_unasked" ||
    scenario === "record_contact_inquiry" ||
    scenario === "record_contact_answered"
  ) {
    const hasInquiry = scenario !== "record_contact_unasked";
    const answered = scenario === "record_contact_answered";
    const base = createContactScenarioRecord(appointmentServices[1] ?? appointmentServices[0], 0);
    return {
      ...base,
      id: `RECORD-MOCK-${scenario.toUpperCase()}`,
      status: answered ? "handled" : "pending",
      workflowStage: answered ? "service_no_longer_needed" : "contact_pending_confirmation",
      appointmentOutcome: answered ? "service_no_longer_needed" : null,
      appointmentOutcomeAt: answered ? "2026-10-30T10:05:00+08:00" : null,
      handledBy: answered ? "王奶奶" : null,
      handledAt: answered ? "2026-10-30T10:05:00+08:00" : null,
      resultSummary: answered ? "老人表示暂时不需要此服务。" : null,
      familyHelpInquiry: hasInquiry ? base.familyHelpInquiry : undefined,
      workflowEvents: [
        { id: `record-contact-${scenario}-1`, type: "call_started", createdAt: "2026-10-30T09:20:00+08:00", actorType: "elder", actorName: "王奶奶" },
        ...(hasInquiry ? [{ id: `record-contact-${scenario}-2`, type: "family_inquiry", createdAt: "2026-10-30T09:36:00+08:00", actorType: "child", actorName: "张晓燕" }] : []),
        ...(answered ? [{ id: `record-contact-${scenario}-3`, type: "service_no_longer_needed", createdAt: "2026-10-30T10:05:00+08:00", actorType: "elder", actorName: "王奶奶" }] : []),
      ],
    };
  }
  const familyScenario = scenario === "record_family_pending"
    ? "requested"
    : scenario === "record_family_handling"
      ? "handling"
      : scenario === "record_family_expired"
        ? "expired"
        : "completed";
  return {
    ...createScenarioRecord(familyScenario),
    id: `RECORD-MOCK-${scenario.toUpperCase()}`,
  };
};

const createContactScenarioRecord = (
  service = appointmentServices[0],
  index = 0,
): ServiceAssistanceRecord =>
  normalizeServiceAssistanceRecord({
    id: `CALL-MOCK-PENDING-${index + 1}`,
    projectId: currentElderProjectId,
    elder: {
      id: currentElderProfile.id,
      name: "王奶奶",
      phone: "+65 8123 4567",
    },
    service: {
      id: service.id,
      name: service.name,
      categoryName: appointmentCategoryName(service.category) || service.name,
    },
    provider: { name: service.provider, phone: service.providerPhone },
    requestReason: "老人直接拨打服务电话",
    requestedAt: "2026-10-30T09:20:00+08:00",
    contactStartedAt: "2026-10-30T09:20:00+08:00",
    workflowStage: "contact_pending_confirmation",
    appointmentOutcome: null,
    familyHelpInquiry: {
      askedAt: "2026-10-30T09:36:00+08:00",
      askedBy: { type: "child", id: "child-zhang-xiaoyan", name: "张晓燕" },
    },
    status: "pending",
    recipientIds: BOUND_FAMILY_IDS,
    handledBy: null,
    handledAt: null,
    resultSummary: null,
    familyHandlingStatus: "not_completed",
    serviceStatus: "not_completed",
    completedAt: null,
    review: null,
  }) as ServiceAssistanceRecord;

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

// 兼容共享契约旧字段名：completed 表示家人协助工单处理完成，不代表服务商履约完成。
const isFamilyHandlingCompleted = (
  record: Pick<
    ServiceAssistanceRecord,
    "familyHandlingStatus" | "serviceStatus"
  >,
) => (record.familyHandlingStatus ?? record.serviceStatus) === "completed";
const getFamilyHandlingCompletedAt = (
  record: Pick<ServiceAssistanceRecord, "handlingCompletedAt" | "completedAt">,
) => record.handlingCompletedAt ?? record.completedAt;
const serviceSnapshotLabel = (service: ServiceAssistanceRecord["service"]) =>
  service.categoryName === service.name
    ? service.name
    : `${service.categoryName} · ${service.name}`;
const isFamilyInquiryPending = (record: ServiceAssistanceRecord) =>
  isPendingServiceContact(record) && Boolean(record.familyHelpInquiry?.askedAt);

type UnifiedRecordStatus = "待处理" | "处理中" | "已处理" | "已失效";
type RecordProgressItem = { time: string; text: string };

const getUnifiedRecordStatus = (record: ServiceAssistanceRecord): UnifiedRecordStatus => {
  if (record.status === "expired" || record.workflowStage === "expired") return "已失效";
  if (
    record.familyContactStatus === "contacting" ||
    record.status === "handling" ||
    record.workflowStage === "family_help_handling"
  ) return "处理中";
  if (
    record.status === "handled" ||
    record.status === "cancelled" ||
    Boolean(record.review) ||
    isFamilyHandlingCompleted(record) ||
    record.workflowStage === "appointment_confirmed" ||
    record.workflowStage === "service_no_longer_needed" ||
    record.familyContactResult === "appointment_confirmed"
  ) return "已处理";
  return "待处理";
};

const getRecordType = (record: ServiceAssistanceRecord) =>
  isFamilyAssistanceRecord(record) ? "请家人帮忙" : "我的联系记录";

const getFamilyActorLabel = (name?: string | null, id?: string | null) => {
  if (id === "child-zhang-xiaoyan" || name === "张晓燕") return "女儿 张晓燕";
  if (id === "child-zhang-jianping" || name === "张建平") return "儿子 张建平";
  return name ? `家人 ${name}` : "家人";
};

const getElderRecordStatus = (record: ServiceAssistanceRecord) => {
  if (isFamilyAssistanceRecord(record)) return getUnifiedRecordStatus(record);
  if (isFamilyInquiryPending(record)) return "待答复";
  if (record.appointmentOutcome) return "已答复";
  return null;
};

const getRecordProgress = (record: ServiceAssistanceRecord): RecordProgressItem[] => {
  const items: RecordProgressItem[] = [{
    time: record.contactStartedAt ?? record.requestedAt,
    text: isFamilyAssistanceRecord(record) ? "已通知家人，请家人帮忙联系" : "已记录本次联系",
  }];
  if (record.familyHelpInquiry) items.push({
    time: record.familyHelpInquiry.askedAt,
    text: `${getFamilyActorLabel(record.familyHelpInquiry.askedBy.name, record.familyHelpInquiry.askedBy.id)}想问您约好了吗`,
  });
  if (record.appointmentOutcomeAt && record.appointmentOutcome === "appointment_confirmed") {
    items.push({ time: record.appointmentOutcomeAt, text: "您回复：约好了" });
  }
  if (record.appointmentOutcomeAt && record.appointmentOutcome === "family_help_requested") {
    items.push({ time: record.appointmentOutcomeAt, text: "您回复：没约好，请家人帮忙" });
  }
  if (record.appointmentOutcomeAt && record.appointmentOutcome === "service_no_longer_needed") {
    items.push({ time: record.appointmentOutcomeAt, text: "您回复：暂时不需要了" });
  }
  if (isFamilyAssistanceRecord(record) && (record.contactStartedAt || record.familyContactStatus === "contacting")) {
    const contactAt = record.familyContactResultAt ?? record.lastFamilyContactAt ?? record.handledAt ?? record.requestedAt;
    if (contactAt) items.push({
      time: contactAt,
      text: `${getFamilyActorLabel(record.familyContactBy?.name || record.handledBy, record.familyContactBy?.id)}正在帮您联系服务商`,
    });
  }
  if (record.familyContactResultAt && record.familyContactResult === "not_appointed") {
    items.push({
      time: record.familyContactResultAt,
      text: `${getFamilyActorLabel(record.lastFamilyContactBy?.name || record.familyContactBy?.name, record.lastFamilyContactBy?.id || record.familyContactBy?.id)}反馈：还没约好`,
    });
  }
  if (record.familyContactResultAt && record.familyContactResult === "appointment_confirmed") {
    items.push({
      time: record.familyContactResultAt,
      text: `${getFamilyActorLabel(record.familyContactBy?.name || record.handledBy, record.familyContactBy?.id)}反馈：已约好`,
    });
  }
  if (record.handledAt && record.resultSummary && !record.familyContactResult && !record.appointmentOutcome) {
    items.push({ time: record.handledAt, text: record.resultSummary });
  }
  const completedAt = getFamilyHandlingCompletedAt(record);
  if (completedAt) items.push({ time: completedAt, text: `${getFamilyActorLabel(record.familyContactBy?.name || record.handledBy || record.handlingCompletedBy)}已完成本次帮忙` });
  if (record.status === "expired" || record.workflowStage === "expired") {
    items.push({ time: record.expiredAt ?? record.requestedAt, text: "本次记录已失效" });
  }
  if (record.review) items.push({
    time: record.review.submittedAt,
    text: `已提交服务评价：${"★".repeat(record.review.rating)}${record.review.text ? ` · ${record.review.text}` : ""}`,
  });
  return items.sort((first, second) => first.time.localeCompare(second.time));
};

const getLatestRecordProgress = (record: ServiceAssistanceRecord) => {
  const progress = getRecordProgress(record);
  if (progress.length > 1) return progress.at(-1)!.text;
  if (!isFamilyAssistanceRecord(record)) return "已记录本次联系";
  const status = getUnifiedRecordStatus(record);
  if (status === "已处理") return "本次记录已处理";
  if (status === "处理中") return "家人正在处理";
  if (status === "已失效") return "本次记录已失效";
  return "已通知家人，等待有人帮忙";
};

type Props = {
  scenario: AppointmentScenario;
  onViewChange?: (
    scenario: AppointmentScenario,
    returnTarget?: AppointmentReturnTarget,
  ) => void;
};

export default function AppointmentServicesPage({
  scenario,
  onViewChange,
}: Props) {
  const [view, setViewState] = useState<View>("list");
  const [detailTab, setDetailTab] = useState<DetailTab>("detail");
  const [selected, setSelected] = useState<AppointmentService>(
    appointmentServices[0],
  );
  const [records, setRecords] =
    useState<ServiceAssistanceRecord[]>(readRecords);
  const [latest, setLatest] = useState<ServiceAssistanceRecord | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmationCopy, setConfirmationCopy] = useState(() =>
    getServiceAssistanceConfirmationCopy(null),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [familyHelpSuccessMessage, setFamilyHelpSuccessMessage] = useState("");
  const [familyInquiryOpen, setFamilyInquiryOpen] = useState(false);
  const familyInquiryDialogRef = useRef<HTMLElement | null>(null);
  const familyInquiryTriggerRef = useRef<HTMLElement | null>(null);
  const [categoryPreviewMode, setCategoryPreviewMode] = useState<boolean | null>(null);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState("");
  const [serviceDirectoryContract, setServiceDirectoryContract] =
    useState<AppointmentServiceDirectoryContract>(() =>
      normalizeAppointmentServiceDirectoryContract(
        readUnifiedServiceDirectoryRuntime(),
      ),
    );
  const submissionGuardRef = useRef(false);

  const setView = (
    next: View,
    nextScenario: AppointmentScenario,
    returnTarget?: AppointmentReturnTarget,
  ) => {
    setViewState(next);
    onViewChange?.(nextScenario, returnTarget);
  };

  useEffect(() => {
    if (scenario !== "family_inquiry") setFamilyInquiryOpen(false);
  }, [scenario]);

  useEffect(() => {
    if (!familyInquiryOpen) return;
    familyInquiryDialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [familyInquiryOpen]);

  useEffect(() => {
    return subscribeUnifiedServiceDirectoryRuntime((contract: unknown) => {
      setServiceDirectoryContract(
        normalizeAppointmentServiceDirectoryContract(
          contract as Parameters<typeof normalizeAppointmentServiceDirectoryContract>[0],
        ),
      );
    });
  }, []);

  useEffect(() => {
    if (scenario === "default") {
      setCategoryPreviewMode(null);
      setViewState("list");
    }
    if (scenario === "empty") {
      setCategoryPreviewMode(null);
      setViewState("list");
    }
    if (scenario === "category_off" || scenario === "category_on") {
      setCategoryPreviewMode(scenario === "category_on");
      setViewState("list");
    }
    if (scenario === "detail") {
      setDetailTab("detail");
      setViewState("detail");
    }
    if (scenario === "records") {
      setRecords(readRecords());
      setLatest(null);
      setViewState("records");
    }
    if (
      scenario === "record_contact_unasked" ||
      scenario === "record_contact_inquiry" ||
      scenario === "record_contact_answered" ||
      scenario === "record_family_pending" ||
      scenario === "record_family_handling" ||
      scenario === "record_family_handled" ||
      scenario === "record_family_expired"
    ) {
      const scenarioRecord = createRecordAcceptanceScenario(scenario);
      const scenarioRecords = scenario === "record_family_handled"
        ? [
            scenarioRecord,
            {
              ...createScenarioRecord("reviewed"),
              id: "RECORD-MOCK-REVIEWED",
            },
          ]
        : [scenarioRecord];
      setRecords(scenarioRecords);
      setLatest(scenarioRecord);
      setViewState("records");
    }
    if (scenario === "family_inquiry") {
      const mockPendingRecord = createContactScenarioRecord(appointmentServices[0], 0);
      setRecords((current) => {
        return [mockPendingRecord, ...current.filter((record) => !record.id.startsWith("CALL-MOCK-PENDING-"))];
      });
      setSelected(appointmentServices[0]);
      setLatest(mockPendingRecord);
      setViewState("detail");
      setFamilyInquiryOpen(true);
    }
    if (
      scenario === "requested" ||
      scenario === "handling" ||
      scenario === "not_appointed" ||
      scenario === "expired" ||
      scenario === "cancelled" ||
      scenario === "handled" ||
      scenario === "completed" ||
      scenario === "reviewed"
    ) {
      setLatest((current) => {
        const expectedCompleted =
          scenario === "completed" || scenario === "reviewed";
        const expectedStatus =
          scenario === "requested" || scenario === "not_appointed"
            ? "pending"
            : scenario === "handling"
              ? "handling"
              : scenario === "expired"
                ? "expired"
                : scenario === "cancelled"
                  ? "cancelled"
                  : "handled";
        if (
          current &&
          current.status === expectedStatus &&
          current.familyContactStatus ===
            (scenario === "handling"
              ? "contacting"
              : scenario === "not_appointed"
                ? "not_appointed"
                : scenario === "handled" || scenario === "completed" || scenario === "reviewed"
                  ? "appointment_confirmed"
                  : null) &&
          isFamilyHandlingCompleted(current) === expectedCompleted &&
          Boolean(current.review) === (scenario === "reviewed")
        )
          return current;
        return createScenarioRecord(scenario);
      });
      setViewState("result");
    }
  }, [scenario]);

  useEffect(() => {
    const syncRecords = () => {
      const nextRecords = readRecords();
      setRecords((current) => {
        const scenarioRecords = current.filter((record) =>
          record.id.startsWith("CALL-MOCK-PENDING-") ||
          record.id.startsWith("RECORD-MOCK-"),
        );
        return [...scenarioRecords, ...nextRecords.filter((record) => !scenarioRecords.some((scenarioRecord) => scenarioRecord.id === record.id))];
      });
      setLatest((current) =>
        current
          ? (nextRecords.find((record) => record.id === current.id) ?? current)
          : current,
      );
    };
    syncRecords();
    const unsubscribe = subscribeSharedServiceAssistanceRecords(syncRecords);
    const timer = window.setInterval(syncRecords, 30_000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, []);

  const directory = useMemo(() => {
    const categoryEnabled = categoryPreviewMode ?? serviceDirectoryContract.categorySettings.enabled;
    const categories = serviceDirectoryContract.categories;
    const services = categoryPreviewMode === true
      ? serviceDirectoryContract.services.map((service, index) => {
          if (service.categoryId || service.categoryCode || categories.length === 0) return service;
          const category = categories[index % categories.length];
          return { ...service, categoryId: category.code, categoryCode: category.code };
        })
      : serviceDirectoryContract.services;
    return resolveAppointmentServiceDirectory({ categoryEnabled, categories, services });
  }, [categoryPreviewMode, serviceDirectoryContract]);
  const communityServices = directory.services;
  useEffect(() => {
    if (!directory.categoryEnabled) {
      setSelectedCategoryCode("");
      return;
    }
    if (!directory.groups.some((group) => group.code === selectedCategoryCode)) {
      setSelectedCategoryCode(directory.groups[0]?.code ?? "");
    }
  }, [directory.categoryEnabled, directory.groups, selectedCategoryCode]);
  const visibleServices = scenario === "empty" ? [] : directory.categoryEnabled
    ? directory.groups.find((group) => group.code === selectedCategoryCode)?.services ?? []
    : communityServices;
  const serviceReviewSummaries = useMemo(
    () =>
      new Map(
        communityServices.map((service) => {
          const relatedIds = [service.id, ...service.legacyServiceIds];
          const relatedRecords = records.filter((record) =>
            relatedIds.includes(record.service.id),
          );
          return [
            service.id,
            getServiceReviewSummary(
              service.id,
              relatedRecords.map((record) => ({
                ...record,
                service: { ...record.service, id: service.id },
              })),
            ) as ServiceReviewSummary,
          ];
        }),
      ),
    [communityServices, records],
  );
  const selectedReviewSummary = serviceReviewSummaries.get(selected.id) ?? {
    count: 0,
    average: null,
    reviews: [],
  };
  const selectedReviews = selectedReviewSummary.reviews;
  const selectedAverageRating = selectedReviewSummary.average;
  const familyInquiries = records.filter(isFamilyInquiryPending);
  const isNotAppointedFeedback =
    latest?.status === "pending" && latest.familyContactStatus === "not_appointed";
  const contactActorName = latest?.familyContactBy?.name || latest?.handledBy || "家人";
  const lastContactActorName =
    latest?.lastFamilyContactBy?.name || latest?.familyContactBy?.name || "家人";

  const requestFamilyHelp = (service = selected) => {
    const scenarioRecord = latest?.service.id === service.id ? latest : null;
    const isResultScenario =
      scenario === "requested" ||
      scenario === "handling" ||
      scenario === "not_appointed" ||
      scenario === "expired" ||
      scenario === "cancelled" ||
      scenario === "handled" ||
      scenario === "completed" ||
      scenario === "reviewed";
    const latestRequest =
      isResultScenario && scenarioRecord
        ? scenarioRecord
        : (getLatestServiceAssistanceRecord(
            records.map((record) => ({
              ...record,
              service: {
                ...record.service,
                id: resolveAppointmentServiceId(record.service.id),
              },
            })),
            "elder-wang-jianguo",
            service.id,
          ) as ServiceAssistanceRecord | null);
    setSelected(service);
    setConfirmationCopy(getServiceAssistanceConfirmationCopy(latestRequest));
    setSubmitError("");
    setFamilyHelpSuccessMessage("");
    setConfirmOpen(true);
  };

  const recordServiceCall = () => {
    const existing = records.find(
      (record) =>
        record.service.id === selected.id && isPendingServiceContact(record),
    );
    if (existing) {
      return;
    }
    const now = new Date().toISOString();
    const candidate: ServiceAssistanceRecord = {
      id: `CALL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      projectId: currentElderProjectId,
      elder: {
        id: currentElderProfile.id,
        name: "王奶奶",
        phone: "+65 8123 4567",
      },
      service: {
        id: selected.id,
        name: selected.name,
        categoryName:
          appointmentCategoryName(selected.category) || selected.name,
      },
      provider: { name: selected.provider, phone: selected.providerPhone },
      requestReason: "老人直接拨打服务电话",
      requestedAt: now,
      status: "pending",
      recipientIds: BOUND_FAMILY_IDS,
      handledBy: null,
      handledAt: null,
      resultSummary: null,
      familyHandlingStatus: "not_completed",
      serviceStatus: "not_completed",
      completedAt: null,
      review: null,
    };
    const result = startSharedServiceContact(candidate) as {
      record: ServiceAssistanceRecord;
    };
    setRecords((current) => [
      result.record,
      ...current.filter((item) => item.id !== result.record.id),
    ]);
  };

  const answerServiceCall = (
    answer:
      | "appointment_confirmed"
      | "family_help_requested"
      | "service_no_longer_needed",
  ) => {
    if (!latest) return;
    const answeredAt = new Date().toISOString();
    const result = latest.id.startsWith("CALL-MOCK-PENDING-") || latest.id.startsWith("RECORD-MOCK-")
      ? {
          record: normalizeServiceAssistanceRecord({
            ...latest,
            workflowStage: answer,
            appointmentOutcome: answer,
            appointmentOutcomeAt: answeredAt,
            status:
              answer === serviceContactAnswers.familyHelpRequested
                ? "pending"
                : "handled",
            requestReason:
              answer === serviceContactAnswers.familyHelpRequested
                ? "拨号后未约成，已请家人协助"
                : latest.requestReason,
            handledBy:
              answer !== serviceContactAnswers.familyHelpRequested
                ? "王奶奶"
                : null,
            handledAt:
              answer !== serviceContactAnswers.familyHelpRequested
                ? answeredAt
                : null,
            resultSummary:
              answer === serviceContactAnswers.appointmentConfirmed
                ? "老人已确认与服务商约好。"
                : answer === serviceContactAnswers.serviceNoLongerNeeded
                  ? "老人表示暂时不需要此服务。"
                : null,
          }) as ServiceAssistanceRecord,
          updated: true,
        }
      : (answerSharedServiceContact(latest.id, answer, {
          type: "elder",
          id: currentElderProfile.id,
          name: "王奶奶",
        }) as { record: ServiceAssistanceRecord | null; updated: boolean });
    if (!result.record) return;
    setLatest(result.record);
    setRecords((current) =>
      current.map((item) =>
        item.id === result.record!.id ? result.record! : item,
      ),
    );
    setFamilyHelpSuccessMessage(
      answer === serviceContactAnswers.appointmentConfirmed
        ? "已记录：您已经约好了"
        : answer === serviceContactAnswers.serviceNoLongerNeeded
          ? "已记录：暂时不需要此服务"
          : "已沿用本次联系记录通知家人",
    );
    setFamilyInquiryOpen(false);
    setViewState("result");
  };

  const closeFamilyInquiry = () => {
    setFamilyInquiryOpen(false);
    familyInquiryTriggerRef.current?.focus();
    if (scenario === "family_inquiry") onViewChange?.("detail");
  };

  const handleFamilyInquiryDialogKeyDown = (
    event: KeyboardEvent<HTMLElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeFamilyInquiry();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (!controls.length) return;
    const first = controls[0];
    const last = controls.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const confirmFamilyHelp = () => {
    if (submissionGuardRef.current) return;
    submissionGuardRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const now = new Date().toISOString();
      const record: ServiceAssistanceRecord = {
        id: `HELP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        projectId: currentElderProjectId,
        elder: {
          id: "elder-wang-jianguo",
          name: "王建国",
          phone: "+65 8603 2918",
        },
        service: {
          id: selected.id,
          name: selected.name,
          categoryName:
            appointmentCategoryName(selected.category) || selected.name,
        },
        provider: { name: selected.provider, phone: selected.providerPhone },
        requestReason: "请家人协助联系服务商",
        requestedAt: now,
        status: "pending",
        recipientIds: BOUND_FAMILY_IDS,
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

      const result = requestSharedServiceAssistance(record) as {
        record: ServiceAssistanceRecord;
        reminded: boolean;
        message: string;
      };
      const savedRecord = result.record;
      setRecords((current) =>
        result.reminded
          ? current.map((item) =>
              item.id === savedRecord.id ? savedRecord : item,
            )
          : [
              savedRecord,
              ...current.filter((item) => item.id !== savedRecord.id),
            ],
      );
      setLatest(savedRecord);
      const notifications = BOUND_FAMILY_IDS.map((recipientId) => ({
        id: `${savedRecord.id}-${recipientId}`,
        type: result.reminded
          ? "service_assistance_reminded"
          : "service_assistance_requested",
        recipientId,
        recordId: savedRecord.id,
        createdAt: now,
      }));
      try {
        window.localStorage.setItem(
          CHILD_NOTIFICATION_KEY,
          JSON.stringify(notifications),
        );
      } catch {
        // 共享协助记录已是跨端通知的权威状态，本地通知缓存失败不影响本次提交。
      }
      setFamilyHelpSuccessMessage(result.message);
      setConfirmOpen(false);
      setView("result", "requested", "detail");
      window.setTimeout(() => {
        submissionGuardRef.current = false;
        setSubmitting(false);
      }, 800);
    } catch {
      setSubmitError("发送失败，请稍后重试。");
      submissionGuardRef.current = false;
      setSubmitting(false);
    }
  };

  const saveReview = () => {
    if (
      !latest ||
      !canReviewServiceAssistance(latest, currentElderProfile.id) ||
      reviewSubmitting
    )
      return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const scenarioOnly =
        latest.id.startsWith("HELP-MOCK-") ||
        latest.id.startsWith("RECORD-MOCK-");
      const mockReview = {
        rating,
        text: reviewText.trim(),
        elderId: latest.elder.id,
        submittedAt: new Date().toISOString(),
        edited: false,
      };
      const persisted = scenarioOnly
        ? { ...latest, review: mockReview }
        : submitSharedServiceReview(latest.id, currentElderProfile.id, {
            rating,
            text: reviewText,
          });
      if (!persisted) throw new Error("review update failed");
      const updated = normalizeServiceAssistanceRecord(
        persisted,
      ) as ServiceAssistanceRecord;
      setLatest(updated);
      setRecords((current) =>
        current.map((record) => (record.id === updated.id ? updated : record)),
      );
      onViewChange?.("reviewed");
    } catch {
      setReviewError("评价提交失败，请稍后重试。");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const header = (
    <ElderPageHeader
      title="特约服务"
      description="查看社区服务，可直接致电服务商或请家人帮忙。"
    />
  );
  const switcher = (
    <div
      className="appointment-section-switch"
      role="tablist"
      aria-label="特约服务页面"
    >
      <button
        className={view !== "records" && view !== "record-detail" ? "active" : ""}
        onClick={() => setView("list", "default")}
      >
        <Wrench />
        可用服务
      </button>
      <button
        className={view === "records" || view === "record-detail" ? "active" : ""}
        onClick={() => setView("records", "records")}
      >
        <ClipboardCheck />
        协助记录
      </button>
    </div>
  );

  return (
    <>
      {(view === "list" || view === "records") && (
        <>
          {header}
          {switcher}
        </>
      )}
      {view === "list" && (
        <section className="appointment-service-list">
          {directory.categoryEnabled && directory.groups.length > 0 && (
            <nav className="appointment-category-nav" aria-label="服务分类">
              {directory.groups.map((group) => (
                <button
                  key={group.code}
                  className={selectedCategoryCode === group.code ? "active" : ""}
                  onClick={() => setSelectedCategoryCode(group.code)}
                >
                  {group.name}
                </button>
              ))}
            </nav>
          )}
          {visibleServices.map((service) => {
            const reviewSummary = serviceReviewSummaries.get(service.id) ?? {
              count: 0,
              average: null,
              reviews: [],
            };
            const firstPrice = service.serviceItems.find((item) =>
              item.priceText.trim(),
            )?.priceText;
            return (
              <button
                key={service.id}
                className="appointment-service-card"
                onClick={() => {
                  setSelected(service);
                  setDetailTab("detail");
                  setView("detail", "detail");
                }}
              >
                <img src={service.coverImage} alt="" />
                <div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  {firstPrice && (
                    <b>
                      {firstPrice}
                      <em> 参考价格</em>
                    </b>
                  )}
                  <span
                    className={`appointment-service-rating${reviewSummary.count ? "" : " is-empty"}`}
                  >
                    {reviewSummary.count ? (
                      <>
                        <Star />
                        {reviewSummary.average!.toFixed(1)}
                        <em>{reviewSummary.count} 条评价</em>
                      </>
                    ) : (
                      "暂无评价"
                    )}
                  </span>
                </div>
                <ChevronRight />
              </button>
            );
          })}
          {visibleServices.length === 0 && (
            <div className="appointment-service-empty">
              <Wrench />
              <strong>暂无可用服务</strong>
              <p>当前社区暂时没有可展示的服务。</p>
            </div>
          )}
        </section>
      )}

      {view === "detail" && (
        <section className="appointment-detail">
          <div className="appointment-detail-hero-image">
            <img src={selected.coverImage} alt={selected.name} />
            <span>{selected.name}</span>
          </div>
          <div className="appointment-detail-basics">
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
          </div>
          <div
            className="appointment-detail-tabs"
            role="tablist"
            aria-label="服务详情内容"
          >
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === "detail"}
              className={detailTab === "detail" ? "active" : ""}
              onClick={() => setDetailTab("detail")}
            >
              详情
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === "reviews"}
              className={detailTab === "reviews" ? "active" : ""}
              onClick={() => setDetailTab("reviews")}
            >
              服务评价
              {selectedReviewSummary.count
                ? ` ${selectedReviewSummary.count}`
                : ""}
            </button>
          </div>
          {detailTab === "detail" ? (
            <>
              <section className="appointment-introduction">
                <h3>服务内容与参考价格</h3>
                <div className="appointment-service-item-list">
                  {selected.serviceItems.map((item) => (
                    <article key={item.id}>
                      <div>
                        <h4>{item.name}</h4>
                        <strong>{item.priceText}</strong>
                      </div>
                      <p>{item.content}</p>
                    </article>
                  ))}
                </div>
                <p className="appointment-price-note">
                  具体费用以服务人员上门确认为准
                </p>
                <div>
                  <h4>注意事项</h4>
                  <ul>
                    {selected.precautions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
              <section className="appointment-service-info">
                <h3>服务信息</h3>
                <div className="appointment-provider">
                  <UserRound />
                  <div className="appointment-provider-content">
                    <div className="appointment-provider-heading">
                      <small>服务商</small>
                      <strong>{selected.provider}</strong>
                    </div>
                    <dl className="appointment-provider-facts">
                      <div>
                        <dt>
                          <Clock3 />
                          营业时间
                        </dt>
                        <dd>{selected.businessHours}</dd>
                      </div>
                      <div>
                        <dt>
                          <MapPin />
                          支持区域
                        </dt>
                        <dd>{selected.serviceArea}</dd>
                      </div>
                      <div>
                        <dt>
                          <PhoneCall />
                          服务电话
                        </dt>
                        <dd>
                          <a
                            href={`tel:${selected.providerPhone.replace(/\s/g, "")}`}
                            onClick={recordServiceCall}
                          >
                            {selected.providerPhone}
                          </a>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </section>
              <section className="appointment-detail-gallery">
                <h3>服务详情</h3>
                <div className="appointment-detail-images">
                  {selected.detailImages.map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt={`${selected.name}服务详情`}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="appointment-service-reviews">
              {selectedAverageRating !== null && (
                <header>
                  <div>
                    <h3>综合评分</h3>
                  </div>
                  <strong>
                    <Star />
                    {selectedAverageRating.toFixed(1)}
                  </strong>
                </header>
              )}
              {selectedReviews.length ? (
                <div className="appointment-service-review-list">
                  {selectedReviews.map((review) => (
                    <article key={review.recordId}>
                      <div>
                        <span>{review.reviewerName}</span>
                        <small>{formatTime(review.submittedAt)}</small>
                      </div>
                      <div
                        className="appointment-service-review-stars"
                        aria-label={`${review.rating} 星评价`}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Star
                            key={value}
                            className={value <= review.rating ? "active" : ""}
                          />
                        ))}
                      </div>
                      <p>{review.text || "未填写文字评价"}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="appointment-service-review-empty">
                  <Star />
                  <strong>暂无评价</strong>
                </div>
              )}
            </section>
          )}
          <div className="appointment-detail-actions">
            <a
              className="primary-button appointment-call-button"
              href={`tel:${selected.providerPhone.replace(/\s/g, "")}`}
              onClick={recordServiceCall}
            >
              <PhoneCall />
              拨打服务电话<span>{selected.providerPhone}</span>
            </a>
            <button
              className="secondary-button appointment-family-help-button"
              onClick={() => requestFamilyHelp()}
            >
              <HandHeart />
              请家人帮忙
            </button>
          </div>
        </section>
      )}

      {view === "result" && latest && (
        <section
          className={`appointment-assistance-result ${latest.status} ${latest.serviceStatus}`}
        >
          {familyHelpSuccessMessage && (
            <p className="appointment-help-success" role="status">
              {familyHelpSuccessMessage}
            </p>
          )}
          <span>
            {latest.status === "expired" || latest.status === "cancelled" ? (
              <XCircle />
            ) : latest.workflowStage === "appointment_confirmed" ||
              latest.workflowStage === "service_no_longer_needed" ||
              isFamilyHandlingCompleted(latest) ||
              latest.status === "handled" ? (
              <CheckCircle2 />
            ) : (
              <BellRing />
            )}
          </span>
          <h2>
            {isFamilyInquiryPending(latest)
              ? `${latest.familyHelpInquiry?.askedBy.name || "家人"}想问：这项服务约好了吗？`
              : latest.workflowStage === "appointment_confirmed"
                ? "已记录预约结果"
                : latest.workflowStage === "service_no_longer_needed"
                  ? "暂时不需要此服务"
                : latest.status === "expired"
                  ? "协助已失效"
                  : latest.status === "cancelled"
                    ? "协助已取消"
                    : isNotAppointedFeedback
                      ? `${lastContactActorName} 暂未约成`
                    : isFamilyHandlingCompleted(latest)
                      ? "家人处理完成"
                      : latest.status === "handled"
                        ? `${latest.handledBy} 已反馈`
                        : latest.status === "handling"
                          ? `${contactActorName} 正在联系`
                          : "已通知家人"}
          </h2>
          <p>
            {isFamilyInquiryPending(latest)
              ? `${latest.familyHelpInquiry?.askedBy.name || "家人"}想确认您是否已经约好；您的答复会同步给家人。`
              : latest.workflowStage === "appointment_confirmed"
                ? "您已确认约好，本次联系已结束并同步给家人。"
                : latest.workflowStage === "service_no_longer_needed"
                  ? "本次询问已结束，您的答复已同步给家人。"
                : latest.status === "expired"
                  ? serviceAssistanceExpiryMessage
                  : latest.status === "cancelled"
                    ? "上次协助请求已取消，您可以重新请家人帮忙。"
                    : isNotAppointedFeedback
                      ? "本次联系还没有约好，协助仍在继续，其他家人也可以继续帮忙联系。"
                    : isFamilyHandlingCompleted(latest)
                      ? "家人已完成本次协助工单处理。"
                      : latest.status === "handled"
                        ? latest.resultSummary
                        : latest.status === "handling"
                          ? `${contactActorName} 正在帮您联系服务商。`
                          : "请等待家人与您联系。"}
          </p>
          <dl>
            <div>
              <dt>需要协助</dt>
              <dd>{serviceSnapshotLabel(latest.service)}</dd>
            </div>
            <div>
              <dt>服务商</dt>
              <dd>
                {latest.provider.name} · {latest.provider.phone}
              </dd>
            </div>
            <div>
              <dt>请求时间</dt>
              <dd>{formatTime(latest.requestedAt)}</dd>
            </div>
            {latest.lastRemindedAt && (
              <div>
                <dt>最近提醒</dt>
                <dd>{formatTime(latest.lastRemindedAt)}</dd>
              </div>
            )}
            {latest.handledAt && (
              <div>
                <dt>{latest.status === "handled" ? "反馈时间" : "处理时间"}</dt>
                <dd>{formatTime(latest.handledAt)}</dd>
              </div>
            )}
            {isNotAppointedFeedback && latest.lastFamilyContactAt && (
              <div>
                <dt>最近反馈</dt>
                <dd>{lastContactActorName} · {formatTime(latest.lastFamilyContactAt)}</dd>
              </div>
            )}
            {latest.appointmentAt?.trim() && (
              <div>
                <dt>预约时间</dt>
                <dd>{latest.appointmentAt}</dd>
              </div>
            )}
            {latest.feeText?.trim() && (
              <div>
                <dt>参考费用</dt>
                <dd>{latest.feeText}</dd>
              </div>
            )}
            {getFamilyHandlingCompletedAt(latest) && (
              <div>
                <dt>家人处理完成时间</dt>
                <dd>{formatTime(getFamilyHandlingCompletedAt(latest)!)}</dd>
              </div>
            )}
          </dl>
          {canReviewServiceAssistance(latest, currentElderProfile.id) && (
            <div className="service-review-form">
              <strong>评价本次服务</strong>
              <div className="service-review-stars" aria-label="服务评分">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    className={value <= rating ? "active" : ""}
                    onClick={() => setRating(value)}
                    aria-label={`${value} 星`}
                  >
                    <Star />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                maxLength={100}
                placeholder="写下评价（选填）"
              />
              {reviewError && (
                <p className="service-review-error" role="alert">
                  {reviewError}
                </p>
              )}
              <button
                className="primary-button"
                onClick={saveReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? "提交中…" : "提交评价"}
              </button>
            </div>
          )}
          {latest.review && (
            <div className="service-review-result">
              <strong>我的评价</strong>
              <div>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={value <= latest.review!.rating ? "active" : ""}
                  />
                ))}
              </div>
              <p>{latest.review.text || "未填写文字评价"}</p>
              <small>
                评价人：{latest.elder.name} ·{" "}
                {formatTime(latest.review.submittedAt)}
              </small>
            </div>
          )}
          {isFamilyAssistanceRecord(latest) &&
            (latest.status === "pending" ||
              latest.status === "handling" ||
              latest.status === "expired" ||
              latest.status === "cancelled") && (
              <button
                className="primary-button"
                onClick={() => {
                  const service = getAppointmentServiceById(latest.service.id);
                  if (service) requestFamilyHelp(service);
                }}
              >
                <HandHeart />
                {latest.status === "expired" || latest.status === "cancelled"
                  ? "重新请家人帮忙"
                  : "再次提醒家人"}
              </button>
            )}
          <button
            className="secondary-button"
            onClick={() => setView("list", "default")}
          >
            继续查看服务
          </button>
        </section>
      )}

      {view === "records" && (
        <section className="appointment-records">
          {!records.length && (
            <div className="acceptance-empty-state standalone">
              <ClipboardCheck />
              <strong>暂无协助记录</strong>
              <span>拨打服务电话或请家人帮忙后，记录会显示在这里</span>
            </div>
          )}
          {records.map((record) => (
            <article key={record.id} className={`appointment-record-summary${isFamilyInquiryPending(record) ? " is-inquiry" : ""}`}>
              <button
                className="appointment-record-open"
                onClick={() => {
                  if (isFamilyInquiryPending(record)) {
                    familyInquiryTriggerRef.current = document.activeElement as HTMLElement;
                    setFamilyInquiryOpen(true);
                  }
                  setLatest(record);
                  setViewState("record-detail");
                }}
              >
                <span className={isFamilyAssistanceRecord(record) ? "is-help" : "is-contact"}>
                  {isFamilyAssistanceRecord(record) ? <HandHeart /> : <PhoneCall />}
                </span>
                <span className="appointment-record-summary-copy">
                  <span className="appointment-record-summary-meta">
                    <small>{getRecordType(record)}</small>
                    {getElderRecordStatus(record) && (
                      <b data-status={getElderRecordStatus(record)!}>{getElderRecordStatus(record)}</b>
                    )}
                  </span>
                  <strong>{record.service.name}</strong>
                  <small>{record.provider.name}</small>
                  <time>{formatTime(record.contactStartedAt ?? record.requestedAt)}</time>
                  <em>{getLatestRecordProgress(record)}</em>
                </span>
                <span className="appointment-record-summary-aside">
                  <ChevronRight />
                </span>
              </button>
              {canReviewServiceAssistance(record, record.elder.id) && (
                <button
                  className="appointment-record-review"
                  onClick={() => {
                    setLatest(record);
                    setRating(5);
                    setReviewText("");
                    setReviewError("");
                  setViewState("result");
                  }}
                >
                  <Star />
                  评价服务
                </button>
              )}
            </article>
          ))}
        </section>
      )}

      {view === "record-detail" && latest && (
        <section className="appointment-record-detail">
          <button className="appointment-record-back" onClick={() => setViewState("records")}>
            返回协助记录
          </button>
          <header>
            <span>{getRecordType(latest)}</span>
            {getElderRecordStatus(latest) && (
              <b data-status={getElderRecordStatus(latest)!}>{getElderRecordStatus(latest)}</b>
            )}
          </header>
          <h2>{latest.service.name}</h2>
          <div className="appointment-record-provider">
            <UserRound />
            <span><small>服务商</small><strong>{latest.provider.name}</strong></span>
            <a href={`tel:${latest.provider.phone.replace(/\s/g, "")}`}><PhoneCall />{latest.provider.phone}</a>
          </div>
          <section className="appointment-record-progress" aria-label="处理进展">
            <h3>处理进展</h3>
            <ol>
              {getRecordProgress(latest).map((item, index) => (
                <li key={`${item.time}-${index}`}>
                  <time>{formatTime(item.time)}</time>
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>
          </section>
          {canReviewServiceAssistance(latest, latest.elder.id) && (
            <button
              className="appointment-record-review"
              onClick={() => {
                setRating(5);
                setReviewText("");
                setReviewError("");
                setViewState("result");
              }}
            >
              <Star />评价服务
            </button>
          )}
        </section>
      )}

      {confirmOpen && (
        <div className="appointment-help-confirm-overlay" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-help-confirm-title"
          >
            <span>
              <HandHeart />
            </span>
            <h2 id="appointment-help-confirm-title">
              {confirmationCopy.title}
            </h2>
            <p>{confirmationCopy.description}</p>
            <small>{confirmationCopy.hint}</small>
            {submitError && (
              <p className="appointment-help-submit-error" role="alert">
                {submitError}
              </p>
            )}
            <div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                再想想
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={confirmFamilyHelp}
                disabled={submitting}
              >
                {submitting ? "发送中…" : confirmationCopy.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}

      {familyInquiryOpen && latest && isFamilyInquiryPending(latest) && (
        <div className="appointment-family-inquiry-overlay" role="presentation">
          <section
            ref={familyInquiryDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-family-inquiry-title"
            onKeyDown={handleFamilyInquiryDialogKeyDown}
          >
            <button
              type="button"
              className="appointment-family-inquiry-close"
              aria-label="关闭询问"
              onClick={closeFamilyInquiry}
            >
              <XCircle />
            </button>
            <span className="appointment-family-inquiry-eyebrow">家人询问</span>
            <h2 id="appointment-family-inquiry-title">
              {getFamilyActorLabel(latest.familyHelpInquiry?.askedBy.name, latest.familyHelpInquiry?.askedBy.id)}想问您：这项服务约好了吗？
            </h2>
            <div className="appointment-family-inquiry-service">
              <small>相关服务</small>
              <strong>{latest.service.name}</strong>
              <span>{latest.provider.name}</span>
            </div>
            <div className="appointment-contact-answer-actions">
              <button className="primary-button" onClick={() => answerServiceCall(serviceContactAnswers.appointmentConfirmed)}>约好了</button>
              <button className="secondary-button" onClick={() => answerServiceCall(serviceContactAnswers.familyHelpRequested)}><HandHeart />没约好，请家人帮忙</button>
              <button className="secondary-button appointment-no-longer-needed-button" onClick={() => answerServiceCall(serviceContactAnswers.serviceNoLongerNeeded)}><XCircle />暂时不需要了</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
