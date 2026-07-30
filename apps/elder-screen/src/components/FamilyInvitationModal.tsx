import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  QrCode,
  RefreshCw,
  UserPlus,
  X,
} from "lucide-react";

type InvitationStatus = "idle" | "generating" | "active" | "failed" | "expired" | "ended";

interface FamilyInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  elderName?: string;
}

const INVITATION_SECONDS = 30 * 60;
const MOCK_CODES = ["735281", "846193", "592407", "318654"];

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

export default function FamilyInvitationModal({ isOpen, onClose, elderName }: FamilyInvitationModalProps) {
  const [status, setStatus] = useState<InvitationStatus>("idle");
  const [bindingCode, setBindingCode] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(INVITATION_SECONDS);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const nextCodeIndex = useRef(0);
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
    setShowEndConfirmation(false);
    setBindingCode("");
    setStatus("generating");

    generationTimer.current = window.setTimeout(() => {
      if (simulateFailure) {
        setStatus("failed");
        return;
      }

      setBindingCode(MOCK_CODES[nextCodeIndex.current % MOCK_CODES.length]);
      nextCodeIndex.current += 1;
      setRemainingSeconds(INVITATION_SECONDS);
      setStatus("active");
    }, 650);
  };

  const endInvitation = () => {
    setShowEndConfirmation(false);
    setBindingCode("");
    setRemainingSeconds(0);
    setStatus("ended");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-invitation-title"
        className="relative w-full max-w-[980px] min-h-[650px] bg-[#F5F2EB] border-2 border-[#DCD6CC] rounded-[36px] shadow-2xl overflow-hidden flex flex-col"
      >
        <header className="h-[112px] px-9 bg-white border-b-2 border-[#E7E1D7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-[#EAF6EF] text-[#14533C] flex items-center justify-center">
              <UserPlus className="w-8 h-8" />
            </span>
            <div>
              <h2 id="family-invitation-title" className="text-[30px] font-black text-[#1C2C24]">邀请家人</h2>
              <p className="text-[17px] font-bold text-gray-500 mt-1">
                {elderName ? `让家人在手机端绑定${elderName}` : "让家人在手机端绑定当前老人"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭邀请家人" className="w-14 h-14 rounded-full bg-[#F2EFE9] text-gray-600 flex items-center justify-center hover:bg-[#E7E1D7]">
            <X className="w-7 h-7" />
          </button>
        </header>

        <div className="flex-1 p-9 flex flex-col items-center justify-center text-center">
          {status === "idle" && (
            <div className="w-full max-w-[680px]">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#EAF6EF] text-[#14533C] flex items-center justify-center">
                <QrCode className="w-12 h-12" />
              </div>
              <h3 className="text-[36px] font-black text-[#1C2C24] mt-7">暂无进行中的邀请</h3>
              <p className="text-[20px] font-bold text-gray-600 mt-4 leading-relaxed">生成后，把二维码或6位绑定码给家人看即可。</p>
              <button type="button" onClick={() => generateCode()} className="w-full h-[76px] mt-8 rounded-2xl bg-[#14533C] text-white text-[24px] font-black flex items-center justify-center gap-3 shadow-lg active:scale-[0.99]">
                <QrCode className="w-7 h-7" />生成家庭绑定码
              </button>
            </div>
          )}

          {status === "generating" && (
            <div role="status" className="flex flex-col items-center">
              <LoaderCircle className="w-20 h-20 text-[#14533C] animate-spin" />
              <h3 className="text-[34px] font-black text-[#1C2C24] mt-7">正在生成家庭绑定码</h3>
              <p className="text-[19px] font-bold text-gray-500 mt-3">请稍候，不要重复点击</p>
            </div>
          )}

          {status === "active" && (
            <div className="w-full grid grid-cols-[330px_minmax(0,1fr)] gap-9 items-center text-left">
              <div className="bg-white border-2 border-[#DCD6CC] rounded-[28px] p-7 shadow-sm">
                <div className="grid grid-cols-11 gap-[3px] w-[260px] h-[260px] mx-auto bg-white p-3" aria-label="家庭绑定二维码，当前为固定Mock二维码">
                  {qrCells.map((dark, index) => <i key={index} className={dark ? "bg-[#10251C]" : "bg-white"} />)}
                </div>
                <p className="text-center text-[15px] font-bold text-gray-500 mt-3">请家人使用手机扫码绑定</p>
              </div>

              <div>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EAF6EF] text-[#14533C] text-[17px] font-black"><CheckCircle2 className="w-5 h-5" />邀请进行中</span>
                <p className="text-[18px] font-black text-gray-600 mt-6">6位家庭绑定码</p>
                <div className="mt-2 px-7 py-5 bg-white border-[3px] border-[#14533C] rounded-2xl text-[48px] font-black tracking-[0.28em] text-[#1C2C24] tabular-nums">
                  {bindingCode}
                </div>
                <div className="mt-5 flex items-center gap-3 text-[#8B5E16]">
                  <Clock3 className="w-7 h-7" />
                  <strong className="text-[27px] font-black tabular-nums">剩余 {formatRemaining(remainingSeconds)}</strong>
                </div>
                <p className="text-[19px] font-black text-[#1C2C24] mt-5 leading-relaxed">家人可以在30分钟内使用同一个二维码分别绑定</p>
                <div className="grid grid-cols-2 gap-4 mt-7">
                  <button type="button" onClick={() => generateCode()} className="h-[66px] rounded-2xl border-2 border-[#14533C] bg-white text-[#14533C] text-[20px] font-black flex items-center justify-center gap-2"><RefreshCw className="w-6 h-6" />重新生成</button>
                  <button type="button" onClick={() => setShowEndConfirmation(true)} className="h-[66px] rounded-2xl border-2 border-[#C84B45] bg-white text-[#A6322D] text-[20px] font-black">结束邀请</button>
                </div>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div role="alert" className="w-full max-w-[680px]">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#FBE8E6] text-[#B73F39] flex items-center justify-center"><AlertTriangle className="w-12 h-12" /></div>
              <h3 className="text-[36px] font-black text-[#1C2C24] mt-7">生成失败</h3>
              <p className="text-[20px] font-bold text-gray-600 mt-4">当前网络异常，请检查网络后重新生成。</p>
              <button type="button" onClick={() => generateCode()} className="w-full h-[72px] mt-8 rounded-2xl bg-[#14533C] text-white text-[23px] font-black">重新生成</button>
            </div>
          )}

          {(status === "expired" || status === "ended") && (
            <div role="status" className="w-full max-w-[680px]">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#F2EFE9] text-gray-500 flex items-center justify-center">{status === "expired" ? <Clock3 className="w-12 h-12" /> : <X className="w-12 h-12" />}</div>
              <h3 className="text-[36px] font-black text-[#1C2C24] mt-7">{status === "expired" ? "绑定码已过期" : "邀请已结束"}</h3>
              <p className="text-[20px] font-bold text-gray-600 mt-4">原二维码和6位绑定码已失效，家人无法继续使用。</p>
              <button type="button" onClick={() => generateCode()} className="w-full h-[72px] mt-8 rounded-2xl bg-[#14533C] text-white text-[23px] font-black flex items-center justify-center gap-3"><RefreshCw className="w-7 h-7" />重新生成家庭绑定码</button>
            </div>
          )}
        </div>

        <details className="mx-9 mb-7 rounded-2xl border-2 border-dashed border-[#CFC8BC] bg-white/70 px-5 py-3 text-left">
          <summary className="cursor-pointer text-[15px] font-black text-gray-500">原型验收状态</summary>
          <div className="flex gap-3 mt-3">
            <button type="button" onClick={() => generateCode(true)} className="px-4 py-2 rounded-xl bg-[#FBE8E6] text-[#A6322D] font-black">模拟生成失败</button>
            <button type="button" onClick={() => { setBindingCode(""); setRemainingSeconds(0); setStatus("expired"); }} className="px-4 py-2 rounded-xl bg-[#F2EFE9] text-gray-700 font-black">模拟绑定码过期</button>
          </div>
        </details>

        {showEndConfirmation && (
          <div className="absolute inset-0 z-10 bg-black/55 flex items-center justify-center p-8">
            <section role="alertdialog" aria-modal="true" aria-labelledby="end-invitation-title" className="w-full max-w-[600px] bg-white rounded-[30px] p-8 text-center shadow-2xl">
              <AlertTriangle className="w-16 h-16 mx-auto text-[#B73F39]" />
              <h3 id="end-invitation-title" className="text-[32px] font-black text-[#1C2C24] mt-5">确认结束本次邀请？</h3>
              <p className="text-[19px] font-bold text-gray-600 mt-4 leading-relaxed">结束后，当前二维码和6位绑定码会立即失效。</p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button type="button" onClick={() => setShowEndConfirmation(false)} className="h-[66px] rounded-2xl border-2 border-[#DCD6CC] text-gray-700 text-[20px] font-black">继续邀请</button>
                <button type="button" onClick={endInvitation} className="h-[66px] rounded-2xl bg-[#B73F39] text-white text-[20px] font-black">确认结束</button>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
