import type { ReactNode } from 'react';

type ElderPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function ElderPageHeader({ title, description, action }: ElderPageHeaderProps) {
  return <header className="elder-page-header">
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    {action && <div className="elder-page-header-action">{action}</div>}
  </header>;
}
