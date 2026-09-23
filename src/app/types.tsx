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
    startsAtRetirement?: boolean;
    startAge?: number | null;
}

export interface YearlyProjectionRow {
    year: number;
    age: number;
    isRetired: boolean;
    startingBalance: number;
    income: number;
    contributions: number;
    growth: number;
    expenses: number;
    netCashFlow: number;
    endingBalance: number;
    endingBalanceReal: number;
}

export interface ScenarioResult {
    name: string;
    retirementAge: number;
    depletionAge: number | null; // null if stays funded through planning horizon
    endingNetWorth: number;
    endingNetWorthReal: number;
    peakNetWorth: number;
    peakAge: number;
    rows: YearlyProjectionRow[];
}

export interface RetirementMilestones {
    earliestRetirementAge: number | null;
    fireTarget: number;
    fireProgressPercent: number;
    targetDepletionAge: number | null;
    targetEndingNetWorth: number;
    targetEndingNetWorthReal: number;
    targetRetirementNetWorth: number;
    targetRetirementNetWorthReal: number;
    monthlyRetirementExpensesAtRetirement: number;
    monthlyRetirementExpensesToday: number;
    sustainableMonthlyWithdrawal: number;
    sustainableMonthlyWithdrawalReal: number;
    crossoverAge: number | null; // Age where investment returns exceed annual expenses
}