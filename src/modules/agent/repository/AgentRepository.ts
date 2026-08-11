import Agent from "../domain/entity/Agent.js";
import AgentCriteria from "./AgentCriteria.js";

export default interface AgentRepository {
    save(agent: Agent): Promise<void>;
    get(criteria: AgentCriteria): Promise<Agent | null>;
}