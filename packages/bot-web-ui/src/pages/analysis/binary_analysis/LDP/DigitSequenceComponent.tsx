import React, { useEffect, useState } from 'react';
import { calculatePercentages } from './calculatePercentage';
import './DigitSequenceComponent.css';

type Props = {
    digitList: number[];
    tickList: number[];
    customPrediction: string | number;
    is_dark_mode_on: boolean;
    selectTickList: () => JSX.Element;
    handleCustomPredictionInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    buy_contract_differs: (contract_type: string, isOverUnder?: boolean) => void;
    buy_contract: (contract_type: string, isTradeActive: boolean) => void;
};

const DigitSequenceComponent: React.FC<Props> = ({
    digitList,
    tickList,
    customPrediction,
    is_dark_mode_on,
    selectTickList,
    buy_contract,
    buy_contract_differs,
    handleCustomPredictionInputChange,
}) => {
    const [numDigits, setNumDigits] = useState<number | string>(3); // Allow both number and string
    const [comparisonOperator, setComparisonOperator] = useState('greater than');
    const [tradeAction, setTradeAction] = useState('DIGITOVER');
    const [isAutoTrading, setIsAutoTrading] = useState(false); // State for auto-trading
    const [tradeExecuted, setTradeExecuted] = useState(false); // Track if trade has been executed

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

    const shouldTriggerTrade = lastNDigits.every(digit => {
        switch (comparisonOperator) {
            case 'greater than':
                return digit > predictionValue;
            case 'less than':
                return digit < predictionValue;
            case 'equal to':
                return digit === predictionValue;
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

    const {
        evenPercentage,
        oddPercentage,
        overPercentage,
        underPercentage,
        matchesPercentage,
        differsPercentage,
        risePercentage,
        fallPercentage,
    } = calculatePercentages(digitList, tickList, predictionValue);

    digitList = digitList.slice(-10);
    tickList = tickList.slice(-10);

    const percentages = Array.from(
        { length: 10 },
        (_, digit) => calculatePercentages(digitList, tickList, digit).matchesPercentage
    );

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
            color = '#ff444f';
        } else if (digit === secondLeastPercentageDigit) {
            gradientPercentage = 50;
            color = '#ffe644';
        } else {
            gradientPercentage = 50;
            color = '#777';
        }

        return `#444 linear-gradient(to bottom, transparent ${gradientPercentage}%, ${color} 0)`;
    };

    const getEvenOddSequence = () => {
        return digitList.map((digit, index) => (
            <div key={index} className={`digit-box ${digit % 2 === 0 ? 'even' : 'odd'}`}>
                {digit % 2 === 0 ? 'E' : 'O'}
            </div>
        ));
    };

    const getRiseFallSequence = () => {
        const riseFallSequence: string[] = [];
        for (let i = 1; i < tickList.length; i++) {
            riseFallSequence.push(tickList[i] > tickList[i - 1] ? 'R' : 'F');
        }

        return riseFallSequence.map((item, index) => (
            <div key={index} className={`digit-box ${item === 'R' ? 'rise-ldp' : 'fall-ldp'}`}>
                {item}
            </div>
        ));
    };

    return (
        <div className='ldp_max_container'>
            <div className='container-ldp' style={{ color: is_dark_mode_on ? '#fff' : '#000' }}>
                <div className='digit-container-ldp'>
                    <div className='last_p'>
                        <label htmlFor=''>Last Digit Prediction:</label>
                        <input
                            className='custom_prediction'
                            type='number'
                            value={customPrediction}
                            onChange={handleCustomPredictionInputChange}
                        />
                        {selectTickList()}
                    </div>

                    <div className='digit-list'>
                        {Array.from({ length: 10 }, (_, digit) => {
                            const individualMatchPercentage = calculatePercentages(
                                digitList,
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
                </div>

                <div className='custom-trade-form'>
                    <label>
                        If the last
                        <input type='number' value={numDigits} onChange={handleNumDigitsChange} />
                        digits are
                    </label>
                    <select value={comparisonOperator} onChange={handleComparisonOperatorChange}>
                        <option value='greater than'>greater than</option>
                        <option value='less than'>less than</option>
                        <option value='equal to'>equal to</option>
                    </select>
                    <label>LDP, it trades </label>
                    <select value={tradeAction} onChange={handleTradeActionChange}>
                        <option value='DIGITOVER'>Digit Over</option>
                        <option value='DIGITUNDER'>Digit Under</option>
                        <option value='DIGITDIFF'>Digit Differs</option>
                    </select>
                    <div className='auto-trade-controls'>
                        <button
                            style={{ backgroundColor: isAutoTrading ? 'red' : 'green', color: '#fff' }}
                            onClick={() => setIsAutoTrading(prev => !prev)}
                        >
                            {isAutoTrading ? 'Stop Auto Trading' : 'Start Auto Trading'}
                        </button>
                    </div>
                </div>

                <div className='metrics'>
                    {/* Metric buttons */}
                    <button className='metric over' onClick={() => buy_contract_differs('DIGITOVER')}>
                        Over {overPercentage.toFixed(2)}%
                    </button>
                    <button className='metric under' onClick={() => buy_contract_differs('DIGITUNDER')}>
                        Under {underPercentage.toFixed(2)}%
                    </button>
                    <button className='metric match' onClick={() => buy_contract_differs('DIGITMATCH')}>
                        Matches {matchesPercentage.toFixed(2)}%
                    </button>
                    <button className='metric under' onClick={() => buy_contract_differs('DIGITDIFF')}>
                        Differ {differsPercentage.toFixed(2)}%
                    </button>
                </div>

                <div className='sequences'>
                    {/* Even Odd Sequences */}
                    <div className='sequence'>
                        <h4>Even Odd</h4>
                        <div className='sequence-container'>{getEvenOddSequence()}</div>
                        <div className='metrics'>
                            <button className='metric even' onClick={() => buy_contract('DIGITEVEN', true)}>
                                Even {evenPercentage.toFixed(2)}%
                            </button>
                            <button className='metric odd' onClick={() => buy_contract('DIGITODD', true)}>
                                Odd {oddPercentage.toFixed(2)}%
                            </button>
                        </div>
                    </div>

                    {/* Rise Fall Sequence */}
                    <div className='sequence'>
                        <h4>Rise/Fall</h4>
                        <div className='sequence-container'>{getRiseFallSequence()}</div>
                        <div className='metrics'>
                            <button className='metric even' onClick={() => buy_contract('CALL', true)}>
                                Rise {risePercentage.toFixed(2)}%
                            </button>
                            <button className='metric odd' onClick={() => buy_contract('PUT', true)}>
                                Fall {fallPercentage.toFixed(2)}%
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitSequenceComponent;