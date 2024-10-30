import React from 'react'; 
import classNames from 'classnames';
import { Button, Icon } from '@deriv/components';
import { observer, useStore } from '@deriv/stores';
import { localize } from '@deriv/translations';
import BotStopNotification from 'Components/bot-stop-notification';
import CircularWrapper from './circular-wrapper';
import ContractStageText from './contract-stage-text';
import { contract_stages } from 'Constants/contract-stage';
import { useDBotStore } from 'Stores/useDBotStore';
import { DBOT_TABS } from 'Constants/bot-contents';

type TTradeAnimation = {
    className?: string;
    should_show_overlay?: boolean;
};

const TradeAnimation = observer(({ className, should_show_overlay }: TTradeAnimation) => {
    const { run_panel, summary_card, dashboard } = useDBotStore();
    const { active_tab } = dashboard;
    const { client } = useStore();
    const { is_contract_completed, profit } = summary_card;
    const {
        contract_stage,
        is_stop_button_visible,
        is_stop_button_disabled,
        onRunButtonClick,
        onStopBotClick,
        performSelfExclusionCheck,
        show_bot_stop_message,
    } = run_panel;
    const { account_status } = client;
    const { ANALYSISPAGE, RANDOMBOTS } = DBOT_TABS;
    const cashier_validation = account_status?.cashier_validation;
    const [shouldDisable, setShouldDisable] = React.useState(false);
    const is_unavailable_for_payment_agent = cashier_validation?.includes('WithdrawServiceUnavailableForPA');

    // Perform self-exclusion checks
    React.useEffect(() => {
        performSelfExclusionCheck();
    }, [performSelfExclusionCheck]);

    React.useEffect(() => {
        if (shouldDisable) {
            const timer = setTimeout(() => {
                setShouldDisable(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [shouldDisable]);

    const status_classes = ['', '', ''];
    const is_purchase_sent = contract_stage === (contract_stages.PURCHASE_SENT as unknown);
    const is_purchase_received = contract_stage === (contract_stages.PURCHASE_RECEIVED as unknown);

    let progress_status = contract_stage - (is_purchase_sent || is_purchase_received ? 2 : 3);

    if (progress_status >= 0) {
        if (progress_status < status_classes.length) {
            status_classes[progress_status] = 'active';
        }

        if (is_contract_completed) {
            progress_status += 1;
        }

        for (let i = 0; i < progress_status; i++) {
            status_classes[i] = 'completed';
        }
    }

    const is_disabled = is_stop_button_disabled || shouldDisable;

    const button_props = React.useMemo(() => {
        if (is_stop_button_visible) {
            return { id: 'db-animation__stop-button', text: localize('Stop'), icon: 'IcBotStop' };
        }
        return { id: 'db-animation__run-button', text: localize('Run'), icon: 'IcPlay' };
    }, [is_stop_button_visible]);

    const show_overlay = should_show_overlay && is_contract_completed;

    return (
        <>
            {(active_tab !== ANALYSISPAGE && active_tab !== RANDOMBOTS) ? (
                <div className={classNames('animation__wrapper', className)}>
                    <Button
                        is_disabled={is_disabled && !is_unavailable_for_payment_agent}
                        className='animation__button'
                        id={button_props.id}
                        text={button_props.text}
                        icon={<Icon icon={button_props.icon} color='active' />}
                        onClick={() => {
                            setShouldDisable(true);
                            if (is_stop_button_visible) {
                                onStopBotClick();
                                return;
                            }
                            onRunButtonClick();
                        }}
                        has_effect
                        {...(is_stop_button_visible || !is_unavailable_for_payment_agent
                            ? { primary: true }
                            : { green: true })}
                    />
    
                    {show_bot_stop_message && <BotStopNotification />}
                    <div
                        className={classNames('animation__container', className, {
                            'animation--running': contract_stage > 0,
                            'animation--completed': contract_stage > 0,
                        })}
                    >
                        <span className='animation__text'>
                            <ContractStageText contract_stage={contract_stage} />
                        </span>
                        <div className='animation__progress'>
                            <div className='animation__progress-line'>
                                <div className={`animation__progress-bar animation__progress-${contract_stage}`} />
                            </div>
                            {status_classes.map((status_class, i) => (
                                <CircularWrapper key={`status_class-${status_class}-${i}`} className={status_class} />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className={classNames('animation__wrapper', className)}>
                    <span className='app-text' style={{ textAlign: 'center', fontWeight: 'bold', display: 'block' }}>
                        Follow us on youtube and Tiktok @binarytool
                    </span>
                </div>
            )}
        </>
    );         
});

export default TradeAnimation;
