type CalculationResults = {
    evenPercentage: number;
    oddPercentage: number;
    overPercentage: number;
    underPercentage: number;
    matchesPercentage: number;
    differsPercentage: number;
    risePercentage: number;
    fallPercentage: number;
};

export const calculatePercentages = (digitList: number[], tickList: number[], customPrediction: number): CalculationResults => {
    const digitCount = digitList.length;
    const tickCount = tickList.length;

    // 1. Calculate Even/Odd percentages
    const evenCount = digitList.filter(digit => digit % 2 === 0).length;
    const oddCount = digitList.filter(digit => digit % 2 !== 0).length;
    const evenPercentage = (evenCount / digitCount) * 100;
    const oddPercentage = (oddCount / digitCount) * 100;

    // 2. Calculate Over/Under percentages relative to customPrediction
    const overCount = digitList.filter(digit => digit > customPrediction).length;
    const underCount = digitList.filter(digit => digit <= customPrediction).length;
    const overPercentage = (overCount / digitCount) * 100;
    const underPercentage = (underCount / digitCount) * 100;

    // 3. Calculate Matches/Differs percentages for customPrediction
    const matchesCount = digitList.filter(digit => digit === customPrediction).length;
    const differsCount = digitList.filter(digit => digit !== customPrediction).length;
    const matchesPercentage = (matchesCount / digitCount) * 100;
    const differsPercentage = (differsCount / digitCount) * 100;

    // 4. Calculate Rise/Fall percentages from tickList
    let riseCount = 0;
    let fallCount = 0;
    for (let i = 1; i < tickList.length; i++) {
        if (tickList[i] > tickList[i - 1]) {
            riseCount++;
        } else {
            fallCount++;
        }
    }
    const risePercentage = (riseCount / (tickCount - 1)) * 100;
    const fallPercentage = (fallCount / (tickCount - 1)) * 100;

    // Return all calculations as a dictionary
    return {
        evenPercentage,
        oddPercentage,
        overPercentage,
        underPercentage,
        matchesPercentage,
        differsPercentage,
        risePercentage,
        fallPercentage,
    };
};
