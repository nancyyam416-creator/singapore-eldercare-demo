import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import "./secondary-page-header.css";

interface SecondaryPageHeaderProps {
  title: string;
  icon: ReactNode;
  onBack: () => void;
  actions?: ReactNode;
}

export default function SecondaryPageHeader({
  title,
  icon,
  onBack,
  actions,
}: SecondaryPageHeaderProps) {
  return (
    <header className="secondary-page-header">
      <div className="secondary-page-header__identity">
        <button type="button" className="secondary-page-header__back" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          返回首页
        </button>
        <div className="secondary-page-header__title">
          {icon}
          <h1>{title}</h1>
        </div>
      </div>

      {actions ? <div className="secondary-page-header__actions">{actions}</div> : null}
    </header>
  );
}
