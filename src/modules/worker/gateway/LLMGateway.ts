export default interface LLMGateway {
    sendPrompt(request: any): Promise<any>;
    
}
