// components/MonthlyExpenses.tsx

import React from 'react';
import { IncomeExpense } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdjust, faPen } from '@fortawesome/free-solid-svg-icons';

// Define the shape of all the props this component expects to receive
interface MonthlyExpensesProps {
    // Variables
    totalMonthlyExpenses: number;
    expenses: IncomeExpense[];
    isExpense: boolean;

    // Action functions
    saveExpense: (expenseName: string, expenseValue: string, endsAtRetirement: boolean, endAge?: number, id?: string) => void;
    deleteExpense: (id: string) => void;
}

// Use a simple functional component that receives the props
export default function MonthlyExpensesIncome({
    totalMonthlyExpenses,
    expenses,
    isExpense,
    saveExpense,
    deleteExpense,
}: MonthlyExpensesProps) {
    const editExpense = (id: string) => {
        setExpenseName(expenses.find(e => e.id === id)?.name || "");
        setExpenseValue(expenses.find(e => e.id === id)?.value.toString() || "");
        setExpenseEndsAtRetirement(expenses.find(e => e.id === id)?.endsAtRetirement || false);
        setExpenseEndAge(expenses.find(e => e.id === id)?.endAge || null);
        setEditingExpenseId(id);
        setInEditMode(true);
    }
    const addEditExpense = (expenseName: string, expenseValue: string, endsAtRetirement: boolean, endAge?: number) => {
        saveExpense(expenseName, expenseValue, endsAtRetirement, endAge, editingExpenseId ?? undefined);
        if (inEditMode) {
            setInEditMode(false);
            setEditingExpenseId(null);
        }
    }

    const [expenseName, setExpenseName] = React.useState("");
    const [inEditMode, setInEditMode] = React.useState(false);
    const [expenseValue, setExpenseValue] = React.useState("");
    const [expenseEndsAtRetirement, setExpenseEndsAtRetirement] = React.useState(false);
    const [expenseEndAge, setExpenseEndAge] = React.useState<number | null>(null);
    const [editingExpenseId, setEditingExpenseId] = React.useState<string | null>(null);
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
                            disabled={expenseEndAge !== null}
                            checked={expenseEndsAtRetirement}
                            onChange={(e) => setExpenseEndsAtRetirement(e.target.checked)}
                        />
                        Ends at retirement
                    </label>
                </div>
                <div className="switch-row">
                    <label>
                        Ends at age:
                        <input
                            type="number"
                            value={expenseEndAge !== null ? expenseEndAge : ''}
                            placeholder="e.g., 65"
                            disabled={expenseEndsAtRetirement}
                            min="0"
                            style={{ marginLeft: '8px', width: '80px', minWidth: '110px' }}
                            onChange={(e) => setExpenseEndAge(e.target.value ? parseInt(e.target.value) : null)}
                        />
                    </label>
                </div>
                <div className="switch-row">
                    <button className="add-button"
                        onClick={() =>
                            addEditExpense(expenseName, expenseValue, expenseEndsAtRetirement, expenseEndAge ?? undefined)}>
                        {inEditMode ? "Update" : "Add"} {isExpense ? "Expense" : "Income"}
                    </button>
                    {inEditMode && (
                        <button className="cancel-button"
                            onClick={() => {
                                setInEditMode(false);
                                setEditingExpenseId(null);
                                setExpenseName("");
                                setExpenseValue("");
                                setExpenseEndsAtRetirement(false);
                                setExpenseEndAge(null);
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
            <div className="list">
                {expenses.length === 0 ? (
                    <div className="empty-text">No {isExpense ? "expenses" : "income"} added yet</div>
                ) : (
                    expenses.map((expense) => (
                        <div key={expense.id} className={expense.id == editingExpenseId ? "list-item editing" : "list-item"}>
                            <div className="list-item-info">
                                <div className="list-item-name">{expense.name}</div>
                                <div className={"list-item-value " + (isExpense ? "negative" : "positive")}>${expense.value.toLocaleString()}/mo</div>
                                {expense.endsAtRetirement && (
                                    <div className="list-item-detail">Ends at retirement</div>
                                )}
                                {expense.endAge != null && (
                                    <div className="list-item-detail">Ends at age {expense.endAge?.toString()} .</div>
                                )}
                            </div>
                            <button className="edit-button" onClick={() => editExpense(expense.id)}> <FontAwesomeIcon icon={faPen} /></button>
                            <button className="delete-button" onClick={() => deleteExpense(expense.id)}>×</button>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}