import React from 'react';
import { Trophy } from 'lucide-react';

interface BestRecordItem {
    label: string;
    value: string;
    unit?: string;
}

interface BestRecordCardProps {
    title: string;
    records: BestRecordItem[];
    date?: string;
}

const BestRecordCard: React.FC<BestRecordCardProps> = ({ title, records, date }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {records.map((record, index) => (
                    <div key={index} className="text-center">
                        <div className="text-sm text-gray-600 mb-1">{record.label}</div>
                        <div className="text-lg font-bold text-blue-600">
                            {record.value}
                            {record.unit && <span className="text-sm ml-1">{record.unit}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {date && (
                <div className="text-xs text-gray-500 mt-4 text-center">
                    記録日: {date}
                </div>
            )}
        </div>
    );
};

export default BestRecordCard; 