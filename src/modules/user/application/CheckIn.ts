export default class CheckIn {
    async execute(input: Input): Promise<Output> {
        
    }
}

type Input = {
    userId: string | undefined;
    name: string;
    email: string;
}

type Output = {
    userId: string;
}