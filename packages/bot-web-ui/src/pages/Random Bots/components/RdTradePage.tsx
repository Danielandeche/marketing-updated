import React from 'react';

interface RDTradeProps {
    showRdConfig: boolean;
    wonTrades: number;
    lostTrades: number;
    takeProfit: string | number;
    stopLoss: string | number;
    pnl: number;
    isTradeActive: boolean;
    isTradeActiveRef: React.MutableRefObject<boolean>;
    isTradeActiveRef_v2: React.MutableRefObject<boolean>;
    consoleRef: React.RefObject<HTMLDivElement>;
    allLastDigitList: number[];
    currentTick: string | number
    clearBotStats: () => void;
    appendToConsole(text: string, color: string): void;
    setIsTradeActive: React.Dispatch<React.SetStateAction<boolean>>;
    setShowRdConfig: React.Dispatch<React.SetStateAction<boolean>>;
}
const RdTradePage = ({
    setShowRdConfig,
    showRdConfig,
    lostTrades,
    stopLoss,
    takeProfit,
    wonTrades,
    pnl,
    isTradeActive,
    isTradeActiveRef,
    consoleRef,
    isTradeActiveRef_v2,
    allLastDigitList,
    currentTick,
    clearBotStats,
    appendToConsole,
    setIsTradeActive,
}: RDTradeProps) => {
    function clearConsole() {
        const consoleDiv = document.querySelector('.rd-trade-page-console');
        consoleDiv!.innerHTML = '';
        clearBotStats();
    }
    const last10Digits = allLastDigitList.slice(-10);
    return (
        <div className='rd-trade-page'>
            <div className='rd-trade-page-header'>
                <div className='win-loss'>
                    <p>W / L</p>
                    <p>
                        <span className='win'>{wonTrades}</span> / <span className='loss'>{lostTrades}</span>
                    </p>
                </div>
                <div className='tp-sl'>
                    <p>PnL</p>
                    <p>
                        <span style={{ color: pnl > 0 ? 'green' : pnl < 0 ? 'red' : '' }}>{pnl.toFixed(2)}</span> USD
                    </p>
                </div>
                <div className='tp-sl'>
                    <p>TP</p>
                    <p>{takeProfit} USD</p>
                </div>
                <div className='tp-sl'>
                    <p>SL</p>
                    <p className='loss'>{stopLoss} USD</p>
                </div>
            </div>
            <div className='rd-trade-page-buttons'>
                <button className='configure-button' onClick={() => setShowRdConfig(!showRdConfig)}>
                    Configure
                </button>
                <button className='configure-button' onClick={() => clearConsole()}>
                    Clear
                </button>
                <button
                    className={`${!isTradeActive ? 'start-button' : 'stop-button'}`}
                    onClick={() => {
                        setIsTradeActive(!isTradeActive);
                        isTradeActiveRef.current = !isTradeActive;
                        isTradeActiveRef_v2.current = !isTradeActive;
                        const status = !isTradeActive;
                        if (status) {
                            appendToConsole('Bot Started...', 'green');
                        } else {
                            appendToConsole('Bot Stopped', 'red');
                        }
                    }}
                >
                    {!isTradeActive ? 'Start' : 'Stop'}
                </button>
            </div>
            <div className="current_tick">
                <h3>Price: {currentTick}</h3>
            </div>
            <div className='number-list'>
                {last10Digits.map((number, index) => (
                    <div key={index} className={`number-item ${number % 2 === 0 ? 'green' : 'red'}`}>
                        {number}
                    </div>
                ))}
            </div>
            <div className='rd-trade-page-console' ref={consoleRef}></div>
        </div>
    );
};

export default RdTradePage;
