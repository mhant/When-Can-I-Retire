// components/AssetsDebts.tsx

import React from 'react';
import { AssetDebt } from './types';

interface AssetsDebtsProps {
    items: AssetDebt[];
    isAsset: boolean;
    totalAssetsDebts: number;
    addItem: (itemName: string, itemValue: string, yearlyContribution: string) => void;
    deleteItem: (id: string) => void;
}

export default function AssetsDebts({
    items,
    isAsset,
    totalAssetsDebts,
    addItem,
    deleteItem,
}: AssetsDebtsProps) {
    const [itemName, setItemName] = React.useState("");
    const [itemValue, setItemValue] = React.useState("");
    const [yearlyContribution, setYearlyContribution] = React.useState("");
    return (
        <section className="section">
            <h2>{isAsset ? "Assets" : "Debts"} (Total: ${totalAssetsDebts})</h2>
            {!isAsset && (
                <div className="warning-box">
                    <strong>Warning:</strong> Better to add debts as monthly expenses with an expiration date. Note that interest will be applied to these repayments.
                </div>
            )}
            <div className="form">
                <input
                    type="text"
                    placeholder={isAsset ? "Asset name (e.g., Savings Account)" : "Debt name (e.g., Mortgage)"}
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Value"
                    value={itemValue}
                    onChange={(e) => setItemValue(e.target.value)}
                />
                {isAsset && <div><label>Yearly Contribution (added until retirement):</label><input
                    type="number"
                    placeholder="I.e. salary contribution to pension"
                    value={yearlyContribution}
                    onChange={(e) => setYearlyContribution(e.target.value)}
                /></div>}
                <button className="add-button"
                    onClick={() => addItem(itemName, itemValue, yearlyContribution)}>Add {isAsset ? "Asset" : "Debt"}</button>
            </div>
            <div className="list">
                {items.length === 0 ? (
                    <div className="empty-text">{isAsset ? "No assets added yet" : "No debts added yet"}</div>
                ) : (
                    items.map((asset) => (
                        <div key={asset.id} className="list-item">
                            <div className="list-item-info">
                                <div className="list-item-name">{asset.name}</div>
                                <div className={"list-item-value " + isAsset ? "positive" : "negative"}>${asset.value.toLocaleString()}</div>
                                {isAsset && asset.yearlyContribution !== undefined && (
                                    <div className="list-item-subvalue">Yearly Contribution: ${asset.yearlyContribution.toLocaleString()}</div>
                                )}
                            </div>
                            <button className="delete-button" onClick={() => deleteItem(asset.id)}>×</button>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}