"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileImport, faMagnifyingGlass, faSave } from '@fortawesome/free-solid-svg-icons';

interface AssetDebt {
  id: string;
  name: string;
  value: number;
}

interface IncomeExpense {
  id: string;
  name: string;
  value: number;
  endAge?: number | null;
  endsAtRetirement: boolean;
}

export default function Home() {
  const fileInputRef = useRef(null);

  const triggerFileInput = () => {
    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
  };

  const setDataFromSave = (savedData: string) => {
    const data = JSON.parse(savedData);
    setCurrentAge(data.currentAge || '30');
    setInflationRate(data.inflationRate || '3');
    setAssets(data.assets || []);
    setDebts(data.debts || []);
    setIncomes(data.incomes || []);
    setExpenses(data.expenses || []);
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          setDataFromSave(e?.target?.result?.toString() ?? "");
        } catch (error) {
          alert('Error: Could not parse the JSON file.');
        }
      };

      reader.readAsText(file);
    }

    // Reset the input value so the same file can be imported again
    event.target.value = null;
  };
  // User profile
  const [currentAge, setCurrentAge] = useState('30');
  const [inflationRate, setInflationRate] = useState('3');

  // Assets
  const [assets, setAssets] = useState<AssetDebt[]>([]);
  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');

  // Debts
  const [debts, setDebts] = useState<AssetDebt[]>([]);
  const [debtName, setDebtName] = useState('');
  const [debtValue, setDebtValue] = useState('');

  // Monthly Income
  const [incomes, setIncomes] = useState<IncomeExpense[]>([]);
  const [incomeName, setIncomeName] = useState('');
  const [incomeValue, setIncomeValue] = useState('');
  const [incomeEndAge, setIncomeEndAge] = useState('');
  const [incomeEndsAtRetirement, setIncomeEndsAtRetirement] = useState(false);

  // Monthly Expenses
  const [expenses, setExpenses] = useState<IncomeExpense[]>([]);
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
        setDataFromSave(savedData);
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
  const deleteAsset = (id: string) => setAssets(assets.filter(a => a.id !== id));
  const deleteDebt = (id: string) => setDebts(debts.filter(d => d.id !== id));
  const deleteIncome = (id: string) => setIncomes(incomes.filter(i => i.id !== id));
  const deleteExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  // Calculate totals
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.value, 0);
  const totalMonthlyIncome = incomes.reduce((sum, i) => sum + i.value, 0);
  const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
  const netWorth = totalAssets - totalDebts;
  const monthlySavings = totalMonthlyIncome - totalMonthlyExpenses;

  // Calculate active income/expenses at a given age
  const getActiveIncomeAtAge = (age: number, retirementAge: number | null = null) => {
    return incomes.reduce((sum, income) => {
      if (income.endsAtRetirement && retirementAge && age >= retirementAge) return sum;
      if (income.endAge && age >= income.endAge) return sum;
      return sum + income.value;
    }, 0);
  };

  const getActiveExpensesAtAge = (age: number, retirementAge: number | null = null) => {
    return expenses.reduce((sum, expense) => {
      if (expense.endsAtRetirement && retirementAge && age >= retirementAge) return sum;
      if (expense.endAge && age >= expense.endAge) return sum;
      return sum + expense.value;
    }, 0);
  };

  const getCostWithInflation = (baseCost: number, inflationRate: number, years: number) => {
    return baseCost * years /** * (1 + inflationRate)**/;
  };
  // Calculate retirement projection
  const retirementData = useMemo(() => {
    const age = parseInt(currentAge) || 30;
    const inflation = (parseFloat(inflationRate) || 3) / 100;

    let currentNetWorth = netWorth;
    let projectedAge = age;
    const maxAge = 110;
    const dataPoints = [];
    const costWithInflation = getCostWithInflation(((totalMonthlyExpenses) * 12), inflation, (maxAge - age));
    let retirementAge = (
      (
        costWithInflation -
        (currentNetWorth - totalDebts)
      )
      /
      ((totalMonthlyIncome) * 12)
    ) + age;
    for (let year = 0; projectedAge <= maxAge; year++, projectedAge++) {
      const activeIncome = getActiveIncomeAtAge(projectedAge, retirementAge);
      const activeExpenses = getActiveExpensesAtAge(projectedAge, retirementAge);
      const adjustedMonthlySavings = activeIncome - activeExpenses;

      currentNetWorth += adjustedMonthlySavings * 12;
      dataPoints.push({
        age: projectedAge,
        netWorth: Math.round(currentNetWorth),
        canRetire: false
      });
    }

    return {
      canRetire: retirementAge !== null,
      retirementAge,
      dataPoints
    };
  }, [currentAge, inflationRate, netWorth, incomes, expenses, assets, debts]);

  return (
    <div className="app">
      <header className="header">
        <h1>Retirement Simulator</h1>
      </header>
      <div className="button-container">
        <button className="export-button" onClick={() => {
          const dataStr = JSON.stringify({
            currentAge,
            inflationRate,
            assets,
            debts,
            incomes,
            expenses
          }, null, 2);
          const blob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "retirement_data.json";
          a.click();
          URL.revokeObjectURL(url);
        }}><FontAwesomeIcon icon={faSave} /> Export Data</button>
        <button className="export-button" onClick={triggerFileInput}>
          <FontAwesomeIcon icon={faFileImport} /> Import Data</button>
      </div>
      {/* Hidden file input element */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />
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
              {/* <div className="input-row">
                <label>Inflation Rate (%):</label>
                <input
                  type="number"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(e.target.value)}
                  placeholder="3"
                  step="0.1"
                />
              </div> */}
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
              {retirementData && retirementData.canRetire && retirementData?.retirementAge ? (
                <div className="retirement-result success">
                  <div className="retirement-title">🎉 You can retire at age:</div>
                  <div className="retirement-age">{retirementData?.retirementAge}</div>
                  <div className="retirement-subtext">
                    Monthly retirement expenses: ${getActiveExpensesAtAge(parseInt(currentAge), parseInt(currentAge ?? "0")).toLocaleString()}
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
