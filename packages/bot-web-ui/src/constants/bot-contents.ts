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
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    ANALYSISPAGE: 2,
    BINARYTOOLS_BOTS: 3,
    CHART: 4,
    RANDOMBOTS: 5,
    COPYTRADING: 6,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-1',
    'id-2',
    'id-3',
    'id-4',
    'id-5',  
    'id-6',
    'id-7',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
