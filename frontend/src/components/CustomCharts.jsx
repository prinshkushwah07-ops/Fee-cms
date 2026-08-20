import React, { useState } from 'react';

// 1. MONTHLY FEE COLLECTION CHART (SVG Bar Chart)
export const MonthlyCollectionChart = ({ data = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const padding = { top: 30, right: 20, bottom: 40, left: 60 };
  const chartHeight = 250;
  const chartWidth = 500;
  const graphHeight = chartHeight - padding.top - padding.bottom;
  const graphWidth = chartWidth - padding.left - padding.right;

  // Find max value for scaling
  const maxVal = Math.max(...data.map(d => d.value), 1000);
  // Round up to nearest nice interval
  const roundMax = Math.ceil(maxVal / 5000) * 5000;

  const barWidth = graphWidth / (data.length || 1) * 0.6;
  const barSpacing = graphWidth / (data.length || 1) * 0.4;

  const yTicks = 4;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full"
        style={{ width: '100%', height: 'auto', maxHeight: '250px' }}
      >
        {/* Grid Lines & Y Axis Labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const val = (roundMax / yTicks) * i;
          const y = chartHeight - padding.bottom - (graphHeight / yTicks) * i;
          return (
            <g key={i}>
              <line 
                x1={padding.left} 
                y1={y} 
                x2={chartWidth - padding.right} 
                y2={y} 
                stroke="#e2e8f0" 
                strokeWidth={1} 
                strokeDasharray="4 4"
              />
              <text 
                x={padding.left - 10} 
                y={y + 4} 
                textAnchor="end" 
                fontSize={10} 
                fill="#64748b"
                fontWeight="500"
              >
                ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* X Axis Line */}
        <line 
          x1={padding.left} 
          y1={chartHeight - padding.bottom} 
          x2={chartWidth - padding.right} 
          y2={chartHeight - padding.bottom} 
          stroke="#cbd5e1" 
          strokeWidth={1.5}
        />

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = item.value > 0 ? (item.value / roundMax) * graphHeight : 0;
          const x = padding.left + (index * (barWidth + barSpacing)) + barSpacing / 2;
          const y = chartHeight - padding.bottom - barHeight;

          return (
            <g key={index}>
              {/* Actual bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 0)}
                fill={hoveredIndex === index ? 'var(--primary-hover)' : 'var(--primary)'}
                rx={4}
                style={{ 
                  transition: 'all 0.2s ease', 
                  cursor: 'pointer',
                  filter: hoveredIndex === index ? 'drop-shadow(0px 4px 6px rgba(79, 70, 229, 0.35))' : 'none'
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Hover Value Label */}
              {hoveredIndex === index && (
                <g>
                  {/* Tooltip Background */}
                  <rect
                    x={x + barWidth / 2 - 40}
                    y={y - 28}
                    width={80}
                    height={20}
                    fill="#0f172a"
                    rx={4}
                  />
                  {/* Tooltip Value Text */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 14}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight="bold"
                  >
                    ₹{item.value.toLocaleString('en-IN')}
                  </text>
                  {/* Small Arrow */}
                  <polygon
                    points={`${x + barWidth / 2 - 4},${y - 8} ${x + barWidth / 2 + 4},${y - 8} ${x + barWidth / 2},${y - 4}`}
                    fill="#0f172a"
                  />
                </g>
              )}

              {/* X Axis Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight - padding.bottom + 18}
                textAnchor="middle"
                fontSize={10}
                fill="#64748b"
                fontWeight="600"
              >
                {item.label.substring(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// 2. PAYMENT MODE DONUT CHART
export const PaymentModeChart = ({ cash = 0, upi = 0 }) => {
  const total = cash + upi || 1;
  const cashPct = (cash / total) * 100;
  const upiPct = (upi / total) * 100;

  // Donut values
  const radius = 50;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  // Stroke Dashoffsets
  const upiOffset = circumference;
  const cashOffset = circumference - (cashPct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
        <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* UPI segment (Indigo) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="var(--primary)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (upiPct / 100) * circumference}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
          {/* Cash segment (Sky) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="var(--secondary)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={cashOffset}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dashoffset 0.5s ease-in-out',
              transform: `rotate(${(upiPct / 100) * 360}deg)`,
              transformOrigin: '70px 70px'
            }}
          />
        </svg>

        {/* Center overlay showing totals */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
            ₹{(cash + upi).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dark)' }}>UPI</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{upi.toLocaleString('en-IN')} ({upiPct.toFixed(0)}%)</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--secondary)', display: 'inline-block' }}></span>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dark)' }}>Cash</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{cash.toLocaleString('en-IN')} ({cashPct.toFixed(0)}%)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. PAID VS PENDING FEES PROGRESS RING
export const PaidPendingChart = ({ paid = 0, pending = 0 }) => {
  const total = paid + pending || 1;
  const paidPct = (paid / total) * 100;
  const pendingPct = (pending / total) * 100;

  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
        <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {/* Base Pending Circle (Rose Red color for pending) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="var(--danger-light)"
            strokeWidth={strokeWidth}
          />
          {/* Overlay Paid Circle (Emerald green color for paid) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="var(--success)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (paidPct / 100) * circumference}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dashoffset 0.6s ease-in-out',
              filter: 'drop-shadow(0px 0px 4px rgba(16, 185, 129, 0.2))'
            }}
          />
        </svg>

        {/* Center Text displaying Paid % */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
            {paidPct.toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</div>
        </div>
      </div>

      {/* Details Box */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
        <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Collected</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--success-text)', marginTop: '0.125rem' }}>
            ₹{paid.toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ paddingLeft: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outstanding</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--danger-text)', marginTop: '0.125rem' }}>
            ₹{pending.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  );
};
