import { UsePerformanceReturn } from '../types';

// Placeholder hook - will be implemented in task 7.3
const usePerformance = (): UsePerformanceReturn => {
  return {
    fps: 60,
    isVisible: true,
    shouldOptimize: false,
  };
};

export default usePerformance;