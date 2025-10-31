// types.ts

export interface AssetDebt {
    id: string;
    name: string;
    value: number;
    yearlyContribution?: number;
}

export interface IncomeExpense {
    id: string;
    name: string;
    value: number;
    endsAtRetirement: boolean;
    endAge?: number | null;
}