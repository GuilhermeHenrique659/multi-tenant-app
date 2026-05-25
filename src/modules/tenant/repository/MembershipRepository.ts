import { BaseCriteria } from "../../@common/Criteria.js";
import Membership from "../domain/Membership.js";

export default interface MembershipRepository {
    save(membership: Membership): Promise<void>;
    has(membership: BaseCriteria): Promise<boolean>;
    get(membership: BaseCriteria): Promise<Membership | null>;
}