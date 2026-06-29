import { useEffect, useState } from "react";
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
    <dialog open>
      <h1>{tenant.props.name}</h1>

      <h2>Add member</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddUser();
        }}
      >
        <div>
          <label>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Role:
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <button type="submit">Add user</button>
      </form>

      <p>Lista de membros</p>
      {tenant.members.map((member, index) => (
        <div key={index}>
          <p>{member.user.name}</p>
          <p>{member.role}</p>
          <button onClick={handleRemoveUser(member.user.id)}>
            Remover user
          </button>
        </div>
      ))}

      <button onClick={onClose}>Close</button>
    </dialog>
  );
}

export default function Home() {
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
    <div>
      <h1>Home</h1>

      <p>Lista</p>
      {tenantsCollection.tenants.values().map((tenant) => {
        return (
          <div key={tenant.props.id}>
            <p>{tenant.props.name}</p>
            <button onClick={showTenantDetails(tenant.props.id)}>
              View details
            </button>
          </div>
        );
      })}

      {selectedTenant ? (
        <TenantModal
          tenant={selectedTenant}
          onClose={() => setSelectedTenantId(null)}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
