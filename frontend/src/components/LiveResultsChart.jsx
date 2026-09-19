import React from 'react';
import { Trophy, CheckCircle2, TrendingUp } from 'lucide-react';

export const LiveResultsChart = ({ options = [], totalVotes = 0, selectedOptionId = null }) => {
  const highestVotes = Math.max(...options.map((o) => o.votes || 0), 0);
  const hasVotes = totalVotes > 0;
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {options.map((opt, index) => {
        const isLeading = hasVotes && opt.votes === highestVotes && highestVotes > 0;
        const isSelectedByUser = selectedOptionId === opt.id;
        const percentage = Math.round(opt.percentage || 0);
        const letter = optionLetters[index] || `${index + 1}`;

        return (
          <div
            key={opt.id}
            className={`vote-bar-container ${isLeading ? 'leading' : ''}`}
            style={{
              borderColor: isSelectedByUser ? '#f5c542' : undefined,
              boxShadow: isSelectedByUser
                ? '0 4px 20px rgba(245, 197, 66, 0.25)'
                : undefined,
            }}
          >
            {/* Animated percentage fill */}
            <div
              className={`vote-bar-fill ${isLeading ? 'leading' : ''}`}
              style={{ width: `${opt.percentage || 0}%` }}
            />

            {/* Foreground Content */}
            <div className="vote-bar-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isLeading
                      ? 'rgba(245, 197, 66, 0.2)'
                      : isSelectedByUser
                      ? 'rgba(59, 130, 246, 0.25)'
                      : 'rgba(18, 32, 68, 0.7)',
                    border: isLeading
                      ? '1px solid #f5c542'
                      : isSelectedByUser
                      ? '1px solid #3b82f6'
                      : '1px solid rgba(245, 197, 66, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: isLeading ? '#f5c542' : isSelectedByUser ? '#93c5fd' : '#cbd5e1',
                    flexShrink: 0,
                  }}
                >
                  {letter}
                </span>

                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: isLeading ? 700 : 600,
                    color: isLeading ? '#ffffff' : '#f8fafc',
                  }}
                >
                  {opt.text}
                </span>

                {isSelectedByUser && (
                  <span
                    className="pill-badge"
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#93c5fd',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      padding: '0.2rem 0.65rem',
                    }}
                  >
                    <CheckCircle2 size={12} /> Your Vote
                  </span>
                )}

                {isLeading && (
                  <span
                    className="pill-badge"
                    style={{
                      background: 'rgba(245, 197, 66, 0.18)',
                      color: '#f5c542',
                      border: '1px solid rgba(245, 197, 66, 0.45)',
                      padding: '0.2rem 0.65rem',
                    }}
                  >
                    <Trophy size={13} color="#f5c542" /> Leader
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.88rem',
                    color: '#94a3b8',
                    fontWeight: 500,
                  }}
                >
                  {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                </span>

                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: isLeading ? '#f5c542' : '#f8fafc',
                    minWidth: '56px',
                    textAlign: 'right',
                    textShadow: isLeading ? '0 0 12px rgba(245, 197, 66, 0.4)' : undefined,
                  }}
                >
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {totalVotes === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            color: '#94a3b8',
            fontSize: '0.95rem',
            background: 'rgba(13, 23, 48, 0.6)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed rgba(245, 197, 66, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(245, 197, 66, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f5c542',
              border: '1px solid rgba(245, 197, 66, 0.25)',
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#f8fafc' }}>Awaiting Live Audience Votes</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Share your poll link. Watch results and animated bars update instantaneously when votes arrive!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
