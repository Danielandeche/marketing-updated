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

    // Calculate based on the last 1000 digits/ticks
    const fullDigitList = digitList.slice(-1000); // Full list for percentage calculations
    const fullTickList = tickList.slice(-1000); // Full tick list for calculations

    // Calculate percentages for each digit
    const percentages = Array.from(
        { length: 10 },
        (_, digit) => calculatePercentages(fullDigitList, fullTickList, digit).matchesPercentage
    );

    // Find the highest, second highest, least, and second least percentages
    const sortedPercentages = [...percentages].slice().sort((a, b) => b - a);
    const highestPercentageDigit = percentages.indexOf(sortedPercentages[0]);
    const secondHighestPercentageDigit = percentages.indexOf(sortedPercentages[1]);
    const leastPercentageDigit = percentages.indexOf(sortedPercentages[sortedPercentages.length - 1]);
    const secondLeastPercentageDigit = percentages.indexOf(sortedPercentages[sortedPercentages.length - 2]);

    // Display only the last 10 digits and ticks
    const displayedDigitList = digitList.slice(-10);
    const displayedTickList = tickList.slice(-10);
    const displayedDigit = digitList[digitList.length - 1];

    // Get background color based on percentages
    const getBackgroundColor = (digit: number): string => {
        if (digit === highestPercentageDigit) {
            return 'linear-gradient(to top, #00a79e 55%, #777 50%)';
        }
        if (digit === secondHighestPercentageDigit) {
            return 'linear-gradient(to top, #070bf7 35%, #777 50%)';
        }
        if (digit === leastPercentageDigit) {
            return 'linear-gradient(to top, #ff444f 55%, #777 50%)';
        }
        if (digit === secondLeastPercentageDigit) {
            return 'linear-gradient(to top, #ffe644 35%, #777 50%)';
        }
        return '#666'; // Default background color
    };

    // Function to generate Even/Odd sequence
    const getEvenOddSequence = () => {
        return displayedDigitList.map((digit, index) => (
            <div key={index} className={`digit-box ${digit % 2 === 0 ? 'even' : 'odd'}`}>
                {digit % 2 === 0 ? 'E' : 'O'}
            </div>
        ));
    };

    // Function to generate Rise/Fall sequence
    const getRiseFallSequence = () => {
        const riseFallSequence: string[] = [];
        for (let i = 1; i < displayedTickList.length; i++) {
            riseFallSequence.push(displayedTickList[i] > displayedTickList[i - 1] ? 'R' : 'F');
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
                            const individualMatchPercentage = calculatePercentages(
                                fullDigitList,
                                fullTickList,
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

                    {/* Digit boxes (last 10 digits only) */}
                    <div className='all_digit_boxes'>
                        {displayedDigitList.map((digit, index) => (
                            <div key={index} className={`digit-box ${digit % 2 === 0 ? 'even' : 'odd'}`}>
                                {digit}
                            </div>
                        ))}
                    </div>
                </div>

                <div className='metrics'>
                    {/* Metric buttons */}
                    <button className='metric even' onClick={() => buy_contract_differs('DIGITOVER')}>
                        Over{' '}
                        {calculatePercentages(fullDigitList, fullTickList, predictionValue).overPercentage.toFixed(2)}%
                    </button>
                    <button className='metric odd' onClick={() => buy_contract_differs('DIGITUNDER')}>
                        Under{' '}
                        {calculatePercentages(fullDigitList, fullTickList, predictionValue).underPercentage.toFixed(2)}%
                    </button>
                    <button className='metric even' onClick={() => buy_contract_differs('DIGITMATCH')}>
                        Matches{' '}
                        {calculatePercentages(fullDigitList, fullTickList, predictionValue).matchesPercentage.toFixed(
                            2
                        )}
                        %
                    </button>
                    <button className='metric odd' onClick={() => buy_contract_differs('DIGITDIFF')}>
                        Differ{' '}
                        {calculatePercentages(fullDigitList, fullTickList, predictionValue).differsPercentage.toFixed(
                            2
                        )}
                        %
                    </button>
                </div>

                <div className='sequences'>
                    {/* Even Odd Sequences */}
                    <div className='sequence'>
                        <h4>Even Odd</h4>
                        <div className='sequence-container'>{getEvenOddSequence()}</div>
                        <div className='metrics'>
                            <button className='metric even' onClick={() => buy_contract('DIGITEVEN', true)}>
                                Even{' '}
                                {calculatePercentages(
                                    fullDigitList,
                                    fullTickList,
                                    predictionValue
                                ).evenPercentage.toFixed(2)}
                                %
                            </button>
                            <button className='metric odd' onClick={() => buy_contract('DIGITODD', true)}>
                                Odd{' '}
                                {calculatePercentages(
                                    fullDigitList,
                                    fullTickList,
                                    predictionValue
                                ).oddPercentage.toFixed(2)}
                                %
                            </button>
                        </div>
                    </div>

                    {/* Rise Fall Sequence */}
                    <div className='sequence'>
                        <h4>Rise/Fall</h4>
                        <div className='sequence-container'>{getRiseFallSequence()}</div>
                        <div className='metrics'>
                            <button className='metric even' onClick={() => buy_contract('CALL', true)}>
                                Rise{' '}
                                {calculatePercentages(
                                    fullDigitList,
                                    fullTickList,
                                    predictionValue
                                ).risePercentage.toFixed(2)}
                                %
                            </button>
                            <button className='metric odd' onClick={() => buy_contract('PUT', true)}>
                                Fall{' '}
                                {calculatePercentages(
                                    fullDigitList,
                                    fullTickList,
                                    predictionValue
                                ).fallPercentage.toFixed(2)}
                                %
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitSequenceComponent;
