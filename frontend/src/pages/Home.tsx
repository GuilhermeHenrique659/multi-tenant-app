import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FetchHttpClient from "../gateway/FetchHttpClient";
import TenantHttpGateway from "../gateway/tenant/TenantHttpGateway";
import UserHttpGateway from "../gateway/user/UserHttpGateway";
import { tenantsStore, type Tenant } from "../model/Tenant";
import {
  useTenant,
  useTenantActions,
  useTenantStore,
} from "../hook/useTenants";
import { AddMember } from "../application/tenant/AddMember";
import { RemoveMember } from "../application/tenant/RemoveMember";
import { ModelToMapFn } from "../util/ArrayUtil";
import { ModelCollection } from "../model/common/Collection";
import { unwrapOrElse } from "../util/Result";

type Props = {
  tenant: Tenant;
  onClose: () => void;
};

function TenantModal({ tenant, onClose }: Props) {
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
    <div className="modal-overlay" onClick={onClose}>
      <dialog className="modal" open onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{tenant.props.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <section className="modal-section">
          <h3 className="modal-section-title">Add member</h3>
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddUser();
            }}
          >
            <div className="form-field">
              <label className="form-label" htmlFor="member-name">Name</label>
              <input
                id="member-name"
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="member-email">Email</label>
              <input
                id="member-email"
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
              />
            </div>
            <div className="form-field form-field--small">
              <label className="form-label" htmlFor="member-role">Role</label>
              <select
                id="member-role"
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn btn--primary" type="submit">Add user</button>
          </form>
        </section>

        <section className="modal-section">
          <h3 className="modal-section-title">Members ({tenant.members.length})</h3>
          {tenant.members.length === 0 ? (
            <p className="empty-state">No members yet</p>
          ) : (
            <ul className="member-list">
              {tenant.members.map((member, index) => (
                <li className="member-item" key={index}>
                  <div className="member-info">
                    <span className="member-name">{member.user.name}</span>
                    <span className={`member-role member-role--${member.role}`}>
                      {member.role}
                    </span>
                  </div>
                  <button
                    className="btn btn--danger btn--small"
                    onClick={handleRemoveUser(member.user.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </dialog>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const tenantsCollection = useTenantStore((s) => s);
  const tenentActions = useTenantActions();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const selectedTenant = useTenant(selectedTenantId);

  const tenantGateway = new TenantHttpGateway(new FetchHttpClient());

  useEffect(() => {
    tenantGateway.getList().then((tenants) =>
      tenantsStore.setState(() => ({
        tenants: ModelCollection.from(tenants.unwrapOr([]), ModelToMapFn),
      })),
    );
  }, []);

  const showTenantDetails = (tenantId: string) => async () => {
    const tenant = await tenantGateway
      .getById(tenantId)
      .then(unwrapOrElse(alert));

    if (!tenant) return;

    tenentActions.updateTenant(tenant);

    setSelectedTenantId(tenant.props.id);
  };

  return (
    <div className="home">
      <h1>Home</h1>

      <div className="tenant-grid">
        {tenantsCollection.tenants.values().map((tenant) => {
          return (
            <div className="tenant-card" key={tenant.props.id}>
              <div className="tenant-card-body">
                <h3 className="tenant-card-name">{tenant.props.name}</h3>
                <p className="tenant-card-meta">
                  {tenant.props.memberCount ?? tenant.members.length} member{(tenant.props.memberCount ?? tenant.members.length) !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="tenant-card-actions">
                <button
                  className="btn btn--primary"
                  onClick={showTenantDetails(tenant.props.id)}
                >
                  View details
                </button>
                <button
                  className="btn"
                  onClick={() => navigate(`/tenants/${tenant.props.id}/projects`)}
                >
                  Projects
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTenant ? (
        <TenantModal
          tenant={selectedTenant}
          onClose={() => setSelectedTenantId(null)}
        />
      ) : null}
    </div>
  );
}
