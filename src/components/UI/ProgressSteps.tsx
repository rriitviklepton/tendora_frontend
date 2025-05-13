import React from 'react';

interface ProgressStepsProps {
  progress: {
    parsing: boolean;
    analysis: boolean;
    docUpload: boolean;
    ready: boolean;
    submitted: boolean;
  };
}

const ProgressSteps = ({ progress }: ProgressStepsProps) => {
  const steps = [
    { key: 'parsing', label: 'Parsing' },
    { key: 'analysis', label: 'Analysis' },
    { key: 'docUpload', label: 'Docs' },
    { key: 'ready', label: 'Ready' },
    { key: 'submitted', label: 'Submitted' }
  ];

  // Find the active step (first one that's false, or last one if all are true)
  const activeStepIndex = steps.findIndex(step => !progress[step.key as keyof typeof progress]);
  const activeStep = activeStepIndex === -1 ? steps.length - 1 : activeStepIndex;
  
  // Calculate progress percentage
  const completedSteps = steps.filter((_, index) => index < activeStep).length;
  const progressPercentage = (activeStep === steps.length - 1 && progress.submitted) 
    ? 100
    : (completedSteps / (steps.length - 1)) * 100;
  
  return (
    <div>
      <div className="relative">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
          <div 
            style={{ width: `${progressPercentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
          ></div>
        </div>
        <div className="flex justify-between mt-1">
          {steps.map((step, index) => (
            <div 
              key={step.key} 
              className="flex flex-col items-center"
              style={{ width: `${100 / steps.length}%` }}
            >
              <div 
                className={`
                  w-3 h-3 rounded-full transition-colors duration-300
                  ${index < activeStep ? 'bg-blue-600' : 
                    index === activeStep ? 'bg-blue-400 animate-pulse' : 
                    'bg-gray-300'}
                `}
              ></div>
              <span 
                className={`
                  text-xs mt-1 transition-colors duration-300
                  ${index < activeStep ? 'text-blue-600' : 
                    index === activeStep ? 'text-blue-600 font-medium' : 
                    'text-gray-500'}
                `}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressSteps;