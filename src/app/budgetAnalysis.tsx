import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Papa from 'papaparse';
import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

type RawDataRow = Record<string, any>;

interface BudgetAnalysisProps {
    addExpense: (expenseName: string, expenseValue: string, endsAtRetirement: boolean) => void;
    addIncome: (incomeName: string, incomeValue: string, endsAtRetirement: boolean) => void;
}

export default function BudgetAnalysis({ addExpense, addIncome }: BudgetAnalysisProps) {
    const [parsedData, setParsedData] = React.useState<any>([]);
    const [columnSelection, setColumnSelection] = React.useState<{ [key: string]: string }>({});
    const categoryOptions = ["N/A", "date", "income", "expense"];
    const [columns, setColumns] = React.useState<GridColDef[]>([]);
    const [data, setData] = React.useState<Array<Record<string, any>>>([]);

    const computeExpensesIncomeFromCSV = () => {
        var totalIncome = 0;
        var totalExpenses = 0;
        var earliestDate: Date | null = null;
        var latestDate: Date | null = null;
        const resultsDiv = document.getElementById('calculation-results') as HTMLDivElement;
        resultsDiv.innerHTML = "";
        if (parsedData.length === 0) {
            alert("No data parsed from CSV file.");
            return;
        }
        const objectValues = Object.values(columnSelection);
        if (!objectValues.includes("income") || !objectValues.includes("expense") || !objectValues.includes("date")) {
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
        const averageMonthlyIncome = totalIncome / monthsDiff;
        const averageMonthlyExpenses = totalExpenses / monthsDiff;
        resultsDiv.innerHTML = `
            <p>From ${earliestDate.toDateString()} to ${latestDate.toDateString()} (${monthsDiff.toFixed(2)} months):</p>
            <p><b>Total Income:</b> $${totalIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p><b>Total Expenses:</b> $${totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p><b>Average Monthly Income:</b> $${averageMonthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}/mo</p>
            <p><b>Average Monthly Expenses:</b> $${averageMonthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}/mo</p>
        `;
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
        setColumnSelection({});
        setParsedData([]);
        outputDiv.innerHTML = "";
        const resultsDiv = document.getElementById('calculation-results') as HTMLDivElement;
        resultsDiv.innerHTML = "";
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
                    // outputDiv.innerHTML = JSON.stringify(results.data, null, 2);
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                }
            });
        }

    };
    return (
        <section className="section">
            <h2>Budget Analysis</h2>
            <p className="instruction-text">
                Please upload a CSV file of your financial transactions.
                The file <b>must</b> have separate columns for <b>income</b> (deposits) and <b>expenses</b> (withdrawals).
            </p>
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
                <div id="calculation-results"></div>
            </div>
        </section >
    );
}