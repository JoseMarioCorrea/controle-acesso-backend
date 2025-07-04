export interface IdfaceUserInput {
    nome: string;
    registration?: string | null;
    prefix?: string;
}
export declare function sanitizeIdfaceUserInput(input: IdfaceUserInput): {
    name: string;
    registration: string;
};
