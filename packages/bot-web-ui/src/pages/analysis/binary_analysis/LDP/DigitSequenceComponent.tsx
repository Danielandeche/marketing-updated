import React, { useState } from 'react';
import { calculatePercentages } from './calculatePercentage';
import './DigitSequenceComponent.css';
import Modal from 'react-modal';
import { FaYoutube} from 'react-icons/fa';

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
};

const DigitSequenceComponent: React.FC<Props> = ({
    digitList,
    tickList,
    CirclesDigitList,
    is_dark_mode_on,
    customPrediction,
    martingaleValueRef,
    isTradeActive,
    guideElement,
    setIsTradeActive,
    handleMartingaleInputChange,
    selectTickList,
    buy_contract,
    buy_contract_differs,
    handleCustomPredictionInputChange,
}) => {

    const predictionValue = typeof customPrediction === 'string' ? parseInt(customPrediction) : customPrediction;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    const openModal = (url: string) => {
        setVideoUrl(url);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setVideoUrl('');
    };

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
    CirclesDigitList = CirclesDigitList.slice(-1000);

    const percentages = Array.from(
        { length: 10 },
        (_, digit) => calculatePercentages(CirclesDigitList, tickList, digit).matchesPercentage
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

    const handle_buy_contract_differs = (contract_type: string) => {
        if (!isTradeActive) {
            setIsTradeActive(true);
            buy_contract_differs(contract_type);
        }
    };
    const handle_buy_contract = (contract_type: string) => {
        if (!isTradeActive) {
            setIsTradeActive(true);
            buy_contract(contract_type, true);
        }
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
                        <div onClick={() => openModal('https://www.youtube.com/embed/gsWzKmslEnY')} style={{ cursor: 'pointer' }}>
                            <FaYoutube size={35} style={{ color: '#FF0000' }} />
                        </div>
                    </div>
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
                    <button className='metric over' onClick={() => handle_buy_contract_differs('DIGITOVER')}>
                        Over {overPercentage.toFixed(2)}%
                    </button>
                    <button className='metric under' onClick={() => handle_buy_contract_differs('DIGITUNDER')}>
                        Under {underPercentage.toFixed(2)}%
                    </button>
                    <button className='metric match' onClick={() => handle_buy_contract_differs('DIGITMATCH')}>
                        Matches {matchesPercentage.toFixed(2)}%
                    </button>
                    <button className='metric under' onClick={() => handle_buy_contract_differs('DIGITDIFF')}>
                        Differ {differsPercentage.toFixed(2)}%
                    </button>
                    <div onClick={() => openModal('https://www.youtube.com/embed/gsWzKmslEnY')} style={{ cursor: 'pointer' }}>
                        <FaYoutube size={40} style={{ color: '#FF0000' }} />
                    </div>
                </div>            

                <div className='sequences'>
                    {/* Even Odd Sequences */}
                    <div className='sequence'>
                        <h4>Even Odd</h4>
                        <div className='sequence-container'>{getEvenOddSequence()}</div>
                        <div className='metrics'>
                            <button className='metric even' onClick={() => handle_buy_contract('DIGITEVEN')}>
                                Even {evenPercentage.toFixed(2)}%
                            </button>
                            <button className='metric odd' onClick={() => handle_buy_contract('DIGITODD')}>
                                Odd {oddPercentage.toFixed(2)}%
                            </button>
                            <div onClick={() => openModal('https://www.youtube.com/embed/gsWzKmslEnY')} style={{ cursor: 'pointer' }}>
                                <FaYoutube size={40} style={{ color: '#FF0000' }} />
                            </div>
                        </div>
                    </div>

                    {/* Rise Fall Sequence */}
                    <div className='sequence'>
                        <h4>Rise/Fall</h4>
                        <div className='sequence-container'>{getRiseFallSequence()}</div>
                        <div className='metrics'>
                            <button className='metric even' onClick={() => handle_buy_contract('CALL')}>
                                Rise {risePercentage.toFixed(2)}%
                            </button>
                            <button className='metric odd' onClick={() => handle_buy_contract('PUT')}>
                                Fall {fallPercentage.toFixed(2)}%
                            </button>
                            <div onClick={() => openModal('https://www.youtube.com/embed/gsWzKmslEnY')} style={{ cursor: 'pointer' }}>
                                <FaYoutube size={40} style={{ color: '#FF0000' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal for YouTube Video */}
                <Modal
                    isOpen={isModalOpen}
                    onRequestClose={closeModal}
                    style={{
                        overlay: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark background
                            zIndex: 1000, // High z-index for overlay
                        },
                        content: {
                            top: '50%', // Center vertically
                            left: '50%', // Center horizontally
                            right: 'auto',
                            bottom: 'auto',
                            transform: 'translate(-50%, -50%)', // Adjust positioning
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            background: '#fff', // Background color
                            zIndex: 1001, // Higher z-index for content
                        },
                    }}
                >
                    <h2 style={{ color: '#000', fontSize: '20px', textAlign: 'center', margin: '5px 0' }}>
                    Pro Analysistool Tutorial
                </h2>
                    <iframe
                        width="560"
                        height="315"
                        src={videoUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                    <button 
                        onClick={closeModal} 
                        style={{ display: 'block', margin: '5px auto', backgroundColor: 'red', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Close
                    </button>

                </Modal>
            </div>
        </div>
    );
};

export default DigitSequenceComponent;