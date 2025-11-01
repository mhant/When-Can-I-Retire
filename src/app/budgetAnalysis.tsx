import { faCalculator, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Papa from 'papaparse';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import toast from 'react-hot-toast';

type RawDataRow = Record<string, any>;

interface BudgetAnalysisProps {
    addExpense: (expenseName: string, expenseValue: string, endsAtRetirement: boolean) => void;
    addIncome: (incomeName: string, incomeValue: string, endsAtRetirement: boolean) => void;
}

export default function BudgetAnalysis({ addExpense, addIncome }: BudgetAnalysisProps) {
    const [parsedData, setParsedData] = React.useState<any>([]);
    const [columnSelection, setColumnSelection] = React.useState<{ [key: string]: string }>({});
    const categoryOptions = ["N/A", "date", "income", "expense", "income and expense"];
    const [columns, setColumns] = React.useState<GridColDef[]>([]);
    const [data, setData] = React.useState<Array<Record<string, any>>>([]);
    const [formattedIncome, setFormattedIncome] = React.useState<string>("");
    const [formattedExpenses, setFformattedExpenses] = React.useState<string>("");
    const [formattedAvgIncome, setFormattedAvgIncome] = React.useState<string>("");
    const [formattedAvgExpense, setFormattedAvgExpense] = React.useState<string>("");
    const [earliestDate, setEarliestDate] = React.useState<Date | null>(null);
    const [latestDate, setLatestDate] = React.useState<Date | null>(null);
    const [monthsDiff, setMonthsDiff] = React.useState<number | null>(null);
    const [instructionsCollapsed, setInstructionsCollapsed] = React.useState<boolean>(false);

    const toggleCollapseInstructions = () => {
        setInstructionsCollapsed(!instructionsCollapsed);
    }


    const computeExpensesIncomeFromCSV = () => {
        var totalIncome = 0;
        var totalExpenses = 0;
        var earliestDate: Date | null = null;
        var latestDate: Date | null = null;
        if (parsedData.length === 0) {
            alert("No data parsed from CSV file.");
            return;
        }
        const objectValues = Object.values(columnSelection);
        if (!objectValues.includes("date") ||
            (!objectValues.includes("income and expense") &&
                !(objectValues.includes("expense") && objectValues.includes("income"))
            )) {
            alert("Please select columns for income, expenses, and date.");
            return;
        }
        data.forEach((row: any) => {
            Object.entries(columnSelection).forEach(([header, category]) => {
                const rowValue: string = row[header];
                if (category === "income") {
                    const incomeValue = parseFloat(rowValue.replace(',', ''));
                    if (!isNaN(incomeValue)) {
                        totalIncome += incomeValue;
                    }
                } else if (category === "expense") {
                    const expenseValue = parseFloat(rowValue.replace(',', ''));
                    if (!isNaN(expenseValue)) {
                        totalExpenses += expenseValue;
                    }
                }
                else if (category === "date") {
                    const dateValue = new Date(row[header]);
                    if (!isNaN(dateValue.getTime())) {
                        if (earliestDate === null || dateValue < earliestDate) {
                            earliestDate = dateValue;
                        }
                        if (latestDate === null || dateValue > latestDate) {
                            latestDate = dateValue;
                        }
                    }
                }
                else if (category === "income and expense") {
                    const value = parseFloat(rowValue.replace(',', '').replace('+', ''));
                    if (isNaN(value)) {
                        return;
                    }
                    if (value < 0) {
                        totalExpenses += Math.abs(value);
                    }
                    else {
                        totalIncome += Math.abs(value);
                    }
                }
            });
        });
        if (earliestDate === null || latestDate === null) {
            alert("Could not determine date range from the selected date column.");
            return;
        }
        latestDate = latestDate as Date;
        earliestDate = earliestDate as Date;
        const timeDiff = latestDate.getTime() - earliestDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        const monthsDiff = daysDiff / 30.44;
        setEarliestDate(earliestDate);
        setLatestDate(latestDate);
        setMonthsDiff(monthsDiff);
        const avgIncomePrint = totalIncome / monthsDiff;
        const avgExpensePrint = totalExpenses / monthsDiff;
        setFormattedIncome(totalIncome.toLocaleString(undefined, { maximumFractionDigits: 2 }));
        setFformattedExpenses(totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 }));
        setFormattedAvgIncome(avgIncomePrint.toLocaleString(undefined, { maximumFractionDigits: 2 }));
        setFormattedAvgExpense(avgExpensePrint.toLocaleString(undefined, { maximumFractionDigits: 2 }));

    };

    const handleAddIncome = (income: string) => {
        addIncome("Average Monthly Income", income, true);
        toast.success('Income added');
    };

    const handleAddExpense = (expense: string) => {
        addExpense("Average Monthly Expense", expense, false);
        toast.success('Expense added');
    };

    const handleProcessRowUpdate = (newRow: RawDataRow, oldRow: RawDataRow) => {
        const updatedData = data.map(row =>
            row.id === newRow.id ? newRow : row
        );
        setData(updatedData);
        return newRow;
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const outputDiv = document.getElementById('output') as HTMLDivElement;
        outputDiv.style.visibility = "visible";
        outputDiv.innerHTML = "";
        setColumnSelection({});
        setParsedData([]);
        setColumns([]);
        setData([]);
        setParsedData([]);
        setEarliestDate(null);
        setLatestDate(null);
        setMonthsDiff(null);
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
                complete: (results) => {
                    setParsedData(results);
                    const processedRows = results.data.map((row, index) => {
                        const rowObject = row as RawDataRow;
                        return {
                            id: index, // Add a unique ID for the DataGrid
                            ...rowObject
                        }
                    });
                    setData(processedRows);
                    results.meta.fields?.forEach((header: string) => {
                        const itemContainer = document.createElement('div');
                        itemContainer.classList.add('item-row');
                        const label = document.createElement('span');
                        label.textContent = header;
                        label.classList.add('header-label');
                        const select = document.createElement('select');
                        select.id = `select-${header}`;
                        setColumnSelection(prev => ({ ...prev, [header]: "N/A" }));
                        var columnObj: GridColDef = { field: header, headerName: header, width: 150, editable: true };
                        setColumns(prev => ([...prev, columnObj]));
                        categoryOptions.forEach(optionText => {
                            const option = document.createElement('option');
                            option.value = optionText;
                            option.textContent = optionText;
                            select.appendChild(option);
                        });
                        select.addEventListener('change', (event) => {
                            const selectedItem = event?.target as HTMLSelectElement;
                            const selectedValue = selectedItem?.value;
                            setColumnSelection(prev => ({ ...prev, [header]: selectedValue }));

                        });
                        itemContainer.appendChild(label);
                        itemContainer.appendChild(select);
                        outputDiv.appendChild(itemContainer);
                    });
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                }
            });
        }
    };
    return (
        <>
            <section className="section">
                <h2>Budget Analysis</h2>
                <div className="instruction-text">
                    <div className="instruction-header" onClick={toggleCollapseInstructions}>
                        <span style={{ color: '#3A6EA5' }}> <FontAwesomeIcon icon={faUpload} />Upload Instructions</span>
                        <span className="collapse-arrow">{instructionsCollapsed ? '►' : '▼'}</span>
                    </div>
                    <div className={`collapsible-content ${instructionsCollapsed ? 'collapsed' : ''}`}>
                        <ol>
                            <li>Download a CSV of your monthly transactions for longest period possible. The CSV will need to contain a date, expense, and income columns.
                                <ol>
                                    <li>If you bank only allows to export/download excel files you wil need to convert it to CSV.</li>
                                    <li>If easier to clean the data in excel format, follow step 2 before coverting to CSV.</li>
                                </ol>
                            </li>
                            <li>Ensure that the CSV has no header or content before the actual rows of transactions.</li>
                            <li>Select Upload CSV File and select the file.</li>
                            <li>After uploading you need to map the columns for date, expense, and income in the selector. If expense and income are in the same column map that column to "income and expense"</li>
                            <li>After mapping the correct columns you can view the CSV and modify/correct data, e.g. if there is a miscalnous income/expense that should not be considered or considered differently.</li>
                            <li>After reviewing the data, click the <code><FontAwesomeIcon icon={faCalculator} />Calculate Averages</code> button to calculate average income/expense
                                <ul>
                                    <li>You can easily add an average expense or income by clicking the <code>Add Average Monthly Income/Expense</code> button and editing in relevent tab.</li>
                                </ul>
                            </li>
                        </ol>
                    </div>
                </div>
                <br />
                <label htmlFor="file-upload-id" className="custom-file-upload">
                    Upload CSV File
                </label>
                <input
                    id="file-upload-id"
                    className="csv-import"
                    type="file"
                    onChange={handleFileChange}
                    accept=".csv"
                />
                <div className="input-row" id="output" style={{ whiteSpace: 'pre-wrap', marginTop: '1em', backgroundColor: '#f0f0f0', padding: '1em', borderRadius: '5px', visibility: "hidden" }}></div>
                <div className='input-row' style={{ visibility: parsedData.length === 0 ? "hidden" : "visible", marginTop: '1em' }}>
                    <h3>Selected Columns:</h3>
                    {Object.entries(columnSelection).map(([header, category]) => (
                        category != "N/A" && <p key={header}>{header}: {category}</p>
                    ))}
                </div>
                <h3>Editable Rows and compute at the bottom</h3>
                <div style={{ visibility: parsedData.length === 0 ? "hidden" : "visible", marginTop: '1em' }}>
                    <DataGrid
                        rows={data}
                        columns={columns}
                        processRowUpdate={handleProcessRowUpdate}
                        onProcessRowUpdateError={(error) => console.error(error)}
                        pageSizeOptions={[5, 10, 25]}
                        initialState={{
                            pagination: {
                                paginationModel: {
                                    pageSize: 5,
                                },
                            },
                        }}
                    />
                </div>
                <button className="calculate-button" onClick={computeExpensesIncomeFromCSV} style={{ visibility: parsedData.length === 0 ? "hidden" : "visible", marginTop: '1em' }}>
                    <FontAwesomeIcon icon={faCalculator} />
                    Calculate Averages
                </button>
                <div style={{ marginTop: '1em', fontStyle: 'italic' }}>
                    <p>Note: This feature is in beta. Please verify the results before relying on them for financial decisions.</p>
                    <div id="calculation-results" style={{ visibility: (earliestDate && latestDate) ? "visible" : "hidden", marginTop: '1em' }}>
                        <div>
                            <p>From {earliestDate?.toDateString()} to {latestDate?.toDateString()} ({monthsDiff?.toFixed(2)} months):</p>
                            <p><b>Total Income:</b> ${formattedIncome}</p>
                            <p><b>Total Expenses:</b> ${formattedExpenses}</p>
                            <div className="budget-analysis-row">
                                <b>Average Monthly Income:</b> ${formattedAvgIncome}/mo
                                <button onClick={() => handleAddIncome(formattedAvgIncome)} className="add-button">
                                    Add Average Monthly Income (until retirement)
                                </button>
                            </div>
                            <div className="budget-analysis-row">
                                <b>Average Monthly Expenses:</b> ${formattedAvgExpense}/mo
                                <button onClick={() => handleAddExpense(formattedAvgExpense)} className="add-button">
                                    Add Average Monthly Expense
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section >
            <Toaster
                position="bottom-center"
                reverseOrder={false}
            />
        </>
    );
}