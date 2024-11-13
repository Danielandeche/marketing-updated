import { getLimitOrderAmount } from '@deriv/shared';

/**
 * Set contract update form initial values
 * @param {object} contract_update_config - contract_update response
 */
export const getContractUpdateConfig = contract_update_config => {
    const { stop_loss, take_profit } = getLimitOrderAmount(contract_update_config);

    return {
        // convert stop_loss, take_profit value to string for validation to work
        contract_update_stop_loss: stop_loss ? Math.abs(stop_loss).toString() : '',
        contract_update_take_profit: take_profit ? take_profit.toString() : '',
        has_contract_update_stop_loss: !!stop_loss,
        has_contract_update_take_profit: !!take_profit,
    };
};
