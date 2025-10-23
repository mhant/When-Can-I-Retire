// components/MonthlyExpenses.tsx

import React from 'react';
import { ChangeEvent } from 'react';
import { IncomeExpense } from './types';

// Define the shape of all the props this component expects to receive
interface MonthlyExpensesProps {
    // Variables
    totalMonthlyExpenses: number;
    expenses: IncomeExpense[];
    isExpense: boolean;

    // Action functions
    addExpense: (expenseName: string, expenseValue: string, endsAtRetirement: boolean) => void;
    deleteExpense: (id: string) => void;
}

// Use a simple functional component that receives the props
export default function MonthlyExpensesIncome({
    totalMonthlyExpenses,
    expenses,
    isExpense,
    addExpense,
    deleteExpense,
}: MonthlyExpensesProps) {
    const [expenseName, setExpenseName] = React.useState("");
    const [expenseValue, setExpenseValue] = React.useState("");
    const [expenseEndsAtRetirement, setExpenseEndsAtRetirement] = React.useState(false);
    return (
        <section className="section">
            <h2>Monthly {isExpense ? "Expenses" : "Income"} (Total: ${totalMonthlyExpenses.toLocaleString()}/mo)</h2>
            <div className="form">
                <input
                    type="text"
                    placeholder={isExpense ? "Expense name (e.g., Rent)" : "Source of Income (e.g., Salary)"}
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Monthly amount"
                    value={expenseValue}
                    onChange={(e) => setExpenseValue(e.target.value)}
                />
                <div className="switch-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={expenseEndsAtRetirement}
                            onChange={(e) => setExpenseEndsAtRetirement(e.target.checked)}
                        />
                        Ends at retirement
                    </label>
                </div>
                <button className="add-button"
                    onClick={() => addExpense(expenseName, expenseValue, expenseEndsAtRetirement)}>Add {isExpense ? "Expense" : "Income"}</button>
            </div>
            <div className="list">
                {expenses.length === 0 ? (
                    <div className="empty-text">No {isExpense ? "expenses" : "income"} added yet</div>
                ) : (
                    expenses.map((expense) => (
                        <div key={expense.id} className="list-item">
                            <div className="list-item-info">
                                <div className="list-item-name">{expense.name}</div>
                                <div className={"list-item-value " + (isExpense ? "negative" : "positive")}>${expense.value.toLocaleString()}/mo</div>
                                {expense.endsAtRetirement && (
                                    <div className="list-item-detail">Ends at retirement</div>
                                )}
                            </div>
                            <button className="delete-button" onClick={() => deleteExpense(expense.id)}>×</button>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}