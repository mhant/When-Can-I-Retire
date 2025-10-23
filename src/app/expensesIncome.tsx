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
    // Handler for text inputs, using the correct React event type for TypeScript
    const handleTextChange = (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
        setter(e.target.value);
    };

    // Handler for the checkbox
    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        setExpenseEndsAtRetirement(e.target.checked);
    };

    return (
        <section className="section">
            <h2>Monthly {isExpense ? "Expenses" : "Income"} (Total: ${totalMonthlyExpenses.toLocaleString()}/mo)</h2>
            <div className="form">
                <input
                    type="text"
                    placeholder={(isExpense ? "Expense" : "Source of Income") + " name (e.g., Rent)"}
                    value={expenseName}
                    onChange={(e) => handleTextChange(e, setExpenseName)}
                />
                <input
                    type="number"
                    placeholder="Monthly amount"
                    value={expenseValue}
                    onChange={(e) => handleTextChange(e, setExpenseValue)}
                />
                <div className="switch-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={expenseEndsAtRetirement}
                            onChange={handleCheckboxChange}
                        />
                        Ends at retirement
                    </label>
                </div>
                <button className="add-button" onClick={() => addExpense(expenseName, expenseValue, expenseEndsAtRetirement)}>Add Expense</button>
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