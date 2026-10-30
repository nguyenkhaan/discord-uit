import React from 'react';

export const ServerSummary = () => {
    const summaryData = [
        { 
            title: 'Tổng server', 
            count: '1,236', 
            trend: '↑ 8%', 
            desc: 'so với tháng trước', 
            color: 'blue' 
        },
        { 
            title: 'Server đang hoạt động', 
            count: '1,180', 
            trend: '↑ 10%', 
            desc: 'so với tháng trước', 
            color: 'green' 
        },
        { 
            title: 'Server tạm ngừng', 
            count: '32', 
            trend: '↑ 3%', 
            desc: 'so với tháng trước', 
            color: 'yellow' 
        },
        { 
            title: 'Server bị khóa', 
            count: '24', 
            trend: '↑ 5%', 
            desc: 'so với tháng trước', 
            color: 'red' 
        }
    ];

    // Tạo helper function để map class màu động trong Tailwind (tránh bị Purge CSS)
    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue': return { bgLight: 'bg-blue-50', bgIcon: 'bg-blue-500', textTrend: 'text-blue-600' };
            case 'green': return { bgLight: 'bg-green-50', bgIcon: 'bg-emerald-500', textTrend: 'text-emerald-600' };
            case 'yellow': return { bgLight: 'bg-amber-50', bgIcon: 'bg-amber-500', textTrend: 'text-amber-600' };
            case 'red': return { bgLight: 'bg-red-50', bgIcon: 'bg-rose-500', textTrend: 'text-rose-600' };
            default: return { bgLight: 'bg-gray-50', bgIcon: 'bg-gray-500', textTrend: 'text-gray-600' };
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {summaryData.map((item, index) => {
                const classes = getColorClasses(item.color);
                return (
                    <div key={index} className="p-5 bg-white rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex items-start gap-4 transition-transform hover:-translate-y-1">
                        {/* Hình vuông Icon */}
                        <div className={`p-3 rounded-xl flex-shrink-0 ${classes.bgLight}`}>
                            <div className={`w-6 h-6 rounded-md shadow-sm ${classes.bgIcon}`}></div>
                        </div>
                        {/* Phần chữ */}
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">{item.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mb-2">{item.count}</p>
                            <p className="text-xs text-gray-500">
                                <span className={`font-semibold ${classes.textTrend}`}>{item.trend}</span> {item.desc}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};