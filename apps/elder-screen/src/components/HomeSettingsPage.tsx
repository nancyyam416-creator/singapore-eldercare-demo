import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Headphones, Save, Settings, UsersRound } from "lucide-react";
import {
  getOrderedEmergencyCallTargets,
  saveEmergencyContactOrder,
  type EmergencyCallTarget,
} from "../emergency-assistance";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./home-settings-page.css";

interface HomeSettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HomeSettingsPage({ isOpen, onClose }: HomeSettingsPageProps) {
  const [targets, setTargets] = useState<EmergencyCallTarget[]>([]);
  const [savedTargetIds, setSavedTargetIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const orderedTargets = getOrderedEmergencyCallTargets();
    setTargets(orderedTargets);
    setSavedTargetIds(orderedTargets.map((target) => target.id));
  }, [isOpen]);

  if (!isOpen) return null;

  const moveTarget = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= targets.length) return;
    setTargets((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const saveOrder = () => {
    saveEmergencyContactOrder(targets.map((target) => target.id));
    setSavedTargetIds(targets.map((target) => target.id));
  };

  const hasUnsavedOrder = targets.length !== savedTargetIds.length || targets.some((target, index) => target.id !== savedTargetIds[index]);

  return (
    <main className="home-settings-page" aria-label="设置">
      <SecondaryPageHeader title="设置" icon={<Settings aria-hidden="true" />} onBack={onClose} />

      <div className="home-settings-layout">
        <aside className="home-settings-navigation" aria-label="设置模块">
          <nav>
            <button type="button" className="is-active" aria-current="page"><Headphones aria-hidden="true" /><span><strong>在线协助</strong><small>呼叫对象与联系顺序</small></span></button>
          </nav>
        </aside>

        <section className="home-settings-content" aria-labelledby="assistance-settings-title">
          <header className="home-settings-content__header">
            <span><Headphones aria-hidden="true" /></span>
            <div><h2 id="assistance-settings-title">在线协助呼叫顺序</h2><p>在线协助会严格按照下方保存顺序逐一进行 Mock 呼叫。</p></div>
          </header>

          <div className="home-settings-targets" aria-label="在线协助呼叫顺序">
            {targets.map((target, index) => (
              <div className={`home-settings-target ${target.targetType === "call-center" ? "is-call-center" : ""}`} key={target.id}>
                <span className="home-settings-target__order">{index + 1}</span>
                <span className="home-settings-target__icon">{target.targetType === "call-center" ? <Headphones aria-hidden="true" /> : <UsersRound aria-hidden="true" />}</span>
                <div><strong>{target.name}</strong><small>{target.relationship} · {target.maskedPhone}</small></div>
                {target.targetType === "call-center" && <em>官方保留</em>}
                <span className="home-settings-target__reorder">
                  <button type="button" disabled={index === 0} onClick={() => moveTarget(index, -1)} aria-label={`上移${target.name}`}><ArrowUp aria-hidden="true" /></button>
                  <button type="button" disabled={index === targets.length - 1} onClick={() => moveTarget(index, 1)} aria-label={`下移${target.name}`}><ArrowDown aria-hidden="true" /></button>
                </span>
              </div>
            ))}
          </div>

          {hasUnsavedOrder && <footer>
            <button type="button" onClick={saveOrder}><Save aria-hidden="true" />保存呼叫顺序</button>
          </footer>}
        </section>
      </div>
    </main>
  );
}
