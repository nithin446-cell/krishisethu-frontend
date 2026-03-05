import React from 'react';

interface DisputeResolutionProps {
	onBack?: () => void;
}

const DisputeResolution: React.FC<DisputeResolutionProps> = ({ onBack }) => {
	return (
		<div className="p-4">
			<button onClick={onBack} className="text-blue-600 mb-4">← Back</button>
			<h2 className="text-xl font-semibold mb-2">Dispute Resolution</h2>
			<p className="text-sm text-gray-600">List of disputes will be shown here.</p>
		</div>
	);
};

export default DisputeResolution;