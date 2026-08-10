import { useState } from "react";
import FetchHttpClient from "../../gateway/FetchHttpClient";
import TenantHttpGateway from "../../gateway/tenant/TenantHttpGateway";
import UserHttpGateway from "../../gateway/user/UserHttpGateway";
import type { Tenant } from "../../model/Tenant";
import { useTenantActions } from "../../hook/useTenants";
import { AddMember } from "../../application/tenant/AddMember";
import { RemoveMember } from "../../application/tenant/RemoveMember";
import { unwrapOrElse } from "../../util/Result";
import Button from "../atoms/Button";
import EmptyState from "../atoms/EmptyState";
import Input from "../atoms/Input";
import Select from "../atoms/Select";
import FormField from "../molecules/FormField";
import MemberItem from "../molecules/MemberItem";
import Modal from "../molecules/Modal";

type TenantModalProps = {
  tenant: Tenant;
  onClose: () => void;
};

export default function TenantModal({ tenant, onClose }: Readonly<TenantModalProps>) {
  const tenentActions = useTenantActions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const httpClient = new FetchHttpClient();
  const tenantGateway = new TenantHttpGateway(httpClient);

  const addMemeber = AddMember({
    tenantGateway,
    userGateway: new UserHttpGateway(httpClient),
  });

  const removeMember = RemoveMember({ tenantGateway });

  const handleAddUser = async () => {
    if (!name || !email) {
      alert("Name and email are required");
      return;
    }

    const updated = await addMemeber({
      tenant,
      member: {
        user: { name, email },
        role,
      },
    }).then(unwrapOrElse(alert));

    if (updated) {
      tenentActions.updateTenant(updated);
      setName("");
      setEmail("");
      setRole("member");
    }
  };

  const handleRemoveUser = (userId?: string) => async () => {
    if (!userId) return;

    const updated = await removeMember({ tenant, userId }).then(
      unwrapOrElse(alert),
    );

    if (updated) tenentActions.updateTenant(updated);
  };

  return (
    <Modal title={tenant.props.name} onClose={onClose}>
      <section className="modal-section">
        <h3 className="modal-section-title">Add member</h3>
        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddUser();
          }}
        >
          <FormField label="Name" htmlFor="member-name">
            <Input
              id="member-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              required
            />
          </FormField>
          <FormField label="Email" htmlFor="member-email">
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
            />
          </FormField>
          <FormField label="Role" htmlFor="member-role" size="small">
            <Select id="member-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
          </FormField>
          <Button variant="primary" type="submit">Add user</Button>
        </form>
      </section>

      <section className="modal-section">
        <h3 className="modal-section-title">Members ({tenant.members.length})</h3>
        {tenant.members.length === 0 ? (
          <EmptyState>No members yet</EmptyState>
        ) : (
          <ul className="member-list">
            {tenant.members.map((member, index) => (
              <MemberItem key={index} member={member} onRemove={handleRemoveUser(member.user.id)} />
            ))}
          </ul>
        )}
      </section>
    </Modal>
  );
}
