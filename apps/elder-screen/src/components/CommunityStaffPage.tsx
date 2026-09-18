import { useMemo } from "react";
import {
  CircleUserRound,
  Clock3,
  Mail,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";
import { getActiveCommunityStaff, type CommunityStaffMock } from "../community-staff";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./community-staff-page.css";

export type CommunityStaffAcceptanceScenario = "multiple" | "single" | "multiple-time-slots" | "empty";

interface CommunityStaffPageProps {
  isOpen: boolean;
  onClose: () => void;
  acceptanceScenario?: CommunityStaffAcceptanceScenario;
}

const getScenarioStaff = (scenario: CommunityStaffAcceptanceScenario) => {
  const staff = getActiveCommunityStaff();
  if (scenario === "empty") return [];
  if (scenario === "single") return staff.slice(0, 1);
  if (scenario === "multiple-time-slots") return staff.filter((person) => person.serviceTimeSlots.length > 1);
  return staff;
};

function StaffPortrait({ person }: { person: CommunityStaffMock }) {
  if (person.photoIndex === undefined) {
    return (
      <span className="community-staff-portrait is-fallback" role="img" aria-label={`${person.displayName}的默认头像`}>
        <CircleUserRound aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className={`community-staff-portrait is-photo-${person.photoIndex + 1}`}
      role="img"
      aria-label={`${person.displayName}的照片`}
    />
  );
}

export default function CommunityStaffPage({
  isOpen,
  onClose,
  acceptanceScenario = "multiple",
}: CommunityStaffPageProps) {
  const staff = useMemo(() => getScenarioStaff(acceptanceScenario), [acceptanceScenario]);

  if (!isOpen) return null;

  return (
    <main className="community-staff-page">
      <SecondaryPageHeader
        title="社区人员"
        icon={<UsersRound aria-hidden="true" />}
        onBack={onClose}
      />

      <section className="community-staff-content">
        {staff.length === 0 ? (
          <div className="community-staff-empty" role="status">
            <span><UserRound aria-hidden="true" /></span>
            <h2>暂无社区人员信息</h2>
          </div>
        ) : (
          <>
            <header className="community-staff-intro">
              <div>
                <h2>社区服务联系人</h2>
                <p>查看社区人员的联系方式和对外服务时间。</p>
              </div>
            </header>

            <div className={`community-staff-grid${staff.length === 1 ? " is-single" : ""}`}>
              {staff.map((person) => (
                <article className="community-staff-card" key={person.id}>
                  <StaffPortrait person={person} />
                  <div className="community-staff-card__identity">
                    <span className="community-staff-card__name">
                      <strong>{person.displayName}</strong>
                      <small className={person.englishName ? "" : "is-missing"}>{person.englishName ?? "英文名未提供"}</small>
                    </span>
                    <b>{person.role}</b>
                  </div>
                  <div className="community-staff-card__details">
                    <div className="community-staff-card__field">
                      <span className="community-staff-card__label"><Clock3 aria-hidden="true" />对外服务时间</span>
                      <div className="community-staff-card__values">
                        {person.serviceTimeSlots.map((timeSlot) => <span key={timeSlot}>{timeSlot}</span>)}
                      </div>
                    </div>
                    <div className="community-staff-card__field">
                      <span className="community-staff-card__label"><Phone aria-hidden="true" />联系电话</span>
                      <div className="community-staff-card__values">
                        <span>{person.phoneNumber}</span>
                      </div>
                    </div>
                    <div className="community-staff-card__field">
                      <span className="community-staff-card__label"><Mail aria-hidden="true" />邮箱</span>
                      <div className="community-staff-card__values is-email">
                        <span className={person.email ? "" : "is-missing"}>{person.email ?? "未提供"}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
