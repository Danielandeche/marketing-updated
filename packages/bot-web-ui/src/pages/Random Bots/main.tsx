import React, { useEffect, useRef, useState } from 'react';
import BotCard from './components/botcard';
import RdConfig from './components/RdConfig';
import RdTradePage from './components/RdTradePage';
import { api_base, api_base4, getLiveAccToken, getToken } from '@deriv/bot-skeleton';
import { FaLinesLeaning } from 'react-icons/fa6';

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

const BotCardProps = {
    botName: 'All-In-One ',
    botDescription: 'This is a all in one bot trading both Under 7 and Under 8 after a certain alogarith is met.',
    recommended: true,
};

const BotCardProps2 = {
    botName: 'Under 9 Random ',
    botDescription: 'This Bot takes Under 9 trades randomly with no special analysis. Very Demure.',
    recommended: false,
};

const BotCardProps3 = {
    botName: 'Under 8 ',
    botDescription: 'A powerful bot that analyzes market trends and makes trades accordingly.',
    recommended: FaLinesLeaning,
};

const BotCardProps4 = {
    botName: 'Under 8 Pro',
    botDescription: 'A high-frequency trading bot that specializes in quick, small profit trades.',
    recommended: true,
};

const BotCardProps5 = {
    botName: 'Under 7',
    botDescription: 'Perfect for range-bound markets, this bot trades within a set price range.',
    recommended: true,
};

const BotCardProps6 = {
    botName: 'Under 7 Pro',
    botDescription: 'Perfect for range-bound markets, this bot trades within a set price range.',
    recommended: true,
};

function sleep(milliseconds: any) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const RandomBots = () => {
    const [showRdTradePage, setShowRdTradePage] = useState(false);
    const [showRdConfig, setShowRdConfig] = useState(false);
    const [wonTrades, setWonTrades] = useState(0);
    const [lostTrades, setLostTrades] = useState(0);
    const [takeProfit, setTakeProfit] = useState<string | number>(5);
    const [stopLoss, setStopLoss] = useState<string | number>(10);
    const [pnl, setPNL] = useState(0);
    const [stake, setStake] = useState<string | number>(2);
    const [defaultStake, setDefaultStake] = useState<string | number>(stake);
    const [martingale, setMartingale] = useState<string | number>(1.2);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [lastDigit, setLastDigit] = useState(0);
    const [currentTick, setCurrentTick] = useState<number | string>('Updating...');
    const [allLastDigitList, setAllLastDigitList] = useState<number[]>([]);
    const [pip_size, setPipSize] = useState(2);
    const [active_symbol, setActiveSymbol] = useState('R_100');
    const [optionsList, setOptions] = useState<SymbolData[]>([]);
    const [isTradeActive, setIsTradeActive] = useState(false);
    const [active_strategy, setActiveStrategy] = useState(1);
    const [prev_symbol, setPrevSymbol] = useState('R_100');

    const contractTradeTypes = useRef<string[]>(['DIGITODD', 'DIGITEVEN', 'DIGITOVER', 'DIGITUNDER', 'DIGITDIFF']);
    const activeSymbolRef = useRef<string>(active_symbol);
    const martingaleValueRef = useRef(martingale);
    const isTradeActiveRef = useRef(isTradeActive);
    const isTradeActiveRef_v2 = useRef(isTradeActive);
    const current_contractids = useRef<string[]>([]);
    const allLastDigitListRef = useRef<number[]>([]);
    const take_profit = useRef<string | number>(takeProfit);
    const stop_loss = useRef<string | number>(stopLoss);
    const total_profit = useRef<number>(0);
    const activeStrategyRef = useRef<number>(active_strategy);
    const stakeRef = useRef<string | number>(stake);
    const oneClickDefaultAmount = useRef<string | number>(defaultStake);
    const totalLostAmount = useRef(0);
    const consoleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        startApi();
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

    const handleStartClick = (strategy: number) => {
        setShowRdTradePage(true);
        setActiveStrategy(strategy);
        activeStrategyRef.current = strategy;
    };

    const getLastDigits = (tick: any, pip_size: any) => {
        let lastDigit = tick.toFixed(pip_size);
        lastDigit = String(lastDigit).slice(-1);
        return Number(lastDigit);
    };

    const removeFirstElement = () => {
        setAllLastDigitList(prevList => prevList.slice(1));
        allLastDigitListRef.current.shift();
    };

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        api_base4.api.forgetAll('ticks').then(() => {
            setCurrentTick('Loading...');
            setActiveSymbol(selectedValue);
            activeSymbolRef.current = selectedValue;
        });
    };
    const handleUpdateStake = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const parsedValue = newValue === '' || isNaN(Number(newValue)) ? newValue : parseFloat(newValue);

        oneClickDefaultAmount.current = parsedValue;
        stakeRef.current = parsedValue;
        setStake(parsedValue);
        setDefaultStake(parsedValue);
    };

    const getLastDigitList = (allLastDigitList:  number[]) => {
        const requiredItems = allLastDigitList.slice(1000);
        const returnedList: number[] = [];
        requiredItems.forEach((tick: number) => {
            const last_digit = getLastDigits(tick, pip_size);
            returnedList.push(last_digit);
        });

        return returnedList;
    };

    const stopAnalysisBot = () => {
        setIsTradeActive(false);
        isTradeActiveRef.current = false;
    };

    const clearBotStats = () => {
        setWonTrades(0);
        setLostTrades(0);
        setPNL(0);
        total_profit.current = 0;
    };

    const buy_contract = (contract_type: string, barrier: number) => {
        isTradeActiveRef.current = false;
        api_base.api.send({
            buy: '1',
            price: stakeRef.current,
            subscribe: 1,
            parameters: {
                amount: stakeRef.current,
                basis: 'stake',
                contract_type,
                currency: 'USD',
                duration: 1,
                duration_unit: 't',
                symbol: activeSymbolRef.current,
                barrier: barrier.toString(),
            },
        });
    };

    const checkLastDigitsStats = (myList: number[], numDigits: number, threshold: number) => {
        if (myList.length >= numDigits) {
            let lastDigits = myList.slice(-numDigits); // Extract the last `numDigits` elements
            let allGreaterOrEqual = lastDigits.every(digit => digit >= threshold);
            // console.log(lastDigits);

            return allGreaterOrEqual;
        } else {
            console.log(`The list has fewer than ${numDigits} elements.`);
            return false;
        }
    };

    function appendToConsole(text: string, color: string) {
        const consoleDiv = document.querySelector('.rd-trade-page-console'); // Select the div
        const newP = document.createElement('p');
        newP.textContent = text;
        newP.style.color = color;
        consoleDiv!.appendChild(newP);

        // Automatically scroll to the bottom
        consoleRef.current!.scrollTop = consoleRef.current!.scrollHeight;
    }

    const strategyPanel = (lastDigitList: number[]) => {
        if (isTradeActiveRef.current && isTradeActiveRef_v2.current) {
            if (activeStrategyRef.current === 1) {
                if (checkLastDigitsStats(lastDigitList, 1, 8)) {
                    buy_contract('DIGITUNDER', 8);
                } else if (checkLastDigitsStats(lastDigitList, 2, 7)) {
                    buy_contract('DIGITUNDER', 8);
                } else if (checkLastDigitsStats(lastDigitList, 3, 7)) {
                    buy_contract('DIGITUNDER', 8);
                } else if (checkLastDigitsStats(lastDigitList, 4, 7)) {
                    buy_contract('DIGITUNDER', 8);
                } else if (checkLastDigitsStats(lastDigitList, 5, 6)) {
                    buy_contract('DIGITUNDER', 8);
                }
            } else if (activeStrategyRef.current === 2) {
                buy_contract('DIGITUNDER', 9);
            } else if (activeStrategyRef.current === 3) {
                if (checkLastDigitsStats(lastDigitList, 1, 8)) {
                    buy_contract('DIGITUNDER', 8);
                }
            } else if (activeStrategyRef.current === 4) {
                if (checkLastDigitsStats(lastDigitList, 2, 7)) {
                    buy_contract('DIGITUNDER', 8);
                }
            } else if (activeStrategyRef.current === 5) {
                if (checkLastDigitsStats(lastDigitList, 3, 7)) {
                    buy_contract('DIGITUNDER', 7);
                }
            } else if (activeStrategyRef.current === 6) {
                if (checkLastDigitsStats(lastDigitList, 4, 6)) {
                    buy_contract('DIGITUNDER', 7);
                }
            }
        } else {
            isTradeActiveRef.current = false;
        }
    };

    const TPSLStatus = () => {
        if (total_profit.current >= take_profit.current) {
            stopAnalysisBot();
        } else if (total_profit.current <= -stop_loss.current) {
            stopAnalysisBot();
        } else {
            isTradeActiveRef.current = true;
        }
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
                    setAllLastDigitList((prevList: any) => [...prevList, ask]);
                    allLastDigitListRef.current.push(ask);

                    strategyPanel(getLastDigitList(allLastDigitListRef.current));
                }

                if (data.msg_type === 'history') {
                    const { history, pip_size } = data;
                    setPipSize(pip_size);
                    const { prices } = history;
                    const { ticks_history } = data.echo_req;
                    setAllLastDigitList(prices);
                    allLastDigitListRef.current = prices;
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
                if (data.msg_type === 'buy') {
                    const { buy } = data;
                    appendToConsole(buy.longcode, 'green');
                    isTradeActiveRef.current = false;
                }

                if (data.msg_type === 'proposal_open_contract') {
                    const { proposal_open_contract } = data;
                    const contract = proposal_open_contract.contract_type;

                    if (contractTradeTypes.current.includes(contract)) {
                        if (proposal_open_contract.is_sold) {
                            if (proposal_open_contract.status === 'lost') {
                                if (!current_contractids.current.includes(proposal_open_contract.contract_id)) {
                                    current_contractids.current.push(proposal_open_contract.contract_id);
                                    total_profit.current += proposal_open_contract.profit;
                                    setPNL(total_profit.current);
                                    if (total_profit.current >= take_profit.current) {
                                        stopAnalysisBot();
                                        return;
                                    } else if (total_profit.current <= -stop_loss.current) {
                                        stopAnalysisBot();
                                        setLostTrades((prevLostTrades: number) => prevLostTrades + 1);
                                        appendToConsole(`Contract Lost ${proposal_open_contract.profit}`, 'red');
                                        appendToConsole(`Stop Loss Hitted!!`, 'red');
                                        return;
                                    }

                                    //
                                    totalLostAmount.current += Math.abs(proposal_open_contract.profit);
                                    let newStake = totalLostAmount.current * parseFloat(martingaleValueRef.current);
                                    setStake(parseFloat(newStake.toFixed(2)));
                                    stakeRef.current = parseFloat(newStake.toFixed(2));
                                    appendToConsole(`Contract Lost ${proposal_open_contract.profit}`, 'red');
                                    setLostTrades((prevLostTrades: number) => prevLostTrades + 1);
                                }
                                TPSLStatus();
                            } else {
                                if (!current_contractids.current.includes(proposal_open_contract.contract_id)) {
                                    current_contractids.current.push(proposal_open_contract.contract_id);
                                    total_profit.current += proposal_open_contract.profit;
                                    setPNL(total_profit.current);
                                    if (total_profit.current >= take_profit.current) {
                                        stopAnalysisBot();
                                        setWonTrades((prevWonTrades: number) => prevWonTrades + 1);
                                        appendToConsole(`Contract Won ${proposal_open_contract.profit}`, 'green');
                                        appendToConsole(`Take Profit Hitted!!`, 'green');
                                        return;
                                    } else if (total_profit.current <= -stop_loss.current) {
                                        stopAnalysisBot();
                                        return;
                                    }
                                    appendToConsole(`Contract Won ${proposal_open_contract.profit}`, 'green');
                                    setWonTrades((prevWonTrades: number) => prevWonTrades + 1);
                                }
                                totalLostAmount.current = 0;
                                setStake(oneClickDefaultAmount.current);
                                stakeRef.current = oneClickDefaultAmount.current;
                                TPSLStatus();
                            }
                        }
                    }
                    // updateResultsCompletedContract(proposal_open_contract);
                }
            });

            api_base.pushSubscription(subscription);
        }
    };

    return (
        <div className='main_rd_bots'>
            {showRdTradePage && (
                <div className='modal'>
                    <div className='modal-content'>
                        <span className='rd-close-button' onClick={() => setShowRdTradePage(!showRdTradePage)}>
                            &times;
                        </span>
                        <RdTradePage
                            setShowRdConfig={setShowRdConfig}
                            showRdConfig={showRdConfig}
                            lostTrades={lostTrades}
                            pnl={pnl}
                            stopLoss={stopLoss}
                            takeProfit={takeProfit}
                            wonTrades={wonTrades}
                            isTradeActive={isTradeActive}
                            setIsTradeActive={setIsTradeActive}
                            isTradeActiveRef={isTradeActiveRef}
                            appendToConsole={appendToConsole}
                            clearBotStats={clearBotStats}
                            consoleRef={consoleRef}
                            isTradeActiveRef_v2={isTradeActiveRef_v2}
                            allLastDigitList={getLastDigitList(allLastDigitList)}
                            currentTick={currentTick}
                        />
                    </div>
                </div>
            )}
            {showRdConfig && (
                <div className='modal'>
                    <div className='modal-content'>
                        <RdConfig
                            setShowRdConfig={setShowRdConfig}
                            showRdConfig={showRdConfig}
                            stopLoss={stopLoss}
                            takeProfit={takeProfit}
                            martingale={martingale}
                            setMartingale={setMartingale}
                            setStopLoss={setStopLoss}
                            setTakeProfit={setTakeProfit}
                            stake={stake}
                            handleSelectChange={handleSelectChange}
                            optionsList={optionsList}
                            martingaleValueRef={martingaleValueRef}
                            stop_loss={stop_loss}
                            take_profit={take_profit}
                            handleUpdateStake={handleUpdateStake}
                            setStake={setStake}
                            active_symbol={active_symbol}
                        />
                    </div>
                </div>
            )}
            <BotCard
                botName={BotCardProps.botName}
                botDescription={BotCardProps.botDescription}
                recommended={BotCardProps.recommended}
                startAction={() => handleStartClick(1)}
            />

            <BotCard
                botName={BotCardProps2.botName}
                botDescription={BotCardProps2.botDescription}
                recommended={BotCardProps2.recommended}
                startAction={() => handleStartClick(2)}
            />

            <BotCard
                botName={BotCardProps3.botName}
                botDescription={BotCardProps3.botDescription}
                recommended={BotCardProps3.recommended}
                startAction={() => handleStartClick(3)}
            />

            <BotCard
                botName={BotCardProps4.botName}
                botDescription={BotCardProps4.botDescription}
                recommended={BotCardProps4.recommended}
                startAction={() => handleStartClick(4)}
            />

            <BotCard
                botName={BotCardProps5.botName}
                botDescription={BotCardProps5.botDescription}
                recommended={BotCardProps5.recommended}
                startAction={() => handleStartClick(5)}
            />

            <BotCard
                botName={BotCardProps6.botName}
                botDescription={BotCardProps6.botDescription}
                recommended={BotCardProps6.recommended}
                startAction={() => handleStartClick(6)}
            />
        </div>
    );
};

export default RandomBots;
