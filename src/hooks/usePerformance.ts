import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
}

export const usePerformance = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    // Measure component load time
    const measureLoadTime = () => {
      const loadTime = performance.now() - startTime;
      
      // Get memory usage if available
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      setMetrics({
        loadTime,
        renderTime: loadTime,
        memoryUsage
      });
    };

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(measureLoadTime);

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} Performance:`, {
        loadTime: performance.now() - startTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      });
    }
  }, [componentName]);

  return metrics;
};

// Hook for monitoring API performance
export const useAPIPerformance = () => {
  const [apiMetrics, setApiMetrics] = useState<Record<string, number>>({});

  const measureAPI = async <T>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setApiMetrics(prev => ({
        ...prev,
        [apiName]: duration
      }));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`API ${apiName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setApiMetrics(prev => ({
        ...prev,
        [`${apiName}_error`]: duration
      }));
      
      throw error;
    }
  };

  return { apiMetrics, measureAPI };
};