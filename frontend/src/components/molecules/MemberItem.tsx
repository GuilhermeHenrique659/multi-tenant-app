import type { Tenant } from "../../model/Tenant";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";

type Member = Tenant["members"][number];

type MemberItemProps = {
  member: Member;
  onRemove: () => void;
};

export default function MemberItem({ member, onRemove }: Readonly<MemberItemProps>) {
  return (
    <li className="member-item">
      <div className="member-info">
        <span className="member-name">{member.user.name}</span>
        <Badge kind="role" tone={member.role}>{member.role}</Badge>
      </div>
      <Button variant="danger" size="small" onClick={onRemove}>Remove</Button>
    </li>
  );
}
