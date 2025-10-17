"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

export default function Home() {
  // User profile
  const [currentAge, setCurrentAge] = useState('30');
  const [inflationRate, setInflationRate] = useState('3');

  // Assets
  const [assets, setAssets] = useState([]);
  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');

  // Debts
  const [debts, setDebts] = useState([]);
  const [debtName, setDebtName] = useState('');
  const [debtValue, setDebtValue] = useState('');

  // Monthly Income
  const [incomes, setIncomes] = useState([]);
  const [incomeName, setIncomeName] = useState('');
  const [incomeValue, setIncomeValue] = useState('');
  const [incomeEndAge, setIncomeEndAge] = useState('');
  const [incomeEndsAtRetirement, setIncomeEndsAtRetirement] = useState(false);

  // Monthly Expenses
  const [expenses, setExpenses] = useState([]);
  const [expenseName, setExpenseName] = useState('');
  const [expenseValue, setExpenseValue] = useState('');
  const [expenseEndAge, setExpenseEndAge] = useState('');
  const [expenseEndsAtRetirement, setExpenseEndsAtRetirement] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [currentAge, inflationRate, assets, debts, incomes, expenses, isLoading]);

  const loadData = () => {
    try {
      const savedData = localStorage.getItem('retirementData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setCurrentAge(data.currentAge || '30');
        setInflationRate(data.inflationRate || '3');
        setAssets(data.assets || []);
        setDebts(data.debts || []);
        setIncomes(data.incomes || []);
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = () => {
    try {
      const data = {
        currentAge,
        inflationRate,
        assets,
        debts,
        incomes,
        expenses
      };
      localStorage.setItem('retirementData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Add functions
  const addAsset = () => {
    if (!assetName || !assetValue) {
      alert('Please fill in all fields');
      return;
    }
    setAssets([...assets, { id: Date.now().toString(), name: assetName, value: parseFloat(assetValue) }]);
    setAssetName('');
    setAssetValue('');
  };

  const addDebt = () => {
    if (!debtName || !debtValue) {
      alert('Please fill in all fields');
      return;
    }
    setDebts([...debts, { id: Date.now().toString(), name: debtName, value: parseFloat(debtValue) }]);
    setDebtName('');
    setDebtValue('');
  };

  const addIncome = () => {
    if (!incomeName || !incomeValue) {
      alert('Please fill in all fields');
      return;
    }
    const newIncome = {
      id: Date.now().toString(),
      name: incomeName,
      value: parseFloat(incomeValue),
      endAge: incomeEndAge ? parseInt(incomeEndAge) : null,
      endsAtRetirement: incomeEndsAtRetirement
    };
    setIncomes([...incomes, newIncome]);
    setIncomeName('');
    setIncomeValue('');
    setIncomeEndAge('');
    setIncomeEndsAtRetirement(false);
  };

  const addExpense = () => {
    if (!expenseName || !expenseValue) {
      alert('Please fill in all fields');
      return;
    }
    const newExpense = {
      id: Date.now().toString(),
      name: expenseName,
      value: parseFloat(expenseValue),
      endAge: expenseEndAge ? parseInt(expenseEndAge) : null,
      endsAtRetirement: expenseEndsAtRetirement
    };
    setExpenses([...expenses, newExpense]);
    setExpenseName('');
    setExpenseValue('');
    setExpenseEndAge('');
    setExpenseEndsAtRetirement(false);
  };

  // Delete functions
  const deleteAsset = (id) => setAssets(assets.filter(a => a.id !== id));
  const deleteDebt = (id) => setDebts(debts.filter(d => d.id !== id));
  const deleteIncome = (id) => setIncomes(incomes.filter(i => i.id !== id));
  const deleteExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));

  // Calculate totals
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.value, 0);
  const totalMonthlyIncome = incomes.reduce((sum, i) => sum + i.value, 0);
  const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
  const netWorth = totalAssets - totalDebts;
  const monthlySavings = totalMonthlyIncome - totalMonthlyExpenses;

  // Calculate active income/expenses at a given age
  const getActiveIncomeAtAge = (age, retirementAge = null) => {
    return incomes.reduce((sum, income) => {
      if (income.endsAtRetirement && retirementAge && age >= retirementAge) return sum;
      if (income.endAge && age >= income.endAge) return sum;
      return sum + income.value;
    }, 0);
  };

  const getActiveExpensesAtAge = (age, retirementAge = null) => {
    return expenses.reduce((sum, expense) => {
      if (expense.endsAtRetirement && retirementAge && age >= retirementAge) return sum;
      if (expense.endAge && age >= expense.endAge) return sum;
      return sum + expense.value;
    }, 0);
  };

  // Calculate retirement projection
  const retirementData = useMemo(() => {
    const age = parseInt(currentAge) || 30;
    const inflation = (parseFloat(inflationRate) || 3) / 100;

    let currentNetWorth = netWorth;
    let projectedAge = age;
    const maxAge = 100;
    const dataPoints = [];
    let retirementAge = null;

    for (let year = 0; projectedAge <= maxAge; year++, projectedAge++) {
      const inflationMultiplier = Math.pow(1 + inflation, year);

      const activeIncome = getActiveIncomeAtAge(projectedAge, retirementAge);
      const activeExpenses = getActiveExpensesAtAge(projectedAge, retirementAge);
      const adjustedIncome = activeIncome * inflationMultiplier;
      const adjustedExpenses = activeExpenses * inflationMultiplier;
      const adjustedMonthlySavings = adjustedIncome - adjustedExpenses;

      currentNetWorth += adjustedMonthlySavings * 12;

      if (year % 5 === 0 || projectedAge <= age + 10) {
        dataPoints.push({
          age: projectedAge,
          netWorth: Math.round(currentNetWorth),
          canRetire: false
        });
      }

      const retirementExpenses = getActiveExpensesAtAge(projectedAge, projectedAge);
      const adjustedRetirementExpenses = retirementExpenses * inflationMultiplier;
      const requiredNetWorth = adjustedRetirementExpenses * 12 * 25;

      if (currentNetWorth >= requiredNetWorth && year > 0 && retirementAge === null) {
        retirementAge = projectedAge;
        if (dataPoints.length > 0) {
          dataPoints[dataPoints.length - 1].canRetire = true;
        }
      }
    }

    const currentRetirementExpenses = getActiveExpensesAtAge(age, age);
    const currentRequiredNetWorth = currentRetirementExpenses * 12 * 25;

    return {
      canRetire: retirementAge !== null,
      retirementAge,
      requiredNetWorth: currentRequiredNetWorth,
      dataPoints
    };
  }, [currentAge, inflationRate, netWorth, incomes, expenses, assets, debts]);

  return (
    <div className="app">
      <header className="header">
        <h1>When Can I Retire?</h1>
      </header>

      <nav className="tab-container">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>
          Assets
        </button>
        <button className={`tab ${activeTab === 'debts' ? 'active' : ''}`} onClick={() => setActiveTab('debts')}>
          Debts
        </button>
        <button className={`tab ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}>
          Income
        </button>
        <button className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
          Expenses
        </button>
      </nav>

      <main className="content">
        {activeTab === 'overview' && (
          <div>
            <section className="section">
              <h2>Your Information</h2>
              <div className="input-row">
                <label>Current Age:</label>
                <input
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="input-row">
                <label>Inflation Rate (%):</label>
                <input
                  type="number"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(e.target.value)}
                  placeholder="3"
                  step="0.1"
                />
              </div>
            </section>

            <section className="section">
              <h2>Financial Summary</h2>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-label">Total Assets</div>
                  <div className="summary-value positive">${totalAssets.toLocaleString()}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Total Debts</div>
                  <div className="summary-value negative">${totalDebts.toLocaleString()}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Net Worth</div>
                  <div className={`summary-value ${netWorth >= 0 ? 'positive' : 'negative'}`}>
                    ${netWorth.toLocaleString()}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Monthly Income</div>
                  <div className="summary-value positive">${totalMonthlyIncome.toLocaleString()}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Monthly Expenses</div>
                  <div className="summary-value negative">${totalMonthlyExpenses.toLocaleString()}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Monthly Savings</div>
                  <div className={`summary-value ${monthlySavings >= 0 ? 'positive' : 'negative'}`}>
                    ${monthlySavings.toLocaleString()}
                  </div>
                </div>
              </div>
            </section>

            <section className="section">
              <h2>Retirement Projection</h2>
              {retirementData.canRetire ? (
                <div className="retirement-result success">
                  <div className="retirement-title">🎉 You can retire at age:</div>
                  <div className="retirement-age">{retirementData.retirementAge}</div>
                  <div className="retirement-subtext">
                    Required net worth: ${retirementData.requiredNetWorth.toLocaleString()}
                  </div>
                  <div className="retirement-subtext">
                    Monthly retirement expenses: ${getActiveExpensesAtAge(parseInt(currentAge), parseInt(currentAge)).toLocaleString()}
                  </div>
                  <div className="retirement-subtext">
                    (Based on 4% withdrawal rule with {inflationRate}% inflation)
                  </div>
                </div>
              ) : (
                <div className="retirement-result warning">
                  <div className="retirement-title">⚠️ Unable to retire by age 100</div>
                  <div className="retirement-subtext">
                    With current savings rate, you may not reach retirement goals.
                  </div>
                  <div className="retirement-subtext">
                    Consider increasing income or reducing expenses.
                  </div>
                </div>
              )}
            </section>

            {retirementData.dataPoints.length > 0 && (
              <section className="section">
                <h2>Net Worth Projection</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={retirementData.dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                    <YAxis
                      label={{ value: 'Net Worth ($)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                        return `$${value}`;
                      }}
                    />
                    <Tooltip
                      formatter={(value) => `$${value.toLocaleString()}`}
                      labelFormatter={(label) => `Age: ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="netWorth" stroke="#4CAF50" strokeWidth={2} name="Net Worth" />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <section className="section">
            <h2>Assets (Total: ${totalAssets.toLocaleString()})</h2>
            <div className="form">
              <input
                type="text"
                placeholder="Asset name (e.g., Savings Account)"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Value"
                value={assetValue}
                onChange={(e) => setAssetValue(e.target.value)}
              />
              <button className="add-button" onClick={addAsset}>Add Asset</button>
            </div>
            <div className="list">
              {assets.length === 0 ? (
                <div className="empty-text">No assets added yet</div>
              ) : (
                assets.map((asset) => (
                  <div key={asset.id} className="list-item">
                    <div className="list-item-info">
                      <div className="list-item-name">{asset.name}</div>
                      <div className="list-item-value positive">${asset.value.toLocaleString()}</div>
                    </div>
                    <button className="delete-button" onClick={() => deleteAsset(asset.id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'debts' && (
          <section className="section">
            <h2>Debts (Total: ${totalDebts.toLocaleString()})</h2>
            <div className="form">
              <input
                type="text"
                placeholder="Debt name (e.g., Mortgage)"
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Amount"
                value={debtValue}
                onChange={(e) => setDebtValue(e.target.value)}
              />
              <button className="add-button" onClick={addDebt}>Add Debt</button>
            </div>
            <div className="list">
              {debts.length === 0 ? (
                <div className="empty-text">No debts added yet</div>
              ) : (
                debts.map((debt) => (
                  <div key={debt.id} className="list-item">
                    <div className="list-item-info">
                      <div className="list-item-name">{debt.name}</div>
                      <div className="list-item-value negative">${debt.value.toLocaleString()}</div>
                    </div>
                    <button className="delete-button" onClick={() => deleteDebt(debt.id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'income' && (
          <section className="section">
            <h2>Monthly Income (Total: ${totalMonthlyIncome.toLocaleString()}/mo)</h2>
            <div className="form">
              <input
                type="text"
                placeholder="Income source (e.g., Salary)"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Monthly amount"
                value={incomeValue}
                onChange={(e) => setIncomeValue(e.target.value)}
              />
              <div className="switch-row">
                <label>
                  <input
                    type="checkbox"
                    checked={incomeEndsAtRetirement}
                    onChange={(e) => setIncomeEndsAtRetirement(e.target.checked)}
                  />
                  Ends at retirement
                </label>
              </div>
              {!incomeEndsAtRetirement && (
                <input
                  type="number"
                  placeholder="End age (optional)"
                  value={incomeEndAge}
                  onChange={(e) => setIncomeEndAge(e.target.value)}
                />
              )}
              <button className="add-button" onClick={addIncome}>Add Income</button>
            </div>
            <div className="list">
              {incomes.length === 0 ? (
                <div className="empty-text">No income sources added yet</div>
              ) : (
                incomes.map((income) => (
                  <div key={income.id} className="list-item">
                    <div className="list-item-info">
                      <div className="list-item-name">{income.name}</div>
                      <div className="list-item-value positive">${income.value.toLocaleString()}/mo</div>
                      {income.endsAtRetirement && (
                        <div className="list-item-detail">Ends at retirement</div>
                      )}
                      {income.endAge && !income.endsAtRetirement && (
                        <div className="list-item-detail">Ends at age {income.endAge}</div>
                      )}
                    </div>
                    <button className="delete-button" onClick={() => deleteIncome(income.id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'expenses' && (
          <section className="section">
            <h2>Monthly Expenses (Total: ${totalMonthlyExpenses.toLocaleString()}/mo)</h2>
            <div className="form">
              <input
                type="text"
                placeholder="Expense name (e.g., Rent)"
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
              {!expenseEndsAtRetirement && (
                <input
                  type="number"
                  placeholder="End age (optional)"
                  value={expenseEndAge}
                  onChange={(e) => setExpenseEndAge(e.target.value)}
                />
              )}
              <button className="add-button" onClick={addExpense}>Add Expense</button>
            </div>
            <div className="list">
              {expenses.length === 0 ? (
                <div className="empty-text">No expenses added yet</div>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="list-item">
                    <div className="list-item-info">
                      <div className="list-item-name">{expense.name}</div>
                      <div className="list-item-value negative">${expense.value.toLocaleString()}/mo</div>
                      {expense.endsAtRetirement && (
                        <div className="list-item-detail">Ends at retirement</div>
                      )}
                      {expense.endAge && !expense.endsAtRetirement && (
                        <div className="list-item-detail">Ends at age {expense.endAge}</div>
                      )}
                    </div>
                    <button className="delete-button" onClick={() => deleteExpense(expense.id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
