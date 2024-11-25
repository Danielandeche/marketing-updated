import React, { useState, useEffect, useRef } from 'react';
import { calculatePercentages } from './calculatePercentage';
import './instances.css';

type AutoTradeInstance = {
    evenOddSelection: 'Even' | 'Odd';
    operator: 'Greater than' | 'Less than' | 'Equal';
    threshold: number;
    tradeSelection: 'Even' | 'Odd';
    isTrading: boolean;
    isTradeActive: boolean;
};

type Props = {
    digitList: number[];
    tickList: number[];
    CirclesDigitList: number[];
    customPrediction: string | number;
    is_dark_mode_on: boolean;
    martingaleValueRef: React.MutableRefObject<string | number>;
    guideElement: () => JSX.Element;
    handleMartingaleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    selectTickList: () => JSX.Element;
    handleCustomPredictionInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    buy_contract_differs: (contract_type: string, isOverUnder?: boolean) => void;
    buy_contract: (contract_type: string, isTradeActive: boolean) => void;
    setIsTradeActive: React.Dispatch<React.SetStateAction<boolean>>;
};

const LDPInstanceComponent: React.FC<Props> = ({
    digitList,
    tickList,
    CirclesDigitList,
    is_dark_mode_on,
    customPrediction,
    martingaleValueRef,
    guideElement,
    setIsTradeActive,
    handleMartingaleInputChange,
    selectTickList,
    buy_contract,
    buy_contract_differs,
    handleCustomPredictionInputChange,
}) => {
    const predictionValue = typeof customPrediction === 'string' ? parseInt(customPrediction) : customPrediction;

    const { evenPercentage, oddPercentage } = calculatePercentages(digitList, tickList, predictionValue);

    digitList = digitList.slice(-10);
    tickList = tickList.slice(-10);
    CirclesDigitList = CirclesDigitList.slice(-1000);

    const [instances, setInstances] = useState<AutoTradeInstance[]>([
        {
            evenOddSelection: 'Even',
            operator: 'Greater than', // Ensure correct type
            threshold: 50,
            tradeSelection: 'Even',
            isTrading: false,
            isTradeActive: false,
        },
    ]);

    const tradeActiveRef = useRef(false);

    const addInstance = () => {
        setInstances((prev) => [
            ...prev,
            {
                evenOddSelection: 'Even',
                operator: 'Greater than', // Ensure correct type
                threshold: 50,
                tradeSelection: 'Even',
                isTrading: false,
                isTradeActive: false,
            },
        ]);
    };

    const removeInstance = (index: number) => {
        setInstances((prev) => prev.filter((_, i) => i !== index));
    };

    const handleStartStop = (index: number) => {
        setInstances((prev) =>
            prev.map((instance, i) =>
                i === index ? { ...instance, isTrading: !instance.isTrading } : instance
            )
        );
    };

    const executeAutoTrading = (instance: AutoTradeInstance, index: number) => {
        const { evenOddSelection, operator, threshold, tradeSelection } = instance;
        const percentageToCheck = evenOddSelection === 'Even' ? evenPercentage : oddPercentage;

        if (
            (operator === 'Greater than' && percentageToCheck > threshold) ||
            (operator === 'Less than' && percentageToCheck < threshold) ||
            (operator === 'Equal' && Math.round(percentageToCheck) === threshold)
        ) {
            if (!tradeActiveRef.current) {
                tradeActiveRef.current = true;

                buy_contract(tradeSelection === 'Even' ? 'DIGITEVEN' : 'DIGITODD', true);

                setTimeout(() => {
                    tradeActiveRef.current = false;
                    setInstances((prev) =>
                        prev.map((inst, i) =>
                            i === index ? { ...inst, isTradeActive: false } : inst
                        )
                    );
                }, 5000);
            }
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            instances.forEach((instance, index) => {
                if (instance.isTrading && !instance.isTradeActive) {
                    executeAutoTrading(instance, index);
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [instances, evenPercentage, oddPercentage]);

    const getEvenOddSequence = () => {
        return digitList.map((digit, index) => (
            <div key={index} className={`ldp-digit-box ${digit % 2 === 0 ? 'even' : 'odd'}`}>
                {digit % 2 === 0 ? 'E' : 'O'}
            </div>
        ));
    };

    return (
        <div className="instance-container">
            {instances.map((instance, index) => (
                <div className="instance-card" style={{ color: is_dark_mode_on ? '#fff' : '#000' }}>
                    <div className="instance-header">
                        <span className="header-title">Instance {index + 1}</span>
                        <button className="btn-remove-instance" onClick={() => removeInstance(index)}>
                            <span>X</span>
                        </button>
                    </div>
                    <div className="digit-container">
                        <div className="inputs-group">
                            <div className="input-block">
                                <label>LDP:</label>
                                <input
                                    className="input-custom-prediction"
                                    type="number"
                                    value={customPrediction}
                                    onChange={handleCustomPredictionInputChange}
                                />
                            </div>
                            {selectTickList()}
                            <div className="input-block">
                                <small>Martingale</small>
                                <input
                                    type="number"
                                    value={martingaleValueRef.current}
                                    onChange={handleMartingaleInputChange}
                                />
                            </div>
                            {guideElement()}
                        </div>
                    </div>

                    <div className="sequence-section">
                        <h4>Even Odd</h4>
                        <div className="sequence-wrapper">{getEvenOddSequence()}</div>
                        <div className="metrics-container">
                            <button className="metric even">
                                Even {evenPercentage.toFixed(2)}%
                            </button>
                            <button className="metric odd">
                                Odd {oddPercentage.toFixed(2)}%
                            </button>
                        </div>
                    </div>

                    {/* Instances List - Table Format */}
                    <table className="instance-table">
                        <thead>
                            <tr>
                                <th>If</th>
                                <th>Condition</th>
                                <th>Percentage %</th>
                                <th>Trade Selection</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="auto-trading-row">
                                <td data-label="If">
                                    <select
                                        value={instance.evenOddSelection}
                                        onChange={(e) =>
                                            setInstances((prev) =>
                                                prev.map((inst, i) =>
                                                    i === index
                                                        ? { ...inst, evenOddSelection: e.target.value as 'Even' | 'Odd' }
                                                        : inst
                                                )
                                            )
                                        }
                                    >
                                        <option value="Even">Even %</option>
                                        <option value="Odd">Odd %</option>
                                    </select>
                                </td>
                                <td data-label="Condition">
                                    <select
                                        value={instance.operator}
                                        onChange={(e) =>
                                            setInstances((prev) =>
                                                prev.map((inst, i) =>
                                                    i === index
                                                        ? { ...inst, operator: e.target.value as 'Greater than' | 'Less than' | 'Equal' }
                                                        : inst
                                                )
                                            )
                                        }
                                    >
                                        <option value="Greater than">Greater than</option>
                                        <option value="Less than">Less than</option>
                                        <option value="Equal">Equal</option>
                                    </select>
                                </td>
                                <td data-label="Percentage %">
                                    <input
                                        type="number"
                                        value={instance.threshold}
                                        onChange={(e) =>
                                            setInstances((prev) =>
                                                prev.map((inst, i) =>
                                                    i === index ? { ...inst, threshold: parseInt(e.target.value) } : inst
                                                )
                                            )
                                        }
                                    />
                                </td>
                                <td data-label="Trade Selection">
                                    <select
                                        value={instance.tradeSelection}
                                        onChange={(e) =>
                                            setInstances((prev) =>
                                                prev.map((inst, i) =>
                                                    i === index
                                                        ? { ...inst, tradeSelection: e.target.value as 'Even' | 'Odd' }
                                                        : inst
                                                )
                                            )
                                        }
                                    >
                                        <option value="Even">Even Trade</option>
                                        <option value="Odd">Odd Trade</option>
                                    </select>
                                </td>
                                <td data-label="Action">
                                    <button onClick={() => handleStartStop(index)}>
                                        {instance.isTrading ? 'Stop' : 'Start'}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>       
            ))}
            
            <button className="btn-add-instance" onClick={addInstance}>
                Add Instance
            </button>
        </div>
    );
};

export default LDPInstanceComponent;