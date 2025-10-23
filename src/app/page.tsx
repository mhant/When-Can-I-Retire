"use client";
import React, { useState, useMemo, useEffect, useRef, ChangeEvent } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileImport, faMagnifyingGlass, faSave } from '@fortawesome/free-solid-svg-icons';
import { AssetDebt, IncomeExpense } from './types';
import MonthlyExpensesIncome from './expensesIncome';
import AssetsDebts from './assetsDebts';

interface RetirementDataPoint {
  age: number;
  netWorth0: number;
  netWorth5: number;
  netWorth10: number;
  netWorth15: number;
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files ? event?.target?.files[0] : null;
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
    event.target.value = "";
  };
  // User profile
  const [currentAge, setCurrentAge] = useState('30');
  const [inflationRate, setInflationRate] = useState('3');

  // Assets
  const [assets, setAssets] = useState<AssetDebt[]>([]);

  // Debts
  const [debts, setDebts] = useState<AssetDebt[]>([]);

  // Monthly Income
  const [incomes, setIncomes] = useState<IncomeExpense[]>([]);

  // Monthly Expenses
  const [expenses, setExpenses] = useState<IncomeExpense[]>([]);

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  const [maxAge, setMaxAge] = useState(110);

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
  const addAsset = (assetName: string, assetValue: string) => {
    if (!assetName || !assetValue) {
      alert('Please fill in all fields');
      return;
    }
    setAssets([...assets, { id: Date.now().toString(), name: assetName, value: parseFloat(assetValue) }]);
  };

  const addDebt = (debtName: string, debtValue: string) => {
    if (!debtName || !debtValue) {
      alert('Please fill in all fields');
      return;
    }
    setDebts([...debts, { id: Date.now().toString(), name: debtName, value: parseFloat(debtValue) }]);
  };

  const addIncome = (incomeName: string, incomeValue: string, incomeEndsAtRetirement: boolean) => {
    if (!incomeName || !incomeValue) {
      alert('Please fill in all fields');
      return;
    }
    const newIncome = {
      id: Date.now().toString(),
      name: incomeName,
      value: parseFloat(incomeValue),
      endsAtRetirement: incomeEndsAtRetirement
    };
    setIncomes([...incomes, newIncome]);
  };

  const addExpense = (expenseName: string, expenseValue: string, endsAtRetirement: boolean) => {
    if (!expenseName || !expenseValue) {
      alert('Please fill in all fields');
      return;
    }
    const newExpense = {
      id: Date.now().toString(),
      name: expenseName,
      value: parseFloat(expenseValue),
      endsAtRetirement: endsAtRetirement
    };
    setExpenses([...expenses, newExpense]);
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
  const getActiveIncomeAtAge = (age: number, retirementAge: number | null = null, incomes: IncomeExpense[]) => {
    return incomes.reduce((sum, income) => {
      if (income.endsAtRetirement && retirementAge && age > retirementAge) return sum;
      return sum + income.value;
    }, 0);
  };

  const getActiveExpensesAtAge = (age: number, years: number, retirementAge: number | null = null, inflation: number | null, expenses: IncomeExpense[]) => {
    return expenses.reduce((sum, expense) => {
      const inflationEst = (inflation ? Math.pow(inflation + 1, years) : 1)
      if (expense.endsAtRetirement && retirementAge && age > retirementAge) return sum * inflationEst;
      return (sum + expense.value) * inflationEst;
    }, 0);
  };

  // Calculate retirement projection
  const retirementData = (currentAge: string, inflationRate: string, netWorth: number, totalMonthlyExpenses: number, totalDebts: number, incomes: IncomeExpense[], expenses: IncomeExpense[], maxAge: number) => {
    const age = parseInt(currentAge) || 30;
    const inflation = (parseFloat(inflationRate) || 3) / 100;
    const returnBadData = {
      canRetire: false,
      retirementAge: null,
      dataPoints: []
    }
    var currentNetWorth = netWorth;
    var projectedAge = age;
    if (!maxAge || maxAge <= age) {
      return returnBadData;
    }
    const dataPoints: RetirementDataPoint[] = new Array<RetirementDataPoint | undefined>(maxAge - age + 21).fill(undefined).map((_, i) => ({ age: 0, netWorth0: 0, netWorth5: 0, netWorth10: 0, netWorth15: 0 }));

    const baseCost = (totalMonthlyExpenses) * 12;
    const yearsToMaxAge = maxAge - age;
    const baseCostWithInflation = baseCost * (
      ((Math.pow(1 + inflation, yearsToMaxAge) - 1) / inflation) *
      (1 + inflation)
    );
    var retirementAge = Math.ceil(
      (
        (baseCostWithInflation) -
        (currentNetWorth - totalDebts)
      )
      /
      ((totalMonthlyIncome) * 12)
    ) + age;
    if (retirementAge > maxAge) {
      return returnBadData;
    }
    const initialRetirementAge = retirementAge;
    retirementAge -= 5;
    for (let i = 0; i < 4; i++) {
      retirementAge += 5;
      let currentTotalWorth = (currentNetWorth - totalDebts);
      projectedAge = age;
      for (let year = 0; projectedAge <= maxAge; year++) {
        projectedAge++;
        const activeIncome = getActiveIncomeAtAge(projectedAge, retirementAge, incomes);
        const activeExpenses = getActiveExpensesAtAge(projectedAge, year, retirementAge, inflation, expenses);
        const adjustedMonthlySavings = activeIncome - activeExpenses;
        currentTotalWorth += adjustedMonthlySavings * 12;
        let currPoint = dataPoints[year];
        if (currentTotalWorth > 0) {
          switch (i) {
            case 0:
              currPoint.netWorth0 = currentTotalWorth;
              break;
            case 1:
              currPoint.netWorth5 = currentTotalWorth;
              break;
            case 2:
              currPoint.netWorth10 = currentTotalWorth;
              break;
            case 3:
              currPoint.netWorth15 = currentTotalWorth;
              break;
          }
          currPoint.age = projectedAge;
        }
        else {
          break;
        }

      }
    }
    let trimmeDataPoints = dataPoints.filter(dp => dp != null && dp.age !== 0);

    return {
      canRetire: initialRetirementAge !== null,
      retirementAge: initialRetirementAge,
      dataPoints: trimmeDataPoints
    };
  };

  const checkGraphDataValidity = (dataPoints: RetirementDataPoint[]) => {
    if (!dataPoints || dataPoints.length === 0) {
      return false;
    }
    for (const point of dataPoints) {
      if (point == null) {
        return false;
      }
    }
    return true;
  };

  var graphData = retirementData(currentAge, inflationRate, netWorth, totalMonthlyExpenses, totalDebts, incomes, expenses, maxAge);

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
              {/* Create two inputs one for inflation and the other for max age*/}
              <div className="input-row">
                <label>Inflation Rate (%):</label>
                <input
                  type="number"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(e.target.value)}
                  placeholder="3"
                  step="0.1"
                />
                <label>Life Expectancy</label>
                <input
                  type="number"
                  value={maxAge ?? ''}
                  onChange={(e) => setMaxAge(parseInt(e.target.value))}
                  placeholder="110"
                  step="5"
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
              {graphData.canRetire && graphData?.retirementAge ? (
                <div className="retirement-result success">
                  <div className="retirement-title">🎉 You can retire at age:</div>
                  <div className="retirement-age">{graphData?.retirementAge}</div>
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

            {checkGraphDataValidity(graphData.dataPoints) && (
              <section className="section">
                <h2>Net Worth Projection</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={graphData.dataPoints}>
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
                    <Line type="monotone" dataKey="netWorth0" stroke="#4CAF50" strokeWidth={2} name="Net Worth Earliest" />
                    <Line type="monotone" dataKey="netWorth5" stroke="#a2b9bc" strokeWidth={2} name="+5Y Retirement" />
                    <Line type="monotone" dataKey="netWorth10" stroke="#3A6EA5" strokeWidth={2} name="+10Y Retirement" />
                    <Line type="monotone" dataKey="netWorth15" stroke="#FF6700" strokeWidth={2} name="+15Y Retirement" />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <AssetsDebts
            isAsset={true}
            items={assets}
            totalAssetsDebts={totalAssets}
            addItem={addAsset}
            deleteItem={deleteAsset} />
        )}

        {activeTab === 'debts' && (
          <AssetsDebts
            isAsset={false}
            items={debts}
            totalAssetsDebts={totalDebts}
            addItem={addDebt}
            deleteItem={deleteDebt} />
        )}

        {activeTab === 'income' && (
          <MonthlyExpensesIncome
            isExpense={false}
            totalMonthlyExpenses={totalMonthlyIncome}
            expenses={incomes}
            addExpense={addIncome}
            deleteExpense={deleteIncome} />
        )}

        {activeTab === 'expenses' && (
          <MonthlyExpensesIncome
            isExpense={true}
            totalMonthlyExpenses={totalMonthlyExpenses}
            expenses={expenses}
            addExpense={addExpense}
            deleteExpense={deleteExpense} />
        )}
      </main>
    </div>
  );
}
