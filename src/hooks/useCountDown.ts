import { zeroPad } from 'react-countdown';

export function useCountDown() {
  const renderCountDownValue = (params: {
    targetDate?: Date | string | number;
    isCompleted: boolean;
    timeUnit: number;
  }): string => {
    const { targetDate, isCompleted, timeUnit } = params;

    if (targetDate && !isCompleted) {
      return zeroPad(timeUnit);
    }

    return '00';
  };

  return { renderCountDownValue };
}
