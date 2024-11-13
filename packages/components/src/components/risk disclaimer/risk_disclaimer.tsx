import React, { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { observer, useStore } from '@deriv/stores';
import './RiskDisclaimer.css';

const RiskDisclaimer = observer(() => {
    const { ui } = useStore();
    const { setDontShowAgainDisclaimer } = ui;
    const [isPopupVisible, setPopupVisible] = useState(false);
    const togglePopup = () => {
        setPopupVisible(!isPopupVisible);
    };
    const setDontShowAgain = () => {
        setDontShowAgainDisclaimer();
        togglePopup();
    };
    return (
        <div>
            <div className='risk-disclaimer-icon' onClick={togglePopup}>
                <FaExclamationTriangle className='icon' /> <b>Risk Disclaimer</b>
            </div>
            {isPopupVisible && (
                <div className='popup_disclaimer' onClick={togglePopup}>
                    <div className='popup-content' onClick={e => e.stopPropagation()}>
                        <span className='close-button' onClick={togglePopup}>
                            &times;
                        </span>
                        <h2>Risk Disclaimer</h2>
                        <p>
                            Deriv offers complex derivatives, such as options and contracts for difference (“CFDs”).
                            These products may not be suitable for all clients, and trading them puts you at risk.
                            Please make sure that you understand the following risks before trading Deriv products:
                        </p>
                        <ul>
                            <li>You may lose some or all of the money you invest in the trade.</li>
                            <li>
                                If your trade involves currency conversion, exchange rates will affect your profit and
                                loss.
                            </li>
                        </ul>
                        <p>You should never trade with borrowed money or with money that you cannot afford to lose.</p>
                        <div className='bottom_btn'>
                            <button className='dont_show_again' onClick={() => setDontShowAgain()}>
                                Dont Show Again
                            </button>
                            <button className='close_btn' onClick={togglePopup}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
export default RiskDisclaimer;
