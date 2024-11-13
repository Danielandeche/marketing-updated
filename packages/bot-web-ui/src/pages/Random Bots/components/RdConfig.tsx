import React from 'react';

interface RDConfigProps {
    active_symbol: string;
    showRdConfig: boolean;
    takeProfit: string | number;
    stopLoss: string | number;
    stake: string | number;
    martingale: string | number;
    optionsList: any[];
    martingaleValueRef: React.MutableRefObject<string | number>;
    take_profit: React.MutableRefObject<string | number>;
    stop_loss: React.MutableRefObject<string | number>;
    setStake: (value: React.SetStateAction<string | number>) => void
    handleSelectChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    setTakeProfit: React.Dispatch<React.SetStateAction<string | number>>;
    setStopLoss: React.Dispatch<React.SetStateAction<string | number>>;
    setShowRdConfig: React.Dispatch<React.SetStateAction<boolean>>;
    handleUpdateStake: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setMartingale: React.Dispatch<React.SetStateAction<string | number>>;
}

const RdConfig = ({
    setShowRdConfig,
    showRdConfig,
    martingale,
    setMartingale,
    setStopLoss,
    setTakeProfit,
    handleSelectChange,
    martingaleValueRef,
    active_symbol,
    handleUpdateStake,
    setStake,
    stop_loss,
    take_profit,
    optionsList,
    stake,
    stopLoss,
    takeProfit,
}: RDConfigProps) => {
    return (
        <div className='rd-config'>
            <div className='rd-config-header'>
                <button className='rd-close-button' onClick={() => setShowRdConfig(!showRdConfig)}>
                    &times;
                </button>
            </div>
            <form className='rd-config-form'>
                <div className='form-group'>
                    <select name='' id='symbol_options' value={active_symbol} onChange={handleSelectChange}>
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
                <div className='form-group'>
                    <label>Stake Amount</label>
                    <input type='text' value={stake} onChange={e => setStake(e.target.value)} onBlur={handleUpdateStake}/>
                </div>
                <div className='form-group'>
                    <label>Martingale</label>
                    <input
                        type='text'
                        value={martingale}
                        onChange={e => setMartingale(e.target.value)}
                        onBlur={e => {
                            const newValue = e.target.value;
                            const parsedValue = newValue === '' || isNaN(Number(newValue)) ? newValue : parseFloat(newValue);

                            martingaleValueRef.current = parsedValue;
                            setMartingale(parsedValue);
                        }}
                    />
                </div>
                <div className='form-group'>
                    <label>Take Profit (TP)</label>
                    <input
                        type='text'
                        value={takeProfit}
                        onChange={e => setTakeProfit(e.target.value)}
                        onBlur={e => {
                            const newValue = e.target.value;
                            const parsedValue = newValue === '' || isNaN(Number(newValue)) ? newValue : parseFloat(newValue);

                            take_profit.current = parsedValue;
                            setTakeProfit(parsedValue);
                        }}
                    />
                </div>
                <div className='form-group'>
                    <label>Stop Loss (SL)</label>
                    <input
                        type='text'
                        value={stopLoss}
                        onChange={e =>  setStopLoss(e.target.value)}
                        onBlur={e => {
                            const newValue = e.target.value;
                            const parsedValue = newValue === '' || isNaN(Number(newValue)) ? newValue : parseFloat(newValue);
                            stop_loss.current = parsedValue;
                            setStopLoss(parsedValue);
                        }}
                    />
                </div>
            </form>
        </div>
    );
};

export default RdConfig;
