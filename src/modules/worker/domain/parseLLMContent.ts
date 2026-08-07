import { Err, Ok, TupleResult } from "../../@common/TupleResult.js";

export default function parseLLMContent(content: string, subject: string): TupleResult<any> {
    try {
        return Ok(JSON.parse(content));
    } catch {
        return Err(`llm returned an invalid json for the ${subject}`);
    }
}
