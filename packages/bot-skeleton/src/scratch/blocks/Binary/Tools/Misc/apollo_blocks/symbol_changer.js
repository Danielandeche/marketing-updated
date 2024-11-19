import { localize } from '@deriv/translations';
import { config } from '../../../../../../constants/config';

Blockly.Blocks.active_symbol_changer = {
    init() {
        this.jsonInit(this.definition());
    },
    definition() {
        return {
            message0: localize(
                'Symbol changer status {{ symbol_active_type }}',
                {
                    symbol_active_type: '%1',
                }
            ),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'SYMBOL_ACTIVE_TYPE',
                    options: config.lists.OTHER_CONTRACTS_TYPES,
                },
            ],
            colour: Blockly.Colours.Special3.colour,
            colourSecondary: Blockly.Colours.Special3.colourSecondary,
            colourTertiary: Blockly.Colours.Special3.colourTertiary,
            previousStatement: null,
            nextStatement: null,
            tooltip: localize('changes the current active traded symbol'),
            category: Blockly.Categories.Miscellaneous,
        };
    },
    meta() {
        return {
            display_name: localize('Market Symbol Changer'),
            description: localize(
                'This block changes the current traded symbol'
            ),
        };
    },
};

Blockly.JavaScript.active_symbol_changer = block => {
    const active_symbol = block.getFieldValue('SYMBOL_ACTIVE_TYPE');
    const code = `Bot.setActiveContractType('${active_symbol}');\n`;
    return code;
};
