import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/VerifyCertificate.css';

export default function VerifyCertificatePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [status, setStatus] = useState('');
  const [certType, setCertType] = useState('');
  const [verifiedAt, setVerifiedAt] = useState(null);
  const [expirationDate, setExpirationDate] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [claimedAt, setClaimedAt] = useState(null);
  const [processStatus, setProcessStatus] = useState('');

  useEffect(() => {
    // Artificial slight delay for a smooth loading animation
    const timer = setTimeout(() => {
      fetch(`/api/verify/${id}`)
        .then(res => res.json())
        .then(data => {
          setIsValid(Boolean(data.valid));
          setIsVerified(Boolean(data.is_verified));
          setIsExpired(Boolean(data.is_expired));
          setStatus(data.status || 'Not Found');
          setCertType(data.type || 'Barangay Certificate');
          setVerifiedAt(data.verified_at || null);
          setExpirationDate(data.expiration_date || null);
          setDaysRemaining(typeof data.days_remaining === 'number' ? data.days_remaining : null);
          setTrackingCode(data.tracking_code || id);
          setClaimedAt(data.claimed_at || null);
          setProcessStatus(data.process_status || '');
          setLoading(false);
        })
        .catch(err => {
          console.error("Verification Error:", err);
          setIsValid(false);
          setIsVerified(false);
          setIsExpired(false);
          setStatus('Error connecting to server');
          setLoading(false);
        });
    }, 600);

    return () => clearTimeout(timer);
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card">
        {loading ? (
          <div>
            <div className="loading-spinner"></div>
            <h2 className="verify-title" style={{ marginTop: '20px', marginBottom: 0 }}>Verifying Document...</h2>
            <p className="status-text">Checking authentic Barangay 830 records</p>
          </div>
        ) : (
          <div>
            {/* Case 1: Valid & Active */}
            {isValid && !isExpired && (
              <>
                <div className="status-badge-pill badge-pill-success">
                  Officially Verified
                </div>
                <div className="icon-container">
                  <div className="icon-success">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
                <h2 className="verify-title">Verified Authentic</h2>
                <p className="status-text">
                  This <strong>{certType}</strong> has been officially authenticated and issued by <strong>Barangay 830</strong>.
                </p>

                <div className="verify-details-card">
                  <div className="verify-row">
                    <span className="verify-label">Document:</span>
                    <span className="verify-value">{certType}</span>
                  </div>
                  <div className="verify-row">
                    <span className="verify-label">Validation Date:</span>
                    <span className="verify-value" style={{ color: '#16a34a' }}>{formatDate(verifiedAt)}</span>
                  </div>
                  {claimedAt && (
                    <div className="verify-row">
                      <span className="verify-label">Claimed Date:</span>
                      <span className="verify-value" style={{ color: '#16a34a', fontWeight: 'bold' }}>
                        {formatDate(claimedAt)}
                      </span>
                    </div>
                  )}
                  <div className="verify-row">
                    <span className="verify-label">Valid Until:</span>
                    <span className="verify-value">{formatDate(expirationDate)}</span>
                  </div>
                  <div className="verify-row">
                    <span className="verify-label">Validity Period:</span>
                    <span className="verify-value">
                      30 Days {daysRemaining !== null && `(${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left)`}
                    </span>
                  </div>
                  <div className="verify-row">
                    <span className="verify-label">Tracking Code:</span>
                    <span className="verify-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {trackingCode ? `${trackingCode.substring(0, 18)}...` : id}
                    </span>
                  </div>
                </div>

                <div className="validity-alert-note">
                  ✓ This document is valid for 30 calendar days from the date of verification.
                </div>
              </>
            )}

            {/* Case 2: Expired (exceeded 30 days) */}
            {isExpired && (
              <>
                <div className="status-badge-pill badge-pill-warning">
                  Expired Document
                </div>
                <div className="icon-container">
                  <div className="icon-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h2 className="verify-title" style={{ color: '#d97706' }}>Certificate Expired</h2>
                <p className="status-text">
                  This <strong>{certType}</strong> was verified by Barangay 830, but its <strong>30-day validity period has expired</strong>.
                </p>

                <div className="verify-details-card">
                  <div className="verify-row">
                    <span className="verify-label">Document:</span>
                    <span className="verify-value">{certType}</span>
                  </div>
                  <div className="verify-row">
                    <span className="verify-label">Date Verified:</span>
                    <span className="verify-value">{formatDate(verifiedAt)}</span>
                  </div>
                  <div className="verify-row">
                    <span className="verify-label">Expired On:</span>
                    <span className="verify-value" style={{ color: '#dc2626' }}>{formatDate(expirationDate)}</span>
                  </div>
                  <div className="verify-row">
                    <span className="verify-label">Status:</span>
                    <span className="verify-value" style={{ color: '#dc2626' }}>Expired (Over 30 days)</span>
                  </div>
                </div>

                <div className="validity-alert-note" style={{ backgroundColor: '#fffbeb', color: '#92400e' }}>
                  ⚠ Expired certificates are no longer valid for official transactions. Please request a new certificate from Barangay 830.
                </div>
              </>
            )}

            {/* Case 3: Not Verified / Not Found */}
            {!isValid && !isExpired && (
              <>
                <div className="status-badge-pill badge-pill-error">
                  Verification Failed
                </div>
                <div className="icon-container">
                  <div className="icon-error">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <h2 className="verify-title" style={{ color: '#dc2626' }}>Not Verified</h2>
                <p className="status-text">
                  {status === 'Not Found' 
                    ? "This document was not found in Barangay 830 records. It may be invalid, forged, or unissued."
                    : `This document is marked as "${status}". It cannot be verified as authentic.`}
                </p>

                <div className="validity-alert-note" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
                  ✕ Only documents issued and approved by authorized Barangay 830 staff can be verified.
                </div>
              </>
            )}

            <div style={{ marginTop: '30px' }}>
              <Link to="/" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                &larr; Return to Homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
