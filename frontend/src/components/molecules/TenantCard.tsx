import type { Tenant } from "../../model/Tenant";
import Button from "../atoms/Button";

type TenantCardProps = {
  tenant: Tenant;
  onViewDetails: () => void;
  onOpenProjects: () => void;
};

export default function TenantCard({ tenant, onViewDetails, onOpenProjects }: Readonly<TenantCardProps>) {
  const memberCount = tenant.props.memberCount ?? tenant.members.length;

  return (
    <div className="tenant-card">
      <div className="tenant-card-body">
        <h3 className="tenant-card-name">{tenant.props.name}</h3>
        <p className="tenant-card-meta">
          {memberCount} member{memberCount !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="tenant-card-actions">
        <Button variant="primary" onClick={onViewDetails}>View details</Button>
        <Button onClick={onOpenProjects}>Projects</Button>
      </div>
    </div>
  );
}
