import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLivePoll } from '../hooks/useLivePoll';
import { LiveResultsChart } from '../components/LiveResultsChart';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Wifi,
  WifiOff,
  Copy,
  Check,
  Lock,
  Vote,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { showToast } from '../components/Toast';

export const ResultsPage = () => {
  const { id } = useParams();
  const { pollData, loading, error, connectionStatus } = useLivePoll(id);
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  const shareUrl = pollData ? `${window.location.origin}/poll/${pollData.share_code}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClosePoll = async () => {
    if (!window.confirm('Are you sure you want to close this poll? Audience will no longer be able to vote.')) {
      return;
    }
    setClosing(true);
    try {
      await api.closePoll(id);
      showToast('Poll has been closed.');
    } catch (err) {
      showToast(err.message || 'Failed to close poll', 'error');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1.25rem',
          color: 'var(--text-muted)',
        }}
      >
        <div className="pulse-dot" style={{ color: 'var(--primary)', width: '16px', height: '16px' }} />
        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>Connecting to live WebSocket stream...</span>
      </div>
    );
  }

  if (error || !pollData) {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
            Unable to Load Results
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.98rem' }}>
            {error || 'Poll not found.'}
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = pollData.status === 'closed' || pollData.is_expired;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Bar with Navigation & Connection Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <Link
          to="/dashboard"
          className="btn btn-secondary btn-sm"
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>

        {/* Live WebSocket Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {connectionStatus === 'connected' ? (
            <span
              className="pill-badge pill-live"
              style={{
                boxShadow: '0 2px 14px rgba(245, 197, 66, 0.25)',
                padding: '0.35rem 0.95rem',
              }}
            >
              <span className="pulse-dot" /> LIVE SYNC ACTIVE
            </span>
          ) : connectionStatus === 'connecting' ? (
            <span
              className="pill-badge"
              style={{
                background: 'rgba(245, 197, 66, 0.1)',
                color: '#f5c542',
                border: '1px solid rgba(245, 197, 66, 0.3)',
                padding: '0.35rem 0.95rem',
              }}
            >
              <Wifi size={14} className="spin-icon" /> RECONNECTING...
            </span>
          ) : (
            <span
              className="pill-badge"
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#fb7185',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                padding: '0.35rem 0.95rem',
              }}
            >
              <WifiOff size={14} /> OFFLINE
            </span>
          )}

          {isClosed ? (
            <span className="pill-badge pill-closed">
              <Lock size={12} /> Closed
            </span>
          ) : (
            <span className="pill-badge pill-active">
              Open
            </span>
          )}
        </div>
      </div>

      {/* Main Results Board Card */}
      <div
        className="glass-card"
        style={{
          padding: '2.75rem 2.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.25rem',
        }}
      >
        {/* Header Question and Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                background: 'rgba(245, 197, 66, 0.12)',
                color: '#f5c542',
                padding: '0.25rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(245, 197, 66, 0.3)',
              }}
            >
              SHARE CODE: #{pollData.share_code}
            </span>

            {pollData.expires_at && (
              <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                Expires: {new Date(pollData.expires_at).toLocaleString()}
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: '2.35rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.28,
              letterSpacing: '-0.025em',
              color: '#f8fafc',
            }}
          >
            {pollData.question}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(10, 18, 38, 0.75)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(245, 197, 66, 0.2)',
              }}
            >
              <Users size={17} color="#f5c542" />
              <strong style={{ color: '#f8fafc', fontSize: '1.08rem' }}>
                {pollData.total_votes}
              </strong>{' '}
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                {pollData.total_votes === 1 ? 'total vote' : 'total votes cast'}
              </span>
            </div>

            <span style={{ color: '#f5c542', fontSize: '0.88rem' }}>
              ⚡ Redis Pub/Sub live pipeline
            </span>
          </div>
        </div>

        {/* Live Animated Bar Chart */}
        <LiveResultsChart
          options={pollData.options}
          totalVotes={pollData.total_votes}
        />

        {/* Bottom Toolbar & Share Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '1.75rem',
            borderTop: '1px solid rgba(245, 197, 66, 0.18)',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          {/* Share Link Field with Instant Copy */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(7, 13, 30, 0.85)',
              border: '1px solid rgba(245, 197, 66, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.45rem 0.55rem 0.45rem 1.15rem',
              gap: '0.85rem',
              maxWidth: '480px',
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: '0.88rem',
                color: '#f8fafc',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {shareUrl}
            </span>

            <button
              onClick={copyShareLink}
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0, padding: '0.45rem 1rem' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <Link
              to={`/poll/${pollData.share_code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="Open public voting screen in a new window"
            >
              <Vote size={15} /> Cast Vote
            </Link>

            {user && !isClosed && (
              <button
                onClick={handleClosePoll}
                disabled={closing}
                className="btn btn-secondary btn-sm"
                style={{ color: '#f5c542' }}
              >
                <Lock size={14} /> Close Poll
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
