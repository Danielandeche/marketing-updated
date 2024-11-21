import React, { useEffect, useState, useCallback } from 'react';
import { FaYoutube, FaEye, FaEyeSlash } from 'react-icons/fa';
import { calculatePercentages } from './calculatePercentage';
import './DigitSequenceComponent.css';

type Props = {
    digitList: number[];
    tickList: number[];
    CirclesDigitList: number[];
    customPrediction: string | number;
    is_dark_mode_on: boolean;
    martingaleValueRef: React.MutableRefObject<string | number>;
    isTradeActive: boolean;
    guideElement: () => JSX.Element;
    handleMartingaleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    selectTickList: () => JSX.Element;
    handleCustomPredictionInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    buy_contract_differs: (contract_type: string, isOverUnder?: boolean) => void;
    buy_contract: (contract_type: string, isTradeActive: boolean) => void;
    setIsTradeActive: React.Dispatch<React.SetStateAction<boolean>>;
    numDigits: number | string;
    setNumDigits: React.Dispatch<React.SetStateAction<number | string>>;
    comparisonOperator: string;
    setComparisonOperator: React.Dispatch<React.SetStateAction<string>>;
    tradeAction: string;
    setTradeAction: React.Dispatch<React.SetStateAction<string>>;
    isAutoTrading: boolean;
    setIsAutoTrading: React.Dispatch<React.SetStateAction<boolean>>;
    tradeExecuted: boolean;
    setTradeExecuted: React.Dispatch<React.SetStateAction<boolean>>;
    numDigits1: number | string;
    setNumDigits1: React.Dispatch<React.SetStateAction<number | string>>;
    comparisonOperator1: string;
    setComparisonOperator1: React.Dispatch<React.SetStateAction<string>>;
    tradeAction1: string;
    setTradeAction1: React.Dispatch<React.SetStateAction<string>>;
    isAutoTrading1: boolean;
    setIsAutoTrading1: React.Dispatch<React.SetStateAction<boolean>>;
    tradeExecuted1: boolean;
    setTradeExecuted1: React.Dispatch<React.SetStateAction<boolean>>;
    lastTradeType: string | null;
    setLastTradeType: React.Dispatch<React.SetStateAction<string | null>>;
    presetName: string;
    setPresetName: React.Dispatch<React.SetStateAction<string>>;
    fileInputKey: number;
    setFileInputKey: React.Dispatch<React.SetStateAction<number>>;
    isCustomTradeFormVisible: boolean;
    setIsCustomTradeFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
    isSequencesVisible: boolean;
    setIsSequencesVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const AutoLDPComponent: React.FC<Props> = ({
    digitList,
    tickList,
    CirclesDigitList,
    is_dark_mode_on,
    customPrediction,
    martingaleValueRef,
    guideElement,
    handleMartingaleInputChange,
    selectTickList,
    buy_contract,
    buy_contract_differs,
    handleCustomPredictionInputChange,
    numDigits,
    setNumDigits,
    comparisonOperator,
    setComparisonOperator,
    tradeAction,
    setTradeAction,
    isAutoTrading,
    setIsAutoTrading,
    tradeExecuted,
    setTradeExecuted,
    numDigits1,
    setNumDigits1,
    comparisonOperator1,
    setComparisonOperator1,
    tradeAction1,
    setTradeAction1,
    isAutoTrading1,
    setIsAutoTrading1,
    tradeExecuted1,
    setTradeExecuted1,
    lastTradeType,
    setLastTradeType,
    isCustomTradeFormVisible,
    setIsCustomTradeFormVisible,
    isSequencesVisible,
    setIsSequencesVisible,
}) => {


    const handleNumDigitsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setNumDigits(value === '' ? '' : Number(value)); // Set to empty string if cleared
    };

    const handleComparisonOperatorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setComparisonOperator(event.target.value);
    };

    const handleTradeActionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setTradeAction(event.target.value);
    };

    const predictionValue = typeof customPrediction === 'string' ? parseInt(customPrediction) : customPrediction;
    const lastNDigits = digitList.slice(-numDigits);

    const handleNumDigitsChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setNumDigits1(value === '' ? '' : Number(value));
    };

    const handleComparisonOperatorChange1 = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setComparisonOperator1(event.target.value);
    };

    const handleTradeActionChange1 = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setTradeAction1(event.target.value);
    };

    const lastNDigits1 = digitList.slice(-Number(numDigits1));

    const shouldTriggerTrade = lastNDigits.every(digit => {
        switch (comparisonOperator) {
            case 'less than LDP':
                return digit < predictionValue;
            case 'less or equal to LDP':
                return digit <= predictionValue;
            case 'greater than LDP':
                return digit > predictionValue;
            case 'greater or equal to LDP':
                return digit >= predictionValue;
            case 'equal to LDP':
                return digit === predictionValue;
            case 'all digits are the same':
                return lastNDigits.every(d => d === lastNDigits[0]);
            default:
                return false;
        }
    });


    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isAutoTrading) {
            interval = setInterval(() => {
                if (shouldTriggerTrade && !tradeExecuted) {
                    buy_contract_differs(tradeAction); // Take the trade if conditions are met
                    setTradeExecuted(true); // Mark trade as executed
                } else if (!shouldTriggerTrade) {
                    setTradeExecuted(false); // Reset trade execution if conditions are not met
                }
            }, 1000); // Adjust the interval time as needed
        }

        return () => clearInterval(interval); // Cleanup interval on unmount or when auto-trading stops
    }, [buy_contract_differs, isAutoTrading, shouldTriggerTrade, tradeAction, tradeExecuted]);

     //even odd auto trading
    const shouldTriggerTrade1 = useCallback(() => {
        if (comparisonOperator1 === 'custom') {
            const allEven = lastNDigits1.every(digit => digit % 2 === 0);
            const allOdd = lastNDigits1.every(digit => digit % 2 !== 0);
            if (allEven && lastTradeType !== 'even') {
                buy_contract('DIGITODD', true);
                setLastTradeType('even');
            } else if (allOdd && lastTradeType !== 'odd') {
                buy_contract('DIGITEVEN', true);
                setLastTradeType('odd');
            }
            return allEven || allOdd;
        } else {
            return lastNDigits1.every(digit => {
                if (comparisonOperator1 === 'even') return digit % 2 === 0;
                if (comparisonOperator1 === 'odd') return digit % 2 !== 0;
                return false;
            });
        }
    }, [comparisonOperator1, lastNDigits1, lastTradeType, buy_contract]);
    
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoTrading1) {
            interval = setInterval(() => {
                if (shouldTriggerTrade1() && !tradeExecuted1) {
                    if (comparisonOperator1 !== 'custom') {
                        buy_contract(tradeAction1, true); // Execute trade
                    }
                    setTradeExecuted1(true); // Mark trade as executed
                } else if (!shouldTriggerTrade1()) {
                    setTradeExecuted1(false); // Reset trade execution if conditions aren't met
                    setLastTradeType(null);
                }
            }, 1000); // Adjust the interval time as needed
        }
        return () => clearInterval(interval); // Cleanup interval on unmount or when auto-trading stops
    }, [buy_contract, isAutoTrading1, tradeAction1, tradeExecuted1, shouldTriggerTrade1, comparisonOperator1]); 

    calculatePercentages(digitList, tickList, predictionValue);

    digitList = digitList.slice(-10);
    tickList = tickList.slice(-10);
    CirclesDigitList = CirclesDigitList.slice(-1000);

    const percentages = Array.from(
        { length: 10 },
        (_, digit) => calculatePercentages(CirclesDigitList, tickList, digit).matchesPercentage
    );

    const getEvenOddSequence = () => {
        return digitList.map((digit, index) => (
            <div key={index} className={`digit-box ${digit % 2 === 0 ? 'even' : 'odd'}`}>
                {digit % 2 === 0 ? 'E' : 'O'}
            </div>
        ));
    };

    const sortedPercentages = [...percentages].slice().sort((a, b) => b - a);
    const highestPercentageDigit = percentages.indexOf(sortedPercentages[0]);
    const secondHighestPercentageDigit = percentages.indexOf(sortedPercentages[1]);
    const leastPercentageDigit = percentages.indexOf(sortedPercentages[sortedPercentages.length - 1]);
    const secondLeastPercentageDigit = percentages.indexOf(sortedPercentages[sortedPercentages.length - 2]);

    const getBackgroundColor = (digit: number): string => {
        let gradientPercentage: number, color: string;

        if (digit === highestPercentageDigit) {
            gradientPercentage = 40;
            color = '#00a79e';
        } else if (digit === secondHighestPercentageDigit) {
            gradientPercentage = 50;
            color = '#070bf7';
        } else if (digit === leastPercentageDigit) {
            gradientPercentage = 40;
            color = '#ff0000';
        } else if (digit === secondLeastPercentageDigit) {
            gradientPercentage = 50;
            color = '#ffe644';
        } else {
            gradientPercentage = 50;
            color = '#777';
        }

        return `#444 linear-gradient(to bottom, transparent ${gradientPercentage}%, ${color} 0)`;
    }; 

    return (
        <div className='ldp_max_container'>
            <div className='container-ldp' style={{ color: is_dark_mode_on ? '#fff' : '#000' }}>
                <div className='digit-container-ldp'>
                    <div className='last_p'>
                        <div className='martingale_ldp'>
                            <label htmlFor=''>LDP:</label>
                            <input
                                className='custom_prediction'
                                type='number'
                                value={customPrediction}
                                onChange={handleCustomPredictionInputChange}
                            />
                        </div>
                        {selectTickList()}
                        <div className='martingale_ldp'>
                            <small>Martingale</small>
                            <input
                                type='number'
                                value={martingaleValueRef.current}
                                onChange={handleMartingaleInputChange}
                            />
                        </div>
                        {guideElement()}  
                    </div>
                </div>
                <div className="card">
                    <h4>Click on circles to select Prediction</h4>
                    <div className='digit-list'>
                        {Array.from({ length: 10 }, (_, digit) => {
                            const individualMatchPercentage = calculatePercentages(
                                CirclesDigitList,
                                tickList,
                                digit
                            ).matchesPercentage;
                            const backgroundColor = getBackgroundColor(digit);

                            return (
                                <div
                                    key={digit}
                                    className={`digit-item ${digit === customPrediction ? 'selected' : ''}`}
                                    onClick={() =>
                                        handleCustomPredictionInputChange({ target: { value: digit } } as any)
                                    }
                                    style={{ background: backgroundColor }}
                                >
                                    {digit === customPrediction && <div className='red-pointer' />}
                                    <h3>{digit}</h3>
                                    <h4>{individualMatchPercentage.toFixed(2)}%</h4>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="card-container">
                    <div className="card-header">
                        <h4>Over Under Differ LDP Auto</h4>
                        <div className="toggle-icon" onClick={() => setIsCustomTradeFormVisible(prev => !prev)}>
                            {isCustomTradeFormVisible ? <FaEyeSlash size={25} /> : <FaEye size={25} />}
                        </div>
                    </div>

                    {isCustomTradeFormVisible && (
                        <div className="card-body">
                            {/* All Digit Boxes */}
                            <div className='all_digit_boxes'>
                                {digitList.map((digit, index) => {
                                    let className = '';
            
                                    if (typeof customPrediction === 'number') {
                                        if (digit > customPrediction) {
                                            className = 'over';
                                        } else if (digit < customPrediction) {
                                            className = 'under';
                                        } else {
                                            className = 'same';
                                        }
                                    }
            
                                    return (
                                        <div key={index} className={`digit-box ${className}`}>
                                            {digit}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="custom-trade-form">
                                <label>
                                    If the last
                                    <input type="number" value={numDigits} onChange={handleNumDigitsChange} />
                                    digits are
                                </label>
                                <select value={comparisonOperator} onChange={handleComparisonOperatorChange}>
                                    <option selected>Select &lt;, &gt;, =, ≤, or ≥</option>
                                    <option value="less than LDP">Less than LDP</option>
                                    <option value="less or equal to LDP">Less or equal to LDP</option>
                                    <option value="greater than LDP">Greater than LDP</option>
                                    <option value="greater or equal to LDP">Greater or equal to LDP</option>
                                    <option value="equal to LDP">Equal to LDP</option>
                                    <option value="all digits are the same">All digits are the same</option>
                                </select>
                                <label>it trades </label>
                                <select value={tradeAction} onChange={handleTradeActionChange}>
                                    <option value="DIGITOVER">Digit Over</option>
                                    <option value="DIGITUNDER">Digit Under</option>
                                    <option value="DIGITDIFF">Digit Differs</option>
                                </select>
                                <div className="auto-trade-controls">
                                    <button
                                        style={{ backgroundColor: isAutoTrading ? 'red' : 'green', color: '#fff' }}
                                        onClick={() => setIsAutoTrading(prev => !prev)}
                                    >
                                        {isAutoTrading ? 'STOP' : 'START'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
    
                <div className="card-container">
                    <div className="card-header">
                        <h4>Even Odd Auto bot</h4>
                        <div className="toggle-icon" onClick={() => setIsSequencesVisible(prev => !prev)}>
                            {isSequencesVisible ? <FaEyeSlash size={25} /> : <FaEye size={25} />}
                        </div>
                    </div>

                    {isSequencesVisible && (
                        <div className="card-body">
                            <div className="sequence">
                                <div className="sequence-container">{getEvenOddSequence()}</div>
                                <div className="custom-trade-form">
                                    <label>
                                        If the last
                                        <input type="number" value={numDigits1} onChange={handleNumDigitsChange1} />
                                        digits are
                                    </label>
                                    <select value={comparisonOperator1} onChange={handleComparisonOperatorChange1}>
                                        <option value="odd">Odd</option>
                                        <option value="even">Even</option>
                                        <option value="custom">If Even → Odd, Odd → Even</option>
                                    </select>

                                    {comparisonOperator1 !== 'custom' && (
                                        <>
                                            <label>it trades</label>
                                            <select value={tradeAction1} onChange={handleTradeActionChange1}>
                                                <option value="DIGITODD">Odd Trade</option>
                                                <option value="DIGITEVEN">Even Trade</option>
                                            </select>
                                        </>
                                    )}

                                    <div className="auto-trade-controls">
                                        <button
                                            style={{ backgroundColor: isAutoTrading1 ? 'red' : 'green', color: '#fff' }}
                                            onClick={() => setIsAutoTrading1(prev => !prev)}
                                        >
                                            {isAutoTrading1 ? 'STOP' : 'START'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutoLDPComponent;
