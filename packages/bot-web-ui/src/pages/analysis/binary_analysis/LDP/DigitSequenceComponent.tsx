import React from 'react';
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
    const predictionValue = typeof customPrediction === 'string' ? parseInt(customPrediction) : customPrediction;

    // Calculate percentages based on digitList, tickList, and customPrediction (predictionValue)
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

    // Limit both lists to the last 10 items
    digitList = digitList.slice(-10);
    tickList = tickList.slice(-10);

    // Calculate percentages for each digit (0-9)
    const percentages = Array.from(
        { length: 10 },
        (_, digit) => calculatePercentages(digitList, tickList, digit).matchesPercentage
    );

    // Find the highest, second highest, least, and second least percentages
    const sortedPercentages = [...percentages].slice().sort((a, b) => b - a);
    const highestPercentageDigit = percentages.indexOf(sortedPercentages[0]);
    const secondHighestPercentageDigit = percentages.indexOf(sortedPercentages[1]);
    const leastPercentageDigit = percentages.indexOf(sortedPercentages[sortedPercentages.length - 1]);
    const secondLeastPercentageDigit = percentages.indexOf(sortedPercentages[sortedPercentages.length - 2]);

    const getBackgroundColor = (digit: number): string => {
        let gradientPercentage: number;
        let color: string;
    
        if (digit === highestPercentageDigit) {
            gradientPercentage = 40; // Percentage where the solid color starts
            color = '#00a79e'; // Top solid color
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
    
        // Construct the background with a solid color and a transparent gradient
        return `#444 linear-gradient(to bottom, transparent ${gradientPercentage}%, ${color} 0)`;
    };
    

    // Generate Even/Odd sequence
    const getEvenOddSequence = () => {
        return digitList.map((digit, index) => (
            <div key={index} className={`digit-box ${digit % 2 === 0 ? 'even' : 'odd'}`}>
                {digit % 2 === 0 ? 'E' : 'O'}
            </div>
        ));
    };

    // Generate Rise/Fall sequence
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

                    {/* Digit list with individual match percentages */}
                    <div className='digit-list'>
                        {Array.from({ length: 10 }, (_, digit) => {
                            // Calculate the match percentage for the current digit (0-9)
                            const individualMatchPercentage = calculatePercentages(digitList, tickList, digit).matchesPercentage;
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

                    {/* Digit boxes (last 10 digits only) */}
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

                <div className='metrics'>
                    {/* Metric buttons */}
                    <button className='metric even' onClick={() => buy_contract_differs('DIGITOVER')}>
                        Over {overPercentage.toFixed(2)}%
                    </button>
                    <button className='metric odd' onClick={() => buy_contract_differs('DIGITUNDER')}>
                        Under {underPercentage.toFixed(2)}%
                    </button>
                    <button className='metric even' onClick={() => buy_contract_differs('DIGITMATCH')}>
                        Matches {matchesPercentage.toFixed(2)}%
                    </button>
                    <button className='metric odd' onClick={() => buy_contract_differs('DIGITDIFF')}>
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
