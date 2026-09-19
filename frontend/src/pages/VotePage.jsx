import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api, getVoterToken, resetVoterToken } from '../services/api';
import { LiveResultsChart } from '../components/LiveResultsChart';
import { CheckCircle2, Lock, AlertCircle, BarChart3, Share2, ArrowRight, UserPlus, Users, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { showToast } from '../components/Toast';

export const VotePage = () => {
  const { shareCode } = useParams();
  const [searchParams] = useSearchParams();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [updatedResults, setUpdatedResults] = useState(null);
  const [currentVoterToken, setCurrentVoterToken] = useState(getVoterToken());

  useEffect(() => {
    // If URL has ?new=1 or ?reset=1, reset the voter token for a brand-new voter session
    if (searchParams.get('new') === '1' || searchParams.get('reset') === '1') {
      const newToken = resetVoterToken();
      setCurrentVoterToken(newToken);
    }

    const fetchPoll = async () => {
      try {
        const data = await api.getPollByShareCode(shareCode);
        setPoll(data);

        // Check if this specific session/tab has voted in this poll
        // (Uses sessionStorage so distinct browser tabs act as separate voters!)
        const storedVotes = JSON.parse(sessionStorage.getItem('user_voted_polls') || '{}');
        if (storedVotes[data.id] && searchParams.get('new') !== '1') {
          setHasVoted(true);
          setSelectedOption(storedVotes[data.id]);
          const results = await api.getPollResults(data.id);
          setUpdatedResults(results);
        }
      } catch (err) {
        setError(err.message || 'Poll not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [shareCode, searchParams]);

  const handleVoteSubmit = async () => {
    if (!selectedOption) {
      showToast('Please select an option before voting.', 'error');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.castVote(poll.id, selectedOption, currentVoterToken);
      setUpdatedResults(res.results);
      setHasVoted(true);

      // Save to this tab's session
      const storedVotes = JSON.parse(sessionStorage.getItem('user_voted_polls') || '{}');
      storedVotes[poll.id] = selectedOption;
      sessionStorage.setItem('user_voted_polls', JSON.stringify(storedVotes));

      // Fire vibrant royal gold & deep blue confetti!
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#f5c542', '#ffd700', '#3b82f6', '#1d4ed8', '#ffffff', '#e5a93b'],
      });

      showToast('Vote cast successfully!');
    } catch (err) {
      if (err.status === 409 || (err.data && err.data.already_voted)) {
        setHasVoted(true);
        showToast('This voter session has already voted. Click "Cast Another Vote" to vote as a new person.', 'info');
        try {
          const res = await api.getPollResults(poll.id);
          setUpdatedResults(res);
        } catch (_) {}
      } else {
        setError(err.message || 'Failed to submit your vote.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteAgain = () => {
    // Generate a fresh, unique voter token for the next voter
    const newToken = resetVoterToken();
    setCurrentVoterToken(newToken);

    // Clear the current poll's recorded vote for this tab session
    const storedVotes = JSON.parse(sessionStorage.getItem('user_voted_polls') || '{}');
    if (poll) {
      delete storedVotes[poll.id];
      sessionStorage.setItem('user_voted_polls', JSON.stringify(storedVotes));
    }

    setHasVoted(false);
    setSelectedOption(null);
    showToast('Ready for next voter! Please cast your vote.', 'success');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href.split('?')[0]);
    showToast('Poll share link copied to clipboard!');
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
        <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>Loading live poll...</span>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3.5rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185',
              margin: '0 auto 1.25rem',
            }}
          >
            <AlertCircle size={32} />
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
            Poll Not Found
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.98rem' }}>
            {error || 'This poll may have ended or the link is incorrect.'}
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = poll.status === 'closed' || (poll.expires_at && new Date() > new Date(poll.expires_at));

  return (
    <div style={{ maxWidth: '680px', margin: '1rem auto' }}>
      <div
        className="glass-card"
        style={{
          padding: '2.75rem 2.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {/* Header Badges & Multi-Voter Session Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {isClosed ? (
              <span className="pill-badge pill-closed">
                <Lock size={12} /> Closed
              </span>
            ) : (
              <span className="pill-badge pill-active">
                <span className="pulse-dot" /> Live Polling
              </span>
            )}

            <span
              style={{
                fontSize: '0.82rem',
                color: '#f5c542',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                background: 'rgba(245, 197, 66, 0.12)',
                border: '1px solid rgba(245, 197, 66, 0.3)',
                padding: '0.25rem 0.65rem',
                borderRadius: '8px',
                letterSpacing: '0.05em',
              }}
            >
              #{poll.share_code}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.78rem',
                color: '#94a3b8',
                background: 'rgba(18, 32, 68, 0.6)',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid rgba(245, 197, 66, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Unique voter session fingerprint"
            >
              <Users size={12} color="#f5c542" />
              Voter #{currentVoterToken.slice(-5)}
            </span>

            <button
              onClick={copyShareLink}
              className="btn btn-secondary btn-sm"
              title="Share this poll link"
            >
              <Share2 size={14} /> Share Link
            </button>
          </div>
        </div>

        {/* Poll Question */}
        <div>
          <h1
            style={{
              fontSize: '2.15rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              color: '#f8fafc',
            }}
          >
            {poll.question}
          </h1>

          {poll.expires_at && (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.6rem' }}>
              Closes on: {new Date(poll.expires_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Voting Options vs Live Results */}
        {!hasVoted && !isClosed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {poll.options.map((option, index) => {
              const isSelected = selectedOption === option.id;
              const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
              const letter = letters[index] || `${index + 1}`;

              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`voting-option-card ${isSelected ? 'selected' : ''}`}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--primary)' : 'rgba(18, 32, 68, 0.7)',
                      color: isSelected ? '#070d1e' : '#94a3b8',
                      border: isSelected ? 'none' : '1px solid rgba(245, 197, 66, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      flexShrink: 0,
                    }}
                  >
                    {letter}
                  </span>

                  <span style={{ fontSize: '1.08rem', fontWeight: 600, color: '#f8fafc', flex: 1 }}>
                    {option.text}
                  </span>

                  <div className="custom-radio">
                    <div className="custom-radio-inner" />
                  </div>
                </div>
              );
            })}

            <button
              onClick={handleVoteSubmit}
              disabled={submitting || !selectedOption}
              className="btn btn-primary"
              style={{
                marginTop: '1rem',
                padding: '1.1rem',
                fontSize: '1.1rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: selectedOption ? '0 10px 35px var(--primary-glow)' : 'none',
              }}
            >
              {submitting ? 'Recording Vote...' : 'Submit Your Vote'}
              <ArrowRight size={20} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Link
                to={`/poll/${poll.id}/results`}
                style={{
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 500,
                }}
              >
                <BarChart3 size={16} /> View real-time results without voting
              </Link>
            </div>
          </div>
        ) : (
          /* Post Vote Confirmation & Inline Results */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div
              style={{
                background: hasVoted
                  ? 'rgba(245, 197, 66, 0.12)'
                  : 'rgba(10, 18, 38, 0.7)',
                border: `1px solid ${hasVoted ? 'rgba(245, 197, 66, 0.35)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: hasVoted ? '0 4px 20px rgba(245, 197, 66, 0.15)' : 'none',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: hasVoted ? 'rgba(245, 197, 66, 0.2)' : 'rgba(18, 32, 68, 0.7)',
                  border: hasVoted ? '1px solid #f5c542' : '1px solid rgba(245, 197, 66, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={24} color={hasVoted ? '#f5c542' : 'var(--text-muted)'} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>
                  {hasVoted ? 'Your vote is recorded!' : 'This poll is closed.'}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.86rem', marginTop: '0.15rem' }}>
                  Live vote counts below sync automatically in real-time.
                </p>
              </div>
            </div>

            {updatedResults && (
              <LiveResultsChart
                options={updatedResults.options}
                totalVotes={updatedResults.total_votes}
                selectedOptionId={selectedOption}
              />
            )}

            {/* Multi-person action buttons */}
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {!isClosed && (
                <button
                  onClick={handleVoteAgain}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '0.95rem',
                    color: '#f5c542',
                    borderColor: 'rgba(245, 197, 66, 0.4)',
                  }}
                >
                  <UserPlus size={18} /> Cast Another Vote (New Person)
                </button>
              )}

              <Link
                to={`/poll/${poll.id}/results`}
                className="btn btn-primary"
                style={{ flex: 1, minWidth: '220px', padding: '0.95rem' }}
              >
                <BarChart3 size={18} /> Open Full Live Results Board
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
