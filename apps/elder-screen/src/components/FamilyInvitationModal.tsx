import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  LoaderCircle,
  UserPlus,
  X,
} from "lucide-react";
import "./family-invitation-modal.css";

type InvitationStatus = "idle" | "generating" | "active" | "failed" | "expired";

interface FamilyInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INVITATION_SECONDS = 30 * 60;

const isFinderCell = (row: number, column: number, top: number, left: number) => {
  const inside = row >= top && row < top + 5 && column >= left && column < left + 5;
  if (!inside) return false;
  const localRow = row - top;
  const localColumn = column - left;
  return localRow === 0 || localRow === 4 || localColumn === 0 || localColumn === 4 || (localRow === 2 && localColumn === 2);
};

const qrCells = Array.from({ length: 121 }, (_, index) => {
  const row = Math.floor(index / 11);
  const column = index % 11;
  const finder = isFinderCell(row, column, 0, 0)
    || isFinderCell(row, column, 0, 6)
    || isFinderCell(row, column, 6, 0);
  return finder || ((row * 7 + column * 5 + row * column) % 4 === 0);
});

const formatRemaining = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

export default function FamilyInvitationModal({ isOpen, onClose }: FamilyInvitationModalProps) {
  const [status, setStatus] = useState<InvitationStatus>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(INVITATION_SECONDS);
  const generationTimer = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "active") return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setStatus("expired");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => () => {
    if (generationTimer.current) window.clearTimeout(generationTimer.current);
  }, []);

  const generateCode = (simulateFailure = false) => {
    if (generationTimer.current) window.clearTimeout(generationTimer.current);
    setStatus("generating");

    generationTimer.current = window.setTimeout(() => {
      if (simulateFailure) {
        setStatus("failed");
        return;
      }

      setRemainingSeconds(INVITATION_SECONDS);
      setStatus("active");
    }, 650);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (status === "idle" || status === "expired") generateCode();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="family-invitation-overlay">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-invitation-title"
        className="family-invitation-modal"
      >
        <header className="family-invitation-header">
          <div className="family-invitation-heading">
            <span className="family-invitation-heading__icon">
              <UserPlus aria-hidden="true" />
            </span>
            <div>
              <h2 id="family-invitation-title">邀请家人</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭邀请家人" className="family-invitation-close">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="family-invitation-body">
          {(status === "idle" || status === "generating") && (
            <div role="status" className="family-invitation-state">
              <LoaderCircle className="is-spinning" aria-hidden="true" />
              <h3>正在生成二维码</h3>
              <p>请稍候</p>
            </div>
          )}

          {status === "active" && (
            <div className="family-invitation-active">
              <div className="family-invitation-qr-panel">
                <div className="family-invitation-qr" aria-label="家庭绑定二维码，当前为固定Mock二维码">
                  {qrCells.map((dark, index) => <i key={index} className={dark ? "bg-[#10251C]" : "bg-white"} />)}
                </div>
                <h3>请家人使用手机扫码</h3>
                <p>扫码后核对老人信息并完成绑定</p>
                <div className="family-invitation-expiry" role="timer" aria-live="polite">
                  <Clock3 aria-hidden="true" />
                  <span>二维码 30 分钟内有效 · 剩余 {formatRemaining(remainingSeconds)}</span>
                </div>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div role="alert" className="family-invitation-state is-error">
              <AlertTriangle aria-hidden="true" />
              <h3>二维码生成失败</h3>
              <p>当前网络异常，请关闭后重新邀请。</p>
            </div>
          )}

          {status === "expired" && (
            <div role="status" className="family-invitation-state">
              <Clock3 aria-hidden="true" />
              <h3>二维码已失效</h3>
              <p>原二维码已无法使用。</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
