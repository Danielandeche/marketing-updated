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
import AutoLDPComponent from './AUTOLDP/AutoLDPComponent';
import { FaClipboardList, FaCloudUploadAlt, FaCloudDownloadAlt} from 'react-icons/fa';
import Modal from 'react-modal';

//strategies
import Over2 from './strategies/Over 2.json';
import Over3 from './strategies/Over 2 Pro.json';

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

interface UploadedSettings {
    activeCard?: string;
    lastDigit?: number;
    numberOfTicks?: number;
    overValue?: number;
    martingaleValue?: number;
    percentageValue?: number;
    underValue?: number;
    isOneClickActive?: boolean;
    isAutoClickerActive?: boolean;
    isRiseFallOneClickActive?: boolean;
    isEvenOddOneClickActive?: boolean;
    isOverUnderOneClickActive?: boolean;
    isTradeActive?: boolean;
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
}

const BinaryAnalysisPage = observer(() => {
    const [activeCard, setActiveCard] = useState(() => {
        return localStorage.getItem('activeCard') || 'AUTOLDP';
    });
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [currentTick, setCurrentTick] = useState<number | string>('Updating...');
    const [allLastDigitList, setAllLastDigitList] = useState<number[]>([]);
    const [isTickChart, setIsTickChart] = useState(true);
    const [lastDigit, setLastDigit] = useState(0);
    const [numberOfTicks, setNumberOfTicks] = useState<string | number>(1000);
    const [optionsList, setOptions] = useState<SymbolData[]>([]);
    const [overValue, setOverValue] = useState<string | number>(4);
    const [martingaleValue, setMartingaleValue] = useState<number | string>(Number(localStorage.getItem('martingaleValue')) || 1.2);
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
    const [presetName, setPresetName] = useState('');
    const [fileInputKey, setFileInputKey] = useState(0);
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const togglePopup = () => {
        setShowPopup(!showPopup);
    };

    const strategies = [
        { name: 'Over2', data: Over2 },
        { name: 'Over3', data: Over3 }
    ];

    const handleStrategySelect = (uploadedSettings: UploadedSettings) => {
        setActiveCard(uploadedSettings.activeCard || 'AUTOLDP');
        setLastDigit(uploadedSettings.lastDigit || 0);
        setNumberOfTicks(uploadedSettings.numberOfTicks || 1000);
        setOverValue(uploadedSettings.overValue || 4);
        martingaleValueRef.current = uploadedSettings.martingaleValue || 1.2;
        setPercentageValue(uploadedSettings.percentageValue || 60);
        setUnderValue(uploadedSettings.underValue || 4);
        setIsOneClickActive(uploadedSettings.isOneClickActive || false);
        setIsAutoClickerActive(uploadedSettings.isAutoClickerActive || false);
        setIsRiseFallOneClickActive(uploadedSettings.isRiseFallOneClickActive || false);
        setIsEvenOddOneClickActive(uploadedSettings.isEvenOddOneClickActive || false);
        setIsOverUnderOneClickActive(uploadedSettings.isOverUnderOneClickActive || false);
        setIsTradeActive(uploadedSettings.isTradeActive || false);
        setOneClickContract(uploadedSettings.oneClickContract || 'DIGITDIFF');
        setTradingDiffType(uploadedSettings.tradingDiffType || 'AUTO');
        setOverUnderContract(uploadedSettings.overUnderContract || 'DIGITOVER');
        setOverUnderDirection(uploadedSettings.overUnderDirection || 'SAME');
        setEvenOddContract(uploadedSettings.evenOddContract || 'DIGITEVEN');
        setSameDiffEvenOdd(uploadedSettings.sameDiffEvenOdd || 'SAME');
        setOneClickDuration(uploadedSettings.oneClickDuration || 1);
        setOneClickAmount(uploadedSettings.oneClickAmount || 0.5);
        setCustomPrediction(uploadedSettings.customPrediction || 0);
        setTakeProfitValue(uploadedSettings.takeProfitValue || 2);
        setStopLossValue(uploadedSettings.stopLossValue || 2);
        setEnableSlTpValue(uploadedSettings.enableSlTpValue || false);
        setEnableDisableMartingale(uploadedSettings.enableDisableMartingale || true);
        setCopyDemo(uploadedSettings.enableCopyDemo || false);
        setOverUnderManual(uploadedSettings.overUnderManual || false);
    };
       

    useEffect(() => {
        localStorage.setItem('martingaleValue', martingaleValue.toString());
    }, [
        martingaleValue
    ]);

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
    const { transactions, run_panel, } = DBotStores;
    const { registerBotListeners, unregisterBotListeners } = run_panel;
    const { is_mobile, is_dark_mode_on } = ui;
    const { updateResultsCompletedContract } = transactions;

    // Save activeCard to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activeCard', activeCard);
    }, [activeCard]);

    // Function to update activeCard
    const handleCardChange = (newCard: string) => {
        setActiveCard(newCard);  // Update activeCard state and automatically save to localStorage
    };

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
                    const { proposal_open_contract } = data;
                    const contract = proposal_open_contract.contract_type;

                    if (contractTradeTypes.current.includes(contract)) {
                        if (proposal_open_contract.is_sold) {
                            // Take profit and stopLoss check
                            if (
                                !current_contractids.current.includes(proposal_open_contract.contract_id) &&
                                enable_tp_sl.current
                            ) {
                                total_profit.current += proposal_open_contract.profit;
                                if (total_profit.current >= take_profit.current) {
                                    stopAnalysisBot();
                                } else if (total_profit.current <= -stop_loss.current) {
                                    stopAnalysisBot();
                                }
                            }

                            console.log('Martingale Status', enable_disable_martingale.current);
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
                                isTradeActiveRef.current = false;
                                setIsTradeActive(false);
                            }
                            if (
                                isTradeActiveRef.current &&
                                !current_contractids.current.includes(proposal_open_contract.contract_id)
                            ) {
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

    const stopAnalysisBot = () => {
        setIsRiseFallOneClickActive(false);
        setIsOverUnderOneClickActive(false);
        setIsEvenOddOneClickActive(false);
        setIsOneClickActive(false);
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

    const buy_contract = (contract_type: string, isTradeActive: boolean) => {
        if (isTradeActive) {
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
    };
    const handleSameDiffEvenOddContractSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSameDiffEvenOdd(selectedValue);
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

    const handleToggle = () => {
        setIsOverUnderOneClickActive(prevState => !prevState);
    };
    const handleToggleeo = () => {
        setIsEvenOddOneClickActive(prevState => !prevState);
    };

    
       
    // Function to download bot settings as a JSON file
    const downloadSettings = () => {
        const name = window.prompt("Enter the name for your settings file:", "Template name");
        if (name) {
            const settings = {
                activeCard,
                lastDigit,
                numberOfTicks,
                overValue,
                martingaleValue: martingaleValueRef.current,
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
                takeProfitValue,
                stopLossValue,
                enableSlTpValue,
                enableDisableMartingale,
                enableCopyDemo,
                overUnderManual,
            };

            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}.json`;
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

                setActiveCard(uploadedSettings.activeCard || 'AUTOLDP');
                setLastDigit(uploadedSettings.lastDigit || 0);
                setOverValue(uploadedSettings.overValue || 4);
                martingaleValueRef.current = uploadedSettings.martingaleValue || 1.2;
                setPercentageValue(uploadedSettings.percentageValue || 60);
                setUnderValue(uploadedSettings.underValue || 4);
                setIsOneClickActive(uploadedSettings.isOneClickActive || false);
                setIsAutoClickerActive(uploadedSettings.isAutoClickerActive || false);
                setIsRiseFallOneClickActive(uploadedSettings.isRiseFallOneClickActive || false);
                setIsEvenOddOneClickActive(uploadedSettings.isEvenOddOneClickActive || false);
                setIsOverUnderOneClickActive(uploadedSettings.isOverUnderOneClickActive || false);
                setIsTradeActive(uploadedSettings.isTradeActive || false);
                setOneClickContract(uploadedSettings.oneClickContract || 'DIGITDIFF');
                setTradingDiffType(uploadedSettings.tradingDiffType || 'AUTO');
                setOverUnderContract(uploadedSettings.overUnderContract || 'DIGITOVER');
                setOverUnderDirection(uploadedSettings.overUnderDirection || 'SAME');
                setEvenOddContract(uploadedSettings.evenOddContract || 'DIGITEVEN');
                setSameDiffEvenOdd(uploadedSettings.sameDiffEvenOdd || 'SAME');
                setOneClickDuration(uploadedSettings.oneClickDuration || 1);
                setOneClickAmount(uploadedSettings.oneClickAmount || 0.5);
                setCustomPrediction(uploadedSettings.customPrediction || 0);
                setTakeProfitValue(uploadedSettings.takeProfitValue || 2);
                setStopLossValue(uploadedSettings.stopLossValue || 2);
                setEnableSlTpValue(uploadedSettings.enableSlTpValue || false);
                setEnableDisableMartingale(uploadedSettings.enableDisableMartingale || true);
                setCopyDemo(uploadedSettings.enableCopyDemo || false);
                setOverUnderManual(uploadedSettings.overUnderManual || false);
            };
            reader.readAsText(file);
        }
    };

    // Example of storing in localStorage when values change
    useEffect(() => {
        const settings = {
            activeCard,
            isSubscribed,
            currentTick,
            allLastDigitList,
            isTickChart,
            lastDigit,
            numberOfTicks,
            optionsList,
            overValue,
            martingaleValue: martingaleValueRef.current,
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
            liveAccCR,
            overUnderManual,
        };

        localStorage.setItem('botSettings', JSON.stringify(settings));
    }, [
        activeCard, isSubscribed, currentTick, allLastDigitList, isTickChart, lastDigit, numberOfTicks,
        optionsList, overValue, percentageValue, underValue, isOneClickActive, isAutoClickerActive,
        isRiseFallOneClickActive, isEvenOddOneClickActive, isOverUnderOneClickActive, isTradeActive,
        oneClickContract, tradingDiffType, overUnderContract, overUnderDirection, evenOddContract,
        sameDiffEvenOdd, oneClickDuration, oneClickAmount, customPrediction, accountCurrency, active_symbol,
        prev_symbol, pip_size, prevLowestValue, showBotSettings, takeProfitValue, stopLossValue,
        enableSlTpValue, enableDisableMartingale, enableCopyDemo, liveAccCR, overUnderManual
    ]);

    useEffect(() => {
        const savedSettings = localStorage.getItem('botSettings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);

            setActiveCard(parsedSettings.activeCard || 'AUTOLDP');
            setIsSubscribed(parsedSettings.isSubscribed || false);
            setCurrentTick(parsedSettings.currentTick || 'Updating...');
            setAllLastDigitList(parsedSettings.allLastDigitList || []);
            setIsTickChart(parsedSettings.isTickChart || true);
            setLastDigit(parsedSettings.lastDigit || 0);
            setNumberOfTicks(parsedSettings.numberOfTicks || 1000);
            setOptions(parsedSettings.optionsList || []);
            setOverValue(parsedSettings.overValue || 4);
            martingaleValueRef.current = parsedSettings.martingaleValue || 1.2;
            setPercentageValue(parsedSettings.percentageValue || 60);
            setUnderValue(parsedSettings.underValue || 4);
            setIsOneClickActive(parsedSettings.isOneClickActive || false);
            setIsAutoClickerActive(parsedSettings.isAutoClickerActive || false);
            setIsRiseFallOneClickActive(parsedSettings.isRiseFallOneClickActive || false);
            setIsEvenOddOneClickActive(parsedSettings.isEvenOddOneClickActive || false);
            setIsOverUnderOneClickActive(parsedSettings.isOverUnderOneClickActive || false);
            setIsTradeActive(parsedSettings.isTradeActive || false);
            setOneClickContract(parsedSettings.oneClickContract || 'DIGITDIFF');
            setTradingDiffType(parsedSettings.tradingDiffType || 'AUTO');
            setOverUnderContract(parsedSettings.overUnderContract || 'DIGITOVER');
            setOverUnderDirection(parsedSettings.overUnderDirection || 'SAME');
            setEvenOddContract(parsedSettings.evenOddContract || 'DIGITEVEN');
            setSameDiffEvenOdd(parsedSettings.sameDiffEvenOdd || 'SAME');
            setOneClickDuration(parsedSettings.oneClickDuration || 1);
            setOneClickAmount(parsedSettings.oneClickAmount || 0.5);
            setCustomPrediction(parsedSettings.customPrediction || 0);
            setAccountCurrency(parsedSettings.accountCurrency || '');
            setActiveSymbol(parsedSettings.active_symbol || 'R_100');
            setPrevSymbol(parsedSettings.prev_symbol || 'R_100');
            setPipSize(parsedSettings.pip_size || 2);
            setPrevLowestValue(parsedSettings.prevLowestValue || '');
            setShowBotSettings(parsedSettings.showBotSettings || false);
            setTakeProfitValue(parsedSettings.takeProfitValue || 2);
            setStopLossValue(parsedSettings.stopLossValue || 2);
            setEnableSlTpValue(parsedSettings.enableSlTpValue || false);
            setEnableDisableMartingale(parsedSettings.enableDisableMartingale || true);
            setCopyDemo(parsedSettings.enableCopyDemo || false);
            setLiveAccCr(parsedSettings.liveAccCR || '');
            setOverUnderManual(parsedSettings.overUnderManual || false);
        }
    }, []);

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
                        {/* <h6>No. of Ticks </h6> */}
                        <input type='number' name='' id='' value={numberOfTicks} onChange={handleInputChange} />
                    </div>
                    <div className='current_price'>
                        <h3>{currentTick.toString()}</h3>
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
                        setEnableDisableMartingale={setEnableDisableMartingale}
                    />
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
                        className={`button ${['pie_diff', 'over_under', 'rise_fall'].includes(activeCard) ? 'active' : ''}`}
                        value={activeCard}
                        onChange={(e) => handleSetActiveCard(e.target.value)}
                    >
                        <option>PRO TOOL</option>
                        <option value='pie_diff'>Even/Odd & Differs</option>
                        <option value='over_under'>Over Under</option>
                        <option value='rise_fall'>Rise Fall</option>
                    </select>
                </div>
                <div className='settings'>
                    <div className='upload'>
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
                    <div className='download'>
                        <label onClick={downloadSettings} className='download-label'>
                            <FaCloudDownloadAlt className='icond' />
                            <span>Download</span>
                        </label>
                    </div>
                    <div className='strategies'>
                        <label onClick={() => setIsStrategyModalOpen(true)} className='strategies-label'>
                            <FaClipboardList className='icons' />
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
                    guideElement={guideElement}
                />
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
                                                            name='contractType'
                                                            id='contractType'
                                                            onChange={handleOverUnderContractSelect}
                                                        >
                                                            <option value='DIGITOVER'>Over</option>
                                                            <option value='DIGITUNDER'>Under</option>
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
                                                            onChange={handlePercentageInputChange}
                                                        />
                                                    </div>
                                                    <h5>Risk Management</h5>
                                                    <div className='active_inactive'>
                                                        <label>Use Martingale</label>
                                                        <label className='switch'>
                                                            <input
                                                                type='checkbox'
                                                                checked={enableDisableMartingale}
                                                                id='enable_disbale_martingale'
                                                                onChange={handleEnableDisableMart}
                                                            />
                                                            <span className='slider round'></span>
                                                        </label>
                                                    </div>

                                                    {enableDisableMartingale && (
                                                        <div className='setting-item'>
                                                            <label>Martingale</label>
                                                            <input
                                                                type='number'
                                                                value={martingaleValueRef.current}
                                                                onChange={handleMartingaleInputChange}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className='active_inactive'>
                                                        <label>Use Take Profit/Stop Loss</label>
                                                        <label className='switch'>
                                                            <input
                                                                type='checkbox'
                                                                checked={enableSlTpValue}
                                                                id='enable_tp_sl'
                                                                onChange={handleIsActiveInActive}
                                                            />
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
                                                                    onChange={handleTpChange}
                                                                />
                                                            </div>
                                                            
                                                            <div className='setting-item'>
                                                                <label>Stop Loss</label>
                                                                <input
                                                                    type='text'
                                                                    value={stopLossValue}
                                                                    id='stop_loss'
                                                                    onChange={handleSlChange}
                                                                />
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
                                liveAccCR={liveAccCR}
                            />
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
                                                        onChange={handleIsRiseFallOneClick}
                                                    />
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
            {activeCard === 'pie_diff' && (
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
                                                            onChange={handleIsAutoClicker}
                                                        />
                                                        <span className='slider round' />
                                                    </label>
                                                </div>
                                            </div>
                                        </>
                                    )
                                )}
                                {tradingDiffType === 'MANUAL' && (
                                    <input
                                        className='custom_prediction'
                                        type='number'
                                        value={customPrediction}
                                        onChange={handleCustomPredictionInputChange}
                                    />
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
                                {showPopup && (
                                    <div className="popup-overlay">
                                        <div className="popup-box">
                                            <button className="close-button" onClick={togglePopup}>X</button>
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
                                                <div className='setting-item'>
                                                    <label>% Value</label>
                                                    <input
                                                        type='number'
                                                        value={percentageValue}
                                                        onChange={handlePercentageInputChange}
                                                    />
                                                </div>
                                                <h5>Risk Management</h5>
                                                <div className='active_inactive'>
                                                    <label>Use Martingale</label>
                                                    <label className='switch'>
                                                        <input
                                                            type='checkbox'
                                                            checked={enableDisableMartingale}
                                                            id='enable_disbale_martingale'
                                                            onChange={handleEnableDisableMart}
                                                        />
                                                        <span className='slider round'></span>
                                                    </label>
                                                </div>

                                                {enableDisableMartingale && (
                                                    <div className='setting-item'>
                                                        <label>Martingale</label>
                                                        <input
                                                            type='number'
                                                            value={martingaleValueRef.current}
                                                            onChange={handleMartingaleInputChange}
                                                        />
                                                    </div>
                                                )}
                                                <div className='active_inactive'>
                                                    <label>Use Take Profit/Stop Loss</label>
                                                    <label className='switch'>
                                                        <input
                                                            type='checkbox'
                                                            checked={enableSlTpValue}
                                                            id='enable_tp_sl'
                                                            onChange={handleIsActiveInActive}
                                                        />
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
                                                                onChange={handleTpChange}
                                                            />
                                                        </div>
                                                        
                                                        <div className='setting-item'>
                                                            <label>Stop Loss</label>
                                                            <input
                                                                type='text'
                                                                value={stopLossValue}
                                                                id='stop_loss'
                                                                onChange={handleSlChange}
                                                            />
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
                            liveAccCR={liveAccCR}
                        />
                    </div>
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
                                <div
                                    className='oneclick_amout'
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5px' }}
                                >
                                    <h3>Settings</h3>                                        
                                    <div className='guide' onClick={togglePopup}>
                                        <TbSettingsDollar />
                                    </div>
                                </div>
                                <div className='tick_stake'>{selectTickList()}</div>
                            </div>          
                            {showPopup && (
                                <div className="popup-overlay">
                                    <div className="popup-box">
                                        <button className="close-button" onClick={togglePopup}>X</button>
                                        <h2>Even/Odd Settings</h2>
                                        <div className='settings-column'>
                                            <div className='setting-item'>
                                                <label>Trade Type</label>
                                                <select name='ct_types' id='contract_types' onChange={handleEvenOddContractSelect}>
                                                    <option value='DIGITEVEN'>Even</option>
                                                    <option value='DIGITODD'>Odd</option>
                                                    <option value='BOTH'>Both</option>
                                                </select>
                                            </div>
                                            <div className='setting-item'>
                                                <label>Contract Type</label>
                                                <select onChange={handleSameDiffEvenOddContractSelect}>
                                                    <option value='SAME'>Same</option>
                                                    <option value='OPPOSITE'>Opposite</option>
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
                                                    onChange={handlePercentageInputChange}
                                                />
                                            </div>
                                            <h5>Risk Management</h5>
                                            <div className='active_inactive'>
                                                <label>Use Martingale</label>
                                                <label className='switch'>
                                                    <input
                                                        type='checkbox'
                                                        checked={enableDisableMartingale}
                                                        id='enable_disbale_martingale'
                                                        onChange={handleEnableDisableMart}
                                                    />
                                                    <span className='slider round'></span>
                                                </label>
                                            </div>

                                            {enableDisableMartingale && (
                                                <div className='setting-item'>
                                                    <label>Martingale</label>
                                                    <input
                                                        type='number'
                                                        value={martingaleValueRef.current}
                                                        onChange={handleMartingaleInputChange}
                                                    />
                                                </div>
                                            )}
                                            <div className='active_inactive'>
                                                <label>Use Take Profit/Stop Loss</label>
                                                <label className='switch'>
                                                    <input
                                                        type='checkbox'
                                                        checked={enableSlTpValue}
                                                        id='enable_tp_sl'
                                                        onChange={handleIsActiveInActive}
                                                    />
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
                                                            onChange={handleTpChange}
                                                        />
                                                    </div>
                                                    
                                                    <div className='setting-item'>
                                                        <label>Stop Loss</label>
                                                        <input
                                                            type='text'
                                                            value={stopLossValue}
                                                            id='stop_loss'
                                                            onChange={handleSlChange}
                                                        />
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
                                sameDiffEvenOdd={sameDiffEvenOdd}
                            />
                        </div>
                    </div>
                </div>
            )}
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
                Video Tutorial
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
    );
});

export default BinaryAnalysisPage;