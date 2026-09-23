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
    saveExpense: (
        expenseName: string,
        expenseValue: string,
        endsAtRetirement: boolean,
        endAge?: number,
        id?: string,
        startAge?: number,
        startsAtRetirement?: boolean
    ) => void;
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
        const item = expenses.find(e => e.id === id);
        setExpenseName(item?.name || "");
        setExpenseValue(item?.value.toString() || "");
        setExpenseEndsAtRetirement(item?.endsAtRetirement || false);
        setExpenseEndAge(item?.endAge ?? null);
        setExpenseStartsAtRetirement(item?.startsAtRetirement || false);
        setExpenseStartAge(item?.startAge ?? null);
        setEditingExpenseId(id);
        setInEditMode(true);
    };

    const addEditExpense = (
        name: string,
        value: string,
        endsAtRetirement: boolean,
        endAge?: number,
        startAge?: number,
        startsAtRetirement?: boolean
    ) => {
        saveExpense(
            name,
            value,
            endsAtRetirement,
            endAge,
            editingExpenseId ?? undefined,
            startAge,
            startsAtRetirement
        );
        if (inEditMode) {
            setInEditMode(false);
            setEditingExpenseId(null);
            resetForm();
        }
    };

    const resetForm = () => {
        setExpenseName("");
        setExpenseValue("");
        setExpenseEndsAtRetirement(false);
        setExpenseEndAge(null);
        setExpenseStartsAtRetirement(false);
        setExpenseStartAge(null);
    };

    const [expenseName, setExpenseName] = React.useState("");
    const [inEditMode, setInEditMode] = React.useState(false);
    const [expenseValue, setExpenseValue] = React.useState("");
    const [expenseEndsAtRetirement, setExpenseEndsAtRetirement] = React.useState(false);
    const [expenseEndAge, setExpenseEndAge] = React.useState<number | null>(null);
    const [expenseStartsAtRetirement, setExpenseStartsAtRetirement] = React.useState(false);
    const [expenseStartAge, setExpenseStartAge] = React.useState<number | null>(null);
    const [editingExpenseId, setEditingExpenseId] = React.useState<string | null>(null);

    return (
        <section className="section">
            <h2>Monthly {isExpense ? "Expenses" : "Income"} (Total: ${totalMonthlyExpenses.toLocaleString()}/mo)</h2>
            <div className="form">
                <input
                    type="text"
                    placeholder={isExpense ? "Expense name (e.g., Rent, Health Insurance)" : "Source of Income (e.g., Salary, Social Security, Pension)"}
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Monthly amount ($)"
                    value={expenseValue}
                    onChange={(e) => setExpenseValue(e.target.value)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', padding: '8px', backgroundColor: '#f9f9fb', borderRadius: '6px' }}>
                    <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Start Conditions:</span>
                        <div className="switch-row">
                            <label>
                                <input
                                    type="checkbox"
                                    disabled={expenseStartAge !== null}
                                    checked={expenseStartsAtRetirement}
                                    onChange={(e) => {
                                        setExpenseStartsAtRetirement(e.target.checked);
                                        if (e.target.checked) setExpenseEndsAtRetirement(false);
                                    }}
                                />
                                Starts at retirement
                            </label>
                        </div>
                        <div className="switch-row">
                            <label>
                                Starts at age:
                                <input
                                    type="number"
                                    value={expenseStartAge !== null ? expenseStartAge : ''}
                                    placeholder="e.g., 67"
                                    disabled={expenseStartsAtRetirement}
                                    min="0"
                                    style={{ marginLeft: '8px', width: '80px', minWidth: '80px' }}
                                    onChange={(e) => setExpenseStartAge(e.target.value ? parseInt(e.target.value) : null)}
                                />
                            </label>
                        </div>
                    </div>

                    <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>End Conditions:</span>
                        <div className="switch-row">
                            <label>
                                <input
                                    type="checkbox"
                                    disabled={expenseEndAge !== null || expenseStartsAtRetirement}
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
                                    style={{ marginLeft: '8px', width: '80px', minWidth: '80px' }}
                                    onChange={(e) => setExpenseEndAge(e.target.value ? parseInt(e.target.value) : null)}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="switch-row">
                    <button className="add-button"
                        onClick={() =>
                            addEditExpense(
                                expenseName,
                                expenseValue,
                                expenseEndsAtRetirement,
                                expenseEndAge ?? undefined,
                                expenseStartAge ?? undefined,
                                expenseStartsAtRetirement
                            )}>
                        {inEditMode ? "Update" : "Add"} {isExpense ? "Expense" : "Income"}
                    </button>
                    {inEditMode && (
                        <button className="cancel-button"
                            onClick={() => {
                                setInEditMode(false);
                                setEditingExpenseId(null);
                                resetForm();
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
                                {expense.startsAtRetirement && (
                                    <div className="list-item-detail">Starts at retirement</div>
                                )}
                                {expense.startAge != null && (
                                    <div className="list-item-detail">Starts at age {expense.startAge}</div>
                                )}
                                {expense.endsAtRetirement && (
                                    <div className="list-item-detail">Ends at retirement</div>
                                )}
                                {expense.endAge != null && (
                                    <div className="list-item-detail">Ends at age {expense.endAge}</div>
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