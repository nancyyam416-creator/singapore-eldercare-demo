import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  Smartphone,
  TabletSmartphone,
  UserRoundCheck,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import "./family-relationship-requests-modal.css";

export type FamilyRelationshipRequestScenario =
  | "pending"
  | "multiple"
  | "processed-approved"
  | "processed-rejected"
  | "expired"
  | "not-eligible";

export type FamilyRelationshipRequestCondition = "network-normal" | "network-submit-failure";

type FamilyRelationshipRequestStatus = "pending" | "approved" | "rejected" | "expired";

interface FamilyRelationshipRequest {
  id: string;
  applicantName: string;
  maskedPhone: string;
  relationship: string;
  requestedAt: string;
  status: FamilyRelationshipRequestStatus;
  handledAt?: string;
  handledSource?: "tablet" | "mobile";
  avatar: string;
}

export interface FamilyRelationshipApprovedContact {
  id: string;
  name: string;
  relation: string;
  avatar: string;
}

interface FamilyRelationshipRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario?: FamilyRelationshipRequestScenario;
  condition?: FamilyRelationshipRequestCondition;
  onPendingCountChange?: (count: number) => void;
  onApproved?: (contact: FamilyRelationshipApprovedContact) => void;
}

const BASE_REQUESTS: FamilyRelationshipRequest[] = [
  {
    id: "family-request-xiaohui",
    applicantName: "女儿小慧",
    maskedPhone: "+65 8*** 2368",
    relationship: "女儿",
    requestedAt: "今天 09:20",
    status: "pending",
    avatar: "https://picsum.photos/seed/family-request-xiaohui/240/240",
  },
  {
    id: "family-request-junjun",
    applicantName: "孙子俊俊",
    maskedPhone: "+86 138****5062",
    relationship: "孙辈",
    requestedAt: "今天 08:45",
    status: "pending",
    avatar: "https://picsum.photos/seed/family-request-junjun/240/240",
  },
];

const cloneRequest = (
  request: FamilyRelationshipRequest,
  overrides: Partial<FamilyRelationshipRequest> = {},
): FamilyRelationshipRequest => ({ ...request, ...overrides });

const createScenarioRequests = (scenario: FamilyRelationshipRequestScenario): FamilyRelationshipRequest[] => {
  switch (scenario) {
    case "multiple":
      return [
        ...BASE_REQUESTS.map((request) => cloneRequest(request)),
        cloneRequest(BASE_REQUESTS[0], {
          id: "family-request-processed",
          applicantName: "儿子小刚",
          maskedPhone: "+86 139****1780",
          relationship: "儿子",
          requestedAt: "昨天 18:30",
          status: "approved",
          handledAt: "昨天 18:42",
          handledSource: "mobile",
          avatar: "https://picsum.photos/seed/xiaogang/240/240",
        }),
      ];
    case "processed-approved":
      return [cloneRequest(BASE_REQUESTS[0], {
        status: "approved",
        handledAt: "今天 09:26",
        handledSource: "mobile",
      })];
    case "processed-rejected":
      return [cloneRequest(BASE_REQUESTS[0], {
        status: "rejected",
        handledAt: "今天 09:26",
        handledSource: "mobile",
      })];
    case "expired":
      return [cloneRequest(BASE_REQUESTS[0], {
        requestedAt: "9月18日 10:20",
        status: "expired",
      })];
    case "not-eligible":
      return [];
    case "pending":
    default:
      return [cloneRequest(BASE_REQUESTS[0])];
  }
};

export const getFamilyRelationshipPendingCount = (scenario: FamilyRelationshipRequestScenario) => (
  createScenarioRequests(scenario).filter((request) => request.status === "pending").length
);

const statusPresentation: Record<FamilyRelationshipRequestStatus, { label: string; detail: string }> = {
  pending: { label: "待您确认", detail: "请核对申请人信息后处理" },
  approved: { label: "已同意", detail: "已成为当前老人的家庭联系人" },
  rejected: { label: "已拒绝", detail: "本次申请没有建立家庭关系" },
  expired: { label: "已过期", detail: "该申请已失效，不能继续处理" },
};

export default function FamilyRelationshipRequestsModal({
  isOpen,
  onClose,
  scenario = "pending",
  condition = "network-normal",
  onPendingCountChange,
  onApproved,
}: FamilyRelationshipRequestsModalProps) {
  const [requests, setRequests] = useState<FamilyRelationshipRequest[]>(() => createScenarioRequests(scenario));
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(() => createScenarioRequests(scenario)[0]?.id ?? null);
  const [submittingAction, setSubmittingAction] = useState<"approve" | "reject" | null>(null);
  const [actionError, setActionError] = useState("");
  const actionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const nextRequests = createScenarioRequests(scenario);
    setRequests(nextRequests);
    setSelectedRequestId(nextRequests[0]?.id ?? null);
    setSubmittingAction(null);
    setActionError("");
    onPendingCountChange?.(nextRequests.filter((request) => request.status === "pending").length);
  }, [condition, onPendingCountChange, scenario]);

  useEffect(() => () => {
    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
  }, []);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) ?? requests[0] ?? null,
    [requests, selectedRequestId],
  );

  const pendingCount = requests.filter((request) => request.status === "pending").length;

  const handleRequest = (action: "approve" | "reject") => {
    if (!selectedRequest || selectedRequest.status !== "pending" || submittingAction) return;
    setActionError("");
    setSubmittingAction(action);
    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);

    actionTimerRef.current = window.setTimeout(() => {
      setSubmittingAction(null);
      if (condition === "network-submit-failure") {
        setActionError("当前网络连接异常，本次处理未提交。请检查网络后重试。");
        return;
      }

      const nextStatus: FamilyRelationshipRequestStatus = action === "approve" ? "approved" : "rejected";
      setRequests((current) => current.map((request) => request.id === selectedRequest.id
        ? {
            ...request,
            status: nextStatus,
            handledAt: "刚刚",
            handledSource: "tablet",
          }
        : request));
      onPendingCountChange?.(Math.max(0, pendingCount - 1));
      if (action === "approve") {
        onApproved?.({
          id: selectedRequest.id,
          name: selectedRequest.applicantName,
          relation: selectedRequest.relationship,
          avatar: selectedRequest.avatar,
        });
      }
    }, 520);
  };

  if (!isOpen) return null;

  return (
    <div className="family-requests-overlay">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-requests-title"
        className="family-requests-modal"
      >
        <header className="family-requests-header">
          <div className="family-requests-heading">
            <span className="family-requests-heading__icon"><UsersRound aria-hidden="true" /></span>
            <div>
              <h2 id="family-requests-title">家人申请</h2>
              <p>家人在手机端发起，您只需核对后同意或拒绝</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭家人申请" className="family-requests-close">
            <X aria-hidden="true" />
          </button>
        </header>

        {scenario === "not-eligible" ? (
          <div className="family-requests-unavailable" role="status">
            <span><TabletSmartphone aria-hidden="true" /></span>
            <h3>当前平板尚未绑定老人档案</h3>
            <p>完成设备激活并绑定老人档案后，才能查看和处理家庭关系申请。</p>
            <button type="button" onClick={onClose}>我知道了</button>
          </div>
        ) : (
          <div className="family-requests-body">
            <aside className="family-requests-list" aria-label="家人申请列表">
              <div className="family-requests-list__summary">
                <span>申请记录</span>
                <strong>{pendingCount > 0 ? `${pendingCount}条待确认` : "暂无待确认"}</strong>
              </div>
              <div className="family-requests-list__items">
                {requests.map((request) => {
                  const presentation = statusPresentation[request.status];
                  return (
                    <button
                      key={request.id}
                      type="button"
                      className={selectedRequest?.id === request.id ? "is-selected" : ""}
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        setActionError("");
                      }}
                    >
                      <img src={request.avatar} alt="" referrerPolicy="no-referrer" />
                      <span>
                        <strong>{request.applicantName}</strong>
                        <small>{request.relationship} · {request.maskedPhone}</small>
                        <em className={`is-${request.status}`}>{presentation.label}</em>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="family-requests-list__source">
                <Smartphone aria-hidden="true" />
                <span><strong>申请由家人手机端发起</strong><small>平板不会生成二维码或绑定码</small></span>
              </div>
            </aside>

            <section className="family-request-detail" aria-live="polite">
              {selectedRequest && (
                <>
                  <div className="family-request-person">
                    <img src={selectedRequest.avatar} alt="" referrerPolicy="no-referrer" />
                    <div>
                      <span>申请成为您的家人</span>
                      <h3>{selectedRequest.applicantName}</h3>
                      <p>{selectedRequest.maskedPhone}</p>
                    </div>
                    <strong className={`is-${selectedRequest.status}`}>{statusPresentation[selectedRequest.status].label}</strong>
                  </div>

                  <dl className="family-request-facts">
                    <div><dt>对方选择的关系</dt><dd>{selectedRequest.relationship}</dd></div>
                    <div><dt>申请时间</dt><dd>{selectedRequest.requestedAt}</dd></div>
                  </dl>

                  <div className="family-request-impact">
                    <ShieldCheck aria-hidden="true" />
                    <div>
                      <h4>同意后会发生什么</h4>
                      <p>对方将成为您的家庭联系人，可以与您留言、通话，并查看您授权的家庭影像与提醒信息。</p>
                    </div>
                  </div>

                  {selectedRequest.status === "pending" ? (
                    <>
                      {actionError && (
                        <div className="family-request-error" role="alert">
                          <WifiOff aria-hidden="true" />
                          <span><strong>提交失败</strong><small>{actionError}</small></span>
                        </div>
                      )}
                      <div className="family-request-actions">
                        <button type="button" className="is-reject" onClick={() => handleRequest("reject")} disabled={Boolean(submittingAction)}>
                          {submittingAction === "reject" ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : <X aria-hidden="true" />}
                          {submittingAction === "reject" ? "正在提交" : "不是我的家人"}
                        </button>
                        <button type="button" className="is-approve" onClick={() => handleRequest("approve")} disabled={Boolean(submittingAction)}>
                          {submittingAction === "approve" ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : <Check aria-hidden="true" />}
                          {submittingAction === "approve" ? "正在提交" : "同意绑定"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={`family-request-result is-${selectedRequest.status}`} role="status">
                      {selectedRequest.status === "approved" ? <CheckCircle2 aria-hidden="true" />
                        : selectedRequest.status === "expired" ? <Clock3 aria-hidden="true" />
                          : <AlertTriangle aria-hidden="true" />}
                      <div>
                        <h4>{statusPresentation[selectedRequest.status].label}</h4>
                        <p>{statusPresentation[selectedRequest.status].detail}</p>
                        {selectedRequest.handledAt && (
                          <small>
                            {selectedRequest.handledSource === "mobile" ? "已在老人手机端处理" : "已在本平板处理"}
                            {` · ${selectedRequest.handledAt}`}
                          </small>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="family-request-single-submit"><UserRoundCheck aria-hidden="true" />同一条申请只能处理一次，处理结果会同步到另一端。</p>
                </>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
