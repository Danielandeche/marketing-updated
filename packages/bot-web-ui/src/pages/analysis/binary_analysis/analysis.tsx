import React, { useEffect, useRef, useState } from 'react';
import { TbSettingsDollar } from 'react-icons/tb';
import { api_base, api_base4, getLiveAccToken, getToken } from '@deriv/bot-skeleton';
import { observer, useStore } from '@deriv/stores';
import { useDBotStore } from 'Stores/useDBotStore';
import BotSettings from './components/bot_settings';
import DiffersBalls from './components/differs_balls';
import ApolloLineChart from './components/line_chart';
import OverUnderBarChart from './components/ou_bar_chart';
import PieChart from './components/pie_chart';
import RiseFallBarChart from './components/rf_bar_chart';
import './analysis.css';
import DigitSequenceComponent from './LDP/DigitSequenceComponent';
import AutoLDPComponent from './LDP/AutoLDPComponent';
import { ImFolderUpload, ImFolderDownload } from "react-icons/im";
import { PiListFill } from "react-icons/pi";

//strategies
import bot1 from './strategies/Multi-Million Even-Odd Setup.json';
import bot2 from './strategies/EvenOdd80%.json';
import bot3 from './strategies/Auto Differ.json';

function sleep(milliseconds: any) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

type LineChartProps = {
    name: string;
    value: number;
};

type DigitDiffStatsProp = {
    value: number;
    appearence: number;
};

type SymbolData = {
    allow_forward_starting: number;
    display_name: string;
    display_order: number;
    exchange_is_open: number;
    is_trading_suspended: number;
    market: string;
    market_display_name: string;
    pip: number;
    subgroup: string;
    subgroup_display_name: string;
    submarket: string;
    submarket_display_name: string;
    symbol: string;
    symbol_type: string;
};

type ActiveSymbolTypes = {
    active_symbols: SymbolData[];
};

interface ContractData {
    status: 'buy' | 'sold';
    profit: number;
}

interface UploadedSettings {
    prevLowestValue: string;
    pip_size: number;
    prev_symbol: string;
    active_symbol: string;
    accountCurrency: string;
    activeCard?: string;
    lastDigit?: number;
    numberOfTicks?: number;
    overValue?: number;
    martingaleValue?: number;
    percentageValue?: number;
    underValue?: number;
    oneClickContract?: string;
    tradingDiffType?: string;
    overUnderContract?: string;
    overUnderDirection?: string;
    evenOddContract?: string;
    sameDiffEvenOdd?: string;
    oneClickDuration?: number;
    oneClickAmount?: number;
    customPrediction?: number;
    takeProfitValue?: number;
    stopLossValue?: number;
    enableSlTpValue?: boolean;
    enableDisableMartingale?: boolean;
    enableCopyDemo?: boolean;
    overUnderManual?: boolean;
    numDigits?: number | string;
    comparisonOperator?: string;
    tradeAction?: string;
    numDigits1?: number | string;
    comparisonOperator1?: string;
    tradeAction1?: string;
    lastTradeType?: string | null;
    presetName?: string;
    fileInputKey?: number;
    isCustomTradeFormVisible?: boolean;
    isSequencesVisible?: boolean;
}

const ContractProgressPopup = ({
    contractData,
    isTradeActive,
    isOneClickActive,
    isAutoClickerActive,
    isRiseFallOneClickActive,
    isEvenOddOneClickActive,
    isOverUnderOneClickActive
}: {
    contractData: ContractData | null,
    isTradeActive: boolean,
    isOneClickActive: boolean,
    isAutoClickerActive: boolean,
    isRiseFallOneClickActive: boolean,
    isEvenOddOneClickActive: boolean,
    isOverUnderOneClickActive: boolean
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [progressText, setProgressText] = useState("Awaiting Contract...");
    const [progressStage, setProgressStage] = useState(0); // 0: No progress, 1: Bought, 2: Monitoring, 3: Completed

    useEffect(() => {
        const anySoftwareRunning = isTradeActive || isOneClickActive || isAutoClickerActive ||
                                   isRiseFallOneClickActive || isEvenOddOneClickActive || isOverUnderOneClickActive;

        if (contractData) {
            setIsVisible(true);
            if (contractData.status === 'buy') {
                setProgressText("Contract Bought");
                setProgressStage(1); // First stage (Contract Bought)
            } else if (contractData.status === 'sold') {
                if (contractData.profit > 0) {
                    setProgressText("Contract Won: Profit: " + contractData.profit);
                } else {
                    setProgressText("Contract Lost: Loss: " + Math.abs(contractData.profit));
                }
                setProgressStage(3); // Final stage (Contract Sold)
                setTimeout(() => setIsVisible(false), 5000);
            }
        } else if (anySoftwareRunning) {
            setIsVisible(true);
            setProgressText("Software is running");
            setProgressStage(2); // Monitoring stage
        } else {
            setIsVisible(false);
        }
    }, [contractData, isTradeActive, isOneClickActive, isAutoClickerActive, isRiseFallOneClickActive, isEvenOddOneClickActive, isOverUnderOneClickActive]);

    const getProgressBarWidth = () => {
        if (progressStage === 1) return '50%'; // Contract Bought
        if (progressStage === 2) return '66%'; // Monitoring stage
        if (progressStage === 3) return '100%'; // Contract Sold
        return '0%'; // Initial stage
    };

    return isVisible ? (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#f2f2f2',
            color: '#000',
            fontSize: '16px',
            fontWeight: 'bold',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            width: '300px',
            textAlign: 'center',
            zIndex: 9999,
            opacity: 0.9,
        }}>
            <div style={{ marginBottom: '10px' }}>{progressText}</div>
            <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
            }}>
                <div style={{
                    width: getProgressBarWidth(),
                    height: '100%',
                    backgroundColor: progressStage === 3 ? (contractData?.profit > 0 ? 'green' : 'red') : '#4caf50', // Green if profit, red if loss
                    transition: 'width 0.5s ease-in-out',
                }} />
            </div>
        </div>
    ) : null;
};

const BinaryAnalysisPage = observer(() => {
    const [activeCard, setActiveCard] = useState('LDP');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [currentTick, setCurrentTick] = useState<number | string>('Updating...');
    const [allLastDigitList, setAllLastDigitList] = useState<number[]>([]);
    const [isTickChart, setIsTickChart] = useState(true);
    const [lastDigit, setLastDigit] = useState(0);
    const [numberOfTicks, setNumberOfTicks] = useState<string | number>(1000);
    const [optionsList, setOptions] = useState<SymbolData[]>([]);
    const [overValue, setOverValue] = useState<string | number>(4);
    const [martingaleValue, setMartingaleValue] = useState<string | number>(1.2);
    const [percentageValue, setPercentageValue] = useState<string | number>(60);
    const [underValue, setUnderValue] = useState<string | number>(4);
    const [isOneClickActive, setIsOneClickActive] = useState(false);
    const [isAutoClickerActive, setIsAutoClickerActive] = useState(false);
    const [isRiseFallOneClickActive, setIsRiseFallOneClickActive] = useState(false);
    const [isEvenOddOneClickActive, setIsEvenOddOneClickActive] = useState(false);
    const [isOverUnderOneClickActive, setIsOverUnderOneClickActive] = useState(false);
    const [isTradeActive, setIsTradeActive] = useState(false);
    const [oneClickContract, setOneClickContract] = useState('DIGITDIFF');
    const [tradingDiffType, setTradingDiffType] = useState('AUTO');
    const [overUnderContract, setOverUnderContract] = useState('DIGITOVER');
    const [overUnderDirection, setOverUnderDirection] = useState('SAME');
    const [evenOddContract, setEvenOddContract] = useState('DIGITEVEN');
    const [sameDiffEvenOdd, setSameDiffEvenOdd] = useState('SAME');
    const [oneClickDuration, setOneClickDuration] = useState(1);
    const [oneClickAmount, setOneClickAmount] = useState<number | string>(0.5);
    const [customPrediction, setCustomPrediction] = useState<number | string>(0);
    const [accountCurrency, setAccountCurrency] = useState('');
    const [active_symbol, setActiveSymbol] = useState('R_100');
    const [prev_symbol, setPrevSymbol] = useState('R_100');
    const [pip_size, setPipSize] = useState(2);
    const [prevLowestValue, setPrevLowestValue] = useState<string | number>('');
    const [showBotSettings, setShowBotSettings] = useState<boolean>(false);
    const [takeProfitValue, setTakeProfitValue] = useState<string | number>(2);
    const [stopLossValue, setStopLossValue] = useState<string | number>(2);
    const [enableSlTpValue, setEnableSlTpValue] = useState<boolean>(false);
    const [enableDisableMartingale, setEnableDisableMartingale] = useState<boolean>(true);
    const [enableCopyDemo, setCopyDemo] = useState<boolean>(false);
    const [liveAccCR, setLiveAccCr] = useState<string>('');
    const [overUnderManual, setOverUnderManual] = useState<boolean>(false);
    const [showPopup, setShowPopup] = useState(false);
    const [showPopup2, setShowPopup2] = useState(false);
    const [contractData, setContractData] = useState<ContractData | null>(null);
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
    const [numTicks, setNumTicks] = useState<number | string>(5);
    const [comparisonOperator2, setComparisonOperator2] = useState('rise');
    const [tradeAction2, setTradeAction2] = useState('CALL');
    const [isAutoTrading2, setIsAutoTrading2] = useState(false);
    const [tradeExecuted2, setTradeExecuted2] = useState(false);
    const [lastTradeType2, setLastTradeType2] = useState<string | null>(null);
    const [presetName, setPresetName] = useState('');
    const [fileInputKey, setFileInputKey] = useState(0);
    const [isCustomTradeFormVisible, setIsCustomTradeFormVisible] = useState(true);
    const [isSequencesVisible, setIsSequencesVisible] = useState(true);
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);

    const strategies = [
        { name: 'Multi-Million Even-Odd Setup', data: bot1 },
        { name: 'EvenOdd80%', data: bot2 },
        { name: 'Auto Differ', data: bot3 },
    ];

    const togglePopup = () => {
        setShowPopup(!showPopup);
    };

    const togglePopup2 = () => {
        setShowPopup2(!showPopup2);
    };

    // Refs
    const martingaleValueRef = useRef<string | number>(martingaleValue);
    const isTradeActiveRef = useRef(isTradeActive);
    const current_contractids = useRef<string[]>([]);
    const totalLostAmount = useRef(0);
    const oneClickDefaultAmount = useRef<string | number>(0.5);
    const contractTradeTypes = useRef<string[]>(['DIGITODD', 'DIGITEVEN', 'DIGITOVER', 'DIGITUNDER', 'DIGITDIFF']);
    const digitDiffHigh = useRef<DigitDiffStatsProp>({ appearence: 0, value: 0 });
    const digitDiffLow = useRef<DigitDiffStatsProp>({ appearence: 0, value: 0 });
    const take_profit = useRef<number>(2);
    const stop_loss = useRef<number>(2);
    const total_profit = useRef<number>(0);
    const enable_tp_sl = useRef<boolean>(false);
    const enable_demo_copy = useRef<boolean>(false);
    const enable_disable_martingale = useRef<boolean>(true);

    const { ui } = useStore();
    const DBotStores = useDBotStore();
    const { transactions, run_panel } = DBotStores;
    const { registerBotListeners, unregisterBotListeners } = run_panel;
    const { is_mobile, is_dark_mode_on } = ui;
    const { updateResultsCompletedContract } = transactions;

    useEffect(() => {
        registerBotListeners();
        startApi();
        // Setting up local saves
        const no_of_ticks = localStorage.getItem('no_of_ticks');
        const active_card = localStorage.getItem('active_card');
        if (no_of_ticks !== null) {
            setNumberOfTicks(parseFloat(no_of_ticks));
        }

        if (active_card !== null) {
            setActiveCard(active_card);
        }

        return () => {
            unregisterBotListeners();
        };
    }, []);

    useEffect(() => {
        if (prev_symbol !== active_symbol) {
            api_base4.api.send({
                ticks_history: active_symbol,
                adjust_start_time: 1,
                count: 5000,
                end: 'latest',
                start: 1,
                style: 'ticks',
            });
        }
        setPrevSymbol(active_symbol);
    }, [active_symbol]);

    const handleStrategySelect = (uploadedSettings: UploadedSettings) => {
        setActiveCard(uploadedSettings.activeCard || 'LDP');
        setOverValue(uploadedSettings.overValue || 4);
        martingaleValueRef.current = uploadedSettings.martingaleValue || 1.2;
        setPercentageValue(uploadedSettings.percentageValue || 60);
        setUnderValue(uploadedSettings.underValue || 4);
        setOneClickContract(uploadedSettings.oneClickContract || 'DIGITDIFF');
        setTradingDiffType(uploadedSettings.tradingDiffType || 'AUTO');
        setOverUnderContract(uploadedSettings.overUnderContract || 'DIGITOVER');
        setOverUnderDirection(uploadedSettings.overUnderDirection || 'SAME');
        setEvenOddContract(uploadedSettings.evenOddContract || 'DIGITEVEN');
        setSameDiffEvenOdd(uploadedSettings.sameDiffEvenOdd || 'SAME');
        setOneClickDuration(uploadedSettings.oneClickDuration || 1);
        setOneClickAmount(uploadedSettings.oneClickAmount || 0.5);
        setCustomPrediction(uploadedSettings.customPrediction || 0);
        setAccountCurrency(uploadedSettings.accountCurrency || '');
        setActiveSymbol(uploadedSettings.active_symbol || 'R_100');
        setPrevSymbol(uploadedSettings.prev_symbol || 'R_100');
        setPipSize(uploadedSettings.pip_size || 2);
        setPrevLowestValue(uploadedSettings.prevLowestValue || '');
        setTakeProfitValue(uploadedSettings.takeProfitValue || 2);
        setStopLossValue(uploadedSettings.stopLossValue || 2);
        setEnableSlTpValue(uploadedSettings.enableSlTpValue || false);
        setEnableDisableMartingale(uploadedSettings.enableDisableMartingale || true);
        setCopyDemo(uploadedSettings.enableCopyDemo || false);
        setOverUnderManual(uploadedSettings.overUnderManual || false);
        setNumDigits(uploadedSettings.numDigits || 3);
        setComparisonOperator(uploadedSettings.comparisonOperator || 'greater than');
        setTradeAction(uploadedSettings.tradeAction || 'DIGITOVER');
        handleCustomPredictionInputChange({ target: { value: uploadedSettings.customPrediction || 0 } } as any);
        martingaleValueRef.current = uploadedSettings.martingaleValue || '';
        setNumDigits1(uploadedSettings.numDigits1 || 3);
        setComparisonOperator1(uploadedSettings.comparisonOperator1 || 'odd');
        setTradeAction1(uploadedSettings.tradeAction1 || 'DIGITODD');
        setIsCustomTradeFormVisible(uploadedSettings.isCustomTradeFormVisible ?? true);
        setIsSequencesVisible(uploadedSettings.isSequencesVisible ?? true);
    };
    
    // Function to download settings as a JSON file
    const downloadSettings = () => {
        const name = window.prompt("Enter the name for your settings file:", presetName);
        if (name) {
            const settings = {
                activeCard,
                numberOfTicks,
                overValue,
                martingaleValue: martingaleValueRef.current,
                percentageValue,
                underValue,
                oneClickContract,
                tradingDiffType,
                overUnderContract,
                overUnderDirection,
                evenOddContract,
                sameDiffEvenOdd,
                oneClickDuration,
                oneClickAmount,
                customPrediction,
                accountCurrency,
                active_symbol,
                prev_symbol,
                pip_size,
                prevLowestValue,
                showBotSettings,
                takeProfitValue,
                stopLossValue,
                enableSlTpValue,
                enableDisableMartingale,
                overUnderManual,
                showPopup,
                showPopup2,
                contractData,
                numDigits,
                comparisonOperator,
                tradeAction,
                numDigits1,
                comparisonOperator1,
                tradeAction1,
                isCustomTradeFormVisible,
                isSequencesVisible,
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
                setActiveCard(uploadedSettings.activeCard || 'LDP');
                setOverValue(uploadedSettings.overValue || 4);
                martingaleValueRef.current = uploadedSettings.martingaleValue || 1.2;
                setPercentageValue(uploadedSettings.percentageValue || 60);
                setUnderValue(uploadedSettings.underValue || 4);
                setOneClickContract(uploadedSettings.oneClickContract || 'DIGITDIFF');
                setTradingDiffType(uploadedSettings.tradingDiffType || 'AUTO');
                setOverUnderContract(uploadedSettings.overUnderContract || 'DIGITOVER');
                setOverUnderDirection(uploadedSettings.overUnderDirection || 'SAME');
                setEvenOddContract(uploadedSettings.evenOddContract || 'DIGITEVEN');
                setSameDiffEvenOdd(uploadedSettings.sameDiffEvenOdd || 'SAME');
                setOneClickDuration(uploadedSettings.oneClickDuration || 1);
                setOneClickAmount(uploadedSettings.oneClickAmount || 0.5);
                setCustomPrediction(uploadedSettings.customPrediction || 0);
                setAccountCurrency(uploadedSettings.accountCurrency || '');
                setActiveSymbol(uploadedSettings.active_symbol || 'R_100');
                setPrevSymbol(uploadedSettings.prev_symbol || 'R_100');
                setPipSize(uploadedSettings.pip_size || 2);
                setPrevLowestValue(uploadedSettings.prevLowestValue || '');
                setTakeProfitValue(uploadedSettings.takeProfitValue || 2);
                setStopLossValue(uploadedSettings.stopLossValue || 2);
                setEnableSlTpValue(uploadedSettings.enableSlTpValue || false);
                setEnableDisableMartingale(uploadedSettings.enableDisableMartingale || true);
                setCopyDemo(uploadedSettings.enableCopyDemo || false);
                setOverUnderManual(uploadedSettings.overUnderManual || false);
                setNumDigits(uploadedSettings.numDigits || 3);
                setComparisonOperator(uploadedSettings.comparisonOperator || 'greater than');
                setTradeAction(uploadedSettings.tradeAction || 'DIGITOVER');
                handleCustomPredictionInputChange({ target: { value: uploadedSettings.customPrediction || 0 } } as any);
                martingaleValueRef.current = uploadedSettings.martingaleValue || '';
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

    useEffect(() => {
        const savedEvenOddContract = localStorage.getItem('evenOddContract');
        const savedSameDiffEvenOddContract = localStorage.getItem('sameDiffEvenOddContract');
        const savedOverUnderContract = localStorage.getItem('overUnderContract');
    
        if (savedEvenOddContract) {
            setEvenOddContract(savedEvenOddContract);
        }
        if (savedSameDiffEvenOddContract) {
            setSameDiffEvenOdd(savedSameDiffEvenOddContract);
        }
        if (savedOverUnderContract) {
            setOverUnderContract(savedOverUnderContract);
        }
    }, []);    

    useEffect(() => {
        // Load settings from localStorage on mount
        const storedActiveCard = localStorage.getItem('activeCard');
        const storedNumberOfTicks = localStorage.getItem('numberOfTicks');
        const storedOptionsList = localStorage.getItem('optionsList');
        const storedOverValue = localStorage.getItem('overValue');
        const storedMartingaleValue = localStorage.getItem('martingaleValue');
        const storedPercentageValue = localStorage.getItem('percentageValue');
        const storedUnderValue = localStorage.getItem('underValue');
        const storedOneClickContract = localStorage.getItem('oneClickContract');
        const storedTradingDiffType = localStorage.getItem('tradingDiffType');
        const storedOverUnderContract = localStorage.getItem('overUnderContract');
        const storedOverUnderDirection = localStorage.getItem('overUnderDirection');
        const storedEvenOddContract = localStorage.getItem('evenOddContract');
        const storedSameDiffEvenOdd = localStorage.getItem('sameDiffEvenOdd');
        const storedOneClickDuration = localStorage.getItem('oneClickDuration');
        const storedOneClickAmount = localStorage.getItem('oneClickAmount');
        const storedShowBotSettings = localStorage.getItem('showBotSettings');
        const storedTakeProfitValue = localStorage.getItem('takeProfitValue');
        const storedStopLossValue = localStorage.getItem('stopLossValue');
        const storedEnableSlTpValue = localStorage.getItem('enableSlTpValue');
        const storedEnableDisableMartingale = localStorage.getItem('enableDisableMartingale');
        const storedEnableCopyDemo = localStorage.getItem('enableCopyDemo');
        const storedNumDigits = localStorage.getItem('numDigits');
        const storedComparisonOperator = localStorage.getItem('comparisonOperator');
        const storedTradeAction = localStorage.getItem('tradeAction');
        const storedCustomPrediction = localStorage.getItem('customPrediction');
        const storedNumDigits1 = localStorage.getItem('numDigits1');
        const storedComparisonOperator1 = localStorage.getItem('comparisonOperator1');
        const storedTradeAction1 = localStorage.getItem('tradeAction1');
        const storedIsCustomTradeFormVisible = localStorage.getItem('isCustomTradeFormVisible');
        const storedIsSequencesVisible = localStorage.getItem('isSequencesVisible');

        setActiveCard(storedActiveCard || 'LDP');
        setNumberOfTicks(storedNumberOfTicks ? JSON.parse(storedNumberOfTicks) : 1000);
        setOptions(storedOptionsList ? JSON.parse(storedOptionsList) : []);
        setOverValue(storedOverValue || 4);
        setMartingaleValue(storedMartingaleValue || 1.2);
        setPercentageValue(storedPercentageValue || 60);
        setUnderValue(storedUnderValue || 4);
        setOneClickContract(storedOneClickContract || 'DIGITDIFF');
        setTradingDiffType(storedTradingDiffType || 'AUTO');
        setOverUnderContract(storedOverUnderContract || 'DIGITOVER');
        setOverUnderDirection(storedOverUnderDirection || 'SAME');
        setEvenOddContract(storedEvenOddContract || 'DIGITEVEN');
        setSameDiffEvenOdd(storedSameDiffEvenOdd || 'BOTH');
        setOneClickDuration(storedOneClickDuration ? Number(storedOneClickDuration) : 1);
        setOneClickAmount(storedOneClickAmount || 0.5);
        handleCustomPredictionInputChange({ target: { value: storedCustomPrediction || 0 } } as any);
        setShowBotSettings(storedShowBotSettings ? JSON.parse(storedShowBotSettings) : false);
        setTakeProfitValue(storedTakeProfitValue || 2);
        setStopLossValue(storedStopLossValue || 2);
        setEnableSlTpValue(storedEnableSlTpValue ? JSON.parse(storedEnableSlTpValue) : false);
        setEnableDisableMartingale(storedEnableDisableMartingale ? JSON.parse(storedEnableDisableMartingale) : true);
        setCopyDemo(storedEnableCopyDemo ? JSON.parse(storedEnableCopyDemo) : false);
        setNumDigits(storedNumDigits ? JSON.parse(storedNumDigits) : 3);
        setComparisonOperator(storedComparisonOperator || 'greater than');
        setTradeAction(storedTradeAction || 'DIGITOVER');
        handleCustomPredictionInputChange({ target: { value: storedCustomPrediction || 0 } } as any);
        setNumDigits1(storedNumDigits1 ? JSON.parse(storedNumDigits1) : 3);
        setComparisonOperator1(storedComparisonOperator1 || 'odd');
        setTradeAction1(storedTradeAction1 || 'DIGITODD');
        setIsCustomTradeFormVisible(storedIsCustomTradeFormVisible ? JSON.parse(storedIsCustomTradeFormVisible) : true);
        setIsSequencesVisible(storedIsSequencesVisible ? JSON.parse(storedIsSequencesVisible) : true);
    }, []);
    
    useEffect(() => {
        // Save settings to localStorage whenever they change
        localStorage.setItem('activeCard', activeCard);
        localStorage.setItem('isSubscribed', JSON.stringify(isSubscribed));
        localStorage.setItem('currentTick', String(currentTick));
        localStorage.setItem('allLastDigitList', JSON.stringify(allLastDigitList));
        localStorage.setItem('isTickChart', JSON.stringify(isTickChart));
        localStorage.setItem('lastDigit', JSON.stringify(lastDigit));
        localStorage.setItem('numberOfTicks', JSON.stringify(numberOfTicks));
        localStorage.setItem('optionsList', JSON.stringify(optionsList));
        localStorage.setItem('overValue', String(overValue));
        localStorage.setItem('martingaleValue', String(martingaleValue));
        localStorage.setItem('percentageValue', String(percentageValue));
        localStorage.setItem('underValue', String(underValue));
        localStorage.setItem('oneClickContract', oneClickContract);
        localStorage.setItem('tradingDiffType', tradingDiffType);
        localStorage.setItem('overUnderContract', overUnderContract);
        localStorage.setItem('overUnderDirection', overUnderDirection);
        localStorage.setItem('evenOddContract', evenOddContract);
        localStorage.setItem('sameDiffEvenOdd', sameDiffEvenOdd);
        localStorage.setItem('oneClickDuration', String(oneClickDuration));
        localStorage.setItem('oneClickAmount', String(oneClickAmount));
        localStorage.setItem('customPrediction', JSON.stringify(customPrediction));
        localStorage.setItem('accountCurrency', accountCurrency);
        localStorage.setItem('active_symbol', active_symbol);
        localStorage.setItem('prev_symbol', prev_symbol);
        localStorage.setItem('showBotSettings', JSON.stringify(showBotSettings));
        localStorage.setItem('takeProfitValue', String(takeProfitValue));
        localStorage.setItem('stopLossValue', String(stopLossValue));
        localStorage.setItem('enableSlTpValue', JSON.stringify(enableSlTpValue));
        localStorage.setItem('enableDisableMartingale', JSON.stringify(enableDisableMartingale));
        localStorage.setItem('enableCopyDemo', JSON.stringify(enableCopyDemo));
        localStorage.setItem('numDigits', JSON.stringify(numDigits));
        localStorage.setItem('comparisonOperator', comparisonOperator);
        localStorage.setItem('tradeAction', tradeAction);
        localStorage.setItem('customPrediction', JSON.stringify(customPrediction));
        localStorage.setItem('numDigits1', JSON.stringify(numDigits1));
        localStorage.setItem('comparisonOperator1', comparisonOperator1);
        localStorage.setItem('tradeAction1', tradeAction1);
        localStorage.setItem('isCustomTradeFormVisible', JSON.stringify(isCustomTradeFormVisible));
        localStorage.setItem('isSequencesVisible', JSON.stringify(isSequencesVisible));
    }, [
        activeCard,
        isSubscribed,
        currentTick,
        allLastDigitList,
        isTickChart,
        lastDigit,
        numberOfTicks,
        optionsList,
        overValue,
        martingaleValue,
        percentageValue,
        underValue,
        isOneClickActive,
        isAutoClickerActive,
        isRiseFallOneClickActive,
        isEvenOddOneClickActive,
        isOverUnderOneClickActive,
        isTradeActive,
        oneClickContract,
        tradingDiffType,
        overUnderContract,
        overUnderDirection,
        evenOddContract,
        sameDiffEvenOdd,
        oneClickDuration,
        oneClickAmount,
        customPrediction,
        accountCurrency,
        active_symbol,
        prev_symbol,
        pip_size,
        prevLowestValue,
        showBotSettings,
        takeProfitValue,
        stopLossValue,
        enableSlTpValue,
        enableDisableMartingale,
        enableCopyDemo,
        numDigits,
        comparisonOperator,
        tradeAction,
        customPrediction,
        isAutoTrading,
        numDigits1,
        comparisonOperator1,
        tradeAction1,
        isCustomTradeFormVisible,
        isSequencesVisible,
    ]);  

    const getLastDigits = (tick: any, pip_size: any) => {
        let lastDigit = tick.toFixed(pip_size);
        lastDigit = String(lastDigit).slice(-1);
        return Number(lastDigit);
    };

    const startApi = async () => {
        await sleep(5000);
        if (!isSubscribed) {
            api_base4.api.send({
                active_symbols: 'brief',
                product_type: 'basic',
            });
            setIsSubscribed(true);
        }

        if (api_base4.api) {
            const subscription = api_base4.api.onMessage().subscribe(({ data }: { data: any }) => {
                if (data.msg_type === 'tick') {
                    const { tick } = data;
                    const { ask, id, pip_size } = tick;
                    const last_digit = getLastDigits(ask, pip_size);

                    setLastDigit(last_digit);
                    setCurrentTick(ask);
                    removeFirstElement();
                    setAllLastDigitList(prevList => [...prevList, ask]);
                }

                if (data.msg_type === 'history') {
                    const { history, pip_size } = data;
                    setPipSize(pip_size);
                    const { prices } = history;
                    const { ticks_history } = data.echo_req;
                    setAllLastDigitList(prices);
                    setActiveSymbol(ticks_history);
                    api_base4.api.send({
                        ticks: ticks_history,
                        subscribe: 1,
                    });
                }

                if (data.msg_type === 'active_symbols') {
                    const { active_symbols }: ActiveSymbolTypes = data;
                    const filteredSymbols = active_symbols.filter(symbol => symbol.subgroup === 'synthetics');
                    filteredSymbols.sort((a, b) => a.display_order - b.display_order);
                    api_base4.api.send({
                        ticks_history: filteredSymbols[0].symbol,
                        adjust_start_time: 1,
                        count: 5000,
                        end: 'latest',
                        start: 1,
                        style: 'ticks',
                    });
                    setOptions(filteredSymbols);
                }
            });

            api_base4.pushSubscription(subscription);
        }

        if (api_base.api) {
            const subscription = api_base.api.onMessage().subscribe(({ data }: { data: any }) => {
                if (data.msg_type === 'proposal_open_contract') {
                    const contractStatus = data.proposal_open_contract;
                    setContractData({
                        status: contractStatus.is_sold ? 'sold' : 'buy',
                        profit: contractStatus.profit,
                    });
                    const { proposal_open_contract } = data;
                    const contract = proposal_open_contract.contract_type;

                    if (contractTradeTypes.current.includes(contract)) {
                        if (proposal_open_contract.is_sold) {
                            // Take profit and stopLoss check
                            if (
                                !current_contractids.current.includes(proposal_open_contract.contract_id) &&
                                enable_tp_sl.current
                            ) {
                                total_profit.current += proposal_open_contract.profit,total_profit.current;
                                if (total_profit.current >= take_profit.current) {
                                    stopAnalysisBot();
                                } else if (total_profit.current <= -stop_loss.current) {
                                    stopAnalysisBot();
                                }
                            }

                            if (proposal_open_contract.status === 'lost') {
                                if (!current_contractids.current.includes(proposal_open_contract.contract_id)) {
                                    current_contractids.current.push(proposal_open_contract.contract_id);
                                    totalLostAmount.current += Math.abs(proposal_open_contract.profit);
                                    let newStake;
                                    if (enable_disable_martingale.current) {
                                        newStake = totalLostAmount.current * parseFloat(martingaleValueRef.current);
                                        setOneClickAmount(parseFloat(newStake.toFixed(2)));
                                    }
                                    isTradeActiveRef.current = false;
                                    setIsTradeActive(false);
                                }
                            } else {
                                totalLostAmount.current = 0;
                                setOneClickAmount(oneClickDefaultAmount.current);
                            }
                            if (
                                isTradeActiveRef.current &&
                                !current_contractids.current.includes(proposal_open_contract.contract_id)
                            ) {
                                isTradeActiveRef.current = false;
                                setIsTradeActive(false);
                                current_contractids.current.push(proposal_open_contract.contract_id);
                            }
                        }
                    }
                    updateResultsCompletedContract(proposal_open_contract);
                }
            });

            api_base.pushSubscription(subscription);
        }
        setAccountCurrency(api_base.account_info.currency);
    };

    const buy_contract = (contract_type: string, isRiseFallOneClickActive: boolean) => {
        if (!isTradeActiveRef.current) {
            isTradeActiveRef.current = true;
            setIsTradeActive(true);
            
            !enableCopyDemo
                ? api_base.api.send({
                      buy: '1',
                      price: oneClickAmount,
                      subscribe: 1,
                      parameters: {
                          amount: oneClickAmount,
                          basis: 'stake',
                          contract_type,
                          currency: accountCurrency,
                          duration: oneClickDuration,
                          duration_unit: 't',
                          symbol: active_symbol,
                      },
                  })
                : api_base.api.send({
                      buy_contract_for_multiple_accounts: '1',
                      tokens: [getToken().token, getLiveAccToken(liveAccCR).token],
                      price: oneClickAmount,
                      parameters: {
                          amount: oneClickAmount,
                          basis: 'stake',
                          contract_type,
                          currency: accountCurrency,
                          duration: oneClickDuration,
                          duration_unit: 't',
                          symbol: active_symbol,
                      },
                  });
        }
    };    

    const buy_contract_differs = (contract_type: string, isOverUnder = false) => {
        !enableCopyDemo
            ? api_base.api.send({
                  buy: '1',
                  price: oneClickAmount,
                  subscribe: 1,
                  parameters: {
                      amount: oneClickAmount,
                      basis: 'stake',
                      contract_type,
                      currency: 'USD',
                      duration: oneClickDuration,
                      duration_unit: 't',
                      symbol: active_symbol,
                      barrier: isOverUnder ? getOverUnderValue() : customPrediction,
                  },
              })
            : api_base.api.send({
                  buy_contract_for_multiple_accounts: '1',
                  tokens: [getToken().token, getLiveAccToken(liveAccCR).token],
                  price: oneClickAmount,
                  parameters: {
                      amount: oneClickAmount,
                      basis: 'stake',
                      contract_type,
                      currency: accountCurrency,
                      duration: oneClickDuration,
                      duration_unit: 't',
                      symbol: active_symbol,
                      barrier: isOverUnder ? getOverUnderValue() : customPrediction,
                  },
              });
    };

    const stopAnalysisBot = () => {
        setIsRiseFallOneClickActive(false);
        setIsOverUnderOneClickActive(false);
        setIsEvenOddOneClickActive(false);
        setIsOneClickActive(false);
        setIsAutoTrading(false);
        totalLostAmount.current = 0;
        total_profit.current = 0;
        setOneClickAmount(oneClickDefaultAmount.current);
    };

    const getOverUnderValue = () => {
        if (overUnderContract === 'DIGITOVER') {
            return overValue;
        } else if (overUnderContract === 'DIGITUNDER') {
            return underValue;
        }
    };

    // =========================
    const removeFirstElement = () => {
        setAllLastDigitList(prevList => prevList.slice(1));
    };

    const getLastDigitList = () => {
        const requiredItems = allLastDigitList.slice(-numberOfTicks);
        const returnedList: number[] = [];
        requiredItems.forEach((tick: number) => {
            const last_digit = getLastDigits(tick, pip_size);
            returnedList.push(last_digit);
        });

        return returnedList;
    };

    const getLast1000DigitList = () => {
        const requiredItems = allLastDigitList.slice(-1000);
        const returnedList: number[] = [];
        requiredItems.forEach((tick: number) => {
            const last_digit = getLastDigits(tick, pip_size);
            returnedList.push(last_digit);
        });

        return returnedList;
    };

    const getTickList = () => {
        const requiredItems = allLastDigitList.slice(-numberOfTicks);

        return requiredItems;
    };

    const getLineChartList = () => {
        const requiredItems = allLastDigitList.slice(-numberOfTicks);
        const returnedList: LineChartProps[] = [];
        let previous_tick = 0;
        let tick_difference = 0;
        requiredItems.forEach((tick: number) => {
            const last_digit = getLastDigits(tick, pip_size);
            if (previous_tick !== 0) {
                tick_difference = tick - previous_tick;
                previous_tick = tick;
            } else {
                previous_tick = tick;
                tick_difference = tick;
            }
            returnedList.push({
                name: isTickChart ? tick.toString() : last_digit.toString(),
                value: isTickChart ? parseFloat(tick_difference.toFixed(2)) : last_digit,
            });
        });

        return returnedList;
    };

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        api_base4.api.forgetAll('ticks').then(() => {
            setCurrentTick('Loading...');
            setActiveSymbol(selectedValue);
        });
    };

    const handleLineChartSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        if (selectedValue === 'risefall') {
            setIsTickChart(true);
        } else if (selectedValue === 'lastdigit') {
            setIsTickChart(false);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setNumberOfTicks(newValue === '' ? '' : Number(newValue));
        localStorage.setItem('no_of_ticks', newValue);
    };
    const handleOverInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setOverValue(newValue === '' ? '' : Number(newValue));
    };
    const handleMartingaleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        martingaleValueRef.current = newValue === '' ? '' : Number(newValue);
        setMartingaleValue(newValue === '' ? '' : Number(newValue));
    };
    const handlePercentageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setPercentageValue(newValue === '' ? '' : Number(newValue));
    };
    const handleUnderInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setUnderValue(newValue === '' ? '' : Number(newValue));
    };
    const handleOneClickAmountInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setOneClickAmount(newValue === '' ? '' : Number(newValue));
        oneClickDefaultAmount.current = newValue === '' ? '' : Number(newValue);
    };
    const handleCustomPredictionInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setCustomPrediction(newValue === '' ? '' : Number(newValue));
    };

    const handleContractSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setOneClickContract(selectedValue);
    };

    const handleTradingDiffType = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setTradingDiffType(selectedValue);
    };

    const handleOverUnderContractSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setOverUnderContract(selectedValue);
        localStorage.setItem('overUnderContract', selectedValue); // Save to localStorage
    };
    const handleOverUnderDirectionSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        if (selectedValue === 'MANUAL') {
            setOverUnderManual(true);
        } else {
            setOverUnderManual(false);
        }
        setOverUnderDirection(selectedValue);
    };

    const handleEvenOddContractSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setEvenOddContract(selectedValue);
        localStorage.setItem('evenOddContract', selectedValue); // Save to localStorage
    };
    
    const handleSameDiffEvenOddContractSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSameDiffEvenOdd(selectedValue);
        localStorage.setItem('sameDiffEvenOddContract', selectedValue); // Save to localStorage
    };       

    const handleDurationSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setOneClickDuration(Number(selectedValue));
    };

    const handleIsOneClick = () => {
        setIsOneClickActive(!isOneClickActive);
    };
    const handleIsAutoClicker = () => {
        setIsAutoClickerActive(!isAutoClickerActive);
    };

    const handleIsRiseFallOneClick = () => {
        setIsRiseFallOneClickActive(!isRiseFallOneClickActive);
    };
   
    const handleSetActiveCard = (card: any) => {
        setActiveCard(card);
        localStorage.setItem('active_card', card);
    };
    const handleTpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setTakeProfitValue(newValue === '' ? '' : Number(newValue));
        take_profit.current = newValue !== '' ? Number(newValue) : 0;
    };

    const handleSlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setStopLossValue(newValue === '' ? '' : Number(newValue));
        stop_loss.current = newValue !== '' ? Number(newValue) : 0;
    };

    const handleLiveAccCrChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value;
        setLiveAccCr(newValue);
    };

    const handleIsActiveInActive = () => {
        setEnableSlTpValue(!enableSlTpValue);
        enable_tp_sl.current = !enable_tp_sl.current;
    };

    const handleEnableDisableMart = () => {
        setEnableDisableMartingale(!enableDisableMartingale);
        enable_disable_martingale.current = !enableDisableMartingale;
    };

    const handleDemoCopy = () => {
        setCopyDemo(!enableCopyDemo);
        enable_demo_copy.current = !enable_demo_copy.current;
    };

    const [liveAccounts, setLiveAccounts] = React.useState<string[]>([]);
    const [selectedAccount, setSelectedAccount] = React.useState<string>('');

    React.useEffect(() => {
        if (typeof localStorage !== 'undefined') {
            const client_accounts = JSON.parse(localStorage.getItem('client.accounts')!) || undefined;
            const filteredAccountKeys = Object.keys(client_accounts).filter(key => key.startsWith('CR'));
            setLiveAccounts(filteredAccountKeys);
            if (filteredAccountKeys.length > 0) {
                setSelectedAccount(filteredAccountKeys[0]);
                setLiveAccCr(filteredAccountKeys[0]);
            }
        }
    }, []);

    const selectTickList = () => {
        return (
            <>
                <div
                    className='oneclick_amout'
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5px' }}
                >
                    <h3>Stake</h3>
                    <input type='number' value={oneClickAmount} onChange={handleOneClickAmountInputChange} />
                </div>
            </>
        );
    };

    const guideElement = () => {
        return (
            <div className='guide' onClick={() => setShowBotSettings(!showBotSettings)}>
                <TbSettingsDollar />
            </div>
        );
    };
    const handleToggle = () => {
        setIsOverUnderOneClickActive(prevState => !prevState);
    };
    const handleToggleeo = () => {
        setIsEvenOddOneClickActive(prevState => !prevState);
    };
    function updateActiveProgress() {
        document.querySelectorAll('.differs_container .progress .active-svg').forEach(svg => svg.remove());

        const activeProgress = document.querySelector('.differs_container .progress.active');
        if (activeProgress) {
            const svgElement = document.createElement('div');
            svgElement.classList.add('active-svg');
            svgElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                    <path fill="red" d="M8 4l6 8H2z"/>
                </svg>`;
            svgElement.style.position = 'absolute';
            svgElement.style.bottom = '-15px';
            svgElement.style.left = '50%';
            svgElement.style.transform = 'translateX(-50%)';
            activeProgress.appendChild(svgElement);
        }
    }

    updateActiveProgress();

    return (
    <>
    <ContractProgressPopup 
        contractData={contractData} 
        isTradeActive={isTradeActive}
        isOneClickActive={isOneClickActive}
        isAutoClickerActive={isAutoClickerActive}
        isRiseFallOneClickActive={isRiseFallOneClickActive}
        isEvenOddOneClickActive={isEvenOddOneClickActive}
        isOverUnderOneClickActive={isOverUnderOneClickActive}
    />
    <div className='main_app'>
            <div className='top_bar'>
                <div className='symbol_price'>
                    <div className='active_symbol'>
                        <select name='' id='symbol_options' onChange={handleSelectChange}>
                            {optionsList.length > 0 ? (
                                optionsList.map(option => (
                                    <option key={option.symbol} value={option.symbol}>
                                        {option.display_name}
                                    </option>
                                ))
                            ) : (
                                <option value=''>SELECT MARKET</option>
                            )}
                        </select>
                    </div>
                    <div className='no_of_ticks'>
                        <input type='number' name='' id='' value={numberOfTicks} onChange={handleInputChange} />
                    </div>
                    <div className='current_price'>
                        <h4>PRICE</h4>
                        <h3>{currentTick.toString()}</h3>
                    </div>
                        <div className='settings-controls'>
                            <div className='upload-settings'>
                                <label htmlFor='file-upload' className='upload-label'>
                                    <ImFolderUpload className='iconu' />
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
                                    <ImFolderDownload className='icond' />
                                    <span>Download</span>
                                </label>
                            </div>
                            <div className='strategies'>
                                <label onClick={() => setIsStrategyModalOpen(true)} className='strategies-label'>
                                    <PiListFill className='icons' />
                                    <span>Strategies</span>
                                </label>
                            </div>
                            {isStrategyModalOpen && (
                                <div className="modal-overlay">
                                    <div className="modal-content">
                                        <button onClick={() => setIsStrategyModalOpen(false)} className="close-btn">X</button>
                                        <h2 className="modal-header">Select a Strategy</h2>
                                        <ul className="strategy-list">
                                            {strategies.map((strategy, index) => (
                                                <li key={index} onClick={() => {
                                                    handleStrategySelect(strategy.data);
                                                    setIsStrategyModalOpen(false);
                                                }}>
                                                    {strategy.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>  
                </div>
                {showBotSettings && (
                    <BotSettings
                        enable_tp_sl={enable_tp_sl}
                        setShowBotSettings={setShowBotSettings}
                        showBotSettings={showBotSettings}
                        stop_loss={stop_loss}
                        take_profit={take_profit}
                        setStopLossValue={setStopLossValue}
                        setTakeProfitValue={setTakeProfitValue}
                        stopLossValue={stopLossValue}
                        takeProfitValue={takeProfitValue}
                        enableSlTpValue={enableSlTpValue}
                        setEnableSlTpValue={setEnableSlTpValue}
                        enableCopyDemo={enableCopyDemo}
                        setCopyDemo={setCopyDemo}
                        enable_demo_copy={enable_demo_copy}
                        liveAccCR={liveAccCR}
                        setLiveAccCr={setLiveAccCr}
                        enableDisableMartingale={enableDisableMartingale}
                        enable_disable_martingale={enable_disable_martingale}
                        setEnableDisableMartingale={setEnableDisableMartingale} />
                )}
                <div className='buttons'>
                    <button
                        className={`button ${activeCard === 'AUTOLDP' ? 'active' : ''}`}
                        onClick={() => handleSetActiveCard('AUTOLDP')}
                    >
                        Auto LDP
                    </button>
                    <button
                        className={`button ${activeCard === 'LDP' ? 'active' : ''}`}
                        onClick={() => handleSetActiveCard('LDP')}
                    >
                        Manual LDP
                    </button>
                    
                    {/* Dropdown for Pro Tool with active check */}
                    <select
                        className={`button ${['pie', 'diff', 'over_under', 'rise_fall'].includes(activeCard) ? 'active' : ''}`}
                        value={activeCard}
                        onChange={(e) => handleSetActiveCard(e.target.value)}
                    >
                        <option>PRO TOOL</option>
                        <option value='pie'>Even & Odd</option>
                        <option value='diff'>Differs & Matches</option>
                        <option value='over_under'>Over & Under</option>
                        <option value='rise_fall'>Rise & Fall</option>
                    </select>
                </div>
            </div>
            {activeCard === 'AUTOLDP' && (
                <AutoLDPComponent
                digitList={getLastDigitList()}
                tickList={getTickList()}
                CirclesDigitList={getLast1000DigitList()}
                customPrediction={customPrediction}
                handleCustomPredictionInputChange={handleCustomPredictionInputChange}
                is_dark_mode_on={is_dark_mode_on}
                buy_contract={buy_contract}
                buy_contract_differs={buy_contract_differs}
                selectTickList={selectTickList}
                handleMartingaleInputChange={handleMartingaleInputChange}
                martingaleValueRef={martingaleValueRef}
                isTradeActive={isTradeActive}
                setIsTradeActive={setIsTradeActive}
                guideElement={guideElement}
                // New Props
                numDigits={numDigits}
                setNumDigits={setNumDigits}
                comparisonOperator={comparisonOperator}
                setComparisonOperator={setComparisonOperator}
                tradeAction={tradeAction}
                setTradeAction={setTradeAction}
                isAutoTrading={isAutoTrading}
                setIsAutoTrading={setIsAutoTrading}
                tradeExecuted={tradeExecuted}
                setTradeExecuted={setTradeExecuted}
                numDigits1={numDigits1}
                setNumDigits1={setNumDigits1}
                comparisonOperator1={comparisonOperator1}
                setComparisonOperator1={setComparisonOperator1}
                tradeAction1={tradeAction1}
                setTradeAction1={setTradeAction1}
                isAutoTrading1={isAutoTrading1}
                setIsAutoTrading1={setIsAutoTrading1}
                tradeExecuted1={tradeExecuted1}
                setTradeExecuted1={setTradeExecuted1}
                lastTradeType={lastTradeType}
                setLastTradeType={setLastTradeType}
                numTicks={numTicks}
                setNumTicks={setNumTicks}
                comparisonOperator2={comparisonOperator2}
                setComparisonOperator2={setComparisonOperator2}
                tradeAction2={tradeAction2}
                setTradeAction2={setTradeAction2}
                isAutoTrading2={isAutoTrading2}
                setIsAutoTrading2={setIsAutoTrading2}
                tradeExecuted2={tradeExecuted2}
                setTradeExecuted2={setTradeExecuted2}
                lastTradeType2={lastTradeType2}
                setLastTradeType2={setLastTradeType2}
                presetName={presetName}
                setPresetName={setPresetName}
                fileInputKey={fileInputKey}
                setFileInputKey={setFileInputKey}
                isCustomTradeFormVisible={isCustomTradeFormVisible}
                setIsCustomTradeFormVisible={setIsCustomTradeFormVisible}
                isSequencesVisible={isSequencesVisible}
                setIsSequencesVisible={setIsSequencesVisible}
            />
            
            )}
            {activeCard === 'LDP' && (
                <DigitSequenceComponent
                    digitList={getLastDigitList()}
                    tickList={getTickList()}
                    CirclesDigitList={getLast1000DigitList()}
                    customPrediction={customPrediction}
                    handleCustomPredictionInputChange={handleCustomPredictionInputChange}
                    is_dark_mode_on={is_dark_mode_on}
                    buy_contract={buy_contract}
                    buy_contract_differs={buy_contract_differs}
                    selectTickList={selectTickList}
                    handleMartingaleInputChange={handleMartingaleInputChange}
                    martingaleValueRef={martingaleValueRef}
                    isTradeActive={isTradeActive}
                    setIsTradeActive={setIsTradeActive}
                    guideElement={guideElement} />
            )}
            {/* Middle Cards */}
            {(activeCard === 'rise_fall' || activeCard === 'over_under') && (
                <div className='rf_ou'>
                    {activeCard === 'over_under' && (
                        <div className='over_under card1'>
                            <div className='over_under_options'>
                                {/* <h2 className='analysis_title'>Over/Under</h2> */}
                                <div className='digit_inputs'>
                                    <div className='over_digit'>
                                        <label htmlFor='over_input'>Over</label>
                                        <input type='number' value={overValue} onChange={handleOverInputChange} />
                                    </div>
                                    <div className='under_digit'>
                                        <label htmlFor='under_input'>Under</label>
                                        <input type='number' value={underValue} onChange={handleUnderInputChange} />
                                    </div>
                                </div>
                                <div className='over_oct_container'>
                                    <div className='over_oct'>
                                        {overUnderManual ? (
                                            <button
                                                onClick={() => buy_contract_differs(overUnderContract, true)}
                                                className='overunder_buy_btn'
                                            >
                                                Buy
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleToggle}
                                                style={{
                                                    backgroundColor: isOverUnderOneClickActive ? 'red' : 'green',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '4px 8px',
                                                    cursor: 'pointer',
                                                    borderRadius: '5px',
                                                }}
                                            >
                                                {isOverUnderOneClickActive ? 'Stop' : 'Run'}
                                            </button>
                                        )}
                                        {selectTickList()}
                                        <div
                                            className='oneclick_amout'
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5px' }}
                                        >
                                            <h3>Settings</h3>
                                            <div className='guide' onClick={togglePopup}>
                                                <TbSettingsDollar />
                                            </div>
                                        </div>
                                    </div>
                                    {showPopup && (
                                        <div className="popup-overlay">
                                            <div className="popup-box">
                                                <button className="close-button" onClick={togglePopup}>X</button>
                                                <h2>Over/Under Settings</h2>
                                                <div className='settings-column'>
                                                    <div className='setting-item'>
                                                        <label>Trade Type</label>
                                                        <select
                                                            name="contractType"
                                                            id="contractType"
                                                            value={overUnderContract} // Set the default value
                                                            onChange={handleOverUnderContractSelect}
                                                        >
                                                            <option value="DIGITOVER">Over</option>
                                                            <option value="DIGITUNDER">Under</option>
                                                        </select>
                                                    </div>
                                                    <div className='setting-item'>
                                                        <label>Contract Type</label>
                                                        <select
                                                            name='direction'
                                                            id='direction'
                                                            onChange={handleOverUnderDirectionSelect}
                                                        >
                                                            <option value='SAME'>Same as trade type</option>
                                                            <option value='OPPOSITE'>Opposite to trade type</option>
                                                            <option value='MANUAL'>Manual</option>
                                                        </select>
                                                    </div>
                                                    <div
                                                        className='setting-item'
                                                    >
                                                        <label>No. of ticks</label>
                                                        <select name='intervals' id='contract_duration' onChange={handleDurationSelect}>
                                                            <option value='1'>1</option>
                                                            <option value='2'>2</option>
                                                            <option value='3'>3</option>
                                                            <option value='4'>4</option>
                                                            <option value='5'>5</option>
                                                            <option value='6'>6</option>
                                                            <option value='7'>7</option>
                                                            <option value='8'>8</option>
                                                            <option value='9'>9</option>
                                                        </select>
                                                    </div>
                                                    <div className='setting-item'>
                                                        <label>% Value</label>
                                                        <input
                                                            type='number'
                                                            value={percentageValue}
                                                            onChange={handlePercentageInputChange} />
                                                    </div>
                                                    <h5>Risk Management</h5>
                                                    <div className='active_inactive'>
                                                        <label>Use Martingale</label>
                                                        <label className='switch'>
                                                            <input
                                                                type='checkbox'
                                                                checked={enableDisableMartingale}
                                                                id='enable_disbale_martingale'
                                                                onChange={handleEnableDisableMart} />
                                                            <span className='slider round'></span>
                                                        </label>
                                                    </div>

                                                    {enableDisableMartingale && (
                                                        <div className='setting-item'>
                                                            <label>Martingale</label>
                                                            <input
                                                                type='number'
                                                                value={martingaleValueRef.current}
                                                                onChange={handleMartingaleInputChange} />
                                                        </div>
                                                    )}
                                                    <div className='active_inactive'>
                                                        <label>Use Take Profit/Stop Loss</label>
                                                        <label className='switch'>
                                                            <input
                                                                type='checkbox'
                                                                checked={enableSlTpValue}
                                                                id='enable_tp_sl'
                                                                onChange={handleIsActiveInActive} />
                                                            <span className='slider round'></span>
                                                        </label>
                                                    </div>

                                                    {enableSlTpValue && (
                                                        <>
                                                            <div className='setting-item'>
                                                                <label>Take Profit</label>
                                                                <input
                                                                    type='text'
                                                                    value={takeProfitValue}
                                                                    id='take_profit'
                                                                    onChange={handleTpChange} />
                                                            </div>

                                                            <div className='setting-item'>
                                                                <label>Stop Loss</label>
                                                                <input
                                                                    type='text'
                                                                    value={stopLossValue}
                                                                    id='stop_loss'
                                                                    onChange={handleSlChange} />
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className='active_inactive'>
                                                        <label>Copy Demo to Real Account</label>
                                                        <label className='switch'>
                                                            <input type='checkbox' checked={enableCopyDemo} id='copy_demo' onChange={handleDemoCopy} />
                                                            <span className='slider round'></span>
                                                        </label>
                                                    </div>
                                                    {enableCopyDemo && (
                                                        <select value={liveAccCR} onChange={handleLiveAccCrChange}>
                                                            {liveAccounts.map(key => (
                                                                <option key={key} value={key}>
                                                                    {key}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <OverUnderBarChart
                                overUnderList={getLastDigitList()}
                                overValue={overValue}
                                underValue={underValue}
                                is_mobile={is_mobile}
                                active_symbol={active_symbol}
                                isOverUnderOneClickActive={isOverUnderOneClickActive}
                                oneClickAmount={oneClickAmount}
                                oneClickDuration={oneClickDuration}
                                isTradeActive={isTradeActive}
                                percentageValue={percentageValue}
                                overUnderContract={overUnderContract}
                                overUnderDirection={overUnderDirection}
                                setIsTradeActive={setIsTradeActive}
                                isTradeActiveRef={isTradeActiveRef}
                                enableCopyDemo={enableCopyDemo}
                                liveAccCR={liveAccCR} />
                        </div>
                    )}
                    {(activeCard === 'rise_fall' || activeCard === 'over_under') && (
                        <div className='line_chart card2'>
                            <div className='linechat_oct'>
                                <select name='' id='linechat_oct_options' onChange={handleLineChartSelectChange}>
                                    {activeCard === 'rise_fall' && <option value='risefall'>Rise/Fall Chart</option>}
                                    {activeCard === 'over_under' && (
                                        <option value='lastdigit'>Last Digits Chart</option>
                                    )}
                                </select>
                                {!isTickChart && <h2 className='analysis_title'>Last Digits Chart</h2>}
                                {isTickChart && (
                                    <div className='oct_trading_options'>
                                        {activeCard === 'rise_fall' && (
                                            <div className='details_options'>
                                                <small>Enable</small>
                                                <label className='switch'>
                                                    <input
                                                        type='checkbox'
                                                        checked={isRiseFallOneClickActive}
                                                        onChange={handleIsRiseFallOneClick} />
                                                    <span className='slider round' />
                                                </label>
                                            </div>
                                        )}
                                        {activeCard === 'rise_fall' && (
                                            <div className='rise_fall_buttons'>
                                                <button
                                                    className='rise_btn'
                                                    onClick={() => buy_contract('CALL', isRiseFallOneClickActive)}
                                                >
                                                    Rise
                                                </button>
                                                <button
                                                    className='fall_btn'
                                                    onClick={() => buy_contract('PUT', isRiseFallOneClickActive)}
                                                >
                                                    Fall
                                                </button>
                                                {selectTickList()}
                                                <div
                                                    className='guide'
                                                    onClick={() => setShowBotSettings(!showBotSettings)}
                                                >
                                                    <TbSettingsDollar />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <ApolloLineChart data={getLineChartList()} />
                        </div>
                    )}
                    {activeCard === 'rise_fall' && (
                        <div className='rise_fall card1'>
                            <h2 className='analysis_title'>Rise/Fall</h2>
                            <RiseFallBarChart allDigitList={getLastDigitList()} is_mobile={is_mobile} />
                        </div>
                    )}
                </div>
            )}
            {/* Bottom Cards */}
            {activeCard === 'pie' && (
                <div className='pie_diff'>
                    <div className='pie card4'>
                        <div className='odd_even_info'>
                            <h2 className='analysis_title'>Even/Odd</h2>
                            <div className='odd_even_settings'>
                                <button
                                    onClick={handleToggleeo}
                                    style={{
                                        backgroundColor: isEvenOddOneClickActive ? 'red' : 'green',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                    }}
                                >
                                    {isEvenOddOneClickActive ? 'Stop' : 'Run'}
                                </button>
                                <div className='tick_stake'>{selectTickList()}</div>
                                <div
                                    className='oneclick_amout'
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5px' }}
                                >
                                    <h3>Settings</h3>
                                    <div className='guide' onClick={togglePopup}>
                                        <TbSettingsDollar />
                                    </div>
                                </div>
                            </div>
                            {showPopup && (
                                <div className="popup-overlay">
                                    <div className="popup-box">
                                        <button className="close-button" onClick={togglePopup}>X</button>
                                        <h2>Even/Odd Settings</h2>
                                        <div className='settings-column'>
                                            <div className='setting-item'>
                                                <label>Trade Type</label>
                                                <select
                                                    name="ct_types"
                                                    id="contract_types"
                                                    value={evenOddContract} // Set the default value
                                                    onChange={handleEvenOddContractSelect}
                                                >
                                                    <option value="DIGITEVEN">Even</option>
                                                    <option value="DIGITODD">Odd</option>
                                                    <option value="BOTH">Both</option>
                                                </select>
                                            </div>
                                            <div className="setting-item">
                                                <label>Contract Type</label>
                                                <select value={sameDiffEvenOdd} onChange={handleSameDiffEvenOddContractSelect}>
                                                    <option value="SAME">Same</option>
                                                    <option value="OPPOSITE">Opposite</option>
                                                </select>
                                            </div>
                                            <div
                                                className='setting-item'
                                            >
                                                <label>No. of ticks</label>
                                                <select name='intervals' id='contract_duration' onChange={handleDurationSelect}>
                                                    <option value='1'>1</option>
                                                    <option value='2'>2</option>
                                                    <option value='3'>3</option>
                                                    <option value='4'>4</option>
                                                    <option value='5'>5</option>
                                                    <option value='6'>6</option>
                                                    <option value='7'>7</option>
                                                    <option value='8'>8</option>
                                                    <option value='9'>9</option>
                                                </select>
                                            </div>
                                            <div className='setting-item'>
                                                <label>% Value</label>
                                                <input
                                                    type='number'
                                                    value={percentageValue}
                                                    onChange={handlePercentageInputChange} />
                                            </div>
                                            <h5>Risk Management</h5>
                                            <div className='active_inactive'>
                                                <label>Use Martingale</label>
                                                <label className='switch'>
                                                    <input
                                                        type='checkbox'
                                                        checked={enableDisableMartingale}
                                                        id='enable_disbale_martingale'
                                                        onChange={handleEnableDisableMart} />
                                                    <span className='slider round'></span>
                                                </label>
                                            </div>

                                            {enableDisableMartingale && (
                                                <div className='setting-item'>
                                                    <label>Martingale</label>
                                                    <input
                                                        type='number'
                                                        value={martingaleValueRef.current}
                                                        onChange={handleMartingaleInputChange} />
                                                </div>
                                            )}
                                            <div className='active_inactive'>
                                                <label>Use Take Profit/Stop Loss</label>
                                                <label className='switch'>
                                                    <input
                                                        type='checkbox'
                                                        checked={enableSlTpValue}
                                                        id='enable_tp_sl'
                                                        onChange={handleIsActiveInActive} />
                                                    <span className='slider round'></span>
                                                </label>
                                            </div>

                                            {enableSlTpValue && (
                                                <>
                                                    <div className='setting-item'>
                                                        <label>Take Profit</label>
                                                        <input
                                                            type='text'
                                                            value={takeProfitValue}
                                                            id='take_profit'
                                                            onChange={handleTpChange} />
                                                    </div>

                                                    <div className='setting-item'>
                                                        <label>Stop Loss</label>
                                                        <input
                                                            type='text'
                                                            value={stopLossValue}
                                                            id='stop_loss'
                                                            onChange={handleSlChange} />
                                                    </div>
                                                </>
                                            )}
                                            <div className='active_inactive'>
                                                <label>Copy Demo to Real Account</label>
                                                <label className='switch'>
                                                    <input type='checkbox' checked={enableCopyDemo} id='copy_demo' onChange={handleDemoCopy} />
                                                    <span className='slider round'></span>
                                                </label>
                                            </div>
                                            {enableCopyDemo && (
                                                <select value={liveAccCR} onChange={handleLiveAccCrChange}>
                                                    {liveAccounts.map(key => (
                                                        <option key={key} value={key}>
                                                            {key}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className='pie_container'>
                            <PieChart
                                allDigitList={getLastDigitList()}
                                contract_type={evenOddContract}
                                isEvenOddOneClickActive={isEvenOddOneClickActive}
                                percentageValue={percentageValue}
                                active_symbol={active_symbol}
                                isTradeActive={isTradeActive}
                                isTradeActiveRef={isTradeActiveRef}
                                oneClickAmount={oneClickAmount}
                                oneClickDuration={oneClickDuration}
                                setIsTradeActive={setIsTradeActive}
                                enableCopyDemo={enableCopyDemo}
                                liveAccCR={liveAccCR}
                                sameDiffEvenOdd={sameDiffEvenOdd} />
                        </div>
                    </div>
                </div>
            )}
            {activeCard === 'diff' && (
                <div className='pie_diff'>
                    <div className='digit_diff card3'>
                        <h2 className='analysis_title'>Differs/Matches</h2>
                        <div className='title_oc_trader'>
                            <div className='oneclick_trader'>
                                {tradingDiffType === 'MANUAL' ? (
                                    <button
                                        className='custom_buy_btn'
                                        onClick={() => buy_contract_differs(oneClickContract)}
                                    >
                                        Buy
                                    </button>
                                ) : (
                                    oneClickContract === 'DIGITDIFF' && (
                                        <>
                                            <div className='differs_choices'>
                                                <button
                                                    onClick={handleIsOneClick}
                                                    style={{
                                                        backgroundColor: isOneClickActive ? 'red' : 'green',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '4px 8px',
                                                        cursor: 'pointer',
                                                        borderRadius: '5px',
                                                    }}
                                                >
                                                    {isOneClickActive ? 'Stop' : 'Run'}
                                                </button>
                                                <div className='auto_clicker'>
                                                    <small>Auto Differ</small>
                                                    <label className='switch'>
                                                        <input
                                                            type='checkbox'
                                                            checked={isAutoClickerActive}
                                                            onChange={handleIsAutoClicker} />
                                                        <span className='slider round' />
                                                    </label>
                                                </div>
                                            </div>
                                        </>
                                    )
                                )}
                                {tradingDiffType === 'MANUAL' && (
                                    <div className='auto_clicker'>
                                        <small>Prediction</small>
                                        <input
                                            className='custom_prediction'
                                            type='number'
                                            value={customPrediction}
                                            onChange={handleCustomPredictionInputChange} />
                                    </div>
                                )}
                                {selectTickList()}
                                <div
                                    className='oneclick_amout'
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5px' }}
                                >
                                    <h3>Settings</h3>
                                    <div className='guide' onClick={togglePopup2}>
                                        <TbSettingsDollar />
                                    </div>
                                    {showPopup2 && (
                                        <div className="popup-overlay">
                                            <div className="popup-box">
                                                <button className="close-button" onClick={togglePopup2}>X</button>
                                                <h2>Differs/Matches Settings</h2>
                                                <div className='settings-column'>
                                                    <div className='setting-item'>
                                                        <label>Trade Type</label>
                                                        <select name='ct_types' id='contract_types' onChange={handleContractSelect}>
                                                            <option value='DIGITDIFF'>Differs</option>
                                                            <option value='DIGITMATCH'>Matches</option>
                                                        </select>
                                                    </div>
                                                    <div className='setting-item'>
                                                        <label>Contract Type</label>
                                                        <select name='td_options' id='trading_options' onChange={handleTradingDiffType}>
                                                            <option value='AUTO'>Auto</option>
                                                            <option value='MANUAL'>Manual</option>
                                                        </select>
                                                    </div>
                                                    <div
                                                        className='setting-item'
                                                    >
                                                        <label>No. of ticks</label>
                                                        <select name='intervals' id='contract_duration' onChange={handleDurationSelect}>
                                                            <option value='1'>1</option>
                                                            <option value='2'>2</option>
                                                            <option value='3'>3</option>
                                                            <option value='4'>4</option>
                                                            <option value='5'>5</option>
                                                            <option value='6'>6</option>
                                                            <option value='7'>7</option>
                                                            <option value='8'>8</option>
                                                            <option value='9'>9</option>
                                                        </select>
                                                    </div>
                                                    <h5>Risk Management</h5>
                                                    <div className='active_inactive'>
                                                        <label>Use Martingale</label>
                                                        <label className='switch'>
                                                            <input
                                                                type='checkbox'
                                                                checked={enableDisableMartingale}
                                                                id='enable_disbale_martingale'
                                                                onChange={handleEnableDisableMart} />
                                                            <span className='slider round'></span>
                                                        </label>
                                                    </div>

                                                    {enableDisableMartingale && (
                                                        <div className='setting-item'>
                                                            <label>Martingale</label>
                                                            <input
                                                                type='number'
                                                                value={martingaleValueRef.current}
                                                                onChange={handleMartingaleInputChange} />
                                                        </div>
                                                    )}
                                                    <div className='active_inactive'>
                                                        <label>Use Take Profit/Stop Loss</label>
                                                        <label className='switch'>
                                                            <input
                                                                type='checkbox'
                                                                checked={enableSlTpValue}
                                                                id='enable_tp_sl'
                                                                onChange={handleIsActiveInActive} />
                                                            <span className='slider round'></span>
                                                        </label>
                                                    </div>

                                                    {enableSlTpValue && (
                                                        <>
                                                            <div className='setting-item'>
                                                                <label>Take Profit</label>
                                                                <input
                                                                    type='text'
                                                                    value={takeProfitValue}
                                                                    id='take_profit'
                                                                    onChange={handleTpChange} />
                                                            </div>

                                                            <div className='setting-item'>
                                                                <label>Stop Loss</label>
                                                                <input
                                                                    type='text'
                                                                    value={stopLossValue}
                                                                    id='stop_loss'
                                                                    onChange={handleSlChange} />
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className='active_inactive'>
                                                        <label>Copy Demo to Real Account</label>
                                                        <label className='switch'>
                                                            <input type='checkbox' checked={enableCopyDemo} id='copy_demo' onChange={handleDemoCopy} />
                                                            <span className='slider round'></span>
                                                        </label>
                                                    </div>
                                                    {enableCopyDemo && (
                                                        <select value={liveAccCR} onChange={handleLiveAccCrChange}>
                                                            {liveAccounts.map(key => (
                                                                <option key={key} value={key}>
                                                                    {key}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DiffersBalls
                            lastDigitList={getLastDigitList()}
                            active_last={lastDigit}
                            active_symbol={active_symbol}
                            contract_type={oneClickContract}
                            duration={oneClickDuration}
                            isOneClickActive={isOneClickActive}
                            stake_amount={oneClickAmount}
                            prevLowestValue={prevLowestValue}
                            isAutoClickerActive={isAutoClickerActive}
                            digitDiffHigh={digitDiffHigh}
                            digitDiffLow={digitDiffLow}
                            isTradeActive={isTradeActive}
                            isTradeActiveRef={isTradeActiveRef}
                            setIsTradeActive={setIsTradeActive}
                            setPrevLowestValue={setPrevLowestValue}
                            tradingDiffType={tradingDiffType}
                            enableCopyDemo={enableCopyDemo}
                            liveAccCR={liveAccCR} />
                    </div>
                </div>
            )}
        </div></>
    );
});

export default BinaryAnalysisPage;
