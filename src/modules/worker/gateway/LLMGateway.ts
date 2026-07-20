export default interface LLLMGateway {
    sendRequest(request: any): Promise<any>;
}