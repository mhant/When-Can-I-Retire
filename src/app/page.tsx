"use client";
import React, { useState, useEffect, useRef, ChangeEvent, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faFileImport, faSave, faSliders,
  faTable, faInfoCircle, faPlane, faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import { AssetDebt, IncomeExpense, ScenarioResult, YearlyProjectionRow } from './types';
import MonthlyExpensesIncome from './expensesIncome';
import AssetsDebts from './assetsDebts';
import BudgetAnalysis from './budgetAnalysis';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
  };

  // User profile & Simulation Parameters
  const [currentAge, setCurrentAge] = useState('30');
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(95);
  const [inflationRate, setInflationRate] = useState('3');
  const [savingsInterest, setSavingsInterest] = useState('7');
  const [preRetirementReturn, setPreRetirementReturn] = useState('7');
  const [postRetirementReturn, setPostRetirementReturn] = useState('5');
  const [wageGrowthRate, setWageGrowthRate] = useState('3');
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState('4');
  const [fatExpenseBump, setFatExpenseBump] = useState('25'); // % increase in retirement expenses for travel/lifestyle

  // UI View Controls
  const [dollarView, setDollarView] = useState<'real' | 'nominal'>('nominal');
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(1);
  const [showTable, setShowTable] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Assets & Debts
  const [assets, setAssets] = useState<AssetDebt[]>([]);
  const [debts, setDebts] = useState<AssetDebt[]>([]);

  // Monthly Income & Expenses
  const [incomes, setIncomes] = useState<IncomeExpense[]>([]);
  const [expenses, setExpenses] = useState<IncomeExpense[]>([]);

  const [activeTab, setActiveTab] = useState('budget_analysis');
  const [isLoading, setIsLoading] = useState(true);

  const setDataFromSave = (savedData: string) => {
    const data = JSON.parse(savedData);
    setCurrentAge(data.currentAge || '30');
    setInflationRate(data.inflationRate || '3');
    setAssets(data.assets || []);
    setDebts(data.debts || []);
    setIncomes(data.incomes || []);
    setExpenses(data.expenses || []);
    setRetirementAge(data.retirementAge || 65);
    setSavingsInterest(data.savingsInterest || '7');
    setPreRetirementReturn(data.preRetirementReturn || data.savingsInterest || '7');
    setPostRetirementReturn(data.postRetirementReturn || '5');
    setWageGrowthRate(data.wageGrowthRate || '3');
    setLifeExpectancy(data.lifeExpectancy || 95);
    setSafeWithdrawalRate(data.safeWithdrawalRate || '4');
    setFatExpenseBump(data.fatExpenseBump || '25');
  };

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

    event.target.value = "";
  };

  // Load data from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [
    currentAge, inflationRate, assets, debts, incomes, expenses, isLoading,
    savingsInterest, retirementAge, preRetirementReturn, postRetirementReturn,
    wageGrowthRate, lifeExpectancy, safeWithdrawalRate, fatExpenseBump
  ]);

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
        expenses,
        savingsInterest,
        retirementAge,
        preRetirementReturn,
        postRetirementReturn,
        wageGrowthRate,
        lifeExpectancy,
        safeWithdrawalRate,
        fatExpenseBump
      };
      localStorage.setItem('retirementData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Add & Save handlers
  const addAsset = (assetName: string, assetValue: string, yearlyContribution?: string, id?: string) => {
    if (!assetName || !assetValue) {
      alert('Please fill in all fields');
      return;
    }
    const val = parseFloat(assetValue.replace(/,/g, ''));
    const contrib = yearlyContribution ? parseFloat(yearlyContribution.replace(/,/g, '')) : undefined;
    if (id) {
      setAssets(assets.map(a => a.id === id ? {
        ...a,
        name: assetName,
        value: val,
        yearlyContribution: contrib
      } : a));
      return;
    }
    setAssets([...assets, { id: Date.now().toString(), name: assetName, value: val, yearlyContribution: contrib }]);
  };

  const addDebt = (debtName: string, debtValue: string, id?: string) => {
    if (!debtName || !debtValue) {
      alert('Please fill in all fields');
      return;
    }
    const val = parseFloat(debtValue.replace(/,/g, ''));
    if (id) {
      setDebts(debts.map(d => d.id === id ? { ...d, name: debtName, value: val } : d));
      return;
    }
    setDebts([...debts, { id: Date.now().toString(), name: debtName, value: val }]);
  };

  const saveIncome = (
    incomeName: string,
    incomeValue: string,
    incomeEndsAtRetirement: boolean,
    endAge?: number,
    id?: string,
    startAge?: number,
    startsAtRetirement?: boolean
  ) => {
    if (!incomeName || !incomeValue) {
      alert('Please fill in all fields');
      return;
    }
    const val = parseFloat(incomeValue.replace(/,/g, ''));
    if (id) {
      setIncomes(incomes.map(i => i.id === id ? {
        ...i,
        name: incomeName,
        value: val,
        endsAtRetirement: incomeEndsAtRetirement,
        endAge: endAge ?? null,
        startAge: startAge ?? null,
        startsAtRetirement: startsAtRetirement || false
      } : i));
      return;
    }
    const newIncome: IncomeExpense = {
      id: Date.now().toString(),
      name: incomeName,
      value: val,
      endsAtRetirement: incomeEndsAtRetirement,
      endAge: endAge ?? null,
      startAge: startAge ?? null,
      startsAtRetirement: startsAtRetirement || false
    };
    setIncomes([...incomes, newIncome]);
  };

  const saveExpense = (
    expenseName: string,
    expenseValue: string,
    endsAtRetirement: boolean,
    endAge?: number,
    id?: string,
    startAge?: number,
    startsAtRetirement?: boolean
  ) => {
    if (!expenseName || !expenseValue) {
      alert('Please fill in all fields');
      return;
    }
    const val = parseFloat(expenseValue.replace(/,/g, ''));
    if (id) {
      setExpenses(expenses.map(e => e.id === id ? {
        ...e,
        name: expenseName,
        value: val,
        endsAtRetirement: endsAtRetirement,
        endAge: endAge ?? null,
        startAge: startAge ?? null,
        startsAtRetirement: startsAtRetirement || false
      } : e));
      return;
    }
    const newExpense: IncomeExpense = {
      id: Date.now().toString(),
      name: expenseName,
      value: val,
      endsAtRetirement: endsAtRetirement,
      endAge: endAge ?? null,
      startAge: startAge ?? null,
      startsAtRetirement: startsAtRetirement || false
    };
    setExpenses([...expenses, newExpense]);
  };

  // Delete handlers
  const deleteAsset = (id: string) => setAssets(assets.filter(a => a.id !== id));
  const deleteDebt = (id: string) => setDebts(debts.filter(d => d.id !== id));
  const deleteIncome = (id: string) => setIncomes(incomes.filter(i => i.id !== id));
  const deleteExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  // Current Financial Totals
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.value, 0);
  const totalMonthlyIncome = incomes.reduce((sum, i) => sum + i.value, 0);
  const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
  const netWorth = totalAssets - totalDebts;
  const monthlySavings = totalMonthlyIncome - totalMonthlyExpenses;

  // Active Income at Age & Year
  const getActiveIncomeAtAge = (
    age: number,
    year: number,
    retAge: number,
    wageGrowth: number,
    inflation: number,
    incomeList: IncomeExpense[]
  ) => {
    return incomeList.reduce((sum, income) => {
      if (income.startsAtRetirement && age < retAge) return sum;
      if (income.startAge != null && age < income.startAge) return sum;
      if (income.endsAtRetirement && age >= retAge) return sum;
      if (income.endAge != null && age > income.endAge) return sum;

      const rate = income.endsAtRetirement ? wageGrowth : inflation;
      const growthFactor = Math.pow(1 + rate, year);
      return sum + income.value * growthFactor;
    }, 0);
  };

  // Active Expenses at Age & Year with optional multiplier (for Fat Retire)
  const getActiveExpensesAtAge = (
    age: number,
    year: number,
    retAge: number,
    inflation: number,
    expenseList: IncomeExpense[],
    retirementExpenseMultiplier: number = 1.0
  ) => {
    const isRetired = age >= retAge;
    const multiplier = isRetired ? retirementExpenseMultiplier : 1.0;
    const baseMonthly = expenseList.reduce((sum, expense) => {
      if (expense.startsAtRetirement && age < retAge) return sum;
      if (expense.startAge != null && age < expense.startAge) return sum;
      if (expense.endsAtRetirement && age >= retAge) return sum;
      if (expense.endAge != null && age > expense.endAge) return sum;
      return sum + expense.value;
    }, 0);
    return baseMonthly * multiplier * Math.pow(1 + inflation, year);
  };

  // Active Asset Contributions at Age
  const getActiveAssetContributionsAtAge = (
    age: number,
    retAge: number,
    assetList: AssetDebt[]
  ) => {
    return assetList.reduce((sum, asset) => {
      if (asset.yearlyContribution && age < retAge) {
        sum += asset.yearlyContribution;
      }
      return sum;
    }, 0);
  };

  // Core Simulation Engine Function
  const simulateScenario = (
    scenarioName: string,
    targetRetirementAge: number,
    startAge: number,
    horizonAge: number,
    initialNetWorth: number,
    preReturn: number,
    postReturn: number,
    inflation: number,
    wageGrowth: number,
    assetList: AssetDebt[],
    incomeList: IncomeExpense[],
    expenseList: IncomeExpense[],
    retirementExpenseMultiplier: number = 1.0
  ): ScenarioResult => {
    let currentBalance = initialNetWorth;
    const rows: YearlyProjectionRow[] = [];
    let depletionAge: number | null = null;
    let peakNetWorth = initialNetWorth;
    let peakAge = startAge;

    const totalYears = Math.max(0, horizonAge - startAge);

    for (let year = 0; year <= totalYears; year++) {
      const age = startAge + year;
      const isRetired = age >= targetRetirementAge;
      const startingBalance = currentBalance;

      const monthlyIncome = getActiveIncomeAtAge(age, year, targetRetirementAge, wageGrowth, inflation, incomeList);
      const annualIncome = monthlyIncome * 12;

      const annualContributions = getActiveAssetContributionsAtAge(age, targetRetirementAge, assetList);

      const monthlyExpense = getActiveExpensesAtAge(age, year, targetRetirementAge, inflation, expenseList, retirementExpenseMultiplier);
      const annualExpense = monthlyExpense * 12;

      const netCashFlow = annualIncome + annualContributions - annualExpense;

      const returnRate = isRetired ? postReturn : preReturn;
      const averageBalance = Math.max(0, startingBalance + netCashFlow / 2);
      const growth = averageBalance > 0 ? averageBalance * returnRate : 0;

      let endingBalance = startingBalance + netCashFlow + growth;

      if (endingBalance <= 0 && depletionAge === null && (startingBalance > 0 || year === 0)) {
        depletionAge = age;
      }

      if (endingBalance > peakNetWorth) {
        peakNetWorth = endingBalance;
        peakAge = age;
      }

      const inflationFactor = Math.pow(1 + inflation, year);
      const endingBalanceReal = endingBalance / (inflationFactor || 1);

      rows.push({
        year,
        age,
        isRetired,
        startingBalance: Math.round(startingBalance),
        income: Math.round(annualIncome),
        contributions: Math.round(annualContributions),
        growth: Math.round(growth),
        expenses: Math.round(annualExpense),
        netCashFlow: Math.round(netCashFlow),
        endingBalance: Math.round(endingBalance),
        endingBalanceReal: Math.round(endingBalanceReal)
      });

      currentBalance = endingBalance;
    }

    return {
      name: scenarioName,
      retirementAge: targetRetirementAge,
      depletionAge,
      endingNetWorth: Math.round(currentBalance),
      endingNetWorthReal: Math.round(currentBalance / Math.pow(1 + inflation, totalYears)),
      peakNetWorth: Math.round(peakNetWorth),
      peakAge,
      rows
    };
  };

  // Calculations Memoized
  const simulationResults = useMemo(() => {
    const startAge = parseInt(currentAge) || 30;
    const targetRetAge = retirementAge || 65;
    const horizon = Math.max(targetRetAge + 5, lifeExpectancy || 95);
    const inflation = (parseFloat(inflationRate) || 0) / 100;
    const preReturn = (parseFloat(preRetirementReturn) || 7) / 100;
    const postReturn = (parseFloat(postRetirementReturn) || 5) / 100;
    const wageGrowth = (parseFloat(wageGrowthRate) || 3) / 100;
    const swr = (parseFloat(safeWithdrawalRate) || 4) / 100;
    const fatMultiplier = 1 + (parseFloat(fatExpenseBump) || 25) / 100;

    // 1. Standard Target Scenario (Safe Retire)
    const targetScenario = simulateScenario(
      `Target (${targetRetAge})`,
      targetRetAge,
      startAge,
      horizon,
      netWorth,
      preReturn,
      postReturn,
      inflation,
      wageGrowth,
      assets,
      incomes,
      expenses,
      1.0
    );

    // 2. Early Scenario (-5 yrs)
    const earlyRetAge = Math.max(startAge, targetRetAge - 5);
    const earlyScenario = simulateScenario(
      `Early (${earlyRetAge})`,
      earlyRetAge,
      startAge,
      horizon,
      netWorth,
      preReturn,
      postReturn,
      inflation,
      wageGrowth,
      assets,
      incomes,
      expenses,
      1.0
    );

    // 3. Target + 5 yrs
    const plus5RetAge = targetRetAge + 5;
    const plus5Scenario = simulateScenario(
      `Target +5 (${plus5RetAge})`,
      plus5RetAge,
      startAge,
      horizon,
      netWorth,
      preReturn,
      postReturn,
      inflation,
      wageGrowth,
      assets,
      incomes,
      expenses,
      1.0
    );

    // 4. Target + 10 yrs
    const plus10RetAge = targetRetAge + 10;
    const plus10Scenario = simulateScenario(
      `Target +10 (${plus10RetAge})`,
      plus10RetAge,
      startAge,
      horizon,
      netWorth,
      preReturn,
      postReturn,
      inflation,
      wageGrowth,
      assets,
      incomes,
      expenses,
      1.0
    );

    // 5. Fat Retire Scenario (Target age with increased travel/lifestyle expenses)
    const fatTargetScenario = simulateScenario(
      `Fat Retire (${targetRetAge} +${fatExpenseBump}%)`,
      targetRetAge,
      startAge,
      horizon,
      netWorth,
      preReturn,
      postReturn,
      inflation,
      wageGrowth,
      assets,
      incomes,
      expenses,
      fatMultiplier
    );

    const scenarios = [earlyScenario, targetScenario, plus5Scenario, plus10Scenario, fatTargetScenario];

    // Earliest Safe Retirement Age Calculation for Safe Retire
    let earliestSafeAge: number | null = null;
    for (let testAge = startAge; testAge <= horizon; testAge++) {
      const testResult = simulateScenario(
        `Test ${testAge}`,
        testAge,
        startAge,
        horizon,
        netWorth,
        preReturn,
        postReturn,
        inflation,
        wageGrowth,
        assets,
        incomes,
        expenses,
        1.0
      );
      if (testResult.depletionAge === null && testResult.endingNetWorth >= 0) {
        earliestSafeAge = testAge;
        break;
      }
    }

    // Earliest Safe Retirement Age Calculation for Fat Retire
    let fatEarliestSafeAge: number | null = null;
    for (let testAge = startAge; testAge <= horizon; testAge++) {
      const testResult = simulateScenario(
        `Test Fat ${testAge}`,
        testAge,
        startAge,
        horizon,
        netWorth,
        preReturn,
        postReturn,
        inflation,
        wageGrowth,
        assets,
        incomes,
        expenses,
        fatMultiplier
      );
      if (testResult.depletionAge === null && testResult.endingNetWorth >= 0) {
        fatEarliestSafeAge = testAge;
        break;
      }
    }

    // Baseline Retirement living expenses
    const monthlyExpensesTodayInRetirement = getActiveExpensesAtAge(targetRetAge + 1, 0, targetRetAge, 0, expenses, 1.0);
    const monthlyIncomeTodayInRetirement = getActiveIncomeAtAge(targetRetAge + 1, 0, targetRetAge, 0, 0, incomes);
    const netMonthlyRetirementExpensesToday = Math.max(0, monthlyExpensesTodayInRetirement - monthlyIncomeTodayInRetirement);
    const annualNetRetirementExpensesToday = netMonthlyRetirementExpensesToday * 12;

    const safeFireTarget = swr > 0 ? Math.round(annualNetRetirementExpensesToday / swr) : 0;
    const safeFireProgressPercent = safeFireTarget > 0 ? Math.min(100, Math.max(0, Math.round((netWorth / safeFireTarget) * 100))) : 100;

    // Fat Retirement living expenses
    const fatMonthlyExpensesToday = monthlyExpensesTodayInRetirement * fatMultiplier;
    const fatNetMonthlyRetirementExpensesToday = Math.max(0, fatMonthlyExpensesToday - monthlyIncomeTodayInRetirement);
    const fatAnnualNetRetirementExpensesToday = fatNetMonthlyRetirementExpensesToday * 12;

    const fatFireTarget = swr > 0 ? Math.round(fatAnnualNetRetirementExpensesToday / swr) : 0;
    const fatFireProgressPercent = fatFireTarget > 0 ? Math.min(100, Math.max(0, Math.round((netWorth / fatFireTarget) * 100))) : 100;

    const targetRow = targetScenario.rows.find(r => r.age === targetRetAge);
    const targetRetirementNetWorth = targetRow?.endingBalance ?? 0;
    const targetRetirementNetWorthReal = targetRow?.endingBalanceReal ?? 0;

    // Build Chart Data for all scenarios
    const chartData = targetScenario.rows.map((row, idx) => {
      const point: any = { age: row.age };
      scenarios.forEach((sc, scIdx) => {
        const scRow = sc.rows[idx];
        if (scRow) {
          point[`sc_${scIdx}`] = dollarView === 'real' ? scRow.endingBalanceReal : scRow.endingBalance;
        }
      });
      return point;
    });

    return {
      scenarios,
      targetScenario,
      fatTargetScenario,
      chartData,
      safeMilestones: {
        earliestRetirementAge: earliestSafeAge,
        fireTarget: safeFireTarget,
        fireProgressPercent: safeFireProgressPercent,
        monthlyRetirementBudgetToday: Math.round(monthlyExpensesTodayInRetirement),
        sustainableMonthlyWithdrawalReal: Math.round((targetRetirementNetWorthReal * swr) / 12),
        endingNetWorth: targetScenario.endingNetWorth,
        endingNetWorthReal: targetScenario.endingNetWorthReal,
        depletionAge: targetScenario.depletionAge
      },
      fatMilestones: {
        earliestRetirementAge: fatEarliestSafeAge,
        fireTarget: fatFireTarget,
        fireProgressPercent: fatFireProgressPercent,
        monthlyRetirementBudgetToday: Math.round(fatMonthlyExpensesToday),
        sustainableMonthlyWithdrawalReal: Math.round((targetRetirementNetWorthReal * swr) / 12),
        endingNetWorth: fatTargetScenario.endingNetWorth,
        endingNetWorthReal: fatTargetScenario.endingNetWorthReal,
        depletionAge: fatTargetScenario.depletionAge
      }
    };
  }, [
    currentAge, retirementAge, lifeExpectancy, inflationRate, preRetirementReturn,
    postRetirementReturn, wageGrowthRate, safeWithdrawalRate, fatExpenseBump,
    assets, debts, incomes, expenses, dollarView
  ]);

  const selectedScenario = simulationResults.scenarios[selectedScenarioIdx] || simulationResults.targetScenario;

  const exportTableCSV = () => {
    if (!selectedScenario?.rows) return;
    const headers = [
      "Year", "Age", "Phase", "Starting Assets", "Annual Income",
      "Contributions", "Investment Growth", "Annual Expenses",
      "Net Cash Flow", "Ending Assets (Nominal)", "Ending Assets (Real)"
    ];
    const rows = selectedScenario.rows.map(r => [
      r.year,
      r.age,
      r.isRetired ? "Retired" : "Working",
      r.startingBalance,
      r.income,
      r.contributions,
      r.growth,
      r.expenses,
      r.netCashFlow,
      r.endingBalance,
      r.endingBalanceReal
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `retirement_projection_${selectedScenario.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scenarioColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];

  return (
    <div className="app">
      <header className="header">
        <h1>Retirement Simulator</h1>
        <div className="disclaimer">
          This app is for educational purposes. Please consult a certified financial advisor or accountant for actionable advice.
        </div>
      </header>

      <div className="button-container">
        <button className="export-button" onClick={() => {
          const dataStr = JSON.stringify({
            currentAge,
            retirementAge,
            lifeExpectancy,
            inflationRate,
            preRetirementReturn,
            postRetirementReturn,
            wageGrowthRate,
            safeWithdrawalRate,
            fatExpenseBump,
            savingsInterest,
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
        }}>
          <FontAwesomeIcon icon={faSave} /> Export Profile
        </button>
        <button className="export-button" onClick={triggerFileInput}>
          <FontAwesomeIcon icon={faFileImport} /> Import Profile
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      <nav className="tab-container">
        <button className={`tab ${activeTab === 'budget_analysis' ? 'active' : ''}`} onClick={() => setActiveTab('budget_analysis')}>
          Budget Analysis (CSV Upload)
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
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Simulation & Estimates
        </button>
      </nav>

      <main className="content">
        {activeTab === 'overview' && (
          <div>
            {/* Simulation Parameters */}
            <section className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0 }}>Simulation Parameters</h2>
                <button
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  style={{ background: 'none', border: 'none', color: '#3A6EA5', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                >
                  <FontAwesomeIcon icon={faSliders} style={{ marginRight: '6px' }} />
                  {showAdvancedSettings ? "Hide Advanced Settings" : "Configure Advanced Settings"}
                </button>
              </div>

              <div className="input-row">
                <label>Current Age:</label>
                <input
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value)}
                  placeholder="30"
                  min="18"
                  max="100"
                />
                <label>Target Retirement Age:</label>
                <input
                  type="number"
                  value={retirementAge.toString()}
                  onChange={(e) => setRetirementAge(parseInt(e.target.value) || 65)}
                  placeholder="65"
                  step="1"
                />
              </div>

              <div className="input-row">
                <label>Pre-Retirement Return (%):</label>
                <input
                  type="number"
                  value={preRetirementReturn}
                  onChange={(e) => {
                    setPreRetirementReturn(e.target.value);
                    setSavingsInterest(e.target.value);
                  }}
                  placeholder="7"
                  step="0.1"
                />
                <label>Post-Retirement Return (%):</label>
                <input
                  type="number"
                  value={postRetirementReturn}
                  onChange={(e) => setPostRetirementReturn(e.target.value)}
                  placeholder="5"
                  step="0.1"
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
                <label>Fat Retire Travel/Luxury Bump (%):</label>
                <input
                  type="number"
                  value={fatExpenseBump}
                  onChange={(e) => setFatExpenseBump(e.target.value)}
                  placeholder="25"
                  step="1"
                />
              </div>

              {showAdvancedSettings && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div className="input-row">
                    <label>Life Expectancy Age:</label>
                    <input
                      type="number"
                      value={lifeExpectancy.toString()}
                      onChange={(e) => setLifeExpectancy(parseInt(e.target.value) || 95)}
                      placeholder="95"
                      min="60"
                      max="115"
                    />
                    <label>Safe Withdrawal Rate (%):</label>
                    <input
                      type="number"
                      value={safeWithdrawalRate}
                      onChange={(e) => setSafeWithdrawalRate(e.target.value)}
                      placeholder="4"
                      step="0.1"
                    />
                  </div>
                  <div className="input-row">
                    <label>Wage Growth (%/yr):</label>
                    <input
                      type="number"
                      value={wageGrowthRate}
                      onChange={(e) => setWageGrowthRate(e.target.value)}
                      placeholder="3"
                      step="0.1"
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '6px' }} />
                    Fat Retire bumps your post-retirement monthly living expenses by {fatExpenseBump}% to account for extra travel, dining, hobbies, and leisure.
                  </div>
                </div>
              )}
            </section>

            {/* Current Financial Baseline */}
            <section className="section">
              <h2>Current Financial Baseline</h2>
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
                  <div className="summary-label">Current Net Worth</div>
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

            {/* Retirement Readiness & Milestones: 2 Distinct Rows */}
            <section className="section">
              <h2 style={{ marginBottom: '16px' }}>Retirement Readiness & Milestones</h2>

              {/* Row 1: Safe Retire (Standard Baseline) */}
              <div className="milestone-row-container safe-retire">
                <div className="milestone-row-header">
                  <div className="milestone-row-title">
                    <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#16a34a' }} />
                    <span>Safe Retire (Baseline Lifestyle)</span>
                  </div>
                  {simulationResults.safeMilestones.depletionAge === null ? (
                    <span className="status-badge success">✓ Fully Funded to Age {lifeExpectancy}</span>
                  ) : (
                    <span className="status-badge danger">⚠️ Depletes at Age {simulationResults.safeMilestones.depletionAge}</span>
                  )}
                </div>

                <div className="milestones-grid">
                  <div className="milestone-card">
                    <div className="milestone-label">Earliest Safe Retirement</div>
                    <div className="milestone-value" style={{ color: '#16a34a' }}>
                      {simulationResults.safeMilestones.earliestRetirementAge !== null
                        ? `Age ${simulationResults.safeMilestones.earliestRetirementAge}`
                        : "After Horizon"}
                    </div>
                    <div className="milestone-subtext">
                      {simulationResults.safeMilestones.earliestRetirementAge !== null && simulationResults.safeMilestones.earliestRetirementAge <= retirementAge
                        ? `Can safely retire ${retirementAge - simulationResults.safeMilestones.earliestRetirementAge} yrs ahead of target (age ${retirementAge})`
                        : `Target age ${retirementAge} requires additional savings or delaying`}
                    </div>
                  </div>

                  <div className="milestone-card">
                    <div className="milestone-label">FIRE Target ({safeWithdrawalRate}% Rule)</div>
                    <div className="milestone-value">
                      ${simulationResults.safeMilestones.fireTarget.toLocaleString()}
                    </div>
                    <div className="progress-container">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${simulationResults.safeMilestones.fireProgressPercent}%`, backgroundColor: '#16a34a' }}
                      />
                    </div>
                    <div className="milestone-subtext">
                      {simulationResults.safeMilestones.fireProgressPercent}% funded today (${netWorth.toLocaleString()} / ${simulationResults.safeMilestones.fireTarget.toLocaleString()})
                    </div>
                  </div>

                  <div className="milestone-card">
                    <div className="milestone-label">Monthly Living Expenses in Retirement</div>
                    <div className="milestone-value" style={{ color: '#2563eb' }}>
                      ${simulationResults.safeMilestones.monthlyRetirementBudgetToday.toLocaleString()}/mo
                    </div>
                    <div className="milestone-subtext">
                      Today's purchasing power based on current baseline expenses
                    </div>
                  </div>

                  <div className="milestone-card">
                    <div className="milestone-label">Ending Balance at Age {lifeExpectancy}</div>
                    <div className={`milestone-value ${simulationResults.safeMilestones.endingNetWorth >= 0 ? 'positive' : 'negative'}`}>
                      ${(dollarView === 'real'
                        ? simulationResults.safeMilestones.endingNetWorthReal
                        : simulationResults.safeMilestones.endingNetWorth).toLocaleString()}
                    </div>
                    <div className="milestone-subtext">
                      {simulationResults.safeMilestones.depletionAge === null
                        ? "Estimated surplus remaining at end of plan"
                        : `Portfolio depleted at age ${simulationResults.safeMilestones.depletionAge}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Fat Retire (Enhanced Lifestyle with Travel & Leisure) */}
              <div className="milestone-row-container fat-retire">
                <div className="milestone-row-header">
                  <div className="milestone-row-title">
                    <FontAwesomeIcon icon={faPlane} style={{ color: '#d97706' }} />
                    <span>Fat Retire (+{fatExpenseBump}% Extra Travel & Leisure Expenses)</span>
                  </div>
                  {simulationResults.fatMilestones.depletionAge === null ? (
                    <span className="status-badge success">✓ Fully Funded to Age {lifeExpectancy}</span>
                  ) : (
                    <span className="status-badge danger">⚠️ Depletes at Age {simulationResults.fatMilestones.depletionAge}</span>
                  )}
                </div>

                <div className="milestones-grid">
                  <div className="milestone-card">
                    <div className="milestone-label">Fat Earliest Safe Retirement</div>
                    <div className="milestone-value" style={{ color: '#d97706' }}>
                      {simulationResults.fatMilestones.earliestRetirementAge !== null
                        ? `Age ${simulationResults.fatMilestones.earliestRetirementAge}`
                        : "After Horizon"}
                    </div>
                    <div className="milestone-subtext">
                      {simulationResults.fatMilestones.earliestRetirementAge !== null
                        ? `Requires working to age ${simulationResults.fatMilestones.earliestRetirementAge} to support +${fatExpenseBump}% luxury expenses`
                        : "Increase contributions or return to reach Fat Retire"}
                    </div>
                  </div>

                  <div className="milestone-card">
                    <div className="milestone-label">Fat FIRE Target ({safeWithdrawalRate}% Rule)</div>
                    <div className="milestone-value">
                      ${simulationResults.fatMilestones.fireTarget.toLocaleString()}
                    </div>
                    <div className="progress-container">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${simulationResults.fatMilestones.fireProgressPercent}%`, backgroundColor: '#d97706' }}
                      />
                    </div>
                    <div className="milestone-subtext">
                      {simulationResults.fatMilestones.fireProgressPercent}% funded today (${netWorth.toLocaleString()} / ${simulationResults.fatMilestones.fireTarget.toLocaleString()})
                    </div>
                  </div>

                  <div className="milestone-card">
                    <div className="milestone-label">Fat Monthly Expenses in Retirement</div>
                    <div className="milestone-value" style={{ color: '#d97706' }}>
                      ${simulationResults.fatMilestones.monthlyRetirementBudgetToday.toLocaleString()}/mo
                    </div>
                    <div className="milestone-subtext">
                      Includes +${Math.round(simulationResults.fatMilestones.monthlyRetirementBudgetToday - simulationResults.safeMilestones.monthlyRetirementBudgetToday).toLocaleString()}/mo extra for vacations and dining
                    </div>
                  </div>

                  <div className="milestone-card">
                    <div className="milestone-label">Fat Ending Balance at Age {lifeExpectancy}</div>
                    <div className={`milestone-value ${simulationResults.fatMilestones.endingNetWorth >= 0 ? 'positive' : 'negative'}`}>
                      ${(dollarView === 'real'
                        ? simulationResults.fatMilestones.endingNetWorthReal
                        : simulationResults.fatMilestones.endingNetWorth).toLocaleString()}
                    </div>
                    <div className="milestone-subtext">
                      {simulationResults.fatMilestones.depletionAge === null
                        ? "Remaining legacy surplus after enhanced lifestyle"
                        : `Runs out at age ${simulationResults.fatMilestones.depletionAge} under +${fatExpenseBump}% spending`}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Scenario Quick Selector Cards */}
            <section className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 style={{ margin: 0 }}>Retirement Age Scenarios</h2>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Click any scenario below to immediately update the asset projection graph!
                </div>
              </div>

              <div className="scenario-summary-cards">
                {simulationResults.scenarios.map((sc, idx) => (
                  <div
                    key={sc.name}
                    className={`scenario-card ${selectedScenarioIdx === idx ? 'active' : ''}`}
                    onClick={() => setSelectedScenarioIdx(idx)}
                  >
                    <div className="scenario-card-title">{sc.name}</div>
                    <div className="scenario-card-stat" style={{ color: sc.depletionAge === null ? '#16a34a' : '#dc2626' }}>
                      {sc.depletionAge === null ? `Funded to ${lifeExpectancy}` : `Depletes at ${sc.depletionAge}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Ending Assets: ${(dollarView === 'real' ? sc.endingNetWorthReal : sc.endingNetWorth).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Estimated Total Asset Projection Graph */}
            <section className="section">
              <div style={{ marginBottom: '12px' }}>
                <h2 style={{ margin: 0 }}>Estimated Total Asset Projections</h2>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Showing all scenarios by default. Click any scenario button above to highlight its projection path and retirement age.
                </div>
              </div>

              <div style={{ width: '100%', height: 400, minHeight: 400, position: 'relative' }}>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height={400} minWidth={100} minHeight={400}>
                    <LineChart data={simulationResults.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                      <YAxis
                        domain={['auto', 'auto']}
                        label={{
                          value: dollarView === 'real' ? 'Total Assets (Today’s $)' : 'Total Assets (Nominal $)',
                          angle: -90,
                          position: 'insideLeft'
                        }}
                        tickFormatter={(value) => {
                          if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                          if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                          return `$${value}`;
                        }}
                      />
                      <Tooltip
                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total Assets']}
                        labelFormatter={(label) => `Age: ${label}`}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <ReferenceLine
                        x={selectedScenario.retirementAge}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{
                          value: `Selected Retire: Age ${selectedScenario.retirementAge}`,
                          fill: '#ef4444',
                          fontSize: 12,
                          position: 'top'
                        }}
                      />
                      {simulationResults.scenarios.map((sc, scIdx) => {
                        const isSelected = scIdx === selectedScenarioIdx;
                        return (
                          <Line
                            key={sc.name}
                            type="monotone"
                            dataKey={`sc_${scIdx}`}
                            stroke={scenarioColors[scIdx % scenarioColors.length]}
                            strokeWidth={isSelected ? 4 : 1.8}
                            strokeOpacity={isSelected ? 1.0 : 0.45}
                            strokeDasharray={scIdx === 4 ? "5 5" : undefined}
                            name={sc.name}
                            dot={false}
                            isAnimationActive={false}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Loading projection chart...
                  </div>
                )}
              </div>
            </section>

            {/* Year-by-Year Breakdown Table */}
            <section className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Year-by-Year Financial Ledger ({selectedScenario?.name})</h2>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Annual breakdown of income, contributions, investment returns, living expenses, and portfolio balances.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="add-button"
                    style={{ padding: '8px 14px', fontSize: '14px', backgroundColor: '#3A6EA5' }}
                    onClick={exportTableCSV}
                  >
                    <FontAwesomeIcon icon={faDownload} style={{ marginRight: '6px' }} />
                    Export CSV
                  </button>
                  <button
                    className="add-button"
                    style={{ padding: '8px 14px', fontSize: '14px', backgroundColor: showTable ? '#64748b' : '#10b981' }}
                    onClick={() => setShowTable(!showTable)}
                  >
                    <FontAwesomeIcon icon={faTable} style={{ marginRight: '6px' }} />
                    {showTable ? "Collapse Table" : "Expand Table"}
                  </button>
                </div>
              </div>

              {showTable && (
                <div className="projection-table-wrapper">
                  <table className="projection-table">
                    <thead>
                      <tr>
                        <th>Age</th>
                        <th>Phase</th>
                        <th>Start Total Assets</th>
                        <th>Annual Income</th>
                        <th>Contributions</th>
                        <th>Investment Growth</th>
                        <th>Annual Expenses</th>
                        <th>Net Cash Flow</th>
                        <th>End Total Assets ({dollarView === 'real' ? "Today's $" : "Nominal"})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedScenario?.rows.map((row) => (
                        <tr
                          key={row.age}
                          className={`${row.isRetired ? 'retired-row' : ''} ${row.endingBalance <= 0 ? 'depleted-row' : ''}`}
                        >
                          <td>{row.age}</td>
                          <td>
                            <span className={row.isRetired ? "tag-retired" : "tag-working"}>
                              {row.isRetired ? "Retired" : "Working"}
                            </span>
                          </td>
                          <td>${row.startingBalance.toLocaleString()}</td>
                          <td style={{ color: '#16a34a' }}>+${row.income.toLocaleString()}</td>
                          <td style={{ color: '#2563eb' }}>+${row.contributions.toLocaleString()}</td>
                          <td style={{ color: '#7c3aed' }}>+${row.growth.toLocaleString()}</td>
                          <td style={{ color: '#dc2626' }}>-${row.expenses.toLocaleString()}</td>
                          <td style={{ color: row.netCashFlow >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                            {row.netCashFlow >= 0 ? '+' : ''}${row.netCashFlow.toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            ${(dollarView === 'real' ? row.endingBalanceReal : row.endingBalance).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'budget_analysis' && (
          <BudgetAnalysis
            addExpense={saveExpense}
            addIncome={saveIncome}
          />
        )}

        {activeTab === 'assets' && (
          <AssetsDebts
            isAsset={true}
            items={assets}
            totalAssetsDebts={totalAssets}
            saveItem={addAsset}
            deleteItem={deleteAsset}
          />
        )}

        {activeTab === 'debts' && (
          <AssetsDebts
            isAsset={false}
            items={debts}
            totalAssetsDebts={totalDebts}
            saveItem={addDebt}
            deleteItem={deleteDebt}
          />
        )}

        {activeTab === 'income' && (
          <MonthlyExpensesIncome
            isExpense={false}
            totalMonthlyExpenses={totalMonthlyIncome}
            expenses={incomes}
            saveExpense={saveIncome}
            deleteExpense={deleteIncome}
          />
        )}

        {activeTab === 'expenses' && (
          <MonthlyExpensesIncome
            isExpense={true}
            totalMonthlyExpenses={totalMonthlyExpenses}
            expenses={expenses}
            saveExpense={saveExpense}
            deleteExpense={deleteExpense}
          />
        )}
      </main>

      <div className="footer">
        Leave feedback or get help at <a href="https://review.bugsmash.io/SzA9Z" target="_blank" rel="noopener noreferrer">BugSmash</a>.<br />
        <p>©2025 Retirement Simulator. All rights reserved.</p>
      </div>
    </div>
  );
}
