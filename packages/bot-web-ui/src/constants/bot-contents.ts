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
    ANALYSISPAGE: 0,
    BOT_BUILDER: 1,
    DASHBOARD: 2,
    RANDOMBOTS: 3,
    BINARYTOOLS_BOTS: 4,
    ANALYSISTOOL: 5,
    COPYTRADING: 6,
    CHART: 7,
    TUTORIAL: 8,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-analysis-page',
    'id-bot-builder',
    'id-dbot-dashboard',
    'id-random-bots',
    'id-dbot-binarytools-bots',
    'id-analysistool',  
    'id-copy-trading',
    'id-charts',
    'id-tutorials',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
