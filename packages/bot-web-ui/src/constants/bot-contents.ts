import { STRATEGIES } from 'src/pages/bot-builder/quick-strategy/config';

type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    BINARYTOOLS_BOTS: 0,
    BOT_BUILDER: 1,
    ANALYSISPAGE: 2,
    RANDOMBOTS: 3,
    CHART: 4,
    COPYTRADING: 5,
    TUTORIAL: 6,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-upload-bots',
    'id-bot-builder',
    'id-analysis-page',
    'id-random-bots',
    'id-charts',  
    'id-copy-trading',
    'id-tutorials',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
