import {
  CalendarDays,
  ContactRound,
  Home,
  MapPin,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { ElderProfileSnapshot } from "../elder-profile";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./personal-profile-page.css";

interface PersonalProfilePageProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ElderProfileSnapshot;
  boundFamilyCount: number;
}

interface ProfileFieldProps {
  label: string;
  value: string;
  icon: typeof UserRound;
  isMissing?: boolean;
}

function ProfileField({ label, value, icon: FieldIcon, isMissing = false }: ProfileFieldProps) {
  return (
    <div className={`personal-profile-field${isMissing ? " is-missing" : ""}`}>
      <span className="personal-profile-field__icon"><FieldIcon aria-hidden="true" /></span>
      <span className="personal-profile-field__copy">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

const displayValue = (value?: string) => value?.trim() || "未完善";

export default function PersonalProfilePage({
  isOpen,
  onClose,
  profile,
  boundFamilyCount,
}: PersonalProfilePageProps) {
  if (!isOpen) return null;

  const emergencyContact = profile.emergencyContact
    ? `${profile.emergencyContact.name} · ${profile.emergencyContact.relationship} · ${profile.emergencyContact.maskedPhone}`
    : "未完善";

  return (
    <main className="personal-profile-page" aria-label="我的信息">
      <SecondaryPageHeader title="我的信息" icon={<UserRound aria-hidden="true" />} onBack={onClose} />

      <div className="personal-profile-layout">
        <aside className="personal-profile-summary">
          <div className="personal-profile-avatar" aria-hidden="true">
            <UserRound />
          </div>
          <span className="personal-profile-summary__eyebrow">当前使用人</span>
          <h2>{displayValue(profile.name)}</h2>
          <p>{displayValue(profile.projectCommunity)}</p>
        </aside>

        <section className="personal-profile-content">
          <section className="personal-profile-section">
            <header>
              <UserRound aria-hidden="true" />
              <div><h3>基本信息</h3><p>来自管理后台老人档案</p></div>
            </header>
            <div className="personal-profile-grid">
              <ProfileField label="姓名" value={displayValue(profile.name)} icon={UserRound} isMissing={!profile.name} />
              <ProfileField label="出生日期" value={displayValue(profile.birthDate)} icon={CalendarDays} isMissing={!profile.birthDate} />
            </div>
          </section>

          <section className="personal-profile-section">
            <header>
              <Home aria-hidden="true" />
              <div><h3>居住与社区</h3><p>来自当前有效归属关系和老人档案</p></div>
            </header>
            <div className="personal-profile-grid">
              <ProfileField label="所属社区／项目" value={displayValue(profile.projectCommunity)} icon={UsersRound} isMissing={!profile.projectCommunity} />
              <ProfileField label="居住地址" value={displayValue(profile.address)} icon={MapPin} isMissing={!profile.address} />
            </div>
          </section>

          <section className="personal-profile-section personal-profile-section--compact">
            <header>
              <ContactRound aria-hidden="true" />
              <div><h3>家庭关系</h3><p>来自紧急联系人和当前有效家庭绑定关系</p></div>
            </header>
            <div className="personal-profile-grid">
              <ProfileField label="紧急联系人" value={emergencyContact} icon={ContactRound} isMissing={!profile.emergencyContact} />
              <ProfileField label="已绑定家人" value={`${boundFamilyCount}位`} icon={UsersRound} />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
