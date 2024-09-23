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

    // Function to generate Even/Odd sequence
    const getEvenOddSequence = () => {
        return digitList.map((digit, index) => (
            <div key={index} className={`digit-box ${digit % 2 === 0 ? 'even' : 'odd'}`}>
                {digit % 2 === 0 ? 'E' : 'O'}
            </div>
        ));
    };

    // Function to generate Rise/Fall sequence
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
                    {/* Digit boxes */}
                    <div className='all_digit_boxes'>
                        {digitList.map((digit, index) => (
                            <div key={index} className={`digit-box ${digit % 2 === 0 ? 'even' : 'odd'}`}>
                                {digit}
                            </div>
                        ))}
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
