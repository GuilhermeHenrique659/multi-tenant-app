export default function parseLLMContent(content: string, subject: string): any {
    try {
        return JSON.parse(content);
    } catch {
        throw new Error(`llm returned an invalid json for the ${subject}`);
    }
}
