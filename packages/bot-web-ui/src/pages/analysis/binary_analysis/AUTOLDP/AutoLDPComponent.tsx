import React, { useEffect, useState, useCallback } from 'react';
import { calculatePercentages } from './calculatePercentage';
import './AutoLDPComponent.css';
import Modal from 'react-modal';
import { FaYoutube, FaCloudUploadAlt, FaCloudDownloadAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

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

const AutoLDPComponent: React.FC<Props> = ({
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
    const [numDigits, setNumDigits] = useState<number | string>(3);
    const [comparisonOperator, setComparisonOperator] = useState('greater than');
    const [tradeAction, setTradeAction] = useState('DIGITOVER');
    const [isAutoTrading, setIsAutoTrading] = useState(false);
    const [tradeExecuted, setTradeExecuted] = useState(false);
    const [numDigits1, setNumDigits1] = useState<number | string>(5);
    const [comparisonOperator1, setComparisonOperator1] = useState('even');
    const [tradeAction1, setTradeAction1] = useState('DIGITEVEN');
    const [isAutoTrading1, setIsAutoTrading1] = useState(false);
    const [tradeExecuted1, setTradeExecuted1] = useState(false);
    const [lastTradeType, setLastTradeType] = useState<string | null>(null);
    const [presetName, setPresetName] = useState('');
    const [fileInputKey, setFileInputKey] = useState(0);
    const [isCustomTradeFormVisible, setIsCustomTradeFormVisible] = useState(true);
    const [isSequencesVisible, setIsSequencesVisible] = useState(true);

    // Function to download settings as a JSON file
    const downloadSettings = () => {
        const name = window.prompt("Enter the name for your settings file:", presetName);
        if (name) {
            const settings = {
                numDigits,
                comparisonOperator,
                tradeAction,
                customPrediction,
                martingaleValue: martingaleValueRef.current,
                isAutoTrading,
                numDigits1,
                comparisonOperator1,
                tradeAction1,
                isCustomTradeFormVisible,
                isSequencesVisible
            };
    
            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}.json`; // Use the entered name
            a.click();
            URL.revokeObjectURL(url); // Cleanup
        }
    };

    // Function to upload settings from a JSON file
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const uploadedSettings = JSON.parse(e.target?.result as string);
                setNumDigits(uploadedSettings.numDigits || 3);
                setComparisonOperator(uploadedSettings.comparisonOperator || 'greater than');
                setTradeAction(uploadedSettings.tradeAction || 'DIGITOVER');
                handleCustomPredictionInputChange({ target: { value: uploadedSettings.customPrediction || 0 } } as any);
                martingaleValueRef.current = uploadedSettings.martingaleValue || '';
                setIsAutoTrading(uploadedSettings.isAutoTrading || false);
                setNumDigits1(uploadedSettings.numDigits1 || 3);
                setComparisonOperator1(uploadedSettings.comparisonOperator1 || 'odd');
                setTradeAction1(uploadedSettings.tradeAction1 || 'DIGITODD');
                setIsCustomTradeFormVisible(uploadedSettings.isCustomTradeFormVisible ?? true);
                setIsSequencesVisible(uploadedSettings.isSequencesVisible ?? true);
            };
            reader.readAsText(file);
            setFileInputKey(prev => prev + 1); // Reset input value
        }
    };
    

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
            default:
                return false;
        }
    });

    const shouldTriggerTrade1 = useCallback(() => {
        if (comparisonOperator1 === 'custom') {
            const allEven = lastNDigits1.every(digit => digit % 2 === 0);
            const allOdd = lastNDigits1.every(digit => digit % 2 !== 0);
            if (allEven && lastTradeType !== 'even') {
                handle_buy_contract('DIGITODD');
                setLastTradeType('even');
            } else if (allOdd && lastTradeType !== 'odd') {
                handle_buy_contract('DIGITEVEN');
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

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoTrading) {
            interval = setInterval(() => {
                if (shouldTriggerTrade && !tradeExecuted) {
                    handle_buy_contract_differs(tradeAction);
                    setTradeExecuted(true);
                } else if (!shouldTriggerTrade) {
                    setTradeExecuted(false);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [buy_contract_differs, isAutoTrading, shouldTriggerTrade, tradeAction, tradeExecuted]);

    useEffect(() => {
        let interval: NodeJS.Timeout;   
        if (isAutoTrading1) {
            interval = setInterval(() => {
                if (shouldTriggerTrade1() && !tradeExecuted1) {
                    if (comparisonOperator1 !== 'custom') {
                        handle_buy_contract(tradeAction1);
                        setTradeExecuted1(true);
                    }
                } else if (!shouldTriggerTrade1() && tradeExecuted1) {
                    setTradeExecuted1(false);
                    setLastTradeType(null);
                }
            }, 1000);
        }   
        return () => clearInterval(interval);
    }, [buy_contract, isAutoTrading1, tradeAction1, tradeExecuted1, shouldTriggerTrade1, comparisonOperator1]);    

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

    useEffect(() => {
        // Load settings from localStorage on mount
        const storedNumDigits = localStorage.getItem('numDigits');
        const storedComparisonOperator = localStorage.getItem('comparisonOperator');
        const storedTradeAction = localStorage.getItem('tradeAction');
        const storedCustomPrediction = localStorage.getItem('customPrediction');
        const storedMartingaleValue = localStorage.getItem('martingaleValue');
        const storedIsAutoTrading = localStorage.getItem('isAutoTrading');
        const storedNumDigits1 = localStorage.getItem('numDigits1');
        const storedComparisonOperator1 = localStorage.getItem('comparisonOperator1');
        const storedTradeAction1 = localStorage.getItem('tradeAction1');
        const storedIsCustomTradeFormVisible = localStorage.getItem('isCustomTradeFormVisible');
        const storedIsSequencesVisible = localStorage.getItem('isSequencesVisible');
        if (storedMartingaleValue) {
            martingaleValueRef.current = JSON.parse(storedMartingaleValue);
        }
    
        setNumDigits(storedNumDigits ? JSON.parse(storedNumDigits) : 3);
        setComparisonOperator(storedComparisonOperator || 'greater than');
        setTradeAction(storedTradeAction || 'DIGITOVER');
        handleCustomPredictionInputChange({ target: { value: storedCustomPrediction || 0 } } as any);
        setIsAutoTrading(storedIsAutoTrading ? JSON.parse(storedIsAutoTrading) : false);
        setNumDigits1(storedNumDigits1 ? JSON.parse(storedNumDigits1) : 3);
        setComparisonOperator1(storedComparisonOperator1 || 'odd');
        setTradeAction1(storedTradeAction1 || 'DIGITODD');
        setIsCustomTradeFormVisible(storedIsCustomTradeFormVisible ? JSON.parse(storedIsCustomTradeFormVisible) : true);
        setIsSequencesVisible(storedIsSequencesVisible ? JSON.parse(storedIsSequencesVisible) : true);
    }, []);
    
    useEffect(() => {
        // Save settings to localStorage whenever they change
        localStorage.setItem('numDigits', JSON.stringify(numDigits));
        localStorage.setItem('comparisonOperator', comparisonOperator);
        localStorage.setItem('tradeAction', tradeAction);
        localStorage.setItem('customPrediction', JSON.stringify(customPrediction));
        localStorage.setItem('isAutoTrading', JSON.stringify(isAutoTrading));
        localStorage.setItem('numDigits1', JSON.stringify(numDigits1));
        localStorage.setItem('comparisonOperator1', comparisonOperator1);
        localStorage.setItem('tradeAction1', tradeAction1);
        localStorage.setItem('isCustomTradeFormVisible', JSON.stringify(isCustomTradeFormVisible));
        localStorage.setItem('isSequencesVisible', JSON.stringify(isSequencesVisible));
        if (martingaleValueRef.current !== null && martingaleValueRef.current !== undefined) {
            localStorage.setItem('martingaleValue', JSON.stringify(martingaleValueRef.current));
        }
    }, [
        numDigits,
        comparisonOperator,
        tradeAction,
        customPrediction,
        martingaleValueRef.current,
        isAutoTrading,
        numDigits1,
        comparisonOperator1,
        tradeAction1,
        isCustomTradeFormVisible,
        isSequencesVisible,
    ]);    

    return (
        <div className='ldp_max_container'>
            <div className='container-ldp' style={{ color: is_dark_mode_on ? '#fff' : '#000' }}>
                <div className='digit-container-ldp'>
                    <div className='last_p'>
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
                        <div className='settings-controls'>
                            <div className='upload-settings'>
                                <label htmlFor='file-upload' className='upload-label'>
                                    <FaCloudUploadAlt className='iconu' />
                                    <span>Upload</span>
                                </label>
                                <input
                                    id='file-upload'
                                    key={fileInputKey}
                                    type='file'
                                    accept='.json'
                                    onChange={handleFileUpload}
                                    className='file-upload-input'
                                />
                            </div>
                            <div className='download-settings'>
                                <label onClick={downloadSettings} className='download-label'>
                                    <FaCloudDownloadAlt className='icond' />
                                    <span>Download</span>
                                </label>
                            </div>
                        </div>
                        <div onClick={() => openModal('https://www.youtube.com/embed/gsWzKmslEnY')} style={{ cursor: 'pointer' }}>
                            <FaYoutube size={35} style={{ color: '#FF0000' }} />
                        </div>
                    </div>                  
    
                    {/* Digit List */}
                    <div className='digit-list'>
                        {Array.from({ length: 10 }, (_, digit) => {
                            const individualMatchPercentage = calculatePercentages(CirclesDigitList, tickList, digit).matchesPercentage;
                            const backgroundColor = getBackgroundColor(digit);
    
                            return (
                                <div
                                    key={digit}
                                    className={`digit-item ${digit === customPrediction ? 'selected' : ''}`}
                                    onClick={() => handleCustomPredictionInputChange({ target: { value: digit } })}
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
                                    <option value="less than LDP">Less than LDP</option>
                                    <option value="less or equal to LDP">Less or equal to LDP</option>
                                    <option value="greater than LDP">Greater than LDP</option>
                                    <option value="greater or equal to LDP">Greater or equal to LDP</option>
                                    <option value="equal to LDP">Equal to LDP</option>
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
                                        {isAutoTrading ? 'Stop Auto Trading' : 'Start Auto Trading'}
                                    </button>
                                </div>
                                <div onClick={() => openModal('https://www.youtube.com/embed/gsWzKmslEnY')} style={{ cursor: 'pointer' }}>
                                    <FaYoutube size={40} style={{ color: '#FF0000' }} />
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
                                            {isAutoTrading1 ? 'Stop Auto Trading' : 'Start Auto Trading'}
                                        </button>
                                    </div>
                                    <div onClick={() => openModal('https://www.youtube.com/embed/gsWzKmslEnY')} style={{ cursor: 'pointer' }}>
                                        <FaYoutube size={40} style={{ color: '#FF0000' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
    
                {/* Modal for YouTube Video */}
                <Modal
                    isOpen={isModalOpen}
                    onRequestClose={closeModal}
                    style={{
                        overlay: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            zIndex: 1000,
                        },
                        content: {
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            background: '#fff',
                            zIndex: 1001,
                        },
                    }}
                >
                    <h2 style={{ color: '#000', fontSize: '20px', textAlign: 'center', margin: '5px 0' }}>
                        Pro Analysistool Tutorial
                    </h2>
                    <iframe
                        width='560'
                        height='315'
                        src={videoUrl}
                        title='YouTube video player'
                        frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
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

export default AutoLDPComponent;
